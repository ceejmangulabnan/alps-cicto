/**
 * farm-parcel lifecycles
 */

import { extractDocumentId } from '../../../farm/services/farm-code'
import { syncFarmFarmers } from '../../../farm/services/farmer-rollup'
import { generateParcelCode } from '../../services/parcel-code'

const FARM_PARCEL_UID = 'api::farm-parcel.farm-parcel'
import {
    AREA_TOLERANCE_HECTARES,
    validateGeoJSONPolygon,
    validateLandStatus,
} from '../../utils/geo'

export default {
    async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
        const { data } = event.params

        // Auto-generate parcel_code if not provided
        if (!data.parcel_code) {
            data.parcel_code = await generateParcelCode()
        }

        if (data.land_status !== undefined) {
            const statusValidation = validateLandStatus(data.land_status)
            if (!statusValidation.valid) {
                throw new Error(statusValidation.error)
            }
        }

        if (data.boundary_geojson !== undefined) {
            const geoValidation = validateGeoJSONPolygon(data.boundary_geojson)
            if (!geoValidation.valid) {
                throw new Error(geoValidation.error)
            }

            if (
                data.area_hectares !== undefined &&
                data.area_hectares !== null
            ) {
                const providedArea = Number(data.area_hectares)
                const calculatedArea = geoValidation.calculatedAreaHectares!
                const difference = Math.abs(providedArea - calculatedArea)
                if (difference > AREA_TOLERANCE_HECTARES) {
                    throw new Error(
                        `area_hectares (${providedArea}) does not match calculated area from boundary_geojson (${calculatedArea.toFixed(4)}). Difference: ${difference.toFixed(4)} ha (tolerance: ${AREA_TOLERANCE_HECTARES} ha)`
                    )
                }
            } else {
                data.area_hectares = geoValidation.calculatedAreaHectares
            }
        }
    },

    /**
     * A parcel's farmers are the source of truth; the owning farm's list is a
     * rollup over its parcels. Moving a parcel between farms has to resync both,
     * so the farm it is leaving is recorded here — the update has already been
     * applied by the time afterUpdate runs.
     */
    async beforeUpdate(event: {
        params: {
            data: Record<string, unknown>
            where: Record<string, unknown>
        }
        state?: Record<string, unknown>
    }) {
        const { data, where } = event.params

        if (data.farm !== undefined && event.state) {
            const previousFarmId = await findFarmIdByInternalId(where.id)
            const nextFarmId = extractDocumentId(data.farm)

            if (previousFarmId && previousFarmId !== nextFarmId) {
                event.state.previousFarmId = previousFarmId
            }
        }

        if (data.land_status !== undefined) {
            const statusValidation = validateLandStatus(data.land_status)
            if (!statusValidation.valid) {
                throw new Error(statusValidation.error)
            }
        }

        if (data.boundary_geojson !== undefined) {
            const geoValidation = validateGeoJSONPolygon(data.boundary_geojson)
            if (!geoValidation.valid) {
                throw new Error(geoValidation.error)
            }

            if (
                data.area_hectares !== undefined &&
                data.area_hectares !== null
            ) {
                const providedArea = Number(data.area_hectares)
                const calculatedArea = geoValidation.calculatedAreaHectares!
                const difference = Math.abs(providedArea - calculatedArea)
                if (difference > AREA_TOLERANCE_HECTARES) {
                    throw new Error(
                        `area_hectares (${providedArea}) does not match calculated area from boundary_geojson (${calculatedArea.toFixed(4)}). Difference: ${difference.toFixed(4)} ha (tolerance: ${AREA_TOLERANCE_HECTARES} ha)`
                    )
                }
            } else {
                data.area_hectares = geoValidation.calculatedAreaHectares
            }
        }
    },

    async afterCreate(event: { result?: Record<string, unknown>; params?: any }) {
        // 1. Extract farm directly from the created result or request params
        const farmData = event.result?.farm || event.params?.data?.farm
        const farmId = extractDocumentId(farmData)

        // 2. If present, sync directly without running a broken document lookup mid-transaction
        if (farmId) {
            await syncFarmFarmers(farmId)
        } else if (event.result?.id) {
            // Fallback only if farm wasn't populated/passed directly
            const resolvedFarmId = await findFarmIdByInternalId(event.result.id)
            if (resolvedFarmId) {
                await syncFarmFarmers(resolvedFarmId)
            }
        }
    },

    async afterUpdate(event: {
        params: { where: Record<string, unknown> }
        state?: Record<string, unknown>
    }) {
        // The farm is looked up rather than read off the event, because an
        // update need not request the relation in its populate and the rollup has
        // to fire whether the caller cared about the farm or not.
        await syncFarmFarmers(
            await findFarmIdByInternalId(event.params.where.id)
        )

        // Moving a parcel to another farm leaves the old one holding a farmer it
        // no longer has, so both sides are re-derived.
        const previousFarmId = event.state?.previousFarmId
        if (typeof previousFarmId === 'string') {
            await syncFarmFarmers(previousFarmId)
        }
    },

    async beforeDelete(event: {
        params: { where: Record<string, unknown> }
        state?: Record<string, unknown>
    }) {
        // Once the parcel is gone its farm link is gone with it, so the farm has
        // to be noted while the parcel still exists.
        const farmId = await findFarmIdByInternalId(event.params.where.id)
        if (farmId && event.state) {
            event.state.previousFarmId = farmId
        }
    },

    async afterDelete(event: { state?: Record<string, unknown> }) {
        const farmId = event.state?.previousFarmId
        if (typeof farmId === 'string') {
            await syncFarmFarmers(farmId)
        }
    },
}

/**
 * Resolves the farm documentId owning a parcel, given the parcel's internal id.
 *
 * Lifecycle events carry the internal id, which the document service cannot be
 * queried by, so the id is mapped to a documentId first. Going via the document
 * service matters: at the query layer `farm` is a join row, not the farm.
 */
async function findFarmIdByInternalId(
    parcelId: unknown
): Promise<string | undefined> {
    if (typeof parcelId !== 'number') {
        return undefined
    }

    // No `select` here: it wants column names, and the documentId mapping is
    // cheaper to rely on than to spell out.
    const row = (await strapi.db
        .query(FARM_PARCEL_UID)
        .findOne({ where: { id: parcelId } })) as {
            documentId?: unknown
        } | null

    const documentId = row?.documentId
    if (typeof documentId !== 'string' || documentId === '') {
        return undefined
    }

    const parcel = await strapi
        .documents(FARM_PARCEL_UID)
        .findOne({
            documentId,
            fields: ['documentId'],
            populate: { farm: { fields: ['documentId'] } },
        })
        .catch(() => null)

    return extractDocumentId((parcel as { farm?: unknown } | null)?.farm)
}
