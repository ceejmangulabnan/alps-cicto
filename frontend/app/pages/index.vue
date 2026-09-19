<template>
    <main>
        <PageHeader
            title="Dashboard"
            :description="`City Agricultural Office - San Fernando, Pampanga as of ${date}`"
        ></PageHeader>
        <h1>Hello Map</h1>
        <ClientOnly>
            <div class="h-[33vh] w-1/2">
                <MglMap :map-style="style" :center="center" :zoom="zoom">
                    <MglNavigationControl />
                </MglMap>
            </div>
        </ClientOnly>
    </main>
</template>
<script setup lang="ts">
import type { LngLatLike } from 'maplibre-gl'

const date = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
})
const config = useRuntimeConfig()
const key = config.public.maptilerKey
const style = `https://api.maptiler.com/maps/streets-v4/style.json?key=${key}`
const center = [-1.559482, 47.21322] as LngLatLike
const zoom = 1
</script>
