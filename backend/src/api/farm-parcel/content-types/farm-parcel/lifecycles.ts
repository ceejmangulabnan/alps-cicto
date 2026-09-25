/**
 * farm-parcel lifecycles
 */

import { generateParcelCode } from '../../services/parcel-code'
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
                data.area_hectares = Number(
                    geoValidation.calculatedAreaHectares!.toFixed(4)
                )
            }
        }
    },

    async beforeUpdate(event: {
        params: {
            data: Record<string, unknown>
            where: Record<string, unknown>
        }
    }) {
        const { data } = event.params

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
                data.area_hectares = Number(
                    geoValidation.calculatedAreaHectares!.toFixed(4)
                )
            }
        }
    },
}
