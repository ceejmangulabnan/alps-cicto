const FARM_UID = 'api::farm.farm'
const BARANGAY_UID = 'api::barangay.barangay'

const FARM_CODE_PREFIX = 'FRM'
const SEQUENCE_LENGTH = 3

export function extractDocumentId(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value !== '' ? value : undefined
    }
    if (typeof value === 'number') {
        return String(value)
    }
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        const id = record.documentId ?? record.id
        if (typeof id === 'string' && id !== '') {
            return id
        }
        if (typeof id === 'number') {
            return String(id)
        }
    }
    return undefined
}

/**
 * Builds a farm code from the owning barangay's code, e.g. FRM-PB01-001.
 */
export async function generateFarmCode(
    barangayRef: unknown
): Promise<string | undefined> {
    const barangayId = extractDocumentId(barangayRef)
    if (!barangayId) {
        return undefined
    }

    const barangay = await strapi.documents(BARANGAY_UID).findOne({
        documentId: barangayId,
        fields: ['documentId', 'code'],
    })

    const barangayCode = barangay?.code as string | undefined
    if (!barangayCode) {
        return undefined
    }

    const count = await strapi.db.query(FARM_UID).count({
        where: {
            farm_code: { $startsWith: `${FARM_CODE_PREFIX}-${barangayCode}-` },
        },
    })

    const sequence = (count + 1).toString().padStart(SEQUENCE_LENGTH, '0')

    return `${FARM_CODE_PREFIX}-${barangayCode}-${sequence}`
}
