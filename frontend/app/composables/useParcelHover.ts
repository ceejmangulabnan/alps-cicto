import type { MglEvent } from '@indoorequal/vue-maplibre-gl'
import type { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl'
import type { ComputedRef } from 'vue'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type { ParcelDrawing } from '~/composables/useParcelDrawing'
import type { ParcelData } from '~/composables/useParcelData'
import { statusColor } from '~/utils/landStatus'
import { PARCEL_MODE } from '~/utils/parcelFeature'
import { toParcelGeometry } from '~/utils/parcelGeometry'

/**
 * Hover highlight lives in its own source rather than in terra-draw's styles:
 * terra-draw only repaints on its own 'change' events, so a style callback fed
 * by Vue state would lag until something else touched a feature. Layers added
 * after terra-draw's also paint above them, which is exactly where a highlight
 * wants to be.
 */
const HOVER_SOURCE_ID = 'parcel-hover'
const HOVER_FILL_LAYER_ID = 'parcel-hover-fill'
const HOVER_OUTLINE_LAYER_ID = 'parcel-hover-outline'

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
}

export interface ParcelHoverOptions {
    drawing: ParcelDrawing
    data: ParcelData
    /**
     * Hovering is a view-mode gesture: it must be off in plot and edit mode,
     * and while a parcel panel is open, so the popup never duplicates the panel.
     */
    enabled: ComputedRef<boolean>
}

/**
 * Owns the "hover a parcel, get a card at the cursor" behaviour for view mode:
 * hit-testing the pointer against the plotted parcels, the cursor and fill
 * highlight that go with a hover, and the refs the card renders from.
 *
 * Deliberately knows nothing about how the card is laid out — it only reports
 * where the pointer is, in map-container pixels, which is also the card's
 * coordinate space.
 */
export const useParcelHover = ({
    drawing,
    data,
    enabled,
}: ParcelHoverOptions) => {
    const { parcels } = data

    const hoverParcel = ref<FarmParcel | null>(null)
    const hoverPoint = ref({ x: 0, y: 0 })

    /** Whether a hover is currently shown; gates redundant clearing work. */
    let active = false
    /** Parcel whose geometry is in the highlight source, to skip repeat setData. */
    let highlightedId: string | null = null
    let cursorIsPointer = false

    function setPointerCursor(map: MaplibreMap, on: boolean) {
        if (on === cursorIsPointer) return
        cursorIsPointer = on

        const canvas = map.getCanvas()
        if (on) canvas.style.cursor = 'pointer'
        else canvas.style.removeProperty('cursor')
    }

    function setHighlight(parcel: FarmParcel | null) {
        const id = parcel?.documentId ?? null
        if (id === highlightedId) return
        highlightedId = id

        const source = drawing.mapInstance.value?.getSource(HOVER_SOURCE_ID) as
            GeoJSONSource | undefined
        if (!source) return

        source.setData(
            parcel
                ? {
                      type: 'FeatureCollection',
                      features: [
                          {
                              type: 'Feature',
                              geometry: toParcelGeometry(parcel),
                              properties: {
                                  color: statusColor(parcel.land_status),
                              },
                          },
                      ],
                  }
                : EMPTY_FEATURE_COLLECTION
        )
    }

    function clearHover() {
        if (!active) return
        active = false
        hoverParcel.value = null
        setHighlight(null)

        const map = drawing.mapInstance.value
        if (map) setPointerCursor(map, false)
    }

    function resolveParcel(
        documentId: string,
        parcelCode: string
    ): FarmParcel | null {
        if (documentId) {
            const byId = parcels.value.find(
                (parcel) => parcel.documentId === documentId
            )
            if (byId) return byId
        }

        // MapLibre does not always hand back the source feature's id in the
        // shape it was stored in, and parcel_code is unique, so it answers for
        // any parcel already plotted when the id lookup misses.
        if (parcelCode) {
            const byCode = parcels.value.find(
                (parcel) => parcel.parcel_code === parcelCode
            )
            if (byCode) return byCode
        }

        return null
    }

    function parcelAtPoint(
        map: MaplibreMap,
        point: { x: number; y: number }
    ): FarmParcel | null {
        const hits = map.queryRenderedFeatures([point.x, point.y])

        for (const hit of hits) {
            const properties = hit.properties
            // Both of terra-draw's polygon layers carry this, and so does the
            // draft polygon being drawn in plot mode — which resolves to no
            // parcel and is skipped, as is the highlight feature itself.
            if (properties?.mode !== PARCEL_MODE) continue

            const parcel = resolveParcel(
                hit.id === undefined ? '' : String(hit.id),
                properties.parcelCode === undefined
                    ? ''
                    : String(properties.parcelCode)
            )
            if (parcel) return parcel
        }

        return null
    }

    function onMapMouseMove(payload: MglEvent<'mousemove'>) {
        const { map, event } = payload

        // Hidden while the panel is open, outside view mode, and mid-pan: a
        // card pinned to a cursor whose map is moving points at nothing.
        if (!enabled.value || map.isMoving()) {
            clearHover()
            return
        }

        const parcel = parcelAtPoint(map, event.point)
        if (!parcel) {
            clearHover()
            return
        }

        active = true
        hoverParcel.value = parcel
        hoverPoint.value = { x: event.point.x, y: event.point.y }
        setHighlight(parcel)
        setPointerCursor(map, true)
    }

    /** Called once from the map's load handler, after terra-draw is up. */
    function initHighlight(map: MaplibreMap) {
        if (!map.getSource(HOVER_SOURCE_ID)) {
            map.addSource(HOVER_SOURCE_ID, {
                type: 'geojson',
                data: EMPTY_FEATURE_COLLECTION,
            })
        }

        if (!map.getLayer(HOVER_FILL_LAYER_ID)) {
            map.addLayer({
                id: HOVER_FILL_LAYER_ID,
                type: 'fill',
                source: HOVER_SOURCE_ID,
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.45,
                    'fill-opacity-transition': { duration: 120 },
                },
            })
        }

        if (!map.getLayer(HOVER_OUTLINE_LAYER_ID)) {
            map.addLayer({
                id: HOVER_OUTLINE_LAYER_ID,
                type: 'line',
                source: HOVER_SOURCE_ID,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 3,
                },
            })
        }
    }

    // Opening the panel or leaving view mode ends the hover immediately rather
    // than on the next mousemove.
    watch(enabled, (value) => {
        if (!value) clearHover()
    })

    onScopeDispose(() => clearHover())

    return {
        hoverParcel,
        hoverPoint,
        onMapMouseMove,
        clearHover,
        initHighlight,
    }
}

export type ParcelHover = ReturnType<typeof useParcelHover>
