<script setup>
import { onMounted, ref } from 'vue'
// Explicitly import the stylesheet
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref(null)

onMounted(async () => {
  // Dynamically import maplibre-gl on the client side only
  const maplibregl = await import('maplibre-gl')
  
  const map = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-74.5, 40], 
    zoom: 9
  })
})
</script>

<template>
  <div ref="mapContainer" class="map-view" />
</template>

<style scoped>
.map-view {
  width: 100%;
  height: 500px;
}
</style>
