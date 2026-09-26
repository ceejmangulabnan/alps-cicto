/**
 * farm lifecycles
 */

import { extractDocumentId, generateFarmCode } from '../../services/farm-code'

export default {
    async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
        const { data } = event.params

        // Validate farmer IDs exist
        if (data.farmers) {
            const farmerIds = Array.isArray(data.farmers)
                ? data.farmers.map(extractDocumentId)
                : [extractDocumentId(data.farmers)]

            const validFarmerIds = farmerIds.filter(
                (id): id is string => typeof id === 'string' && id !== ''
            )

            if (validFarmerIds.length > 0) {
                const existingFarmers = await strapi
                    .documents('api::farmer.farmer')
                    .findMany({
                        filters: {
                            documentId: { $in: validFarmerIds },
                        },
                        fields: ['documentId'],
                    })

                if (existingFarmers.length !== validFarmerIds.length) {
                    const foundIds = existingFarmers.map(
                        (f: Record<string, unknown>) => f.documentId
                    )
                    const missingIds = validFarmerIds.filter(
                        (id) => !foundIds.includes(id)
                    )
                    throw new Error(
                        `Invalid farmer ID(s): ${missingIds.join(', ')}`
                    )
                }
            }
        }

        // Validate barangay exists
        if (data.barangay) {
            const barangayId = extractDocumentId(data.barangay)

            if (barangayId) {
                const barangay = await strapi
                    .documents('api::barangay.barangay')
                    .findOne({
                        documentId: barangayId,
                        fields: ['documentId', 'code'],
                    })

                if (!barangay) {
                    throw new Error(`Invalid barangay ID: ${barangayId}`)
                }
            }
        }

        // Safety net for writes that bypass the document service.
        // The document-service middleware in src/index.ts handles the normal
        // request path, because required-field validation runs before this hook.
        if (!data.farm_code) {
            const farmCode = await generateFarmCode(data.barangay)
            if (farmCode) {
                data.farm_code = farmCode
            }
        }
    },
}
