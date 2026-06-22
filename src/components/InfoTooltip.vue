<template>
    <div class="bg-white rounded-xl shadow-lg px-4 py-3 min-w-50">
        <div class="flex items-center justify-between mb-1.5">
            <div>
                <span class="font-semibold text-stone-800 text-sm">{{ f.properties?.name }}</span>
                <span v-if="mode!=='prov' && f.properties?.name!==f.properties?.province" class="font-light text-stone-600 text-sm"> ({{ f.properties?.province }})</span>
            </div>
            <span class="text-xs bg-blue-100 text-blue-600 ml-1 px-2 py-0.5 rounded-full" v-if="capital">
                Capital
            </span>
        </div>

        <div class="flex text-xs justify-between px-1 mb-0.5">
            <span class=" text-stone-500">Población:</span>
            <span class="text-stone-400">
                {{ f.properties?.population.toLocaleString() }} hab
            </span>
        </div>

        <div class="flex text-xs justify-between px-1">
            <span class=" text-gray-500">Dist. centroide:</span>
            <span class="text-teal-500">
                {{ //@ts-ignore
                    distanceKm(f.geometry.coordinates, centers.centroid).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km
            </span>
        </div>

        <div class="flex text-xs justify-between px-1">
            <span class=" text-gray-500">Dist. municipal:</span>
            <span class="text-fuchsia-600">
                {{ //@ts-ignore
                    distanceKm(f.geometry.coordinates, centers.municipal).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km
            </span>
        </div>

        <div class="flex text-xs justify-between px-1">
            <span class=" text-gray-500">Dist. población:</span>
            <span class="text-amber-600">
                {{ //@ts-ignore
                    distanceKm(f.geometry.coordinates, centers.population).toLocaleString('es-ES', { maximumFractionDigits: 2 }) }} km
            </span>
        </div>

    </div>
</template>

<script setup lang="ts">

import type { Feature } from 'geojson';
import { capitalByMode } from '../leaflet/markerLayerFunctions';
import type { AppMode, Centers } from '../types';
import { computed } from 'vue';
import { distanceKm } from '../utils';

const props = defineProps<{
    f: Feature
    mode: AppMode,
    centers: Centers
}>();

const capital = computed(() => capitalByMode(props.f, props.mode))

</script>