/**
 * farm service
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreService('api::farm.farm', ({ strapi }) => ({
    /**
     * Get parcel summary for a farm - aggregates total area from child farm_parcels
     */
    async getParcelSummary(farmId: string | number) {
        // Fetch farm with farm_parcels to aggregate area
        const farm = await strapi.documents('api::farm.farm').findOne({
            documentId: farmId as string,
            populate: {
                farm_parcels: {
                    fields: ['area_hectares', 'land_status'],
                },
            },
            fields: ['farm_code'],
        })

        if (!farm) {
            return null
        }

        const farmData = farm as Record<string, unknown>
        const parcels =
            (farmData.farm_parcels as Array<Record<string, unknown>>) || []

        // Aggregate total area
        const totalAreaHectares = parcels.reduce((sum, parcel) => {
            return sum + Number(parcel.area_hectares || 0)
        }, 0)

        // Count parcels by status
        const statusCounts = parcels.reduce(
            (acc: Record<string, number>, parcel) => {
                const status = (parcel.land_status as string) || 'Unknown'
                acc[status] = (acc[status] || 0) + 1
                return acc
            },
            {}
        )

        return {
            farm_id: farmData.documentId || farmData.id,
            farm_code: farmData.farm_code,
            total_area_hectares: Number(totalAreaHectares.toFixed(4)),
            parcel_count: parcels.length,
            status_breakdown: statusCounts,
        }
    },
}))
