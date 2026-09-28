/**
 * custom farmer controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController(
    'api::farmer.farmer',
    ({ strapi }) => ({
        /**
         * GET /farmers/deep
         * Find farmers with deep population of nested relations
         */
        async findDeep(ctx) {
            try {
                const { query } = ctx

                const queryParams = {
                    ...query,
                    populate: {
                        parcels: {
                            populate: {
                                farm: {
                                    populate: {
                                        farm_parcels: {
                                            populate: [
                                                'planting_cycle',
                                                'inspections',
                                            ],
                                        },
                                        barangay: true,
                                    },
                                },
                            },
                        },
                    },
                } as Record<string, unknown>

                const results = await strapi
                    .documents('api::farmer.farmer')
                    .findMany(queryParams)

                ctx.body = { data: results }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },

        /**
         * GET /farmers/:id/deep
         * Find one farmer with deep population of nested relations
         */
        async findOneDeep(ctx) {
            try {
                const { id } = ctx.params
                const { query } = ctx

                const queryParams = {
                    ...query,
                    populate: {
                        parcels: {
                            populate: {
                                farm: {
                                    populate: {
                                        farm_parcels: {
                                            populate: [
                                                'planting_cycle',
                                                'inspections',
                                            ],
                                        },
                                        barangay: true,
                                    },
                                },
                            },
                        },
                    },
                } as Record<string, unknown>

                const result = await strapi
                    .documents('api::farmer.farmer')
                    .findOne({ documentId: id, ...queryParams })

                if (!result) {
                    return ctx.notFound('Farmer not found')
                }

                ctx.body = { data: result }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },

        /**
         * GET /farmers/search
         * Search farmers with filters: name, farmer_code, barangay
         */
        async search(ctx) {
            try {
                const { query } = ctx
                const filters = (query.filters || {}) as Record<string, unknown>

                const searchFilters: Record<string, unknown> = {}

                if (filters.name) {
                    searchFilters.name = { $containsi: filters.name }
                }

                if (filters.farmer_code) {
                    searchFilters.farmer_code = { $eq: filters.farmer_code }
                }

                // A farmer has no barangay of its own; it is reached through the
                // parcels it tends and the farms those parcels belong to. Going
                // via parcels rather than the farm rollup keeps this independent
                // of the rollup being in sync.
                const { barangay, ...fieldFilters } = filters

                if (barangay) {
                    searchFilters.parcels = {
                        farm: {
                            barangay: {
                                $or: [
                                    { name: { $eq: barangay } },
                                    { code: { $eq: barangay } },
                                ],
                            },
                        },
                    }
                }

                const mergedFilters = {
                    ...searchFilters,
                    // barangay is only a search term, not a farmer column, so it
                    // is dropped rather than passed through as a field filter.
                    ...fieldFilters,
                }

                const queryParams = {
                    ...query,
                    filters: mergedFilters,
                    populate: {
                        parcels: {
                            populate: {
                                farm: {
                                    populate: {
                                        barangay: true,
                                        farm_parcels: true,
                                    },
                                },
                            },
                        },
                    },
                } as Record<string, unknown>

                const results = await strapi
                    .documents('api::farmer.farmer')
                    .findMany(queryParams)

                ctx.body = { data: results }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },
    })
)
