/**
 * custom inspection routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'DELETE',
            path: '/inspections/delete/:documentId',
            handler: 'api::inspection.custom-inspection.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
