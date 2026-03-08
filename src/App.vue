<script setup lang="ts">

import SpainMap from './components/SpainMap.vue'
import SidePanel from './components/SidePanel.vue';
import BottomBar from './components/BottomBar.vue';
import type { AppMode } from './types';
import { ref } from 'vue';
import LoadingScreen from './components/LoadingScreen.vue';


const mode = ref<AppMode | undefined>();
const mapLoaded = ref<boolean>(false);

function changeMode(newMode: AppMode) {
    mode.value = newMode;
    mapLoaded.value = false;
}

function onLoaded() {
    alert("loaded!")
    mapLoaded.value = true;
}

</script>


<template>
    <div class="h-screen w-screen flex flex-col md:flex-row">
        <SidePanel class="p-3 h-1/4 md:w-1/4 md:h-full"/>
        
        <div class="relative grow">
            <LoadingScreen v-if="!mapLoaded" class="absolute inset-0 z-2000"/>

            <SpainMap class="h-full z-0" :mode="mode" @on-loaded="onLoaded"/>
        </div>
        
        <BottomBar 
            :current-mode="mode"
            @change-mode="changeMode"
            class="h-16"    
        />
    </div>
</template>
