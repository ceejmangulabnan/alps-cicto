/**
 * custom farm-parcel routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'GET',
            path: '/farm-parcels/idle-at-risk',
            handler: 'api::farm-parcel.custom-farm-parcel.idleAtRisk',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/farm-parcels/recommendations',
            handler: 'api::farm-parcel.custom-farm-parcel.recommendations',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/farm-parcels/from-map',
            handler: 'api::farm-parcel.custom-farm-parcel.createFromMap',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
