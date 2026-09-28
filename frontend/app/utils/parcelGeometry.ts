import { area } from '@turf/area'
import { feature } from '@turf/helpers'
import type { FarmParcel } from '~/composables/useFarmParcelApi'

/**
 * Terra Draw validates coordinates against the adapter coordinate precision, so
 * stored boundaries carrying float artifacts must be rounded before plotting or
 * terra-draw rejects the feature outright.
 */
export const COORD_PRECISION = 9

export function normalizeCoordinate(value: number): number {
    return Math.round(value * 10 ** COORD_PRECISION) / 10 ** COORD_PRECISION
}

export function normalizeRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
    return ring.map((coordinate) => [
        normalizeCoordinate(coordinate[0] ?? 0),
        normalizeCoordinate(coordinate[1] ?? 0),
    ])
}

/** Unwraps the two shapes Strapi may return for `boundary_geojson`. */
export function getParcelGeometry(parcel: FarmParcel): GeoJSON.Polygon {
    const boundary = parcel.boundary_geojson
    return boundary.type === 'Feature' ? boundary.geometry : boundary
}

/** Like getParcelGeometry, but safe to hand to terra-draw's validators. */
export function toParcelGeometry(parcel: FarmParcel): GeoJSON.Polygon {
    return {
        type: 'Polygon',
        coordinates: getParcelGeometry(parcel).coordinates.map(normalizeRing),
    }
}

export function calculateAreaHectares(geometry: GeoJSON.Polygon): number {
    try {
        return area(feature(geometry)) / 10000
    } catch {
        return 0
    }
}
