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

    instance.setMode('render')
    draw.value = instance
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
            <div class="flex items-center gap-1">
                <button
                    class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    :class="
                        drawMode === 'plot'
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                    "
                    title="Plot a new parcel outline"
                    @click="startPlotting"
                >
                    <UIcon name="i-lucide-vector-polygon" class="size-3.5" />
                    Plot parcel
                </button>
                <button
                    class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    :class="
                        drawMode === 'edit'
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                    "
                    title="Move, reshape or delete parcels (Delete key removes)"
                    @click="startEditing"
                >
                    <UIcon name="i-lucide-move" class="size-3.5" />
                    Edit
                </button>
                <button
                    v-if="drawMode !== 'view'"
                    class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    title="Stop drawing / editing"
                    @click="setViewMode"
                >
                    <UIcon name="i-lucide-check" class="size-3.5" />
                    Done
                </button>
                <button
                    class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    :disabled="parcelCount === 0"
                    :class="{
                        'cursor-not-allowed opacity-40': parcelCount === 0,
                    }"
                    title="Remove all plotted parcels"
                    @click="clearParcels"
                >
                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                    Clear
                </button>
            </div>

            <div class="flex items-center gap-3">
                <span
                    v-if="drawMode === 'plot'"
                    class="text-[11px] font-medium text-emerald-700"
                >
                    Click to drop points — click the first point (or press
                    Enter) to close the parcel
                </span>
                <span
                    class="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-500"
                >
                    {{ parcelCount }} parcel{{ parcelCount === 1 ? '' : 's' }}
                    drawn
                </span>
            </div>
        </div>

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
                        <MglFullscreenControl :position="Position.TOP_RIGHT" />
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
                class="pointer-events-none absolute bottom-4 left-4 z-10 rounded bg-white/80 px-2 py-1 font-mono text-[10px] text-gray-500 backdrop-blur-sm"
            >
                {{ coordinatesText }}
            </div>
        </div>
    </div>
</template>
