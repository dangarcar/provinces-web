<template>
    <div class="flex rounded-xl p-1 bg-stone-700"> 
        <img :src="markerSrc" class="h-9 m-2" />
                    
        <div class="p-1">
            <h3 class="font-semibold text-lg">{{ title }}:</h3>
            <span class="block text-sm text-emerald-100 -mt-1">{{ formatCoords(center) }}</span>

            <h4 v-if="visible" class="font-semibold mt-1">Municipio más cercano:</h4>
            <p v-if="visible" class="text-sm">{{ closest?.props.name }} 
                <span v-if="mode!=='prov'">({{ closest?.props.province }})</span>
                {{ distanceKm(closest?.coords, center).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Feature } from 'geojson';
import { computed, ref } from 'vue';
import type { AppMode } from '../types';
import { distanceKm, formatCoords } from '../utils';
import { useIsMobile } from '../composables/useIsMobile';


const isMobile = useIsMobile();

const visible = ref(!isMobile.value);

const props = defineProps<{
    markerSrc: string,
    selectedFeature: Feature,
    title: string
    centerName: string
    mode: AppMode
}>();

const center = computed(() => props.selectedFeature.properties?.centers[props.centerName]);
const closest = computed(() => getClosest(props.selectedFeature.properties?.villages, center.value))


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