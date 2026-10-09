/**
 * custom farm-parcel routes
 */

export default {
    type: 'content-api' as const,
    routes: [
        {
            method: 'POST',
            path: '/farm-parcels/from-map',
            handler: 'api::farm-parcel.custom-farm-parcel.createFromMap',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/farm-parcels/delete/:documentId',
            handler: 'api::farm-parcel.custom-farm-parcel.destroy',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
