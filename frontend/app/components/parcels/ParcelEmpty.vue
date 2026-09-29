<template>
    <div
        class="mt-3 flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-5 text-center"
    >
        <UIcon :name="icon" class="size-4 text-gray-300" />
        <p class="text-[11px] text-gray-400">{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        message: string
        /** Lucide icon name; `inbox` reads as "nothing recorded yet". */
        icon?: string
    }>(),
    { icon: 'i-lucide-inbox' }
)
</script>
