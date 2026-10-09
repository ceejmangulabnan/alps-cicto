/**
 * custom farm-parcel controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

export default factories.createCoreController(
    'api::farm-parcel.farm-parcel',
    ({ strapi }) => ({
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

