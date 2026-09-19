<template>
    <header class="space-y-1 md:mb-6 mb-4">
        <h1 class="text-2xl md:text-4xl font-bold">{{ title }}</h1>
        <p class="text-sm md:text-basetext-muted">{{ description }}</p>
    </header>
</template>

<script lang="ts" setup>
interface Props {
    title: string
    description: string
}

const { title, description } = defineProps<Props>()
</script>
