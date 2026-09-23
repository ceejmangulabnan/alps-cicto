/**
 * farmer lifecycles
 */

export default {
    async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
        const { data } = event.params

        // Get current year
        const currentYear = new Date().getFullYear()

        // Count existing farmers for the current year
        const count = await strapi.db.query('api::farmer.farmer').count({
            where: {
                farmer_code: {
                    $startsWith: `FMR-${currentYear}-`,
                },
            },
        })

        // Generate sequential number (4 digits, zero-padded)
        const sequence = (count + 1).toString().padStart(4, '0')

        // Set farmer_code
        data.farmer_code = `FMR-${currentYear}-${sequence}`
    },
}
