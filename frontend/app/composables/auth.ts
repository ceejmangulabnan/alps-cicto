/**
 * Auth-composable adapter over `nuxt-auth-utils`.
 *
 * All authentication state lives in a single sealed, httpOnly session cookie
 * managed by nuxt-auth-utils. The access token and refresh token never touch
 * the browser: `login` seals them into `session.secure` server-side, and the
 * Strapi proxy (`server/api/strapi/[...].ts`) attaches them when talking to
 * Strapi, rotating the access token on a 401 before the browser ever sees it.
 *
 * The old localStorage token strategy is gone (sessions were silently
 * invalidated ~10 minutes after login). Anyone logged in under the old scheme
 * simply logs in once more.
 */
import type { User } from '#auth-utils'

export interface AuthFetchOptions {
    method?: string
    body?: unknown
    query?: Record<string, unknown>
    headers?: Record<string, string>
    credentials?: RequestCredentials
    [key: string]: unknown
}

export const useAuth = () => {
    const session = useUserSession()
    // Capture the request-scoped fetch once, here, so `authFetch` calls made
    // later from event handlers still forward cookies on the server (needed
    // for SSR data fetches to hit the proxy authenticated).
    const fetchFn = useRequestFetch()

    const isAuthenticated = computed(() => session.loggedIn.value)
    const hasRole = (roleType: string) =>
        session.user.value?.role?.type === roleType

    const login = async (identifier: string, password: string) => {
        await fetchFn('/api/auth/login', {
            method: 'POST',
            body: { identifier, password },
        })
        // The login route sealed the session cookie server-side; pull it into
        // the client state.
        await session.fetch()
    }

    const logout = async () => {
        try {
            await fetchFn('/api/auth/logout', { method: 'POST' })
        } catch {}
        // Clear the local session state (the reference-sealed cookie was
        // cleared by the logout route).
        await session.clear()
    }

    /**
     * `$fetch` against the Nuxt-side Strapi proxy. Absolute Strapi URLs (the
     * shape the API composables have always built, e.g.
     * `http://host:1337/api/farms`) are rewritten to the relative
     * `/api/strapi/...` path so the request stays same-origin and rides the
     * session cookie. The proxy attaches the Bearer token and handles the
     * 401 refresh-retry, so a 401 surfacing here means the session is
     * genuinely dead: clear the local state and let the existing
     * "session expired" banners do their job.
     */
    const authFetch = async <T>(
        request: string,
        options: AuthFetchOptions = {}
    ): Promise<T> => {
        try {
            return await fetchFn<T>(toProxyPath(request), options as never)
        } catch (error) {
            if (getErrorStatus(error) === 401) {
                if (import.meta.client) {
                    await session.clear().catch(() => {})
                }
            }
            throw error
        }
    }

    return {
        user: session.user,
        isAuthenticated,
        hasRole,
        login,
        logout,
        authFetch,
    }
}

/** Strip the origin and `/api` prefix off a Strapi URL, e.g.
 * `http://host:1337/api/farms?x=1` → `/api/strapi/farms?x=1`. */
const toProxyPath = (request: string): string => {
    if (request.startsWith('/api/strapi')) return request

    if (request.startsWith('http')) {
        try {
            const url = new URL(request)
            return `/api/strapi${url.pathname.replace(/^\/api/, '')}${url.search}`
        } catch {
            return request
        }
    }

    if (request.startsWith('/api/')) {
        return `/api/strapi${request.slice(4)}`
    }

    return request
}

/**
 * The HTTP status behind a fetch failure, or null when there isn't one. Reads
 * the shapes `$fetch` and `ofetch` throw with, plus the normalised `statusCode`
 * Nuxt's own errors carry. Exported so callers that need to branch on the cause
 * — a 404 rendering an empty state, say — do not re-derive it.
 */
export const getErrorStatus = (error: unknown): number | null => {
    if (typeof error !== 'object' || error === null) return null

    const candidate = error as {
        status?: unknown
        statusCode?: unknown
        response?: { status?: unknown }
    }

    for (const value of [
        candidate.status,
        candidate.statusCode,
        candidate.response?.status,
    ]) {
        if (typeof value === 'number') return value
    }

    return null
}

export type { User }