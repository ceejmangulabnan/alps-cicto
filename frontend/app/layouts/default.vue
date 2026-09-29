<script setup lang="ts">
const route = useRoute()
const { isMobile, drawerOpen, close } = useSidebar()

const activeNav = computed(() => {
    const name = String(route.name ?? '')
    return name === 'index' ? 'dashboard' : name
})

// A drawer left open after navigating would cover the page just navigated to.
watch(() => route.fullPath, close)

// Shrinking past `lg` while the drawer is open would otherwise leave it
// overlaying content that is no longer a full-height sidebar.
watch(isMobile, (mobile) => {
    if (mobile) close()
})

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <div class="flex h-screen overflow-hidden">
        <AppSidebar :active="activeNav" />

        <!--
            Backdrop for the off-canvas drawer. Only mounted while it is open so
            it cannot swallow clicks meant for the page behind it.
        -->
        <div
            v-if="drawerOpen"
            class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            @click="close"
        />

        <main class="flex min-w-0 flex-1 flex-col overflow-y-auto bg-gray-50">
            <AppTopbar :page="activeNav" />

            <NuxtPage />
        </main>
    </div>
</template>
