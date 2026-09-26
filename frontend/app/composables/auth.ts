type Role = {
    id: number
    name: string
    description: string | null
    type: string
}

type AuthUser = {
    id: number
    username: string
    email: string
    role?: Role | null
}

type LoginResponse = {
    jwt: string
    user: AuthUser
}

type RefreshResponse = {
    jwt: string
}

interface AuthFetchOptions {
    method?: string
    body?: unknown
    query?: Record<string, unknown>
    headers?: Record<string, string>
    credentials?: RequestCredentials
    [key: string]: unknown
}

/** Refresh this many seconds before the access token actually expires. */
const TOKEN_REFRESH_SKEW_SECONDS = 60

export const useAuth = () => {
    const user = useState<AuthUser | null>('auth_user', () => null)
    const jwt = useState<string | null>('auth_jwt', () => null)

    const isAuthenticated = computed(() => user.value !== null)
    const hasRole = (roleType: string) => user.value?.role?.type === roleType

    const login = async (identifier: string, password: string) => {
        const config = useRuntimeConfig()
        const baseUrl = config.public.strapiUrl

        const response = await $fetch<LoginResponse>(
            `${baseUrl}/api/auth/local`,
            {
                method: 'POST',
                body: { identifier, password },
                credentials: 'include',
            }
        )
        const token = response.jwt

        let fullUser: AuthUser = response.user
        try {
            const me = await $fetch<AuthUser>(
                `${baseUrl}/api/users/me?populate=role`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                }
            )
            if (me && me.id) {
                fullUser = me
            }
        } catch {}

        fullUser = { ...fullUser, role: normalizeRole(fullUser.role) }

        user.value = fullUser
        jwt.value = token

        if (import.meta.client) {
            localStorage.setItem('user', JSON.stringify(fullUser))
            localStorage.setItem('jwt', token)
        }
    }

    let inflightRefresh: Promise<string> | null = null

    const clearSession = () => {
        user.value = null
        jwt.value = null

        if (import.meta.client) {
            localStorage.removeItem('user')
            localStorage.removeItem('jwt')
        }
    }

    /**
     * Strapi is configured with `jwtManagement: 'refresh'` and httpOnly sessions, so
     * `/api/auth/local` hands back a short-lived access token while the long-lived
     * refresh token lives in an httpOnly cookie we cannot read. Exchanging the cookie
     * for a new access token is the only way to keep a session alive.
     */
    const refreshAccessToken = async (): Promise<string> => {
        if (!import.meta.client) {
            throw new Error('Cannot refresh the session outside the browser')
        }
        if (inflightRefresh) return await inflightRefresh

        const config = useRuntimeConfig()
        const baseUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')

        inflightRefresh = (async () => {
            try {
                const response = await $fetch<RefreshResponse>(
                    `${baseUrl}/api/auth/refresh`,
                    {
                        method: 'POST',
                        credentials: 'include',
                    }
                )
                if (!response?.jwt) {
                    throw new Error('Refresh response did not include a token')
                }

                jwt.value = response.jwt
                localStorage.setItem('jwt', response.jwt)

                return response.jwt
            } catch (error) {
                clearSession()
                throw error
            } finally {
                inflightRefresh = null
            }
        })()

        return await inflightRefresh
    }

    /** Proactively rotates the access token so requests never race its expiry. */
    const ensureAccessToken = async (): Promise<string> => {
        const token = jwt.value
        if (!token) return ''
        if (isTokenExpiring(token, TOKEN_REFRESH_SKEW_SECONDS)) {
            return await refreshAccessToken()
        }
        return token
    }

    /**
     * `$fetch` with the bearer token attached, refreshing proactively on expiry and
     * once more on a 401. A 401 from the auth strategy is raised before the handler
     * runs, so replaying the request cannot duplicate a write.
     */
    const authFetch = async <T>(
        request: string,
        options: AuthFetchOptions = {}
    ): Promise<T> => {
        const token = await ensureAccessToken()
        const withAuth = (value: string | null): AuthFetchOptions => ({
            ...options,
            credentials: options.credentials ?? 'include',
            headers: {
                ...options.headers,
                ...(value ? { Authorization: `Bearer ${value}` } : {}),
            },
        })

        try {
            return await $fetch<T>(request, withAuth(token) as never)
        } catch (error) {
            if (getErrorStatus(error) !== 401) throw error

            const refreshed = await refreshAccessToken().catch(() => null)
            if (!refreshed) throw error

            return await $fetch<T>(request, withAuth(refreshed) as never)
        }
    }

    const logout = async () => {
        const config = useRuntimeConfig()

        try {
            await $fetch(`${config.public.strapiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: { Authorization: `Bearer ${jwt.value}` },
            })
        } catch {}

        clearSession()
    }

    const hydrate = () => {
        if (!import.meta.client) return

        const savedUser = localStorage.getItem('user')
        const savedJwt = localStorage.getItem('jwt')

        if (savedUser && savedJwt) {
            const restoredUser = JSON.parse(savedUser)
            user.value = {
                ...restoredUser,
                role: normalizeRole(restoredUser.role),
            }
            jwt.value = savedJwt
        }
    }

    return {
        user,
        jwt,
        isAuthenticated,
        hasRole,
        login,
        logout,
        hydrate,
        refreshAccessToken,
        ensureAccessToken,
        authFetch,
    }
}

const normalizeRole = (role: unknown): Role | null => {
    if (role && typeof role === 'object' && 'type' in role) return role as Role
    return null
}

const decodeTokenExpiry = (token: string): number | null => {
    const segments = token.split('.')
    if (segments.length !== 3) return null

    const payloadSegment = segments[1]
    if (!payloadSegment) return null

    try {
        const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            '='
        )
        const payload = JSON.parse(atob(padded)) as { exp?: number }
        return typeof payload.exp === 'number' ? payload.exp : null
    } catch {
        return null
    }
}

/** Unknown expiry is treated as expiring so a malformed token gets replaced. */
const isTokenExpiring = (token: string, skewSeconds: number): boolean => {
    const expiresAt = decodeTokenExpiry(token)
    if (expiresAt === null) return true
    return expiresAt - skewSeconds <= Math.floor(Date.now() / 1000)
}

const getErrorStatus = (error: unknown): number | null => {
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
