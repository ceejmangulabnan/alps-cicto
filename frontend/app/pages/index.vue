<template>
    <div>
        <h1>Hello Map</h1>
        <ClientOnly>
            <div class="h-[33vh] w-1/2">
                <MglMap :map-style="style" :center="center" :zoom="zoom">
                    <MglNavigationControl />
                </MglMap>
            </div>
        </ClientOnly>
        <h1>Hello Map Leaflet</h1>
        <div class="h-[33vh] w-1/2">
            <MapLeaflet></MapLeaflet>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { LngLatLike } from 'maplibre-gl'

const config = useRuntimeConfig()
const key = config.public.maptilerKey
const style = `https://api.maptiler.com/maps/streets-v4/style.json?key=${key}`
const center = [-1.559482, 47.21322] as LngLatLike
const zoom = 1
</script>
