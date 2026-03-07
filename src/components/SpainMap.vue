<template>
    <div :class="props.class">
        <LMap :zoom="zoom" :center="center" :options="{ zoomControl: false }">
            <LTileLayer
                :max-zoom=maxZoom
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
import { onMounted, watch, shallowRef, reactive } from "vue";
import { useProvince } from "../composables/useProvince";

const props = defineProps<{
    class: string
}>();

const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid

const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";



const provincesData = shallowRef();
const rec = reactive({i: 0});

const provincesIdURL = 'https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevelname=Provincia'
//const provinceEmptyURL = 'https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=1&skipGeometry=true&nationallevelname=Provincia'

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

const { province, setProvince } = useProvince();

const onEachFeature = (feature: any, layer: any) => {
    layer.on({
        mouseover: (e: any) => { setProvince(feature.properties) },
        mouseout: (f: any) => { console.log(f.target); },
        click: (e: any) => { console.log("CLICK " + e); }
    });
}


</script>