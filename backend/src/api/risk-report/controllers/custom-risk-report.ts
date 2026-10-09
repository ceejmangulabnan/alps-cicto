/**
 * custom risk-report controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

const RISK_REPORT_UID = 'api::risk-report.risk-report'

export default factories.createCoreController(
    RISK_REPORT_UID,
    ({ strapi }) => ({
        /**
         * DELETE /risk-reports/delete/:documentId
         *
         * The stock REST destroy action 403s on documents created through the
         * API (they carry no createdBy) even though the destroy permission is
         * granted. The Document Service deletes them fine, so this wraps it in
         * a route the app's token is authorized for. Strapi drops the parcel's
         * `risk_reports` relation in the same pass.
         *
         * `risk-report` is draftAndPublish, so the delete is pointed at the
         * published version explicitly: the callers read that version, and the
         * default status should not be what decides whether a filed report
         * actually goes away.
         *
         * A report filed from a finding is refused: deleting it would silently
         * drop the inspection's observation. The finding has to be removed from
         * the inspection form instead, which owns the report's lifecycle.
         */
        async destroy(ctx) {
            const { documentId } = ctx.params as { documentId?: string }

            if (!documentId) {
                return ctx.badRequest('A documentId is required.')
            }

            try {
                const report = (await strapi
                    .documents(RISK_REPORT_UID)
                    .findOne({
                        documentId,
                        populate: ['inspection'],
                        status: 'published',
                    })) as { inspection?: { documentId: string } | null } | null

                if (report?.inspection) {
                    return ctx.badRequest(
                        'This report was filed from a field inspection. Remove the finding from the inspection instead.'
                    )
                }

                const deleted = await strapi
                    .documents(RISK_REPORT_UID)
                    .delete({ documentId, status: 'published' })

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
                        : 'Failed to delete the risk report.'
                )
            }
        },
    })
)