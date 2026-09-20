<script setup lang="ts">
const route = useRoute()

const activeNav = computed(() => {
    const name = String(route.name ?? '')
    return name === 'index' ? 'dashboard' : name
})
</script>

<template>
    <div class="flex h-screen overflow-hidden">
        <AppSidebar :active="activeNav" />

        <main class="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
            <AppTopbar :page="activeNav" />

            <NuxtPage />
        </main>
    </div>
</template>
