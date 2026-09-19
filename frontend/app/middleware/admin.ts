export default defineNuxtRouteMiddleware(() => {
    const { isAuthenticated, hasRole } = useAuth()

    if (!isAuthenticated.value) {
        return navigateTo('/login')
    }

    if (!hasRole('administrator')) {
        return navigateTo('/')
    }
})
