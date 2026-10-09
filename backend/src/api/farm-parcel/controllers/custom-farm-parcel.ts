/**
 * custom farm-parcel controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

export default factories.createCoreController(
    'api::farm-parcel.farm-parcel',
    ({ strapi }) => ({
        /**
         * GET /farm-parcels/idle-at-risk
         * Filter idle/at-risk parcels where area_hectares > 0.50 for high-value crop reactivation
         */
        async idleAtRisk(ctx) {
            try {
                const { query } = ctx

                const filters: Record<string, unknown> = {
                    $or: [
                        { land_status: { $eq: 'Idle' } },
                        { land_status: { $eq: 'At Risk' } },
                    ],
                    area_hectares: { $gt: 0.5 },
                }

                if (query.filters) {
                    Object.assign(filters, query.filters)
                }

                const queryParams = {
                    ...query,
                    filters,
                    populate: query.populate || [
                        'farm',
                        'planting_cycle',
                        'inspections',
                    ],
                }

                const results = await strapi
                    .documents('api::farm-parcel.farm-parcel')
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
         * GET /farm-parcels/recommendations
         * Rule engine endpoint for decision-support suggestions for underutilized land
         */
        async recommendations(ctx) {
            try {
                const { query } = ctx

                const baseFilters: Record<string, unknown> = {
                    $or: [
                        { land_status: { $eq: 'Idle' } },
                        { land_status: { $eq: 'Fallow' } },
                        { land_status: { $eq: 'At Risk' } },
                    ],
                    area_hectares: { $gt: 0.5 },
                    planting_cycle: { $null: true },
                }

                const filters = {
                    ...baseFilters,
                    ...(query.filters || {}),
                }

                const queryParams = {
                    ...query,
                    filters,
                    populate: query.populate || [
                        'farm',
                        'farm.barangay',
                        'farmers',
                    ],
                }

                const parcels = await strapi
                    .documents('api::farm-parcel.farm-parcel')
                    .findMany(queryParams)

                const recommendations = parcels.map(
                    (parcel: Record<string, unknown>) => {
                        const parcelData = parcel as Record<string, unknown>
                        const farm = parcelData.farm as Record<
                            string,
                            unknown
                        > | null
                        const barangay = farm?.barangay as Record<
                            string,
                            unknown
                        > | null

                        let priority: 'High' | 'Medium' | 'Low' = 'Medium'
                        const suggestions: string[] = []

                        if (parcelData.land_status === 'At Risk') {
                            priority = 'High'
                            suggestions.push(
                                'Immediate intervention required - land degradation risk'
                            )
                            suggestions.push(
                                'Consider soil conservation measures (contour farming, cover crops)'
                            )
                        } else if (
                            parcelData.land_status === 'Idle' &&
                            Number(parcelData.area_hectares) > 2
                        ) {
                            priority = 'High'
                            suggestions.push(
                                'High-value crop reactivation candidate (e.g., cacao, coffee, high-value vegetables)'
                            )
                            suggestions.push(
                                'Conduct soil fertility analysis before replanting'
                            )
                        } else if (parcelData.land_status === 'Fallow') {
                            priority = 'Medium'
                            suggestions.push(
                                'Crop rotation opportunity - consider legumes for nitrogen fixation'
                            )
                            suggestions.push(
                                'Green manure cover crop recommended'
                            )
                        } else if (parcelData.land_status === 'Idle') {
                            priority = 'Medium'
                            suggestions.push(
                                'Suitable for diversified smallholder crops (vegetables, fruit trees)'
                            )
                            suggestions.push(
                                'Consider intercropping systems for risk diversification'
                            )
                        }

                        const area = Number(parcelData.area_hectares)
                        if (area > 5) {
                            suggestions.push(
                                'Large parcel - consider mechanization or contract farming arrangements'
                            )
                        } else if (area < 1) {
                            suggestions.push(
                                'Small parcel - intensive cultivation methods recommended (raised beds, container gardening)'
                            )
                        }

                        if (barangay) {
                            suggestions.push(
                                `Located in ${barangay.name} - check local agricultural extension services for support`
                            )
                        }

                        return {
                            parcel_id: parcelData.documentId || parcelData.id,
                            parcel_code: parcelData.parcel_code,
                            area_hectares: parcelData.area_hectares,
                            land_status: parcelData.land_status,
                            current_use:
                                parcelData.current_use || 'Not specified',
                            farm: farm
                                ? {
                                      farm_id: farm.documentId || farm.id,
                                      farm_code: farm.farm_code,
                                      barangay: barangay
                                          ? {
                                                name: barangay.name,
                                                code: barangay.code,
                                            }
                                          : null,
                                  }
                                : null,
                            priority,
                            suggestions: [...new Set(suggestions)],
                            recommended_actions: generateRecommendedActions(
                                parcelData,
                                priority
                            ),
                        }
                    }
                )

                const priorityOrder = { High: 0, Medium: 1, Low: 2 }
                recommendations.sort((a, b) => {
                    const priorityDiff =
                        priorityOrder[a.priority] - priorityOrder[b.priority]
                    if (priorityDiff !== 0) return priorityDiff
                    return Number(b.area_hectares) - Number(a.area_hectares)
                })

                ctx.body = { data: recommendations }
            } catch (err) {
                ctx.throw(
                    500,
                    err instanceof Error ? err.message : 'An error occurred'
                )
            }
        },

        /**
         * POST /farm-parcels/from-map
         * Create a farm parcel from map drawing with GeoJSON
         */
        async createFromMap(ctx) {
            try {
                const { body } = ctx.request

                // Validate required fields
                if (!body.farm) {
                    return ctx.badRequest('Farm is required')
                }
                if (!body.boundary_geojson) {
                    return ctx.badRequest('boundary_geojson is required')
                }
                if (!body.land_status) {
                    return ctx.badRequest('land_status is required')
                }

                // Verify farm exists
                const farm = await strapi.documents('api::farm.farm').findOne({
                    documentId: body.farm,
                    fields: ['documentId'],
                })
                if (!farm) {
                    return ctx.badRequest('Invalid farm ID')
                }

                // Prepare data for creation
                // parcel_code will be auto-generated in beforeCreate lifecycle
                const parcelData: Record<string, unknown> = {
                    farm: body.farm,
                    boundary_geojson: body.boundary_geojson,
                    land_status: body.land_status,
                    current_use: body.current_use || '',
                    // The farmers tending this parcel. The owning farm's farmer
                    // list is a rollup over these, so it is not sent here.
                    ...(body.farmers !== undefined && {
                        farmers: body.farmers,
                    }),
                    // area_hectares is optional - will be auto-calculated in lifecycle if not provided
                    ...(body.area_hectares !== undefined && {
                        area_hectares: body.area_hectares,
                    }),
                }

                // Create parcel using Document Service (triggers lifecycle validation)
                const parcel = await strapi
                    .documents('api::farm-parcel.farm-parcel')
                    .create({
                        data: parcelData as any,
                        populate: [
                            'farm',
                            'farm.barangay',
                            'farmers',
                            'planting_cycle',
                            'inspections',
                        ],
                    })

                ctx.body = { data: parcel }
            } catch (err) {
                if (err instanceof Error) {
                    // Return validation errors from lifecycle
                    return ctx.badRequest(err.message)
                }
                ctx.throw(500, 'An error occurred while creating parcel')
            }
        },

        /**
         * DELETE /farm-parcels/delete/:documentId
         *
         * The stock REST destroy action 403s on documents created through the
         * API (they carry no createdBy) even though the destroy permission is
         * granted. The Document Service deletes them fine, so this wraps it in
         * a route the app's token is authorized for.
         *
         * A parcel is not deletable while anything still points at it: a
         * planting cycle (the Crops registry), inspections, or risk reports.
         * Each of those records would be left with nothing to reference, so
         * they are cleared from their own registries first.
         */
        async destroy(ctx) {
            const { documentId } = ctx.params as { documentId?: string }

            if (!documentId) {
                return ctx.badRequest('A documentId is required.')
            }

            const parcel = (await strapi
                .documents('api::farm-parcel.farm-parcel')
                .findOne({
                    documentId,
                    populate: ['planting_cycle'],
                })) as { planting_cycle?: unknown } | null

            if (!parcel) {
                return ctx.notFound()
            }

            const inspectionCount = await strapi
                .documents('api::inspection.inspection')
                .count({ filters: { parcel: { documentId } } })

            // Risk reports are draftAndPublish, so a single report can exist as
            // a draft, a published entry, or both sharing one documentId. Both
            // statuses are read and folded by documentId, so the count is the
            // number of reports rather than the number of rows.
            const riskReportIds = new Set<string>()

            for (const status of ['published', 'draft'] as const) {
                const reports = await strapi
                    .documents('api::risk-report.risk-report')
                    .findMany({
                        filters: { farm_parcel: { documentId } },
                        fields: ['documentId'],
                        status,
                    })

                reports.forEach((report) =>
                    riskReportIds.add(report.documentId)
                )
            }

            const riskReportCount = riskReportIds.size

            const blockers: string[] = []

            if (parcel.planting_cycle) {
                blockers.push('a planting cycle')
            }
            if (inspectionCount > 0) {
                blockers.push(
                    `${inspectionCount} ${
                        inspectionCount === 1 ? 'inspection' : 'inspections'
                    }`
                )
            }
            if (riskReportCount > 0) {
                blockers.push(
                    `${riskReportCount} ${
                        riskReportCount === 1 ? 'risk report' : 'risk reports'
                    }`
                )
            }

            if (blockers.length > 0) {
                ctx.throw(
                    409,
                    `This parcel still has ${blockers.join(
                        ', '
                    )}. Remove those from their registries first.`
                )
            }

            try {
                const deleted = await strapi
                    .documents('api::farm-parcel.farm-parcel')
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
                        : 'Failed to delete the parcel.'
                )
            }
        },
    })
)

function generateRecommendedActions(
    parcel: Record<string, unknown>,
    priority: 'High' | 'Medium' | 'Low'
) {
    const actions = []
    const status = parcel.land_status as string
    const area = Number(parcel.area_hectares)

    if (priority === 'High') {
        actions.push({
            action: 'Soil Testing',
            timeline: 'Immediate (within 2 weeks)',
            description:
                'Comprehensive soil analysis (pH, NPK, organic matter, micronutrients)',
        })
        actions.push({
            action: 'Technical Assessment',
            timeline: 'Within 1 month',
            description: 'On-site evaluation by agricultural technician',
        })
    }

    if (status === 'Idle' || status === 'Fallow') {
        actions.push({
            action: 'Land Preparation',
            timeline: 'Before planting season',
            description:
                'Clearing, plowing, harrowing, and leveling as appropriate',
        })
        actions.push({
            action: 'Crop Selection',
            timeline: 'Before planting season',
            description:
                'Select crops based on soil test results, market demand, and climate suitability',
        })
    }

    if (status === 'At Risk') {
        actions.push({
            action: 'Erosion Control',
            timeline: 'Immediate',
            description:
                'Install contour lines, terraces, or vegetative barriers',
        })
        actions.push({
            action: 'Drainage Improvement',
            timeline: 'Before rainy season',
            description: 'Establish proper drainage to prevent waterlogging',
        })
    }

    if (area > 1) {
        actions.push({
            action: 'Irrigation Assessment',
            timeline: 'Before dry season',
            description:
                'Evaluate water source availability and irrigation options',
        })
    }

    actions.push({
        action: 'Monitoring Setup',
        timeline: 'Ongoing',
        description:
            'Establish regular monitoring schedule for crop health and soil conditions',
    })

    return actions
}
