<template>
    <div :class="props.class">
        <LMap :center :zoom :options="{ zoomControl: false }" ref="map-ref" @ready="onMapReady">
            <LTileLayer
                :max-zoom=maxZoom
                :min-zoom=5
                :url="baseMapUrl"
                attribution='&copy; <a href="https://ign.es/" target="_blank">IGN España</a>'
            />
            <LGeoJson 
                :geojson="provincesData"
                :options="{ onEachFeature: onEachFeature }"
            />
        </LMap> 
    </div>
</template>

<script setup lang="ts">

import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet"
import { onMounted, watch, shallowRef, reactive, ref, useTemplateRef } from "vue";
import { useProvince } from "../composables/useProvince";
import type { AppMode } from "../types";

const props = defineProps<{
    class: string,
    mode?: AppMode
}>();

const emit = defineEmits(['onLoaded']);

const mapRef = useTemplateRef('map-ref');

function onMapReady() {
    mapRef.value?.leafletObject?.fitBounds(bounds)
}

setTimeout(() => {
    console.log(mapRef.value)
    mapRef.value?.leafletObject?.flyToBounds(bounds, { duration: 1.0 })
    emit('onLoaded')
}, 3000)

const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid
const bounds: [[number, number], [number, number]] = [
    [34.6039117, -10.1416748],  // SW corner
    [43.9562353, 4.0327432]   // NE corner
]


const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";


/*const emits = defineEmits<{
    onGeometryLoaded
}>();*/


const provincesData = ref();
/*const rec = reactive({i: 0});



const provincesIdURL = 'https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevelname=Provincia'
const spainURL = 'https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=1&skipGeometry=false&nationallevelname=País'
//const provinceEmptyURL = 'https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=1&skipGeometry=true&nationallevelname=Provincia'


function nationalLevelByMode(mode: AppMode) {
    switch(mode) {
        case "spa":  return "https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/1stOrder"
        case "ccaa": return "https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/2ndOrder"
        case "prov": return "https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/3rdOrder"
    }
}

onMounted(async () => {
    try {
        console.time("api")
        const provinceSet = await (await fetch(provincesIdURL)).json();
        provincesData.value = provinceSet;

        for(const p of provinceSet.features) {
            const url = `https://api-features.ign.es/collections/administrativeunit/items/${p.id}?f=json`
            fetch(url).then(async v => v.json().then(v => {
                const elem: any = provinceSet.features.find((e: any) => e.id === p.id);
                elem.geometry = v.geometry
                rec.i++;
                provincesData.value = structuredClone(provinceSet)
            }))            
        }

        watch(rec, r => {
            if(r.i === provinceSet.numberReturned) {
                console.timeEnd("api")
            }
        })
    } catch (error) {
        console.error('Error fetching API data:', error);
    }
});

const { province, setProvince } = useProvince();*/

const onEachFeature = (feature: any, layer: any) => {
    layer.on({
        mouseover: (e: any) => { console.log(feature.properties) },
        mouseout: (f: any) => { console.log(f.target); },
        click: (e: any) => { console.log("CLICK " + e); }
    });
}


</script>