<template>
  <MglMap :map-style="style" :center="center" :zoom="zoom">
    <MglNavigationControl />
  </MglMap>
</template>

<script setup>
const style = "https://demotiles.maplibre.org/style.json";
const center = [-1.559482, 47.21322];
const zoom = 8;
</script>
