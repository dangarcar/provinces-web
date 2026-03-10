<script setup lang="ts">

import { ref } from 'vue';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'; 

import type { AppMode } from './types';

import SpainMap from './components/SpainMap.vue'
import SidePanel from './components/SidePanel.vue';
import ModeBar from './components/ModeBar.vue';
import LoadingScreen from './components/LoadingScreen.vue';


const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');


const mode = ref<AppMode | undefined>();
const newMode = ref<AppMode | undefined>();
const mapLoaded = ref<boolean>(false);

function changeMode(m: AppMode) {
    mode.value = undefined;
    newMode.value = m;
    mapLoaded.value = false;
}

function onLoaded() {
    mapLoaded.value = true;
    mode.value = newMode.value;
    newMode.value = undefined;
}

</script>


<template>
    <div class="h-svh w-screen flex flex-col md:flex-row-reverse pb-[env(safe-area-inset-bottom)] bg-fuchsia-700">        
        <div class="flex flex-col grow">
            <ModeBar 
                :current-mode="mode"
                @change-mode="changeMode"
                class="h-16"    
            />
            
            <div class="relative grow">
                <LoadingScreen v-if="!mapLoaded" class="absolute inset-0 z-2000"/>
                
                <SpainMap class="h-full z-0" :mode="mode" :new-mode="newMode" @on-loaded="onLoaded"/>
            </div>
        </div>

        <SidePanel v-if="!isMobile" class="p-3 h-1/4 md:w-1/4 md:h-full"/>
    </div>
</template>
