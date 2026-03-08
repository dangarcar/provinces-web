<template>
    <div 
        class="bg-white/10 backdrop-blur-sm flex flex-col justify-center items-center gap-4"
        :class="props.class"
    >
        <img :src="loadinganim" class="h-20 w-20"/>
        <h2 class="font-bold">Cargando mapa...</h2>
    </div>
</template>

<script setup lang="ts">

import loadinganim from '/loadinganim.svg'

const props = defineProps<{
    class: string
}>();

</script>