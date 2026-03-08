<template>
    <div class="bg-emerald-900 flex justify-around" :class="props.class">
        <button 
            v-for="mode in APP_MODES"
            class="grow flex justify-center items-center"
            :class="{ 'bg-emerald-700 ring-emerald-200 ring-2 rounded-md ring-inset': props.currentMode==mode }" 
            @click="$emit('changeMode', mode)"
            :key="mode"
        > 
            <img :src="getMapImg(mode)" class="h-12">
        </button>
    </div>
</template>

<script setup lang="ts">
import { APP_MODES, type AppMode } from '../types';

const props = defineProps<{
    class: string
    currentMode?: AppMode
}>();

const emits = defineEmits<{
    changeMode: [mode: AppMode]
}>();


import flagmap from "/flagmap.png"
import ccaamap from "/ccaamap.png"
import provincemap from "/provincemap.png"

function getMapImg(mode: AppMode) {
    switch(mode) {
        case 'spa': return flagmap;
        case 'ccaa': return ccaamap;
        case 'prov': return provincemap;
    }
}

</script>