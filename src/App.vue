<script setup lang="ts">

import { ref, useTemplateRef } from 'vue';
import type { AppMode } from './types';

import SpainMap from './components/SpainMap.vue'
import SidePanel from './components/SidePanel.vue';
import ModeBar from './components/ModeBar.vue';
import LoadingScreen from './components/LoadingScreen.vue';
import type { Feature } from 'geojson';

const props = defineProps<{
    cachedGeodata: boolean
}>();

const mode = ref<AppMode | undefined>();
const newMode = ref<AppMode | undefined>();

const mapLoaded = ref<boolean>(false);
const firstLoad = ref<boolean>(false);

const selectedFeature = ref<Feature>();
const mapRef = useTemplateRef('map-ref');

function changeMode(m?: AppMode) {
    mapLoaded.value = false;
    selectedFeature.value = undefined;

    mode.value = undefined;
    newMode.value = m;
}

async function onGeoLoaded() {
    if(firstLoad.value === false) {
        firstLoad.value = true;
        mapLoaded.value = true;
    }

    mode.value = newMode.value;
    newMode.value = undefined;
}

function onGeoLayerMounted() {
    mapLoaded.value = true;
}

function onElementSelected(feature?: Feature) {   
    selectedFeature.value = feature;
}

</script>


<template>
    <div class="h-svh w-screen flex flex-col pb-[env(safe-area-inset-bottom)] bg-fuchsia-700">        
        <ModeBar 
            :current-mode="mode"
            :first-load="firstLoad"
            @change-mode="changeMode"
            class="h-16"    
        />

        <div class="grow overflow-hidden flex flex-col-reverse md:flex-row">
            <SidePanel :selected-feature 
                class="transition-[height] md:transition-[width] duration-400 ease-out md:h-full" 
                :class="selectedFeature? 'h-1/4 md:w-1/4': 'h-0 md:w-0'"
            />

            <div class="relative grow">
                <LoadingScreen v-if="!mapLoaded" class="absolute inset-0 z-2000"/>
                
                <SpainMap class="h-full z-0" 
                    ref="map-ref"
                    :mode="mode" 
                    :new-mode="newMode" 
                    :cached-geodata="props.cachedGeodata" 
                    @on-geo-loaded="onGeoLoaded"
                    @on-geo-mounted-layer="onGeoLayerMounted"
                    @element-selected="onElementSelected"
                />
            </div>
        </div>

    </div>
</template>
