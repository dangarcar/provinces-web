<script setup lang="ts">

import { useProvince } from '../composables/useProvince';

const { province, setProvince } = useProvince();

const props = defineProps<{
    class: string
}>();

</script>

<template>
    <div :class=props.class>
        <h1 class="text-4xl">{{ province? province["nameunit"]:'' }}</h1>
        <p>{{ province }}</p>

        <!--<HelloWorld msg="VIVA JAPON"/>-->
    </div>
</template>