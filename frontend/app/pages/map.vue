<script setup lang="ts">
import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl'
import { Position } from '@indoorequal/vue-maplibre-gl'
import {
    TerraDraw,
    TerraDrawPolygonMode,
    TerraDrawRenderMode,
    TerraDrawSelectMode,
} from 'terra-draw'
import type { GeoJSONStoreFeatures } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { area } from '@turf/area'
import { feature } from '@turf/helpers'
import { useFarmParcelApi, type FarmParcel } from '~/composables/useFarmParcelApi'
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
const drawMode = ref<DrawMode>('view')
const parcelCount = ref(0)

const landStatusOptions = [
    'Cultivated',
    'Preparation',
    'Harvesting',
    'Fallow',
    'Idle',
    'At Risk',
    'Converted',
] as const

// Status color mapping for map display
const statusColors: Record<string, string> = {
    Cultivated: '#22c55e',
    Preparation: '#f97316',
    Harvesting: '#eab308',
    Fallow: '#6b7280',
    Idle: '#ef4444',
    'At Risk': '#dc2626',
    Converted: '#8b5cf6',
}

const STATUS_COLOR: Record<string, string> = {
    Cultivated: '#16a34a',
    Preparation: '#0369a1',
    Harvesting: '#ca8a04',
    Fallow: '#b45309',
    Idle: '#6b7280',
    'At Risk': '#dc2626',
    Converted: '#0f766e',
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

// ---------------------------------------------------------------------------
// API Composables
// ---------------------------------------------------------------------------
const { createFromMap, getAll: getAllParcels } = useFarmParcelApi()
const { getAllForSelect: getFarms } = useFarmsApi()

function toParcelFeature(parcel: FarmParcel): GeoJSONStoreFeatures {
    const boundary = parcel.boundary_geojson
    const geometry =
        boundary.type === 'Feature' ? boundary.geometry : boundary

    return {
        type: 'Feature',
        id: parcel.documentId,
        geometry,
        properties: {
            mode: 'polygon',
            parcelCode: parcel.parcel_code,
            landStatus: parcel.land_status,
            areaHectares: parcel.area_hectares,
            farmCode: parcel.farm?.farm_code ?? null,
            currentUse: parcel.current_use,
        },
    }
}

// ---------------------------------------------------------------------------
// New Parcel sidebar (connected to backend)
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()

const isAddingParcel = () => route.query.addParcel !== undefined
const isEditingParcel = () => route.query.editParcel !== undefined
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
    land_status: 'Cultivated' as (typeof landStatusOptions)[number],
    current_use: '' as string,
})

function clearMessages() {
    error.value = null
    success.value = null
}

function closeSidebar() {
    showSidebar.value = false
    draw.value?.setMode('render')
    drawMode.value = 'view'
    router.replace({ path: '/map' })
    // Reset form
    parcelForm.farm = ''
    parcelForm.parcel_code = ''
    parcelForm.area_hectares = ''
    parcelForm.land_status = 'Cultivated'
    parcelForm.current_use = ''
    clearMessages()
}

async function loadFarms() {
    try {
        farms.value = await getFarms()
    } catch (err) {
        console.error('Failed to load farms:', err)
    }
}

async function loadExistingParcels() {
    try {
        const response = await getAllParcels({
            populate: ['farm', 'farm.barangay', 'farm.farmers'],
            'pagination[pageSize]': 500,
        })
        const parcels = response.data
        if (draw.value && parcels.length > 0) {
            const features = parcels.map(toParcelFeature)
            draw.value.addFeatures(features)
            parcelCount.value = features.length
        }
    } catch (err) {
        console.error('Failed to load existing parcels:', err)
    }
}

function isParcel(feature: GeoJSONStoreFeatures): boolean {
    return feature.properties?.mode === 'polygon'
}

function countParcels(instance: TerraDraw): number {
    return instance.getSnapshot().filter(isParcel).length
}

function onMapLoad(payload: { map: MaplibreMap }) {
    const instance = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: payload.map }),
        modes: [
            new TerraDrawPolygonMode({ modeName: 'polygon' }),
            new TerraDrawSelectMode({ modeName: 'select' }),
            new TerraDrawRenderMode({ modeName: 'render', styles: {} }),
        ],
    })

    instance.on('change', () => {
        // Update parcel count on any change
        parcelCount.value = countParcels(instance)
    })
    instance.start()

    draw.value = instance

    // Load farms and existing parcels
    loadFarms()
    loadExistingParcels()

    if (isAddingParcel()) {
        showSidebar.value = true
        instance.setMode('polygon')
        drawMode.value = 'plot'
    } else {
        instance.setMode('render')
        drawMode.value = 'view'
    }
}

function setViewMode() {
    draw.value?.setMode('render')
    drawMode.value = 'view'
}

function startPlotting() {
    draw.value?.setMode('polygon')
    drawMode.value = 'plot'
}

function startEditing() {
    draw.value?.setMode('select')
    drawMode.value = 'edit'
}

function clearParcels() {
    const instance = draw.value
    if (!instance || parcelCount.value === 0) return
    const ids = instance
        .getSnapshot()
        .filter(isParcel)
        .map((f) => f.id)
        .filter((id): id is string | number => id !== undefined)
    instance.removeFeatures(ids)
    parcelCount.value = countParcels(instance)
    drawMode.value = 'view'
}

function openAddParcel() {
    showSidebar.value = true
    router.replace({ path: '/map', query: { addParcel: '1' } })
    draw.value?.setMode('polygon')
    drawMode.value = 'plot'
    clearMessages()
}

function getDrawnPolygon(): GeoJSON.Polygon | null {
    const geometry = draw.value
        ?.getSnapshot()
        .filter(isParcel)
        .at(-1)?.geometry

    return geometry?.type === 'Polygon' ? geometry : null
}

function calculateAreaHectares(geojson: GeoJSON.Polygon): number {
    try {
        const turfFeature = feature(geojson)
        const areaSqMeters = area(turfFeature)
        return Math.round((areaSqMeters / 10000) * 10000) / 10000 // Round to 4 decimal places
    } catch {
        return 0
    }
}

async function handleSaveParcel() {
    clearMessages()

    // Validate required fields
    if (!parcelForm.farm) {
        error.value = 'Please select a farm'
        return
    }
    if (!parcelForm.land_status) {
        error.value = 'Please select a land status'
        return
    }

    // Get the drawn polygon
    const polygon = getDrawnPolygon()
    if (!polygon) {
        error.value = 'No parcel drawn on the map. Please draw a parcel first.'
        return
    }

    // Calculate area client-side for immediate feedback
    const calculatedArea = calculateAreaHectares(polygon)
    parcelForm.area_hectares = calculatedArea.toFixed(4)

    loading.value = true

    try {
        const response = await createFromMap({
            farm: parcelForm.farm,
            boundary_geojson: polygon,
            land_status: parcelForm.land_status,
            current_use: parcelForm.current_use,
            area_hectares: calculatedArea,
        })

        const newParcel = response.data

        success.value = `Parcel ${newParcel.parcel_code} created successfully!`

        // Add the new parcel to the map
        if (draw.value) {
            draw.value.addFeatures([toParcelFeature(newParcel)])
            parcelCount.value = countParcels(draw.value)
        }

        // Close sidebar after short delay to show success message
        setTimeout(() => {
            closeSidebar()
        }, 1500)
    } catch (err: any) {
        error.value =
            err.data?.message ||
            err.message ||
            'Failed to create parcel. Please try again.'
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
                                Plotting Guide
                            </span>
                        </div>
                        <div
                            class="mt-2.5 space-y-1.5 text-[11px] text-gray-500"
                        >
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2d6a2d]"
                                ></span>
                                Click points to trace the parcel boundary
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2d6a2d]"
                                ></span>
                                Click the first point again to close the parcel
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"
                                ></span>
                                Use Edit mode to adjust existing vertices
                            </div>
                        </div>
                    </div>
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

                <form class="space-y-4">
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
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="" disabled>
                                    Select a farm...
                                </option>
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
                                Parcel Code
                            </label>
                            <input
                                v-model="parcelForm.parcel_code"
                                type="text"
                                placeholder="e.g. PLC-1201"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                    class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
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
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#245524]"
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
                        {{ loading ? 'Saving...' : 'Plot Parcel' }}
                    </button>
                    <div
                        class="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 p-2.5"
                    >
                        <UIcon
                            name="i-lucide-info"
                            class="mt-0.5 size-3 flex-shrink-0 text-gray-400"
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
