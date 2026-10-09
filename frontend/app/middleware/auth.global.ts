import { ROLE_TYPES } from '~/composables/auth'

// app/middleware/auth.global.ts
//
// Single global auth barrier covering every page. `nuxt-auth-utils` prefetches
// the session server-side (enforce: 'pre') before middleware runs, so on a hard
// SSR load this never redirects a logged-in user to the login page -- the
// session is known before the guard makes a decision.
export default defineNuxtRouteMiddleware(async (to) => {
    const session = useUserSession()

    if (!session.ready.value) {
        await session.fetch()
    }

    const isLoggedIn = session.loggedIn.value
    const role = session.user.value?.role?.type || ''

    // 1. Unauthenticated users are redirected to login
    if (!isLoggedIn) {
        if (to.path !== '/login') {
            return navigateTo('/login')
        }
        return
    }

    // 2. Prevent accessing the login page if already logged in
    if (to.path === '/login') {
        return navigateTo('/')
    }

    // 3. Admin routes are restricted to the administrator role; everyone else
    //    (authenticated or not) is sent to the dashboard.
    if (to.path.startsWith('/admin')) {
        if (role === ROLE_TYPES.admin) {
            return
        }
        return navigateTo('/')
    }

    return
})