import { area } from '@turf/area'
import { feature } from '@turf/helpers'
import type { Geometry } from 'geojson'

export const VALID_LAND_STATUS = [
    'Cultivated',
    'Preparation',
    'Harvesting',
    'Fallow',
    'Idle',
    'At Risk',
    'Converted',
] as const

export type LandStatus = (typeof VALID_LAND_STATUS)[number]

export const AREA_TOLERANCE_HECTARES = 0.01

export function validateGeoJSONPolygon(geojson: unknown): {
    valid: boolean
    error?: string
    calculatedAreaHectares?: number
} {
    if (!geojson || typeof geojson !== 'object') {
        return {
            valid: false,
            error: 'boundary_geojson must be a valid GeoJSON object',
        }
    }

    const gj = geojson as Record<string, unknown>

    if (gj.type === 'FeatureCollection') {
        return {
            valid: false,
            error:
                'boundary_geojson must be a single Polygon or Feature, not FeatureCollection',
        }
    }

    let geometry: Record<string, unknown> | null = null

    if (gj.type === 'Feature') {
        if (!gj.geometry || typeof gj.geometry !== 'object') {
            return {
                valid: false,
                error: 'Feature must have a geometry property',
            }
        }
        geometry = gj.geometry as Record<string, unknown>
    } else if (gj.type === 'Polygon') {
        geometry = gj
    } else {
        return {
            valid: false,
            error:
                'boundary_geojson must be a valid GeoJSON Polygon or Feature with Polygon geometry',
        }
    }

    if (geometry.type !== 'Polygon') {
        return { valid: false, error: 'Geometry must be of type Polygon' }
    }

    if (
        !Array.isArray(geometry.coordinates) ||
        geometry.coordinates.length === 0
    ) {
        return {
            valid: false,
            error: 'Polygon must have at least one ring (exterior ring)',
        }
    }

    const coordinates = geometry.coordinates as unknown[][]
    const exteriorRing = coordinates[0] as unknown[]
    if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
        return {
            valid: false,
            error: 'Exterior ring must have at least 4 coordinate pairs',
        }
    }

    const first = exteriorRing[0] as unknown[]
    const last = exteriorRing[exteriorRing.length - 1] as unknown[]
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return {
            valid: false,
            error:
                'Polygon exterior ring must be closed (first and last coordinates must match)',
        }
    }

    let calculatedAreaHectares: number
    try {
        const turfFeature = feature(geometry as unknown as Geometry)
        const areaSqMeters = area(turfFeature)
        calculatedAreaHectares = areaSqMeters / 10000
    } catch (err) {
        return {
            valid: false,
            error: `Failed to calculate area: ${
                err instanceof Error ? err.message : 'Unknown error'
            }`,
        }
    }

    return { valid: true, calculatedAreaHectares }
}

export function validateLandStatus(status: unknown): {
    valid: boolean
    error?: string
} {
    if (typeof status !== 'string') {
        return { valid: false, error: 'land_status must be a string' }
    }
    if (!VALID_LAND_STATUS.includes(status as LandStatus)) {
        return {
            valid: false,
            error: `land_status must be one of: ${VALID_LAND_STATUS.join(', ')}`,
        }
    }
    return { valid: true }
}
