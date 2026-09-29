/**
 * custom planting-cycle routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'DELETE',
            path: '/planting-cycles/delete/:documentId',
            handler: 'api::planting-cycle.custom-planting-cycle.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
