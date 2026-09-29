/**
 * custom harvest routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'DELETE',
            path: '/harvests/delete/:documentId',
            handler: 'api::harvest.custom-harvest.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
