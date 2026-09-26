/**
 * farmer lifecycles
 */

import { generateFarmerCode } from '../../services/farmer-code'

export default {
    async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
        const { data } = event.params

        // Safety net for writes that bypass the document service.
        // The document-service middleware in src/index.ts handles the normal
        // request path, because required-field validation runs before this hook.
        if (!data.farmer_code) {
            data.farmer_code = await generateFarmerCode()
        }
    },
}
