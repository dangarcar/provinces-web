<template>
    <div>
        <LMap key="Global map" :center :zoom :options="{ zoomControl: false }" ref="map-ref" @ready="flyToBounds">
            <LTileLayer
                :min-zoom=5
                :max-zoom="maxZoom"
                :url="baseMapUrl"
                attribution='&copy; <a href="https://ign.es/" target="_blank">IGN España</a>'
            />
            <GeoJsonLayer 
                :cachedGeodata :map-ready :mode :new-mode :map-ref="mapRef"
                @on-geo-loaded="$emit('onGeoLoaded')"
                @on-geo-mounted-layer="$emit('onGeoMountedLayer')"
            />
        </LMap> 
    </div>
</template>



<script setup lang="ts">

import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet"
import { onMounted, useTemplateRef, onBeforeUnmount } from "vue";

import { type AppMode } from "../types";
import GeoJsonLayer from "./GeoJsonLayer.vue";

const props = defineProps<{
    cachedGeodata: boolean,
    mapReady: boolean,
    mode?: AppMode,
    newMode?: AppMode
}>();

const emit = defineEmits(['onGeoLoaded', 'onGeoMountedLayer']);


const mapRef = useTemplateRef('map-ref');

const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid
const bounds: [[number, number], [number, number]] = [
    [34.6039117, -10.1416748],  // SW corner
    [43.9562353, 4.0327432]   // NE corner
]


const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";


onMounted(() => {
    window.addEventListener("resize", flyToBounds);
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", flyToBounds);
})


function flyToBounds() {
    if(mapRef.value) {
        mapRef.value?.leafletObject?.flyToBounds(bounds, { duration: 1.0 })
    }
}

</script>