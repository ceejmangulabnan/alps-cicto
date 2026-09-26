const FARMER_UID = 'api::farmer.farmer'

const FARMER_CODE_PREFIX = 'FMR'
const SEQUENCE_LENGTH = 4

/**
 * Builds a farmer code scoped to the current year, e.g. FMR-2026-0001.
 */
export async function generateFarmerCode(): Promise<string> {
    const year = new Date().getFullYear()

    const count = await strapi.db.query(FARMER_UID).count({
        where: {
            farmer_code: { $startsWith: `${FARMER_CODE_PREFIX}-${year}-` },
        },
    })

    const sequence = (count + 1).toString().padStart(SEQUENCE_LENGTH, '0')

    return `${FARMER_CODE_PREFIX}-${year}-${sequence}`
}
