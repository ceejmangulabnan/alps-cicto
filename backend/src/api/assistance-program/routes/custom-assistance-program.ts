/**
 * custom assistance-program routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'DELETE',
            path: '/assistance-programs/delete/:documentId',
            handler:
                'api::assistance-program.custom-assistance-program.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
