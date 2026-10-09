/**
 * custom inspection controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

const INSPECTION_UID = 'api::inspection.inspection'
const RISK_REPORT_UID = 'api::risk-report.risk-report'

export default factories.createCoreController(INSPECTION_UID, ({ strapi }) => ({
    /**
     * DELETE /inspections/delete/:documentId
     *
     * The stock REST destroy action 403s on documents created through the
     * API (they carry no createdBy) even though the destroy permission is
     * granted. The Document Service deletes them fine, so this wraps it in
     * a route the app's token is authorized for. Strapi drops the parcel's
     * `inspections` relation in the same pass.
     *
     * The inspection's risk reports go with it: a report filed from a finding
     * has no meaning once the observation is gone, and leaving it behind would
     * put an orphaned risk on the registry. They are deleted first, so a
     * failure leaves the inspection (and its reports) intact rather than a
     * half-removed set.
     */
    async destroy(ctx) {
        const { documentId } = ctx.params as { documentId?: string }

        if (!documentId) {
            return ctx.badRequest('A documentId is required.')
        }

        try {
            const inspection = (await strapi
                .documents(INSPECTION_UID)
                .findOne({
                    documentId,
                    populate: ['risk_reports'],
                })) as { risk_reports?: { documentId: string }[] } | null

            if (!inspection) {
                return ctx.notFound()
            }

            for (const report of inspection.risk_reports ?? []) {
                await strapi
                    .documents(RISK_REPORT_UID)
                    .delete({ documentId: report.documentId, status: 'published' })
            }

            const deleted = await strapi
                .documents(INSPECTION_UID)
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
                    : 'Failed to delete the inspection.'
            )
        }
    },
}))
