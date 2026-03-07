<script setup lang="ts">

import HelloWorld from './HelloWorld.vue'
import { useProvince } from '../composables/useProvince';

const { province, setProvince } = useProvince();

</script>

<template>
    <div class="w-1/4 p-3">
        <h1 class="text-4xl">{{ province? province["nameunit"]:'' }}</h1>
        <p>{{ province }}</p>

        <!--<HelloWorld msg="VIVA JAPON"/>-->
    </div>
</template>