import type { Map as MaplibreMap } from 'maplibre-gl'
import {
    TerraDraw,
    TerraDrawPolygonMode,
    TerraDrawSelectMode,
} from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { toParcelGeometry } from '~/utils/parcelGeometry'
import {
    isParcelFeature,
    parcelFeatureColor,
    parcelFeatureProperties,
    toParcelFeature,
} from '~/utils/parcelFeature'

/** How the map is currently behaving, as shown in the HUD badge. */
export type DrawMode = 'view' | 'plot' | 'edit'

export interface DrawModeMeta {
    label: string
    icon: string
    cls: string
}

const MODE_META: Record<DrawMode, DrawModeMeta> = {
    view: {
        label: 'View Mode',
        icon: 'i-lucide-mouse-pointer-2',
        cls: 'bg-white/85 text-gray-600',
    },
    plot: {
        label: 'Plotting Active',
        icon: 'i-lucide-vector-polygon',
        cls: 'bg-[#2d6a2d]/90 text-white',
    },
    edit: {
        label: 'Editing',
        icon: 'i-lucide-pencil',
        cls: 'bg-amber-500/90 text-white',
    },
}

const PARCEL_MODE_NAME = 'polygon'
const SELECT_MODE_NAME = 'select'

/**
 * Terra Draw validates feature ids against its id strategy, which defaults to
 * UUID4. Strapi document ids are not UUIDs, so accept any string id.
 */
const PARCEL_ID_STRATEGY = {
    getId: () => crypto.randomUUID(),
    isValidId: () => true,
}

export interface ParcelFeatureRejection {
    id?: string | number
    reason?: string
}

export interface ParcelDrawingHandlers {
    onSelect?: (id: string | number) => void
    onDeselect?: (id: string | number) => void
}

/**
 * Owns the terra-draw instance and everything that has to know about it: mode
 * switching, feature ingest, and which feature the sidebar is currently acting
 * on. Knows nothing about the API or the UI.
 */
export const useParcelDrawing = () => {
    const mapInstance = shallowRef<MaplibreMap>()
    const draw = shallowRef<TerraDraw>()
    const drawMode = ref<DrawMode>('view')
    const parcelCount = ref(0)

    /**
     * The terra-draw store is not reactive, so this counter is bumped by the
     * 'change' event to invalidate anything derived from feature geometry.
     */
    const geometryRevision = ref(0)

    const draftFeatureId = ref<string | number | null>(null)
    const selectedParcelId = ref<string | null>(null)
    const selectedParcel = ref<FarmParcel | null>(null)

    /**
     * Set while we drive terra-draw's selection ourselves, so the 'select'
     * event it echoes back does not re-enter the caller's select handler.
     */
    let hydratingSelection = false
    let handlers: ParcelDrawingHandlers = {}

    const modeMeta = computed(() => MODE_META[drawMode.value])

    const activeFeatureId = computed<string | number | null>(
        () => draftFeatureId.value ?? selectedParcelId.value
    )

    function getFeatureGeometry(id: string | number): GeoJSON.Polygon | null {
        const geometry = draw.value?.getSnapshotFeature(id)?.geometry
        return geometry?.type === 'Polygon' ? geometry : null
    }

    /** Geometry of the feature the sidebar is currently acting on. */
    const activePolygon = computed<GeoJSON.Polygon | null>(() => {
        void geometryRevision.value

        const id = activeFeatureId.value
        return id === null ? null : getFeatureGeometry(id)
    })

    function refreshCount() {
        const instance = draw.value
        parcelCount.value = instance
            ? instance.getSnapshot().filter(isParcelFeature).length
            : 0
    }

    function init(
        map: MaplibreMap,
        nextHandlers: ParcelDrawingHandlers = {}
    ) {
        mapInstance.value = map
        handlers = nextHandlers

        const instance = new TerraDraw({
            adapter: new TerraDrawMapLibreGLAdapter({ map }),
            idStrategy: PARCEL_ID_STRATEGY,
            modes: [
                new TerraDrawPolygonMode({
                    modeName: PARCEL_MODE_NAME,
                    styles: {
                        fillColor: parcelFeatureColor,
                        outlineColor: parcelFeatureColor,
                        fillOpacity: 0.3,
                        outlineWidth: 2,
                    },
                }),
                new TerraDrawSelectMode({
                    modeName: SELECT_MODE_NAME,
                    // terra-draw hands styling of a *selected* feature to the
                    // select mode, which otherwise repaints it in its own
                    // default blue and drops the land_status colour. Reuse the
                    // same resolver so a selected parcel still matches the
                    // legend; the heavier outline signals the selection.
                    styles: {
                        selectedPolygonColor: parcelFeatureColor,
                        selectedPolygonOutlineColor: parcelFeatureColor,
                        selectedPolygonOutlineWidth: 3,
                        selectedPolygonFillOpacity: 0.35,
                    },
                    // Default binds Delete to removing the whole feature, which
                    // would drop the polygon from the map with no way to
                    // restore it (there is no delete endpoint wired up).
                    // Coordinate/vertex deletion still works via the flags.
                    keyEvents: {
                        deselect: 'Escape',
                        delete: null,
                        rotate: null,
                        scale: null,
                    },
                    flags: {
                        polygon: {
                            feature: {
                                draggable: true,
                                rotateable: false,
                                scaleable: false,
                                coordinates: {
                                    draggable: true,
                                    midpoints: { draggable: true },
                                    deletable: true,
                                },
                            },
                        },
                    },
                }),
            ],
        })

        instance.on('change', () => {
            refreshCount()
            geometryRevision.value += 1
        })
        instance.on('finish', (id) => {
            if (drawMode.value !== 'plot') return
            draftFeatureId.value = id
            geometryRevision.value += 1
        })
        instance.on('select', (id) => {
            if (hydratingSelection) return
            handlers.onSelect?.(id)
        })
        instance.on('deselect', (id) => handlers.onDeselect?.(id))

        instance.start()
        draw.value = instance
    }

    function setDrawMode(mode: DrawMode) {
        draw.value?.setMode(
            mode === 'plot' ? PARCEL_MODE_NAME : SELECT_MODE_NAME
        )
        drawMode.value = mode
    }

    function enterPlotMode() {
        setDrawMode('plot')
    }

    function enterViewMode() {
        setDrawMode('view')
    }

    function enterEditMode() {
        if (!draw.value || parcelCount.value === 0) return
        setDrawMode('edit')
    }

    /**
     * Flag-only update for the deselect handler: terra-draw is already in
     * select mode by then, and re-setting it would restart the mode.
     */
    function markViewMode() {
        drawMode.value = 'view'
    }

    function selectParcel(parcel: FarmParcel) {
        const instance = draw.value
        if (!instance) return

        // A deep link can name a parcel that was not part of the initial load.
        if (!instance.hasFeature(parcel.documentId)) {
            addParcelFeatures([parcel])
        }

        hydratingSelection = true
        try {
            // selectFeature emits 'select' synchronously, so the guard is
            // still in place for the echo it produces.
            instance.selectFeature(parcel.documentId)
        } finally {
            hydratingSelection = false
        }
    }

    function clearSelection() {
        if (selectedParcelId.value && draw.value) {
            draw.value.deselectFeature(selectedParcelId.value)
        }
        selectedParcelId.value = null
        selectedParcel.value = null
    }

    function removeFeature(id: string | number) {
        if (draw.value?.hasFeature(id)) {
            draw.value.removeFeatures([id])
        }
    }

    function discardDraft() {
        if (draftFeatureId.value !== null) removeFeature(draftFeatureId.value)
        draftFeatureId.value = null
    }

    /** Plots saved parcels, returning the ones terra-draw refused. */
    function addParcelFeatures(parcels: FarmParcel[]): ParcelFeatureRejection[] {
        const instance = draw.value
        if (!instance || parcels.length === 0) return []

        const results = instance.addFeatures(parcels.map(toParcelFeature))
        refreshCount()

        return results
            .filter((result) => !result.valid)
            .map((result) => ({ id: result.id, reason: result.reason }))
    }

    /** Re-plot an existing parcel after its geometry or status changed. */
    function syncParcel(parcel: FarmParcel) {
        const instance = draw.value
        if (!instance) return

        instance.updateFeatureGeometry(
            parcel.documentId,
            toParcelGeometry(parcel)
        )
        instance.updateFeatureProperties(
            parcel.documentId,
            parcelFeatureProperties(parcel)
        )
        refreshCount()
    }

    /**
     * Swaps the in-progress draft for the polygon that was just persisted, so
     * the map keeps showing the parcel under its real document id.
     */
    function commitDraft(parcel: FarmParcel) {
        discardDraft()
        addParcelFeatures([parcel])
    }

    return {
        mapInstance,
        draw,
        drawMode,
        modeMeta,
        parcelCount,
        draftFeatureId,
        selectedParcelId,
        selectedParcel,
        activeFeatureId,
        activePolygon,
        init,
        setDrawMode,
        enterPlotMode,
        enterViewMode,
        enterEditMode,
        markViewMode,
        selectParcel,
        getFeatureGeometry,
        clearSelection,
        discardDraft,
        addParcelFeatures,
        syncParcel,
        commitDraft,
    }
}

export type ParcelDrawing = ReturnType<typeof useParcelDrawing>
