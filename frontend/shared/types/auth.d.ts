export {}

declare module '#auth-utils' {
    interface Role {
        id: number
        name: string
        type: string
        description?: string | null
    }

    interface User {
        id: number
        username: string
        email: string
        role?: Role
    }

    interface SecureSessionData {
        accessToken?: string
        refreshToken?: string
    }
}