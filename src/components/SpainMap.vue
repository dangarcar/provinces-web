<template>
    <div>
        <LMap key="Global map" :center :zoom :options="{ zoomControl: false, doubleClickZoom: false, zoomSnap: 0.1 }" ref="map-ref" @vue:updated="flyToBounds(defaultBounds)">
            <LTileLayer
                :min-zoom=4
                :max-zoom="maxZoom"
                :url="baseMapUrl"
                attribution='&copy; <a href="https://ign.es/" target="_blank">IGN España</a>'
            />
            <GeoJsonLayer 
                :cachedGeodata :mode :new-mode :map-ref="mapRef"
                @on-geo-loaded="$emit('onGeoLoaded')"
                @on-geo-mounted-layer="$emit('onGeoMountedLayer')"
                @element-selected="onSelectedElement"
            />
        </LMap> 
    </div>
</template>



<script setup lang="ts">

import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet"
import { onMounted, useTemplateRef, onBeforeUnmount } from "vue";

import { type AppMode } from "../types";
import GeoJsonLayer from "./GeoJsonLayer.vue";
import type { Feature } from "geojson";
import { nextTick } from "vue";
import { LatLngBounds, type LatLngBoundsExpression } from "leaflet";

const props = defineProps<{
    cachedGeodata: boolean,
    mode?: AppMode,
    newMode?: AppMode
}>();

const emit = defineEmits<{
    onGeoLoaded: [],
    onGeoMountedLayer: [],
    elementSelected: [feature?: Feature]
}>();


const mapRef = useTemplateRef('map-ref');
let lastFeatureUndef = true;

const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid

const defaultBounds = new LatLngBounds(
    [34.6039117, -10.1416748],  // SW corner
    [43.9562353, 4.0327432]   // NE corner
);


const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";


onMounted(() => {
    window.addEventListener("resize", () => flyToBounds(defaultBounds));
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", () => flyToBounds(defaultBounds));
})


async function onSelectedElement(feature?: Feature) {
    emit('elementSelected', feature);

    const leaflet = mapRef.value?.leafletObject!;
    
    await nextTick();

    const animTime = (!lastFeatureUndef && feature)? 0: 400;
    smoothResize(leaflet, animTime);

    const deltaZoom = feature? -0.3 : 0.1;
    setTimeout(() => {
        requestAnimationFrame(() => leaflet.flyTo(leaflet.getCenter(), leaflet.getZoom() + deltaZoom, { duration: 0.2, easeLinearity: 0.5 }));
    }, animTime);

    let bounds = defaultBounds;
    if(feature && feature.bbox) {
        const bbox = feature.bbox;
        const boundsPad = 5e-2;
        bounds = new LatLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]).pad(boundsPad);
    }

    setTimeout(() => {
        requestAnimationFrame(() => leaflet.flyToBounds(bounds, { duration: 0.7 - deltaZoom, easeLinearity: 0.1 }))
    }, animTime + 200);


    lastFeatureUndef = feature === undefined;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function smoothResize(leaflet: any, duration: number) {
    const start = performance.now();
    const startCenter = leaflet.getCenter();

    const step = (now: number) => {
        const progress = easeOutCubic(Math.min((now - start) / duration, 1));

        leaflet.invalidateSize({ pan: false })

        leaflet.setView(startCenter, leaflet.getZoom(), { animate: false });

        if(progress < 1)
            requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}


function flyToBounds(bounds: LatLngBoundsExpression) {
    if(mapRef.value) {
        mapRef.value?.leafletObject?.flyToBounds(bounds, { duration: 1.0 })
    }
}

</script>