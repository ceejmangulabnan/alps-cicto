import type { User } from '#auth-utils'
import { readRefreshTokenFromHeaders } from '~~/server/utils/strapi'

interface StrapiLoginResponse {
    jwt?: string
    user?: {
        id: number
        username: string
        email: string
    }
}

interface StrapiMeResponse {
    id: number
    username: string
    email: string
    role?: {
        id: number
        name: string
        type: string
    }
}

function isStrapiError(
    body: unknown
): body is { error?: { message?: string; detail?: string } } {
    return typeof body === 'object' && body !== null
}

export default defineEventHandler(async (event) => {
    const { identifier, password } = await readBody<{
        identifier: string
        password: string
    }>(event)

    if (!identifier?.trim() || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email/username and password are required.',
        })
    }

    const { strapiUrl } = useRuntimeConfig()

    const loginResponse = await $fetch.raw<StrapiLoginResponse>(
        `${strapiUrl}/api/auth/local`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { identifier: identifier.trim(), password },
            retry: false,
            ignoreResponseError: true,
            parseResponse: (text) => (text ? JSON.parse(text) : null),
        }
    )

    if (
        loginResponse.status !== 200 ||
        !loginResponse._data?.jwt ||
        !loginResponse._data?.user
    ) {
        const message = isStrapiError(loginResponse._data)
            ? loginResponse._data.error?.message ??
              loginResponse._data.error?.detail
            : undefined

        throw createError({
            statusCode: 401,
            statusMessage: message || 'Invalid email/username or password.',
        })
    }

    const accessToken = loginResponse._data.jwt
    const refreshToken = readRefreshTokenFromHeaders(loginResponse.headers)

    const meResponse = await $fetch.raw<StrapiMeResponse>(
        `${strapiUrl}/api/users/me`,
        {
            query: { populate: 'role' },
            headers: { Authorization: `Bearer ${accessToken}` },
            retry: false,
            ignoreResponseError: true,
            parseResponse: (text) => (text ? JSON.parse(text) : null),
        }
    )

    if (meResponse.status !== 200 || !meResponse._data?.id) {
        throw createError({
            statusCode: 502,
            statusMessage: 'Failed to load user profile.',
        })
    }

    const { id, username, email, role } = meResponse._data

    const user: User = { id, username, email, role }

    // replaceUserSession initializes the session from scratch (safer than
    // updating any pre-existing session state on a login flow)
    await replaceUserSession(event, {
        user,
        secure: {
            accessToken,
            refreshToken: refreshToken ?? undefined,
        },
    })

    return { user }
})