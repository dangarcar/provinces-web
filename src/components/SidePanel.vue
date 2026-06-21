<template>
    <div class="bg-stone-800">
        <div v-if="selectedFeature" class="m-3 md:min-w-[20svw] flex flex-col">
            <div class="flex p-1 pr-0 md:pr-1 gap-2">
                <h1 class="text-4xl font-bold grow">{{ selectedFeature?.properties?.name }}</h1>

                <div class="self-end">
                    <p class="pr-2 pl-2 text-md font-semibold rounded-full border-2" :class="modeColorsTw[mode!]">{{ modeNames[mode!] }}</p>
                </div>
            </div>

            <div v-if="selectedFeature && mode" class="p-1">
                <h2 class="text-xl font-semibold -ml-0.5 mt-2">Centros:</h2>
                
                <CenterCard  title="Centroide" centerName="centroid" class="mt-2"
                    :markerSrc="marker1" :selectedFeature :mode />

                <CenterCard  title="Centro de los municipios" centerName="municipal" class="mt-4"
                    :markerSrc="marker2" :selectedFeature :mode />

                <CenterCard title="Centro de población" centerName="population" class="mt-4"
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

const props = defineProps<{
    selectedFeature?: Feature,
    mode?: AppMode
}>();

const modeColorsTw: Record<AppMode, string> = {
    spa: 'bg-rose-500',
    ccaa: 'bg-emerald-400',
    prov: 'bg-cyan-400'
}

const modeNames: Record<AppMode, string> = {
    spa: 'País',
    ccaa: 'CC.AA.',
    prov: 'Provincia'
}

</script>