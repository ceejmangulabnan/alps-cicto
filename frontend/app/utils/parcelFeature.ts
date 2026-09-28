import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { statusColor } from './landStatus'
import { toParcelGeometry } from './parcelGeometry'

/**
 * TerraDraw routes each feature to the mode named in its `properties.mode`, so
 * every parcel we plot has to declare this one.
 */
export const PARCEL_MODE = 'polygon'

/**
 * Deliberately excludes `mode`: terra-draw owns that property and rejects
 * attempts to update it ("You are trying to update a reserved property name:
 * mode"), which aborted the save handler after the API call had already
 * succeeded. It is only added on ingest, in toParcelFeature.
 */
export function parcelFeatureProperties(parcel: FarmParcel) {
    return {
        parcelCode: parcel.parcel_code,
        landStatus: parcel.land_status,
        areaHectares: parcel.area_hectares,
        farmCode: parcel.farm?.farm_code ?? '',
        currentUse: parcel.current_use ?? '',
    }
}

export function toParcelFeature(parcel: FarmParcel): GeoJSONStoreFeatures {
    return {
        type: 'Feature',
        id: parcel.documentId,
        geometry: toParcelGeometry(parcel),
        properties: { ...parcelFeatureProperties(parcel), mode: PARCEL_MODE },
    }
}

export function isParcelFeature(feature: GeoJSONStoreFeatures): boolean {
    return feature.properties?.mode === PARCEL_MODE
}

/**
 * terra-draw hands styling of a feature to the mode named in its
 * `properties.mode`, and parcelFeatureProperties sets that to PARCEL_MODE — so
 * these callbacks are what actually paint saved parcels.
 */
export function parcelFeatureColor(feature: GeoJSONStoreFeatures): HexColor {
    const status = (feature.properties as { landStatus?: unknown } | undefined)
        ?.landStatus

    return statusColor(status)
}
