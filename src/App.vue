<script setup lang="ts">
import SpainMap from './components/SpainMap.vue'
import SidePanel from './components/SidePanel.vue';

</script>

<template>
    <div class="h-screen w-screen flex">
        <SidePanel />
        <SpainMap class="grow"/>
    </div>
</template>
