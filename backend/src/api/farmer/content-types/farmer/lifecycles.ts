/**
 * farmer lifecycles
 */

import { errors } from '@strapi/utils'

import { generateFarmerCode } from '../../services/farmer-code'

export default {
    async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
        const { data } = event.params

        // `required` only checks that the field is present, and an empty string
        // counts as present, so a blank name would otherwise be stored as a
        // nameless farmer. Trim first so whitespace is caught too.
        if (typeof data.name === 'string') {
            data.name = data.name.trim()
        }

        if (typeof data.name !== 'string' || data.name === '') {
            throw new errors.ValidationError('A farmer name is required.', {
                name: 'must not be empty',
            })
        }

        // Safety net for writes that bypass the document service.
        // The document-service middleware in src/index.ts handles the normal
        // request path, because required-field validation runs before this hook.
        if (!data.farmer_code) {
            data.farmer_code = await generateFarmerCode()
        }
    },
}
