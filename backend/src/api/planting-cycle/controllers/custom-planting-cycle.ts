/**
 * custom planting-cycle controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

const PLANTING_CYCLE_UID = 'api::planting-cycle.planting-cycle'

export default factories.createCoreController(
    PLANTING_CYCLE_UID,
    ({ strapi }) => ({
        /**
         * DELETE /planting-cycles/delete/:documentId
         *
         * The stock REST destroy action 403s on documents created through the
         * API (they carry no createdBy) even though the destroy permission is
         * granted. The Document Service deletes them fine, so this wraps it in
         * a route the app's token is authorized for. Strapi nulls the parcel's
         * `planting_cycle` relation and cascades its harvests in the same pass.
         */
        async destroy(ctx) {
            const { documentId } = ctx.params as { documentId?: string }

            if (!documentId) {
                return ctx.badRequest('A documentId is required.')
            }

            try {
                const deleted = await strapi
                    .documents(PLANTING_CYCLE_UID)
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
                        : 'Failed to delete the planting cycle.'
                )
            }
        },
    })
)
