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
import { useFarmParcelApi } from '~/composables/useFarmParcelApi'
import { useFarmsApi } from '~/composables/useFarmsApi'

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
const mapCenter = ref<[number, number]>([120.6896, 15.0282])
const mapZoom = ref(14)

const attributionControl = {
    compact: true,
    customAttribution: 'ALPS GIS',
}

const coordinatesText = computed(() => {
    const c = mapCenter.value
    const lng = Array.isArray(c) ? c[0] : (c?.lng ?? 0)
    const lat = Array.isArray(c) ? c[1] : (c?.lat ?? 0)
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

// ---------------------------------------------------------------------------
// API Composables
// ---------------------------------------------------------------------------
const { createFromMap, getAll: getAllParcels } = useFarmParcelApi()
const { getAllForSelect: getFarms } = useFarmsApi()

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
const farms = ref<Array<{ documentId: string; farm_code: string; barangay?: { name: string; code: string }; farmers?: Array<{ name: string; farmer_code: string }> }>>([])

const parcelForm = reactive({
    farm: '' as string,
    parcel_code: '' as string,
    area_hectares: '' as string,
    land_status: 'Cultivated' as typeof landStatusOptions[number],
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
        const data = await getFarms()
        farms.value = data.map((f: any) => ({
            documentId: f.documentId,
            farm_code: f.farm_code,
            barangay: f.barangay,
            farmers: f.farmers,
        }))
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
            const features = parcels.map((p: any) => ({
                type: 'Feature' as const,
                id: p.documentId,
                geometry: p.boundary_geojson,
                properties: {
                    mode: 'polygon' as const,
                    parcelCode: p.parcel_code,
                    landStatus: p.land_status,
                    areaHectares: p.area_hectares,
                    farmCode: p.farm?.farm_code,
                    currentUse: p.current_use,
                },
            }))
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
            new TerraDrawRenderMode({ modeName: 'render' }),
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

function getDrawnPolygon(): GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon> | null {
    const instance = draw.value
    if (!instance) return null

    const snapshot = instance.getSnapshot()
    const polygons = snapshot.filter(isParcel)

    if (polygons.length === 0) return null

    // Return the most recently created polygon (last one)
    const latest = polygons[polygons.length - 1]
    const geometry = latest.geometry

    // If it's a Feature, extract geometry; if it's already a Polygon, use as-is
    if (geometry.type === 'Feature') {
        return geometry.geometry as GeoJSON.Polygon
    }
    return geometry as GeoJSON.Polygon
}

function calculateAreaHectares(geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>): number {
    try {
        const turfFeature = feature(geojson as any)
        const areaSqMeters = area(turfFeature)
        return Math.round(areaSqMeters / 10000 * 10000) / 10000 // Round to 4 decimal places
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
            const newFeature = {
                type: 'Feature' as const,
                id: newParcel.documentId,
                geometry: newParcel.boundary_geojson,
                properties: {
                    mode: 'polygon' as const,
                    parcelCode: newParcel.parcel_code,
                    landStatus: newParcel.land_status,
                    areaHectares: newParcel.area_hectares,
                    farmCode: newParcel.farm?.farm_code,
                    currentUse: newParcel.current_use,
                },
            }
            draw.value.addFeatures([newFeature])
            parcelCount.value = countParcels(draw.value)
        }

        // Close sidebar after short delay to show success message
        setTimeout(() => {
            closeSidebar()
        }, 1500)
    } catch (err: any) {
        error.value = err.data?.message || err.message || 'Failed to create parcel. Please try again.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-[#e8f0e5]">
        <div class="z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-map" class="size-4 text-[#2d6a2d]" />
                <span class="text-sm font-semibold text-gray-800 font-sans">Agricultural Parcel Map</span>
                <span class="text-[11px] text-gray-400">San Fernando, Pampanga</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-600">
                    {{ parcelCount }} parcel{{ parcelCount === 1 ? '' : 's' }} drawn
                </span>
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
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
                            <MglNavigationControl :position="Position.TOP_RIGHT" :show-compass="false" />
                            <MglFullscreenControl :position="Position.TOP_RIGHT" />
                        </MglMap>
                    </div>
                    <template #fallback>
                        <div class="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Loading map...</div>
                    </template>
                </ClientOnly>

                <div class="pointer-events-none absolute left-4 top-4 z-10">
                    <div class="rounded-lg bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
                        <div class="text-xs font-semibold text-gray-700 font-sans">Agricultural Parcel Map — San Fernando, Pampanga</div>
                        <div class="text-[10px] text-gray-500">Base map · MapLibre GL</div>
                    </div>
                </div>

                <div class="pointer-events-none absolute bottom-4 left-4 z-10 rounded bg-white/80 px-2 py-1 font-mono text-[10px] text-gray-600 backdrop-blur-sm">
                    {{ coordinatesText }}
                </div>
            </div>

            <!-- New Parcel Sidebar -->
            <aside v-if="showSidebar" class="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5">
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h2 class="text-base font-bold text-gray-900">{{ sidebarTitle }}</h2>
                        <p class="text-[11px] text-gray-500">{{ sidebarSubtitle }}</p>
                    </div>
                    <button type="button" class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600" @click="closeSidebar">
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="handleSaveParcel">
                    <div>
                        <label class="mb-1 block text-xs font-medium text-gray-600">Farm</label>
                        <select
                            v-model="parcelForm.farm"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            :disabled="loading"
                        >
                            <option value="" disabled>Select a farm...</option>
                            <option v-for="f in farms" :key="f.documentId" :value="f.documentId">
                                {{ f.farm_code }} · {{ f.barangay?.name || 'Unknown Barangay' }}
                                {{ f.farmers?.length ? `(${f.farmers[0].name})` : '' }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-medium text-gray-600">Parcel Code</label>
                        <input
                            v-model="parcelForm.parcel_code"
                            type="text"
                            placeholder="Auto-generated (e.g. PLC-2026-0001)"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"
                            readonly
                        />
                        <p class="mt-1 text-[10px] text-gray-500">Auto-generated on save</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-xs font-medium text-gray-600">Area (ha)</label>
                            <input
                                v-model="parcelForm.area_hectares"
                                type="number"
                                step="0.0001"
                                min="0"
                                placeholder="0.0000"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"
                                readonly
                            />
                            <p class="mt-1 text-[10px] text-gray-500">Calculated from polygon</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-medium text-gray-600">Land Status</label>
                            <select
                                v-model="parcelForm.land_status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                                :disabled="loading"
                            >
                                <option v-for="s in landStatusOptions" :key="s" :value="s">{{ s }}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-medium text-gray-600">Current Use</label>
                        <input
                            v-model="parcelForm.current_use"
                            type="text"
                            placeholder="e.g. Rice / Corn / Sugarcane"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            :disabled="loading"
                        />
                    </div>

                    <!-- Error/Success Messages -->
                    <div v-if="error" class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs" role="alert">
                        <UIcon name="i-lucide-circle-alert" class="inline-block size-3 mr-1" />
                        {{ error }}
                    </div>
                    <div v-if="success" class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs" role="status">
                        <UIcon name="i-lucide-circle-check" class="inline-block size-3 mr-1" />
                        {{ success }}
                    </div>
                </form>

                <div class="mt-6 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245524] disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="loading"
                        @click="handleSaveParcel"
                    >
                        <UIcon v-if="loading" name="i-lucide-loader-2" class="size-4 animate-spin" />
                        <UIcon v-else name="i-lucide-vector-polygon" class="size-4" />
                        {{ loading ? 'Saving...' : 'Plot Parcel' }}
                    </button>
                    <p class="mt-2 text-center text-[10px] text-gray-400">
                        Click the map to drop points — click the first point again to close the parcel.
                    </p>
                </div>
            </aside>
        </div>
    </div>
</template>