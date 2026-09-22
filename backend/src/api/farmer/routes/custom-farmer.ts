/**
 * custom farmer routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'GET',
            path: '/farmers/deep',
            handler: 'api::farmer.custom-farmer.findDeep',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/farmers/:id/deep',
            handler: 'api::farmer.custom-farmer.findOneDeep',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/farmers/search',
            handler: 'api::farmer.custom-farmer.search',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
