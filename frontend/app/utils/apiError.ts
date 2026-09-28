/**
 * Normalises the several shapes a rejected `authFetch` can take into an HTTP
 * status code, so callers can branch on 401/403 without repeating the casts.
 */
export function getHttpStatus(value: unknown): number | undefined {
    return (
        (value as { statusCode?: number })?.statusCode ??
        (value as { response?: { status?: number } })?.response?.status
    )
}

/**
 * Digs a human readable message out of an API error, falling back when the
 * payload carries none of the shapes we recognise.
 */
export function getErrorMessage(value: unknown, fallback: string): string {
    if (value && typeof value === 'object') {
        const apiError = value as {
            data?: { message?: string; error?: { message?: string } }
            message?: string
        }
        return (
            apiError.data?.error?.message ||
            apiError.data?.message ||
            apiError.message ||
            fallback
        )
    }

    return fallback
}
