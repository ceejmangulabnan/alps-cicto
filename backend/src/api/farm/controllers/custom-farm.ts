/**
 * custom farm controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController(
    'api::farm.farm',
    ({ strapi }) => ({
        /**
         * GET /farms/with-summary
         * Find farms with parcel summary (aggregated area)
         */
        async findWithSummary(ctx) {
            try {
                const { query } = ctx

                const queryParams = {
                    ...query,
                    populate: {
                        farm_parcels: {
                            fields: ['area_hectares', 'land_status'],
                        },
                        barangay: true,
                        farmers: true,
                    },
                } as Record<string, unknown>

                const results = await strapi
                    .documents('api::farm.farm')
                    .findMany(queryParams)

                const resultsWithSummary = results.map(
                    (farm: Record<string, unknown>) => {
                        const farmData = farm as Record<string, unknown>
                        const parcels =
                            (farmData.farm_parcels as Array<
                                Record<string, unknown>
                            >) || []

                        const totalAreaHectares = parcels.reduce(
                            (sum, parcel) => {
                                return sum + Number(parcel.area_hectares || 0)
                            },
                            0
                        )

                        const statusCounts = parcels.reduce(
                            (acc: Record<string, number>, parcel) => {
                                const status =
                                    (parcel.land_status as string) || 'Unknown'
                                acc[status] = (acc[status] || 0) + 1
                                return acc
                            },
                            {}
                        )

                        return {
                            ...farmData,
                            parcel_summary: {
                                total_area_hectares: Number(
                                    totalAreaHectares.toFixed(4)
                                ),
                                parcel_count: parcels.length,
                                status_breakdown: statusCounts,
                            },
                        }
                    }
                )

                ctx.body = { data: resultsWithSummary }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },

        /**
         * GET /farms/:id/with-summary
         * Find one farm with parcel summary
         */
        async findOneWithSummary(ctx) {
            try {
                const { id } = ctx.params
                const { query } = ctx

                const queryParams = {
                    ...query,
                    populate: {
                        farm_parcels: {
                            fields: [
                                'area_hectares',
                                'land_status',
                                'parcel_code',
                            ],
                            populate: ['planting_cycle'],
                        },
                        barangay: true,
                        farmers: true,
                    },
                } as Record<string, unknown>

                const result = await strapi
                    .documents('api::farm.farm')
                    .findOne({ documentId: id, ...queryParams })

                if (!result) {
                    return ctx.notFound('Farm not found')
                }

                const farmData = result as Record<string, unknown>
                const parcels =
                    (farmData.farm_parcels as Array<Record<string, unknown>>) ||
                    []

                const totalAreaHectares = parcels.reduce((sum, parcel) => {
                    return sum + Number(parcel.area_hectares || 0)
                }, 0)

                const statusCounts = parcels.reduce(
                    (acc: Record<string, number>, parcel) => {
                        const status =
                            (parcel.land_status as string) || 'Unknown'
                        acc[status] = (acc[status] || 0) + 1
                        return acc
                    },
                    {}
                )

                const resultWithSummary = {
                    ...farmData,
                    parcel_summary: {
                        total_area_hectares: Number(
                            totalAreaHectares.toFixed(4)
                        ),
                        parcel_count: parcels.length,
                        status_breakdown: statusCounts,
                    },
                }

                ctx.body = { data: resultWithSummary }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },
    })
)
