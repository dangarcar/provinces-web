<template>
    <div class="bg-stone-800">
        <div v-if="selectedFeature" class="md:min-w-[20svw] m-1 flex flex-col">
            <div class="flex m-3 pr-0 md:pr-1 gap-1 md:gap-2 flex-col md:flex-row justify-between">
                <div class="flex">
                    <h1 class="text-4xl font-bold grow">{{ selectedFeature?.properties?.name }}</h1>
                    <button v-if="isMobile" class="text-2xl px-2 transition-transform duration-100 active:scale-125" @click="$emit('closeLayer')">x</button>
                </div>

                <div class="self-start md:self-end">
                    <p class="px-2 mt-1 leading-5 text-sm font-semibold rounded-full border" :class="modeColorsTw[mode!]">{{ modeNames[mode!] }}</p>
                </div>
            </div>

            <div v-if="selectedFeature && mode" class="flex-1 overflow-y-auto min-h-0 p-3 pt-0 max-h-[calc(33svh-3rem)] md:max-h-full">
                <h2 class="text-xl font-semibold -ml-0.5">Centros:</h2>
                
                <CenterCard  title="Centroide" centerName="centroid" class="mt-2 mb-4"
                    :markerSrc="marker1" :selectedFeature :mode />

                <CenterCard  title="Centro de los municipios" centerName="municipal" class="mb-4"
                    :markerSrc="marker2" :selectedFeature :mode />

                <CenterCard title="Centro de población" centerName="population" class="mb-8"
                    :markerSrc="marker3" :selectedFeature :mode />
            </div>            
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Feature } from 'geojson';
import type { AppMode } from '../types';

import marker1 from "/marker1.png"
import marker2 from "/marker2.png"
import marker3 from "/marker3.png"
import CenterCard from './CenterCard.vue';
import { useIsMobile } from '../composables/useIsMobile.ts';

const props = defineProps<{
    selectedFeature?: Feature,
    mode?: AppMode
}>();

const emit = defineEmits<{
    closeLayer: [],
}>();

const isMobile = useIsMobile();

const modeColorsTw: Record<AppMode, string> = {
    spa: 'bg-rose-800',
    ccaa: 'bg-emerald-700',
    prov: 'bg-cyan-700'
}

const modeNames: Record<AppMode, string> = {
    spa: 'País',
    ccaa: 'CC.AA.',
    prov: 'Provincia'
}

</script>