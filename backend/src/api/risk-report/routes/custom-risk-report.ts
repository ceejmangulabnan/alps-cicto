/**
 * custom risk-report routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'DELETE',
            path: '/risk-reports/delete/:documentId',
            handler: 'api::risk-report.custom-risk-report.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}