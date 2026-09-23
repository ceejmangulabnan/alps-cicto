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
    const [lng, lat] = mapCenter.value
    const ns = lat >= 0 ? 'N' : 'S'
    const ew = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew} · Zoom ${Math.round(mapZoom.value)}`
})

// ---------------------------------------------------------------------------
// Terra Draw parcel plotting
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'alps.farm-parcels'

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
]

// ---------------------------------------------------------------------------
// New Parcel sidebar (layout only — not yet connected to the backend)
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()

const isAddingParcel = () => route.query.addParcel !== undefined
const showSidebar = ref(isAddingParcel())

function closeSidebar() {
    showSidebar.value = false
    draw.value?.setMode('render')
    drawMode.value = 'view'
    router.replace({ path: '/map' })
}

const parcelForm = reactive({
    farm: '',
    parcel_code: '',
    area_hectares: '',
    land_status: 'Cultivated',
    current_use: '',
})

const farmOptions = [
    { code: 'FAR-1001', label: 'Jose Mendoza' },
    { code: 'FAR-1002', label: 'Rosa Dizon' },
    { code: 'FAR-1003', label: 'Pedro Santos' },
    { code: 'FAR-1004', label: 'Luz Villanueva' },
]

function isParcel(feature: GeoJSONStoreFeatures): boolean {
    return feature.properties?.mode === 'polygon'
}

function countParcels(instance: TerraDraw): number {
    return instance.getSnapshot().filter(isParcel).length
}

function loadSavedParcels(): GeoJSONStoreFeatures[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as GeoJSONStoreFeatures[]) : []
    } catch {
        return []
    }
}

function persistParcels(instance: TerraDraw) {
    try {
        const polygons = instance.getSnapshot().filter(isParcel)
        parcelCount.value = polygons.length
        localStorage.setItem(STORAGE_KEY, JSON.stringify(polygons))
    } catch {
        // storage unavailable (private mode etc.) — keep drawing in memory
    }
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

    instance.on('change', () => persistParcels(instance))
    instance.start()

    const saved = loadSavedParcels()
    if (saved.length) {
        instance.addFeatures(saved)
    }
    parcelCount.value = countParcels(instance)

    draw.value = instance
    if (isAddingParcel()) {
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
        .map((feature) => feature.id)
    instance.removeFeatures(ids)
    persistParcels(instance)
    drawMode.value = 'view'
}
</script>

<template>
    <div
        class="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-[#e8f0e5]"
    >
        <div
            class="z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2 shadow-sm"
        >
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-map" class="size-4 text-[#2d6a2d]" />
                <span
                    class="text-sm font-semibold text-gray-800"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Agricultural Parcel Map
                </span>
                <span class="text-[11px] text-gray-400">
                    San Fernando, Pampanga
                </span>
            </div>
            <span
                class="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-600"
            >
                {{ parcelCount }} parcel{{ parcelCount === 1 ? '' : 's' }} drawn
            </span>
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

                <div class="pointer-events-none absolute left-4 top-4 z-10">
                    <div
                        class="rounded-lg bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm"
                    >
                        <div
                            class="text-xs font-semibold text-gray-700"
                            style="font-family: 'DM Sans', sans-serif"
                        >
                            Agricultural Parcel Map — San Fernando, Pampanga
                        </div>
                        <div class="text-[10px] text-gray-500">
                            Base map · MapLibre GL
                        </div>
                    </div>
                </div>

                <div
                    class="pointer-events-none absolute bottom-4 left-4 z-10 rounded bg-white/80 px-2 py-1 font-mono text-[10px] text-gray-600 backdrop-blur-sm"
                >
                    {{ coordinatesText }}
                </div>
            </div>

            <!-- New Parcel Sidebar -->
            <aside
                v-if="showSidebar"
                class="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h2
                            class="text-base font-bold text-gray-900"
                            style="font-family: 'DM Sans', sans-serif"
                        >
                            New Parcel
                        </h2>
                        <p class="text-[11px] text-gray-500">
                            Fill in the parcel details, then plot it on the map.
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
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Farm
                        </label>
                        <select
                            v-model="parcelForm.farm"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                            <option value="" disabled>Select a farm...</option>
                            <option
                                v-for="f in farmOptions"
                                :key="f.code"
                                :value="f.code"
                            >
                                {{ f.code }} · {{ f.label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel Code
                        </label>
                        <input
                            v-model="parcelForm.parcel_code"
                            type="text"
                            placeholder="e.g. PLC-1201"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Area (ha)
                            </label>
                            <input
                                v-model="parcelForm.area_hectares"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Land Status
                            </label>
                            <select
                                v-model="parcelForm.land_status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in landStatusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Current Use
                        </label>
                        <input
                            v-model="parcelForm.current_use"
                            type="text"
                            placeholder="e.g. Rice / Corn / Sugarcane"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                </form>

                <div class="mt-6 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#245524]"
                    >
                        <UIcon name="i-lucide-vector-polygon" class="size-4" />
                        Plot Parcel
                    </button>
                    <p class="mt-2 text-center text-[10px] text-gray-400">
                        Click the map to drop points — click the first point
                        again to close the parcel.
                    </p>
                </div>
            </aside>
        </div>
    </div>
</template>
