<template>
    <div :class="props.class">
        <LMap key="Global map" :center :zoom :options="{ zoomControl: false }" ref="map-ref" @ready="flyToBounds">
            <LTileLayer
                :max-zoom=maxZoom
                :min-zoom=5
                :url="baseMapUrl"
                attribution='&copy; <a href="https://ign.es/" target="_blank">IGN España</a>'
            />
            <LGeoJson 
                v-if="props.mode"
                :geojson="getGeodata(mode)"
                :options="{ onEachFeature: onEachFeature }"
                :options-style="getStyle(mode)"
            />
        </LMap> 
    </div>
</template>

<script setup lang="ts">

import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet"
import { onMounted, useTemplateRef, onBeforeUnmount, watch } from "vue";
import colors from "tailwindcss/colors"

import { useGeodata } from "../composables/useGeodata";
import type { AppMode } from "../types";
import type { StyleFunction } from "leaflet";

const props = defineProps<{
    class: string,
    mode?: AppMode,
    newMode?: AppMode
}>();

const emit = defineEmits(['onLoaded']);

const mapRef = useTemplateRef('map-ref');


const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid
const bounds: [[number, number], [number, number]] = [
    [34.6039117, -10.1416748],  // SW corner
    [43.9562353, 4.0327432]   // NE corner
]


const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";

const { setupData, getGeodata, loadGeometry } = useGeodata();


onMounted(async () => {
    window.addEventListener("resize", flyToBounds);
    
    setupData().then(() => emit('onLoaded'))
})


onBeforeUnmount(() => {
    window.removeEventListener("resize", flyToBounds);
})


watch(() => props.newMode, (newMode) => {
    if(newMode !== undefined) {
        console.time('api3')
        loadGeometry(newMode).then(() => {
            console.timeEnd('api3')    
            emit('onLoaded')
        });
    }
})


//TODO: this is useless
function onEachFeature(feature: any, layer: any) {
    layer.on({
        mouseover: (e: any) => { console.log(feature.properties) },
        mouseout: (f: any) => { console.log(f.target); },
        click: (e: any) => { console.log("CLICK " + e); }
    });
}

function flyToBounds() {
    if(mapRef.value) {
        mapRef.value?.leafletObject?.flyToBounds(bounds, { duration: 1.0 })
    }
}


function getStyle(mode?: AppMode): StyleFunction {
    if(!mode) 
        return () => ({})

    switch(mode) {
        case "spa": 
            return () => ({
                color: colors.rose[400],
                fillColor: colors.rose[500]
            });
        case "ccaa": 
            return () => ({
                color: colors.emerald[300],
                fillColor: colors.emerald[400]
            });
        case "prov": 
            return () => ({
                color: colors.cyan[300],
                fillColor: colors.cyan[400]
            });
    }
}

</script>