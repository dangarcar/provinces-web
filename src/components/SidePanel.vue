<script setup lang="ts">
import type { Feature } from 'geojson';


const props = defineProps<{
    selectedFeature?: Feature
}>();

</script>

<template>
    <div class="bg-stone-800">
        <div class="m-3 min-h-[20svh] md:min-w-[20svw]">

            <h1>{{ selectedFeature?.properties?.name }}</h1>
            <!--<h1 class="text-4xl">{{ province? province["nameunit"]:'' }}</h1>
            <p>{{ province }}</p>-->
            
        </div>
    </div>
</template>