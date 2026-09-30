/**
 * custom assistance-program controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'

const ASSISTANCE_PROGRAM_UID = 'api::assistance-program.assistance-program'

export default factories.createCoreController(
    ASSISTANCE_PROGRAM_UID,
    ({ strapi }) => ({
        /**
         * DELETE /assistance-programs/delete/:documentId
         *
         * The stock REST destroy action 403s on documents created through the
         * API (they carry no createdBy) even though the destroy permission is
         * granted. The Document Service deletes them fine, so this wraps it in
         * a route the app's token is authorized for. Strapi drops the farmer's
         * and the barangay's `assistance_programs` relation in the same pass.
         */
        async destroy(ctx) {
            const { documentId } = ctx.params as { documentId?: string }

            if (!documentId) {
                return ctx.badRequest('A documentId is required.')
            }

            try {
                const deleted = await strapi
                    .documents(ASSISTANCE_PROGRAM_UID)
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
                        : 'Failed to delete the assistance program.'
                )
            }
        },
    })
)
