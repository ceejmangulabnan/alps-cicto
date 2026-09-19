<script setup lang="ts">
import type { StyleSpecification } from 'maplibre-gl'
import { Position } from '@indoorequal/vue-maplibre-gl'

definePageMeta({ middleware: 'auth' })

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
</script>

<template>
    <div
        class="relative h-[calc(100vh-56px)] w-full overflow-hidden bg-[#e8f0e5]"
    >
        <ClientOnly>
            <div class="absolute inset-0">
                <MglMap
                    v-model:center="mapCenter"
                    v-model:zoom="mapZoom"
                    :map-style="mapStyle"
                    :attribution-control="attributionControl"
                    height="100%"
                    width="100%"
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
</template>
