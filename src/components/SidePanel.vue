<script setup lang="ts">

const props = defineProps<{
    class: string
}>();

</script>

<template>
    <div class="bg-stone-800" :class=props.class>
        <!--<h1 class="text-4xl">{{ province? province["nameunit"]:'' }}</h1>
        <p>{{ province }}</p>-->

        <!--<HelloWorld msg="VIVA JAPON"/>-->
    </div>
</template>