const FARM_UID = 'api::farm.farm'
const FARM_PARCEL_UID = 'api::farm-parcel.farm-parcel'

/**
 * A farmer is assigned to a parcel, and a farm's farmer list is the union of the
 * farmers tending its parcels. The farm side is a rollup rather than user input so
 * the two can never disagree.
 *
 * This is safe to call repeatedly: it writes the exact set implied by the current
 * parcels, so a missed or duplicated call converges rather than drifts.
 */
export async function syncFarmFarmers(
    farmDocumentId: string | undefined
): Promise<void> {
    if (!farmDocumentId) {
        return
    }

    const parcels = await strapi.documents(FARM_PARCEL_UID).findMany({
        filters: { farm: { documentId: farmDocumentId } },
        fields: ['documentId'],
        populate: { farmers: { fields: ['documentId'] } },
    })

    // A farmer tending several parcels of the same farm appears in each of them, so
    // the union is what makes the farm list match the parcels at a glance.
    const farmerIds = new Set<string>()
    for (const parcel of parcels) {
        const farmers = (parcel as { farmers?: unknown }).farmers ?? []
        for (const farmer of Array.isArray(farmers) ? farmers : [farmers]) {
            const record = farmer as { documentId?: unknown } | null
            const documentId = record?.documentId
            if (typeof documentId === 'string' && documentId !== '') {
                farmerIds.add(documentId)
            }
        }
    }

    await strapi.documents(FARM_UID).update({
        documentId: farmDocumentId,
        data: { farmers: [...farmerIds] },
    })
}
