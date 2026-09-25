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
// New Parcel sidebar (layout only — not yet connected to the backend)
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()

const isAddingParcel = () => route.query.addParcel !== undefined
const isEditingParcel = () => route.query.editParcel !== undefined
const showSidebar = ref(isAddingParcel() || isEditingParcel())
const sidebarTitle = computed(() =>
    isEditingParcel() ? 'Edit Parcel' : 'New Parcel'
)
const sidebarSubtitle = computed(() =>
    isEditingParcel()
        ? 'Update the parcel details for this farmland.'
        : 'Fill in the parcel details, then plot it on the map.'
)

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

if (isEditingParcel()) {
    parcelForm.farm = (route.query.farm_code as string) ?? ''
    parcelForm.parcel_code = (route.query.parcel_code as string) ?? ''
    parcelForm.area_hectares = (route.query.area as string) ?? ''
    parcelForm.land_status = (route.query.land_status as string) ?? 'Cultivated'
    parcelForm.current_use = (route.query.current_use as string) ?? ''
}

const farmOptions = [
    { code: 'FAR-1001', label: 'Jose Mendoza' },
    { code: 'FAR-1002', label: 'Rosa Dizon' },
    { code: 'FAR-1003', label: 'Pedro Santos' },
    { code: 'FAR-1004', label: 'Luz Villanueva' },
]

const farmSelectOptions = computed(() => {
    if (isEditingParcel() && route.query.farm_code) {
        const code = String(route.query.farm_code)
        const known = farmOptions.some((f) => f.code === code)
        if (!known) {
            return [
                ...farmOptions,
                {
                    code,
                    label: String(route.query.farmer_name ?? 'Farm'),
                },
            ]
        }
    }
    return farmOptions
})

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

function openAddParcel() {
    showSidebar.value = true
    router.replace({ path: '/map', query: { addParcel: '1' } })
    draw.value?.setMode('polygon')
    drawMode.value = 'plot'
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
                        <span
                            class="text-sm font-bold text-gray-900 font-sans"
                        >
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
                    v-if="showSidebar || drawMode === 'plot' || drawMode === 'edit'"
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
                        <div class="mt-2.5 space-y-1.5 text-[11px] text-gray-500">
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
                                    v-for="f in farmSelectOptions"
                                    :key="f.code"
                                    :value="f.code"
                                >
                                    {{ f.code }} · {{ f.label }}
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
                            >
                                Area (ha)
                            </label>
                            <input
                                v-model="parcelForm.area_hectares"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
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
                        />
                    </div>
                </form>

                <div class="mt-6 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#245524]"
                    >
                        <UIcon
                            :name="
                                isEditingParcel()
                                    ? 'i-lucide-save'
                                    : 'i-lucide-vector-polygon'
                            "
                            class="size-4"
                        />
                        {{ isEditingParcel() ? 'Save Changes' : 'Plot Parcel' }}
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
