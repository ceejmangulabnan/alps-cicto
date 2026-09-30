const ASSISTANCE_PROGRAM_UID = 'api::assistance-program.assistance-program'

const REFERENCE_CODE_PREFIX = 'AST'
const SEQUENCE_LENGTH = 4

/**
 * Builds an assistance reference code scoped to the current year, e.g.
 * AST-2026-0001. It is the row identifier officers read off the table, so it
 * is generated rather than typed.
 */
export async function generateAssistanceReferenceCode(): Promise<string> {
    const year = new Date().getFullYear()

    const count = await strapi.db.query(ASSISTANCE_PROGRAM_UID).count({
        where: {
            reference_code: {
                $startsWith: `${REFERENCE_CODE_PREFIX}-${year}-`,
            },
        },
    })

    const sequence = (count + 1).toString().padStart(SEQUENCE_LENGTH, '0')

    return `${REFERENCE_CODE_PREFIX}-${year}-${sequence}`
}
