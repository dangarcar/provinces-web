<template>
    <div>
        <LMap key="Global map" :center :zoom :options="{ zoomControl: false, doubleClickZoom: false, zoomSnap: 1 }" ref="map-ref" @vue:updated="flyToBounds(defaultBounds)">
            <LTileLayer
                :min-zoom=4
                :max-zoom="maxZoom"
                :url="baseMapUrl"
                attribution='&copy; <a href="https://ign.es/" target="_blank">IGN España</a>'
            />
            <LLayerGroup ref="layer-ref" />
        </LMap> 
    </div>
</template>



<script setup lang="ts">

import { LMap, LTileLayer, LLayerGroup } from "@vue-leaflet/vue-leaflet"
import { onMounted, useTemplateRef, onBeforeUnmount, watch } from "vue";

import { type AppMode } from "../types";
import type { Feature } from "geojson";
import { nextTick } from "vue";
import L, { LatLngBounds, type LatLngBoundsExpression } from "leaflet";
import { usePopulation } from "../composables/usePopulation";
import { useGeodata } from "../composables/useGeodata";
import { useIsMobile } from "../composables/useIsMobile";
import { getStyle, getStyleFunction } from "../leaflet/polyLayerFunctions";
import { getPointLayer, useOnEachFeaturePoint, usePointToLayer } from "../leaflet/markerLayerFunctions";

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
const layerRef = useTemplateRef('layer-ref');
let lastFeatureUndef = true;

const isMobile = useIsMobile();
const { setupData, getGeodata, loadGeometry } = useGeodata(props.cachedGeodata);
const { setupPopulation, getMunicipalities, getAllMunicipalities, addCenters } = usePopulation();

let lastLayer: L.Layer | undefined;
let polyLayerId: number = -1;
let pointLayerId: number = -1;


const zoom = 6, maxZoom = 12
const center: [number, number] = [40.4268, -3.7038] // Madrid

const defaultBounds = new LatLngBounds(
    [34.6039117, -10.1416748],  // SW corner
    [43.9562353, 4.0327432]   // NE corner
);


const baseMapUrl = "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";
//const secondMapUrl = "https://www.ign.es/wmts/ign-base?layer=IGNBaseOrto&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}";

onMounted(() => {
    Promise.all([ setupData(), setupPopulation() ]).then(() => emit('onGeoLoaded'));
    window.addEventListener("resize", () => flyToBounds(defaultBounds));
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", () => flyToBounds(defaultBounds));
})

watch(() => props.newMode, (newMode) => {
    if(newMode !== undefined) {
        const leaflet = layerRef.value?.leafletObject!;
        leaflet.clearLayers();

        onSelectedElement(undefined);

        console.time('load-geometry')
        loadGeometry(newMode).then(async () => {
            console.timeEnd('load-geometry')
            emit('onGeoLoaded');
        });
    }
});

watch(() => props.mode, async (mode) => {
    if(mode) {
        const leaflet = layerRef.value?.leafletObject!;

        await new Promise(r => setTimeout(r, 50));

        lastLayer = undefined;
        const geolayer = L.geoJSON();
        geolayer.options.style = getStyleFunction(mode);
        geolayer.options.onEachFeature = onEachPolygonFeature;
        geolayer.addData(getGeodata(mode));
        
        leaflet.addLayer(geolayer);
        polyLayerId = leaflet.getLayerId(geolayer);
     
        emit('onGeoMountedLayer')
    }
}, { immediate: true })


const onEachPolygonFeature = (f: Feature, layer: L.Layer) => {
    const layerGroup = layerRef.value?.leafletObject;
    
    layer.on({
        mouseover: e => { 
            if(!props.mode || lastLayer) 
                return;

            const layer = e.target;
            layer.setStyle(getStyle(props.mode, 'hover'));
            layer.bringToFront();
        },
        mouseout: e => { 
            if(!lastLayer)
                (layerGroup?.getLayer(polyLayerId) as L.GeoJSON).resetStyle(e.target);
        },
        click: e => { 
            if(!props.mode) 
                return;


            if(lastLayer)
                (layerGroup?.getLayer(polyLayerId) as L.GeoJSON).resetStyle(lastLayer);
        
            const layer = e.target;
            if(lastLayer !== layer) {
                layer.setStyle(getStyle(props.mode, 'click'))

                lastLayer = layer;
                setFeature(f);                
            } else {
                if(!isMobile.value)
                    layer.setStyle(getStyle(props.mode, 'hover'))

                lastLayer = undefined;
                setFeature(undefined);
            }

            layer.bringToFront(); 
        }
    })
};

function setFeature(feature?: Feature) {
    emit('elementSelected', feature);

    const layerGroup = layerRef.value?.leafletObject!;
    if(layerGroup.getLayers().length > 1)
        layerGroup.removeLayer(pointLayerId);
    
    if(!feature || !props.mode)
        return;

    const geolayer = L.geoJSON();
    geolayer.options.onEachFeature = useOnEachFeaturePoint(props.mode);
    geolayer.options.pointToLayer = usePointToLayer(props.mode);
    geolayer.addData(getPointLayer(feature, props.mode, getMunicipalities, getAllMunicipalities, addCenters));

    layerGroup.addLayer(geolayer);
    pointLayerId = layerGroup.getLayerId(geolayer);

    //Smooth map animation
    onSelectedElement(feature);
}


//MAP CONTROL
async function onSelectedElement(feature?: Feature) {
    const mapObject = mapRef.value?.leafletObject!;
    
    await nextTick();

    const animTime = (!lastFeatureUndef && feature)? 0: 400;
    smoothResize(mapObject, animTime);

    const deltaZoom = feature? -0.3 : 0.1;
    setTimeout(() => {
        requestAnimationFrame(() => mapObject.flyTo(mapObject.getCenter(), mapObject.getZoom() + deltaZoom, { duration: 0.2, easeLinearity: 0.5 }));
    }, animTime);

    let bounds = defaultBounds;
    if(feature && feature.bbox) {
        const bbox = feature.bbox;
        const boundsPad = 5e-2;
        bounds = new LatLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]).pad(boundsPad);
    }

    setTimeout(() => {
        requestAnimationFrame(() => mapObject.flyToBounds(bounds, { duration: 0.7 - deltaZoom, easeLinearity: 0.1 }))
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