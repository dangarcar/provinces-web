<template>
    <div class="flex rounded-xl p-1 bg-stone-700"> 
        <img :src="markerSrc" class="h-9 m-2" />
                    
        <div class="p-1 grow">
            <h3 class="font-semibold text-lg">{{ title }}:</h3>
            <span class="block text-sm text-emerald-100 -mt-1">{{ formatCoords(center) }}</span>

            <div class="overflow-hidden transition-all duration-300 ease-in-out" ref="expand" 
                :style="{ maxHeight: isMobile? (visible ? expandedHeight + 'px' : '0px') : 'auto' }"
            >
                <h4 class="font-semibold mt-3">Municipio más cercano:</h4>
                <p class="text-sm ml-2">{{ closest?.props.name }} 
                    <span v-if="mode!=='prov'">({{ closest?.props.province }})</span> :&nbsp;&nbsp;
                    <span class="font-light">{{ distanceKm(closest?.coords, center).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km</span>
                </p>

                <h4 class="font-semibold mt-1">Distancia a la capital:</h4>
                <p class="text-sm ml-2 mb-2">{{ capital?.props.name }} 
                    <span v-if="mode!=='prov'">({{ capital?.props.province }})</span> :&nbsp;&nbsp;
                    <span class="font-light">{{ distanceKm(capital?.coords, center).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km</span>
                </p>
            </div>
        </div>

        <svg
            v-if="isMobile"
            class="m-3 w-6 h-6 text-stone-50 transition-transform duration-200"
            :class="visible ? 'rotate-0' : 'rotate-90'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
            @click="visible = !visible"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
import type { Feature } from 'geojson';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import type { AppMode } from '../types';
import { distanceKm, formatCoords } from '../utils';
import { useIsMobile } from '../composables/useIsMobile';


const isMobile = useIsMobile();

const visible = ref(!isMobile.value);

const expand = useTemplateRef('expand');
const expandedHeight = ref(0);

watch(visible, async (val) => {
    if(val && expand.value) {
        await nextTick();
        expandedHeight.value = expand.value.scrollHeight;
    } else {
        expandedHeight.value = 0
    }
});

const props = defineProps<{
    markerSrc: string,
    selectedFeature: Feature,
    title: string
    centerName: string
    mode: AppMode
}>();

const center = computed(() => props.selectedFeature.properties?.centers[props.centerName]);
const closest = computed(() => getClosest(props.selectedFeature.properties?.villages, center.value))

const capital = computed(() => props.selectedFeature.properties?.villages.filter((e:any) => {
    switch(props.mode) {
        case 'spa': return e.props.nationCap;
        case 'ccaa': return e.props.ccaaCap;
        case 'prov': return e.props.provCap;
    }
})[0]);

function getClosest(villages: any[], coords: [number,number]) {
    return villages
        .map(v => {
            const dx = v.coords[0] - coords[0];
            const dy = v.coords[1] - coords[1];
            return { dist: dx*dx + dy*dy, props: v.props, coords: v.coords};
        })
        .sort((a, b) => a.dist - b.dist)[0];
}

</script>