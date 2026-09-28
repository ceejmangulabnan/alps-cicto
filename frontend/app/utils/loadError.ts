import { getErrorMessage, getHttpStatus } from '~/utils/apiError'

/** Which recovery action, if any, an error banner should offer. */
export type LoadErrorAction = 'retry' | 'sign-in' | null

export interface LoadError {
    message: string
    action: LoadErrorAction
}

export interface LoadErrorSubject {
    /** What is being loaded, e.g. `farms`, used in the prose. */
    name: string
    /** Strapi's name for the content type, quoted in the 403 hint. */
    contentType: string
}

/**
 * Turns a rejected request into something an error banner can render: a 401
 * offers re-authentication, a 403 names the permission to grant, and anything
 * else offers a retry. Sharing this keeps the two registry tabs and the map
 * banner from drifting apart.
 */
export function toLoadError(
    value: unknown,
    subject: LoadErrorSubject
): LoadError {
    const status = getHttpStatus(value)

    if (status === 401) {
        return {
            message: 'Your session has expired. Please sign in again.',
            action: 'sign-in',
        }
    }

    if (status === 403) {
        return {
            message: `You do not have access to ${subject.name}. Ask an administrator to grant the "find" permission for the ${subject.contentType} content type to your role.`,
            action: null,
        }
    }

    return {
        message: getErrorMessage(
            value,
            `Unable to load ${subject.name}. Check that the API is running and press Retry.`
        ),
        action: 'retry',
    }
}
