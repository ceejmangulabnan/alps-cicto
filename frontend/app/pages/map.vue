<script setup lang="ts">
import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl'
import { LngLatBounds } from 'maplibre-gl'
import { Position } from '@indoorequal/vue-maplibre-gl'
import {
    TerraDraw,
    TerraDrawPolygonMode,
    TerraDrawSelectMode,
} from 'terra-draw'
import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { area } from '@turf/area'
import { feature } from '@turf/helpers'
import {
    LAND_STATUS_OPTIONS,
    useFarmParcelApi,
    type FarmParcel,
    type LandStatus,
} from '~/composables/useFarmParcelApi'
import { useFarmsApi, type Farm } from '~/composables/useFarmsApi'

const config = useRuntimeConfig()
const maptilerKey = config.public.maptilerKey as string | undefined

const OSM_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        openstreetmap: {
            type: 'raster',
            attribution: '© OpenStreetMap contributors',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
        },
    },
    layers: [
        {
            id: 'osm-tiles',
            type: 'raster',
            source: 'openstreetmap',
        },
    ],
}

const mapStyle = computed<StyleSpecification | string>(() =>
    maptilerKey
        ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerKey}`
        : OSM_STYLE
)

// San Fernando, Pampanga
const mapCenter = ref({ lng: 120.6896, lat: 15.0282 })
const mapZoom = ref(14)

const attributionControl = {
    compact: true,
    customAttribution: 'ALPS GIS',
}

const coordinatesText = computed(() => {
    const { lng, lat } = mapCenter.value
    const ns = lat >= 0 ? 'N' : 'S'
    const ew = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew} · Zoom ${Math.round(mapZoom.value)}`
})

// ---------------------------------------------------------------------------
// Terra Draw parcel plotting
// ---------------------------------------------------------------------------
type DrawMode = 'view' | 'plot' | 'edit'

const draw = shallowRef<TerraDraw>()
const mapInstance = shallowRef<MaplibreMap>()
const drawMode = ref<DrawMode>('view')
const parcelCount = ref(0)
const parcels = ref<FarmParcel[]>([])
const draftFeatureId = ref<string | number | null>(null)
const selectedParcelId = ref<string | null>(null)
const selectedParcel = ref<FarmParcel | null>(null)
const hasGeometry = ref(false)
const hydratingSelection = ref(false)

const landStatusOptions = LAND_STATUS_OPTIONS

const STATUS_COLOR: Record<string, HexColor> = {
    Cultivated: '#16a34a',
    Preparation: '#0369a1',
    Harvesting: '#ca8a04',
    Fallow: '#b45309',
    Idle: '#6b7280',
    'At Risk': '#dc2626',
    Converted: '#0f766e',
}

/**
 * Colour for features that have no persisted land_status yet, i.e. a polygon
 * that is still being drawn. Neutral so it never implies a real status.
 */
const STATUS_COLOR_FALLBACK: HexColor = '#6b7280'

/**
 * Resolves a parcel polygon's map colour from its persisted land_status.
 *
 * TerraDraw routes each feature to the mode named in its `properties.mode`,
 * and `featureProperties` sets that to 'polygon' — so these callbacks are what
 * actually paint saved parcels. Must always return a concrete colour: terra-draw
 * silently substitutes its default blue when a styling callback returns
 * undefined, which would make a saved parcel look like a fresh drawing.
 */
function statusColor(status: unknown): HexColor {
    return typeof status === 'string'
        ? (STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK)
        : STATUS_COLOR_FALLBACK
}

function parcelFeatureColor(feature: GeoJSONStoreFeatures): HexColor {
    const status = (feature.properties as { landStatus?: unknown } | undefined)
        ?.landStatus

    return statusColor(status)
}

const MODE_META: Record<
    DrawMode,
    { label: string; icon: string; cls: string }
> = {
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

const modeMeta = computed(() => MODE_META[drawMode.value])

/** Legend entries, derived from the same source as STATUS_COLOR so the two
 *  cannot drift apart. */
const statusLegend = computed(() =>
    LAND_STATUS_OPTIONS.map((status) => ({
        label: status,
        color: STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK,
    }))
)

const parcelList = computed(() =>
    [...parcels.value].sort((a, b) =>
        a.parcel_code.localeCompare(b.parcel_code)
    )
)

// ---------------------------------------------------------------------------
// API Composables
// ---------------------------------------------------------------------------
const {
    createFromMap,
    getAll: getAllParcels,
    getById: getParcelById,
    update: updateParcel,
} = useFarmParcelApi()
const { getAllForSelect: getFarms } = useFarmsApi()

function toParcelFeature(parcel: FarmParcel): GeoJSONStoreFeatures {
    const boundary = parcel.boundary_geojson
    const geometry = boundary.type === 'Feature' ? boundary.geometry : boundary

    return {
        type: 'Feature',
        id: parcel.documentId,
        geometry,
        properties: featureProperties(parcel),
    }
}

// ---------------------------------------------------------------------------
// New Parcel sidebar (connected to backend)
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()

const editParcelId = computed(() => {
    const value = route.query['edit-parcel']
    return typeof value === 'string' ? value : undefined
})
const focusParcelId = computed(() => {
    const value = route.query['focus-parcel']
    return typeof value === 'string' ? value : undefined
})
const isAddingParcel = () => route.query['add-parcel'] !== undefined
const isEditingParcel = () =>
    Boolean(editParcelId.value || selectedParcelId.value)
const showSidebar = ref(false)
const sidebarTitle = computed(() =>
    isEditingParcel() ? 'Edit Parcel' : 'New Parcel'
)
const sidebarSubtitle = computed(() =>
    isEditingParcel()
        ? 'Update the parcel details for this farmland.'
        : 'Fill in the parcel details, then plot it on the map.'
)

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const farms = ref<Farm[]>([])

const parcelForm = reactive({
    farm: '' as string,
    parcel_code: '' as string,
    area_hectares: '' as string,
    land_status: 'Cultivated' as LandStatus,
    current_use: '' as string,
})

function clearMessages() {
    error.value = null
    success.value = null
}

function getErrorMessage(value: unknown, fallback: string) {
    if (value && typeof value === 'object') {
        const apiError = value as {
            data?: { message?: string; error?: { message?: string } }
            message?: string
        }
        return (
            apiError.data?.error?.message ||
            apiError.data?.message ||
            apiError.message ||
            fallback
        )
    }

    return fallback
}

function resetForm() {
    parcelForm.farm = ''
    parcelForm.parcel_code = ''
    parcelForm.area_hectares = ''
    parcelForm.land_status = 'Cultivated'
    parcelForm.current_use = ''
    hasGeometry.value = false
}

function isParcel(feature: GeoJSONStoreFeatures): boolean {
    return feature.properties?.mode === 'polygon'
}

function countParcels(instance: TerraDraw): number {
    return instance.getSnapshot().filter(isParcel).length
}

function getParcelGeometry(parcel: FarmParcel): GeoJSON.Polygon {
    const boundary = parcel.boundary_geojson
    return boundary.type === 'Feature' ? boundary.geometry : boundary
}

function getFeatureGeometry(id: string | number): GeoJSON.Polygon | null {
    const geometry = draw.value?.getSnapshotFeature(id)?.geometry
    return geometry?.type === 'Polygon' ? geometry : null
}

function calculateAreaHectares(geojson: GeoJSON.Polygon): number {
    try {
        const turfFeature = feature(geojson)
        const areaSqMeters = area(turfFeature)
        return areaSqMeters / 10000
    } catch {
        return 0
    }
}

function updateAreaForFeature(id: string | number) {
    const geometry = getFeatureGeometry(id)
    if (!geometry) {
        hasGeometry.value = false
        return
    }

    hasGeometry.value = true
    parcelForm.area_hectares = calculateAreaHectares(geometry).toFixed(4)
}

function featureProperties(parcel: FarmParcel) {
    return {
        mode: 'polygon',
        parcelCode: parcel.parcel_code,
        landStatus: parcel.land_status,
        areaHectares: parcel.area_hectares,
        farmCode: parcel.farm?.farm_code ?? '',
        currentUse: parcel.current_use ?? '',
    }
}

function replaceParcel(parcel: FarmParcel) {
    const index = parcels.value.findIndex(
        (item) => item.documentId === parcel.documentId
    )
    if (index === -1) {
        parcels.value = [...parcels.value, parcel]
    } else {
        parcels.value[index] = parcel
    }
}

function fitToParcel(parcel: FarmParcel) {
    const instance = mapInstance.value
    const coordinates = getParcelGeometry(parcel).coordinates[0]
    const first = coordinates?.[0]
    if (!instance || !first || first.length < 2) return

    const firstLng = first[0]
    const firstLat = first[1]
    if (typeof firstLng !== 'number' || typeof firstLat !== 'number') {
        return
    }

    const bounds = new LngLatBounds([firstLng, firstLat], [firstLng, firstLat])
    coordinates.forEach((coordinate) => {
        const lng = coordinate[0]
        const lat = coordinate[1]
        if (typeof lng === 'number' && typeof lat === 'number') {
            bounds.extend([lng, lat])
        }
    })
    instance.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 500 })
}

function fitToAllParcels() {
    const instance = mapInstance.value
    if (!instance || parcels.value.length === 0) return

    const bounds = new LngLatBounds()
    let extended = false
    for (const parcel of parcels.value) {
        for (const coordinate of getParcelGeometry(parcel).coordinates[0] ?? []) {
            const lng = coordinate[0]
            const lat = coordinate[1]
            if (typeof lng === 'number' && typeof lat === 'number') {
                bounds.extend([lng, lat])
                extended = true
            }
        }
    }
    if (!extended) return

    instance.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 0 })
}

function loadParcelIntoForm(parcel: FarmParcel) {
    parcelForm.farm = parcel.farm?.documentId ?? ''
    parcelForm.parcel_code = parcel.parcel_code
    parcelForm.area_hectares = parcel.area_hectares.toFixed(4)
    parcelForm.land_status = parcel.land_status
    parcelForm.current_use = parcel.current_use ?? ''
    hasGeometry.value = true
}

async function ensureParcel(documentId: string) {
    const localParcel = parcels.value.find(
        (parcel) => parcel.documentId === documentId
    )
    if (localParcel) return localParcel

    const response = await getParcelById(documentId)
    replaceParcel(response.data)
    return response.data
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

function closeSidebar() {
    discardDraft()
    clearSelection()
    showSidebar.value = false
    draw.value?.setMode('select')
    drawMode.value = 'view'
    router.replace({ path: '/map' })
    resetForm()
    clearMessages()
}

async function loadFarms() {
    try {
        farms.value = await getFarms()
    } catch (value: unknown) {
        error.value = getErrorMessage(value, 'Unable to load farms.')
    }
}

async function loadExistingParcels() {
    try {
        const response = await getAllParcels({
            populate: ['farm', 'farm.barangay', 'farm.farmers'],
        })
        parcels.value = response.data
        if (draw.value && response.data.length > 0) {
            draw.value.addFeatures(response.data.map(toParcelFeature))
            parcelCount.value = countParcels(draw.value)
            // The default centre is a fixed San Fernando coordinate, so any
            // parcel plotted elsewhere would load off-screen and look missing.
            fitToAllParcels()
        }
    } catch (value: unknown) {
        error.value = getErrorMessage(value, 'Unable to load existing parcels.')
    }
}

async function onParcelSelect(id: string | number) {
    if (hydratingSelection.value || draftFeatureId.value === id) return

    const parcel = parcels.value.find((item) => item.documentId === String(id))
    if (!parcel) return

    selectedParcelId.value = parcel.documentId
    selectedParcel.value = parcel
    loadParcelIntoForm(parcel)
    showSidebar.value = true
    drawMode.value = 'edit'
    clearMessages()
}

function onParcelDeselect(id: string | number) {
    if (selectedParcelId.value !== String(id)) return
    selectedParcelId.value = null
    selectedParcel.value = null
    if (!showSidebar.value) drawMode.value = 'view'
}

async function openParcelForEdit(documentId: string) {
    try {
        const parcel = await ensureParcel(documentId)
        selectedParcelId.value = parcel.documentId
        selectedParcel.value = parcel
        loadParcelIntoForm(parcel)
        showSidebar.value = true
        drawMode.value = 'edit'
        clearMessages()

        const instance = draw.value
        if (!instance) return

        instance.setMode('select')
        hydratingSelection.value = true
        try {
            instance.selectFeature(parcel.documentId)
        } finally {
            hydratingSelection.value = false
        }
        fitToParcel(parcel)
    } catch (value: unknown) {
        error.value = getErrorMessage(value, 'Unable to open parcel.')
    }
}

async function focusParcel(documentId: string) {
    try {
        const parcel = await ensureParcel(documentId)
        draw.value?.setMode('select')
        drawMode.value = 'view'
        fitToParcel(parcel)
    } catch (value: unknown) {
        error.value = getErrorMessage(value, 'Unable to focus parcel.')
    }
}

function onMapLoad(payload: { map: MaplibreMap }) {
    mapInstance.value = payload.map

    const instance = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: payload.map }),
        modes: [
            new TerraDrawPolygonMode({
                modeName: 'polygon',
                styles: {
                    fillColor: parcelFeatureColor,
                    outlineColor: parcelFeatureColor,
                    fillOpacity: 0.3,
                    outlineWidth: 2,
                },
            }),
            new TerraDrawSelectMode({
                modeName: 'select',
                // terra-draw hands styling of a *selected* feature to the select
                // mode, which otherwise repaints it in its own default blue and
                // drops the land_status colour. Reuse the same resolver so a
                // selected parcel still matches the legend; the heavier outline
                // is what signals the selection.
                styles: {
                    selectedPolygonColor: parcelFeatureColor,
                    selectedPolygonOutlineColor: parcelFeatureColor,
                    selectedPolygonOutlineWidth: 3,
                    selectedPolygonFillOpacity: 0.35,
                },
                // Default binds Delete to removing the whole feature, which would
                // drop the polygon from the map with no way to restore it (there
                // is no delete endpoint wired up). Coordinate/vertex deletion
                // still works via the flags below.
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

    instance.on('change', (ids) => {
        parcelCount.value = countParcels(instance)
        const activeId = draftFeatureId.value ?? selectedParcelId.value
        if (activeId !== null && ids.includes(activeId)) {
            updateAreaForFeature(activeId)
        }
    })
    instance.on('finish', (id) => {
        if (drawMode.value !== 'plot') return
        draftFeatureId.value = id
        updateAreaForFeature(id)
    })
    instance.on('select', (id) => {
        void onParcelSelect(id)
    })
    instance.on('deselect', (id) => onParcelDeselect(id))
    instance.start()
    draw.value = instance

    void (async () => {
        await loadFarms()
        await loadExistingParcels()

        if (isAddingParcel()) {
            showSidebar.value = true
            instance.setMode('polygon')
            drawMode.value = 'plot'
            return
        }

        if (editParcelId.value) {
            await openParcelForEdit(editParcelId.value)
            return
        }

        if (focusParcelId.value) {
            await focusParcel(focusParcelId.value)
            return
        }

        setViewMode()
    })()
}

function setViewMode() {
    draw.value?.setMode('select')
    drawMode.value = 'view'
}

function startPlotting() {
    openAddParcel()
}

function startEditing() {
    if (!draw.value || parcelCount.value === 0) return
    draw.value.setMode('select')
    drawMode.value = 'edit'
}

function openAddParcel() {
    discardDraft()
    clearSelection()
    resetForm()
    showSidebar.value = true
    router.replace({ path: '/map', query: { 'add-parcel': '1' } })
    draw.value?.setMode('polygon')
    drawMode.value = 'plot'
    clearMessages()
}

const canSave = computed(
    () =>
        !loading.value &&
        Boolean(parcelForm.farm) &&
        Boolean(parcelForm.land_status) &&
        hasGeometry.value
)

async function handleSaveParcel() {
    clearMessages()

    if (!parcelForm.farm) {
        error.value = 'Please select a farm'
        return
    }
    if (!parcelForm.land_status) {
        error.value = 'Please select a land status'
        return
    }

    const activeId = isEditingParcel()
        ? selectedParcelId.value
        : draftFeatureId.value
    const polygon = activeId === null ? null : getFeatureGeometry(activeId)
    if (!polygon) {
        error.value = isEditingParcel()
            ? 'No parcel boundary is available.'
            : 'No parcel drawn on the map. Please draw a parcel first.'
        return
    }

    const calculatedArea = calculateAreaHectares(polygon)
    parcelForm.area_hectares = calculatedArea.toFixed(4)
    loading.value = true

    try {
        if (isEditingParcel() && selectedParcelId.value) {
            const response = await updateParcel(selectedParcelId.value, {
                farm: parcelForm.farm,
                boundary_geojson: polygon,
                land_status: parcelForm.land_status,
                current_use: parcelForm.current_use,
                area_hectares: calculatedArea,
            })
            const updatedParcel = response.data
            replaceParcel(updatedParcel)
            selectedParcel.value = updatedParcel
            loadParcelIntoForm(updatedParcel)
            if (draw.value) {
                draw.value.updateFeatureGeometry(
                    selectedParcelId.value,
                    getParcelGeometry(updatedParcel)
                )
                draw.value.updateFeatureProperties(
                    selectedParcelId.value,
                    featureProperties(updatedParcel)
                )
                parcelCount.value = countParcels(draw.value)
            }
            success.value = `Parcel ${updatedParcel.parcel_code} updated successfully!`
            return
        }

        const response = await createFromMap({
            farm: parcelForm.farm,
            boundary_geojson: polygon,
            land_status: parcelForm.land_status,
            current_use: parcelForm.current_use,
            area_hectares: calculatedArea,
        })
        const newParcel = response.data
        replaceParcel(newParcel)
        if (draftFeatureId.value !== null) removeFeature(draftFeatureId.value)
        draftFeatureId.value = null
        if (draw.value) {
            draw.value.addFeatures([toParcelFeature(newParcel)])
            parcelCount.value = countParcels(draw.value)
        }
        success.value = `Parcel ${newParcel.parcel_code} created successfully!`
        setTimeout(closeSidebar, 1200)
    } catch (value: unknown) {
        error.value = getErrorMessage(
            value,
            isEditingParcel()
                ? 'Failed to update parcel. Please try again.'
                : 'Failed to create parcel. Please try again.'
        )
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div
        class="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-[#e8f0e5]"
    >
        <div
            class="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
            <div class="flex items-center gap-3">
                <span
                    class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d6a2d] text-white shadow-sm"
                >
                    <UIcon name="i-lucide-map" class="size-4.5" />
                </span>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-gray-900 font-sans">
                            Agricultural Parcel Map
                        </span>
                        <span
                            class="rounded-full bg-[#e8f5e8] px-2 py-0.5 text-[10px] font-medium text-[#2d6a2d] ring-1 ring-green-100"
                        >
                            San Fernando, Pampanga
                        </span>
                    </div>
                    <div class="text-[11px] text-gray-400">
                        Base map · OpenStreetMap / MapTiler GL
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span
                    class="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600"
                >
                    <UIcon
                        name="i-lucide-vector-polygon"
                        class="size-3.5 text-[#2d6a2d]"
                    />
                    <span class="font-semibold text-gray-800">
                        {{ parcelCount }}
                    </span>
                    parcel{{ parcelCount === 1 ? '' : 's' }} drawn
                </span>
                <button
                    type="button"
                    :disabled="parcelCount === 0"
                    class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="startEditing"
                >
                    <UIcon name="i-lucide-pencil" class="size-3.5" />
                    Edit
                </button>
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#245524]"
                    @click="openAddParcel"
                >
                    <UIcon name="i-lucide-layers" class="size-3.5" />
                    Add Parcel
                </button>
            </div>
        </div>

        <div class="flex flex-1 overflow-hidden">
            <div class="relative flex-1 overflow-hidden">
                <ClientOnly>
                    <div class="absolute inset-0">
                        <MglMap
                            v-model:center="mapCenter"
                            v-model:zoom="mapZoom"
                            :map-style="mapStyle"
                            :attribution-control="attributionControl"
                            height="100%"
                            width="100%"
                            @map:load="onMapLoad"
                        >
                            <MglNavigationControl
                                :position="Position.TOP_RIGHT"
                                :show-compass="false"
                            />
                            <MglFullscreenControl
                                :position="Position.TOP_RIGHT"
                            />
                        </MglMap>
                    </div>
                    <template #fallback>
                        <div
                            class="absolute inset-0 flex items-center justify-center text-xs text-gray-500"
                        >
                            Loading map...
                        </div>
                    </template>
                </ClientOnly>

                <div
                    v-if="
                        showSidebar ||
                        drawMode === 'plot' ||
                        drawMode === 'edit'
                    "
                    class="pointer-events-none absolute left-4 top-4 z-10"
                >
                    <div
                        class="rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="flex h-6 w-6 items-center justify-center rounded-md bg-[#2d6a2d]"
                            >
                                <UIcon
                                    name="i-lucide-pen-tool"
                                    class="size-3 text-white"
                                />
                            </span>
                            <span class="text-xs font-semibold text-gray-800">
                                {{
                                    isEditingParcel()
                                        ? 'Edit Parcel'
                                        : 'Plotting Guide'
                                }}
                            </span>
                        </div>
                        <div
                            class="mt-2.5 space-y-1.5 text-[11px] text-gray-500"
                        >
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d6a2d]"
                                ></span>
                                Click points to trace the parcel boundary
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d6a2d]"
                                ></span>
                                Click the first point again to close the parcel
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                ></span>
                                Use Edit mode to adjust existing vertices
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="parcelList.length > 0"
                    class="absolute right-4 top-24 z-10 w-60 overflow-hidden rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
                >
                    <div class="flex items-center justify-between px-3 py-2">
                        <span
                            class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                        >
                            Parcels ({{ parcelList.length }})
                        </span>
                        <button
                            type="button"
                            class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[#2d6a2d] hover:bg-[#2d6a2d]/10"
                            @click="fitToAllParcels"
                        >
                            <UIcon name="i-lucide-scan" class="size-3" />
                            Fit all
                        </button>
                    </div>
                    <ul
                        class="max-h-64 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100"
                    >
                        <li v-for="parcel in parcelList" :key="parcel.documentId">
                            <button
                                type="button"
                                class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                                :class="
                                    selectedParcelId === parcel.documentId
                                        ? 'bg-[#2d6a2d]/10'
                                        : ''
                                "
                                @click="openParcelForEdit(parcel.documentId)"
                            >
                                <span
                                    class="size-2 shrink-0 rounded-full"
                                    :style="{
                                        backgroundColor:
                                            statusColor(parcel.land_status),
                                    }"
                                />
                                <span class="min-w-0 flex-1">
                                    <span
                                        class="block truncate text-xs font-semibold text-gray-800"
                                    >
                                        {{ parcel.parcel_code }}
                                    </span>
                                    <span
                                        class="block truncate text-[10px] text-gray-500"
                                    >
                                        {{ parcel.land_status }} ·
                                        {{
                                            parcel.area_hectares.toFixed(2)
                                        }}
                                        ha
                                    </span>
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>

                <div
                    class="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2"
                >
                    <div
                        class="rounded-lg bg-white/85 px-2 py-1.5 font-mono text-[10px] text-gray-600 shadow-sm backdrop-blur-sm"
                    >
                        {{ coordinatesText }}
                    </div>
                    <div
                        class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm"
                        :class="modeMeta.cls"
                    >
                        <UIcon :name="modeMeta.icon" class="size-3" />
                        {{ modeMeta.label }}
                    </div>
                </div>

                <!-- Land Status Legend -->
                <div
                    v-if="parcelCount > 0"
                    class="pointer-events-none absolute bottom-4 right-4 z-10 rounded-xl bg-white/95 px-3 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
                >
                    <div
                        class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                        Land Status
                    </div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div
                            v-for="entry in statusLegend"
                            :key="entry.label"
                            class="flex items-center gap-1.5"
                        >
                            <span
                                class="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10"
                                :style="{ backgroundColor: entry.color }"
                            ></span>
                            <span class="text-[10px] text-gray-600">
                                {{ entry.label }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Parcel Sidebar -->
            <aside
                v-if="showSidebar"
                class="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h2 class="text-base font-bold text-gray-900">
                            {{ sidebarTitle }}
                        </h2>
                        <p class="text-[11px] text-gray-500">
                            {{ sidebarSubtitle }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="closeSidebar"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form
                    id="parcel-form"
                    class="space-y-4"
                    @submit.prevent="handleSaveParcel"
                >
                    <div class="border-b border-gray-100 pb-4">
                        <div
                            class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                        >
                            <UIcon
                                name="i-lucide-tractor"
                                class="size-3.5 text-[#2d6a2d]"
                            />
                            Farm Reference
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farm
                            </label>
                            <select
                                v-model="parcelForm.farm"
                                :disabled="loading || farms.length === 0"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                            >
                                <option value="">Select a farm...</option>
                                <option
                                    v-for="farm in farms"
                                    :key="farm.documentId"
                                    :value="farm.documentId"
                                >
                                    {{ farm.farm_code }} ·
                                    {{ farm.barangay?.name ?? 'Unknown' }}
                                </option>
                            </select>
                        </div>
                        <div class="mt-3">
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Parcel Code (generated)
                            </label>
                            <input
                                v-model="parcelForm.parcel_code"
                                type="text"
                                placeholder="Generated after saving"
                                readonly
                                class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div class="border-b border-gray-100 pb-4">
                        <div
                            class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                        >
                            <UIcon
                                name="i-lucide-layers"
                                class="size-3.5 text-[#2d6a2d]"
                            />
                            Land Details
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                                >Area (ha)</label
                            >
                            <input
                                v-model="parcelForm.area_hectares"
                                type="number"
                                step="0.0001"
                                min="0"
                                placeholder="0.0000"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"
                                readonly
                            />
                            <p class="mt-1 text-[10px] text-gray-500">
                                Calculated from polygon
                            </p>
                        </div>
                        <div class="mt-3">
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Land Status
                            </label>
                            <div class="flex flex-wrap gap-1.5">
                                <button
                                    v-for="s in landStatusOptions"
                                    :key="s"
                                    type="button"
                                    :disabled="loading"
                                    class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    :class="
                                        parcelForm.land_status === s
                                            ? 'border-[#2d6a2d] bg-[#e8f5e8] text-[#2d6a2d]'
                                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                    "
                                    @click="parcelForm.land_status = s"
                                >
                                    <span
                                        class="h-2 w-2 rounded-full"
                                        :style="{
                                            backgroundColor: STATUS_COLOR[s],
                                        }"
                                    />
                                    {{ s }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div
                            class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                        >
                            <UIcon
                                name="i-lucide-file-text"
                                class="size-3.5 text-[#2d6a2d]"
                            />
                            Notes
                        </div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Current Use
                        </label>
                        <input
                            v-model="parcelForm.current_use"
                            type="text"
                            placeholder="e.g. Rice / Corn / Sugarcane"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            :disabled="loading"
                        />
                    </div>

                    <!-- Error/Success Messages -->
                    <div
                        v-if="error"
                        class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
                        role="alert"
                    >
                        <UIcon
                            name="i-lucide-circle-alert"
                            class="inline-block size-3 mr-1"
                        />
                        {{ error }}
                    </div>
                    <div
                        v-if="success"
                        class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs"
                        role="status"
                    >
                        <UIcon
                            name="i-lucide-circle-check"
                            class="inline-block size-3 mr-1"
                        />
                        {{ success }}
                    </div>
                </form>

                <div class="mt-6 border-t border-gray-100 pt-4">
                    <button
                        type="submit"
                        form="parcel-form"
                        :disabled="!canSave"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <UIcon
                            v-if="loading"
                            name="i-lucide-loader-2"
                            class="size-4 animate-spin"
                        />
                        <UIcon
                            v-else
                            name="i-lucide-vector-polygon"
                            class="size-4"
                        />
                        {{
                            loading
                                ? 'Saving...'
                                : isEditingParcel()
                                  ? 'Save Changes'
                                  : 'Save Parcel'
                        }}
                    </button>
                    <div
                        class="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 p-2.5"
                    >
                        <UIcon
                            name="i-lucide-info"
                            class="mt-0.5 size-3 shrink-0 text-gray-400"
                        />
                        <p class="text-[10px] leading-relaxed text-gray-500">
                            {{
                                isEditingParcel()
                                    ? 'Changes are saved to the parcel record.'
                                    : 'Click the map to drop points — click the first point again to close the parcel.'
                            }}
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>
