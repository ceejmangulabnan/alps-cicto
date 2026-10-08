import type { H3Event } from 'h3'

const REFRESH_COOKIE_NAME = 'strapi_up_refresh'

type StrapiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type { StrapiMethod }

interface StrapiRequestOptions {
    method?: StrapiMethod
    body?: unknown
    query?: Record<string, unknown>
    headers?: Record<string, string>
    /**
     * Opt-out flag for the 401 refresh-and-retry in `strapiRequest`.
     * Defaults to enabled when omitted. Pass `false` for endpoints where
     * a 401 is an expected/legitimate authorization failure (e.g. the
     * logged-in user lacks permission), so we don't waste a
     * refresh-token rotation or trigger a pointless retry.
     */
    auth?: boolean
}

interface StrapiResponse<T = unknown> {
    status: number
    data: T
}

function getStrapiBaseUrl(): string {
    const { strapiUrl } = useRuntimeConfig()
    return `${strapiUrl}/api`
}

function readRefreshTokenFromHeaders(headers: Headers): string | null {
    for (const cookie of headers.getSetCookie()) {
        const match = cookie.match(
            new RegExp(`(?:^|;\\s*)${REFRESH_COOKIE_NAME}=([^;]+)`)
        )
        if (match) {
            return decodeURIComponent(match[1] ?? '')
        }
    }
    return null
}

/**
 * True when the body is a JSON-serializable object (as opposed to a raw
 * Buffer / FormData multipart payload that must pass through untouched).
 */
function isJsonBody(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) return false
    if (body instanceof FormData || body instanceof URLSearchParams) return false
    if (Array.isArray(body)) return false
    // Buffers (and other typed arrays) expose a `.buffer` property.
    if ('buffer' in body) return false
    return true
}

async function fetchStrapi<T = unknown>(
    _event: H3Event,
    path: string,
    options: StrapiRequestOptions,
    token?: string
): Promise<StrapiResponse<T>> {
    const hasExplicitContentType = Object.keys(options.headers ?? {}).some(
        (key) => key.toLowerCase() === 'content-type'
    )

    const response = await $fetch.raw<T>(`${getStrapiBaseUrl()}${path}`, {
        method: (options.method ?? 'GET') as never,
        query: options.query,
        body: options.body as never,
        headers: {
            ...options.headers,
            // Attach the Bearer token on every call -- `options.auth` only
            // controls the 401 refresh-retry, not whether the token is sent.
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // Force JSON only for plain-object bodies; multipart requests carry
            // their own Content-Type (with boundary) and must not be clobbered.
            ...(isJsonBody(options.body) && !hasExplicitContentType
                ? { 'Content-Type': 'application/json' }
                : {}),
        },
        retry: false,
        // Return the response (even 4xx/5xx) so `strapiRequest` can inspect
        // the status and run its 401 refresh-retry. Without this, `$fetch.raw`
        // throws on non-2xx and the retry logic is never reached.
        ignoreResponseError: true,
        parseResponse: (text) => (text ? JSON.parse(text) : null),
    })

    return { status: response.status, data: response._data as T }
}

export async function refreshStrapiSession(
    event: H3Event
): Promise<{ accessToken: string; refreshToken: string } | null> {
    const session = await getUserSession(event)
    const refreshToken = session?.secure?.refreshToken

    if (!refreshToken) {
        return null
    }

    const response = await $fetch.raw<{ jwt?: string }>(
        `${getStrapiBaseUrl()}/auth/refresh`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { refreshToken },
            retry: false,
            ignoreResponseError: true,
            parseResponse: (text) => (text ? JSON.parse(text) : null),
        }
    )

    if (response.status !== 200 || !response._data?.jwt) {
        return null
    }
    const rotatedRefreshToken =
        readRefreshTokenFromHeaders(response.headers) ?? refreshToken

    await replaceUserSession(event, {
        ...session,
        secure: {
            accessToken: response._data.jwt,
            refreshToken: rotatedRefreshToken,
        },
    })

    return {
        accessToken: response._data.jwt,
        refreshToken: rotatedRefreshToken,
    }
}

export async function strapiRequest<T = unknown>(
    event: H3Event,
    path: string,
    options: StrapiRequestOptions = {}
): Promise<StrapiResponse<T>> {
    const session = await getUserSession(event)
    const token = session?.secure?.accessToken

    let response = await fetchStrapi<T>(event, path, options, token)

    // A 401 usually means the access token expired, so rotate it via
    // `refreshStrapiSession` and retry once with the fresh token.
    // Skipped entirely when the caller passes `auth: false` -- there a 401
    // is an expected, legitimate failure and refreshing would be pointless.
    // Note: `auth: false` only disables this retry; the Bearer token is still attached.
    if (response.status === 401 && options.auth !== false) {
        const refreshed = await refreshStrapiSession(event)
        if (refreshed) {
            response = await fetchStrapi<T>(
                event,
                path,
                options,
                refreshed.accessToken
            )
        }
    }

    return response
}

export { readRefreshTokenFromHeaders }