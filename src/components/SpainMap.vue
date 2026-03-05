<script setup lang="ts">
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet"

const props = defineProps<{
    height: string,
    width: string
}>();

const zoom = 13
const center: [number, number] = [40.4268, -3.7038] // Madrid
</script>

<template>
  <div>
    <LMap :zoom="zoom" :center="center" :style="{ height:props.height, width: props.width }">
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <LMarker :lat-lng="center">
        <LPopup>Madfid 🚀</LPopup>
      </LMarker>
    </LMap> 
  </div>
</template>