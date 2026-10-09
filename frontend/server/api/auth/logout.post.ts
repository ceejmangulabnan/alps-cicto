export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (session?.secure?.refreshToken) {
        // `strapiRequest` attaches the session's Bearer access token (and
        // refresh-rotates on a 401), which Strapi 5's logout controller needs
        // for `ctx.state.user`; the refresh token in the body tells it which
        // session to revoke.
        await strapiRequest(event, '/auth/logout', {
            method: 'POST',
            body: { refreshToken: session.secure.refreshToken },
        }).catch(() => {})
    }

    await clearUserSession(event)

    return { ok: true }
})