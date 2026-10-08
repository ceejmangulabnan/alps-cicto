import type { StrapiMethod } from '~~/server/utils/strapi'
import { strapiRequest } from '~~/server/utils/strapi'

/**
 * Catch-all proxy to the Strapi content API.
 *
 * The client never talks to Strapi directly: `authFetch` (in
 * `app/composables/auth.ts`) calls `/api/strapi/...`, which reaches here with
 * the user's sealed session cookie. We attach the Bearer access token
 * server-side, refresh-rotate on a 401, and retry once -- so a token that
 * expired mid-session never leaks a 401 to the browser (no more silent
 * log-outs ~10 minutes after login).
 *
 * Access token and refresh-state stay in the httpOnly session cookie; Strapi
 * is only ever reached from the server.
 */
export default defineEventHandler(async (event) => {
    // 401 here -- for a genuinely missing/invalid session -- is thrown before
    // any Strapi call, so pages that hard-load without a session get bounced
    // by the global middleware instead of by a data fetch.
    await requireUserSession(event)

    const segments = event.context.params?._ ?? ''
    const path = `/${segments}`
    const method = event.method

    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase())
    const contentType =
        getRequestHeader(event, 'content-type') ?? ''

    let body: unknown
    let headers: Record<string, string> = {}

    if (hasBody && contentType.startsWith('multipart/form-data')) {
        // h3's `readBody` cannot parse multipart bodies back into the original
        // bytes, so forward the raw payload with the *original* content-type
        // header (which carries the boundary) untouched. Strapi's upload
        // handler sees an identical request to what the browser produced.
        body = await readRawBody(event, false)
        headers['Content-Type'] = contentType
    } else if (hasBody) {
        body = await readBody(event).catch(() => null)
    }

    const { status, data } = await strapiRequest(event, path, {
        method: (['PATCH', 'POST', 'PUT', 'DELETE'].includes(method)
            ? method
            : 'GET') as StrapiMethod,
        body: body ?? undefined,
        query: getQuery(event),
        headers,
    })

    if (status >= 400) {
        const message =
            (data as { error?: { message?: string; detail?: string } })
                ?.error?.message ??
            (data as { error?: { message?: string; detail?: string } })
                ?.error?.detail ??
            'Strapi request failed.'

        // A final 401 (i.e. refresh already failed) means the session on the
        // server is dead/authless; drop it so the middleware redirects to the
        // login page on the next navigation.
        if (status === 401) {
            await clearUserSession(event)
        }

        throw createError({
            statusCode: status,
            statusMessage: message,
        })
    }

    return data
})