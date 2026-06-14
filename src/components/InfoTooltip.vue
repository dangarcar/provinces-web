<template>
    <div class="bg-white rounded-xl shadow-lg px-4 py-3 min-w-40">

        <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-gray-800">
                {{ f.properties?.name }}
            </span>
            <span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full" v-if="capitalByMode(f, mode)">
                Capital
            </span>
            </div>

            <div class="text-sm text-gray-500">
                Population
            </div>

            <div class="text-lg font-bold text-gray-900">
                {{ f.properties?.population.toLocaleString() }}
            </div>

            <div class="flex flex-col items-center">
                <div class="bg-white rounded-xl shadow-lg px-4 py-3"></div>
                <div class="w-3 h-3 bg-white rotate-45 -mt-1 shadow"></div>
            </div>

            </div>
</template>

<script setup lang="ts">

import type { Feature } from 'geojson';
import { capitalByMode } from '../leaflet/markerLayerFunctions';
import type { AppMode, Centers } from '../types';

const props = defineProps<{
    f: Feature
    mode: AppMode,
    centers: Centers
}>();

</script>