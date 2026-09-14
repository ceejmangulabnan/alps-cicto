<template>
  <div>
    <ClientOnly>
      <MglMap :map-style="style" :center="center" :zoom="zoom" height="500px">
        <MglNavigationControl />
      </MglMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { MglMap, MglNavigationControl } from "@indoorequal/vue-maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const style =
  "https://api.maptiler.com/maps/streets/style.json?key=cQX2iET1gmOW38bedbUh";
const center: [number, number] = [-1.559482, 47.21322];
const zoom = 8;
</script>
