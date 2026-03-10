<template>
    <div class="flex justify-around bg-stone-800" :class="props.class">
        <button 
            v-for="mode in APP_MODES"
            class="grow flex justify-center items-center border-2 border-b-0 rounded-t-lg border-emerald-950 bg-emerald-900"
            :class="{ 'bg-emerald-700! border-emerald-200!': props.currentMode==mode }" 
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