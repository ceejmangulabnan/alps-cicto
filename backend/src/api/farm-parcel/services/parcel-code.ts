const PARCEL_UID = 'api::farm-parcel.farm-parcel'

const PARCEL_CODE_PREFIX = 'PLC'
const SEQUENCE_LENGTH = 4

/**
 * Builds a parcel code scoped to the current year, e.g. PLC-2026-0001.
 */
export async function generateParcelCode(): Promise<string> {
    const year = new Date().getFullYear()

    const count = await strapi.db.query(PARCEL_UID).count({
        where: {
            parcel_code: { $startsWith: `${PARCEL_CODE_PREFIX}-${year}-` },
        },
    })

    const sequence = (count + 1).toString().padStart(SEQUENCE_LENGTH, '0')

    return `${PARCEL_CODE_PREFIX}-${year}-${sequence}`
}
