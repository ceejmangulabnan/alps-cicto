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

    const logout = async () => {
        const config = useRuntimeConfig()

        try {
            await $fetch(`${config.public.strapiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: { Authorization: `Bearer ${jwt.value}` },
            })
        } catch {}

        user.value = null
        jwt.value = null

        if (import.meta.client) {
            localStorage.removeItem('user')
            localStorage.removeItem('jwt')
        }
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

    return { user, jwt, isAuthenticated, hasRole, login, logout, hydrate }
}

const normalizeRole = (role: unknown): Role | null => {
    if (role && typeof role === 'object' && 'type' in role) return role as Role
    return null
}
