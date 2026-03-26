<template>
    <LLayerGroup ref="layer-ref" />
</template>



<script setup lang="ts">

import { LLayerGroup } from "@vue-leaflet/vue-leaflet"
import { onMounted, useTemplateRef, watch } from "vue";
import colors from "tailwindcss/colors"

import { useGeodata } from "../composables/useGeodata";
import { type AppMode } from "../types";
import L, { type StyleFunction } from "leaflet";
import type { Feature } from "geojson";
import { useIsMobile } from "../composables/useIsMobile";

const props = defineProps<{
    cachedGeodata: boolean,
    mapRef: any,
    mode?: AppMode,
    newMode?: AppMode
}>();

const emit = defineEmits(['onGeoLoaded', 'onGeoMountedLayer']);

const { setupData, getGeodata, loadGeometry } = useGeodata(props.cachedGeodata);

const isMobile = useIsMobile();

const layerRef = useTemplateRef('layer-ref');

let geolayer: L.GeoJSON;
let lastLayer: L.Layer | undefined;

onMounted(() => setupData().then(() => emit('onGeoLoaded')));

watch(() => props.newMode, (newMode) => {
    if(newMode !== undefined) {
        const leaflet = layerRef.value?.leafletObject!;
        leaflet.clearLayers();

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
        geolayer = L.geoJSON();
        geolayer.options.style = getStyle(mode);
        geolayer.options.onEachFeature = onEachFeature;
        geolayer.addData(getGeodata(mode));
        
        leaflet.addLayer(geolayer);
     
        emit('onGeoMountedLayer')
    }
}, { immediate: true })


function onEachFeature(f: Feature, layer: L.Layer) {
    layer.on({
        mouseover: e => { 
            if(!props.mode || lastLayer) 
                return;
            
            const layer = e.target;
            layer.setStyle(hoverStyle[props.mode]);
            layer.bringToFront();
        },
        mouseout: e => { 
            if(!lastLayer)
                geolayer.resetStyle(e.target);
        },
        click: e => { 
            if(!props.mode) 
                return;
            
            
            if(lastLayer)
                geolayer.resetStyle(lastLayer);
        
            const layer = e.target;
            if(lastLayer !== layer) {
                layer.setStyle(clickStyle[props.mode])
                lastLayer = layer;

                console.log(f) //FIXME:
            } else {
                if(!isMobile.value)
                    layer.setStyle(hoverStyle[props.mode])
                lastLayer = undefined;
            }

            layer.bringToFront(); 
        }
    });
}


function getStyle(mode?: AppMode): StyleFunction {
    if(!mode) 
        return () => ({})

    return () => baseStyle[mode];
}

const baseStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[400],
        fillColor: colors.rose[500],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    },
    'ccaa': {
        color: colors.emerald[300],
        fillColor: colors.emerald[400],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    },
    'prov': {
        color: colors.cyan[300],
        fillColor: colors.cyan[400],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    }
} as const;

const hoverStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[300],
        fillColor: colors.rose[600],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    },
    'ccaa': {
        color: colors.emerald[200],
        fillColor: colors.emerald[500],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    },
    'prov': {
        color: colors.cyan[200],
        fillColor: colors.cyan[500],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    }
} as const;

const clickStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[200],
        fillColor: colors.rose[500],
        fillOpacity: 0.5,
        weight: isMobile.value? 2 : 3
    },
    'ccaa': {
        color: colors.emerald[100],
        fillColor: colors.emerald[500],
        fillOpacity: 0.7,
        weight: isMobile.value? 2 : 3
    },
    'prov': {
        color: colors.cyan[200],
        fillColor: colors.cyan[500],
        fillOpacity: 0.7,
        weight: isMobile.value? 2 : 3
    }
} as const;

</script>