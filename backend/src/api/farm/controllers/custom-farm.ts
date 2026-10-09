/**
 * custom farm controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

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
                        // farmer_status is included so the farm's status can be
                        // derived from the rollup without a second request.
                        farmers: {
                            fields: ['name', 'farmer_code', 'farmer_status'],
                        },
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
                            populate: {
                                planting_cycle: true,
                                // Who tends each parcel, as opposed to the
                                // farm-wide rollup populated below.
                                farmers: {
                                    fields: [
                                        'name',
                                        'farmer_code',
                                        'farmer_status',
                                    ],
                                },
                            },
                        },
                        farmers: {
                            fields: ['name', 'farmer_code', 'farmer_status'],
                        },
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

        /**
         * DELETE /farms/delete/:documentId
         *
         * The stock REST destroy action 403s on documents created through the
         * API (they carry no createdBy) even though the destroy permission is
         * granted. The Document Service deletes them fine, so this wraps it in
         * a route the app's token is authorized for.
         *
         * A farm is not deletable while it still has parcels:
         * `farm-parcel.farm` is required, so removing the farm would leave its
         * parcels pointing at nothing. They are removed from the Parcels
         * registry first.
         */
        async destroy(ctx) {
            const { documentId } = ctx.params as { documentId?: string }

            if (!documentId) {
                return ctx.badRequest('A documentId is required.')
            }

            const parcelCount = await strapi
                .documents('api::farm-parcel.farm-parcel')
                .count({ filters: { farm: { documentId } } })

            if (parcelCount > 0) {
                ctx.throw(
                    409,
                    `This farm still has ${parcelCount} ${
                        parcelCount === 1 ? 'parcel' : 'parcels'
                    }. Delete them from the Parcels registry first.`
                )
            }

            try {
                const deleted = await strapi
                    .documents('api::farm.farm')
                    .delete({ documentId })

                if (!deleted) {
                    return ctx.notFound()
                }

                ctx.body = { data: deleted }
            } catch (err) {
                if (err instanceof errors.NotFoundError) {
                    return ctx.notFound()
                }
                if (err instanceof errors.ApplicationError) {
                    throw err
                }
                throw new errors.ApplicationError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete the farm.'
                )
            }
        },
    })
)
