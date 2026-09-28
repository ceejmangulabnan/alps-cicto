<script setup lang="ts">
import type { DrawModeMeta } from '~/composables/useParcelDrawing'

defineProps<{
    coordinates: string
    mode: DrawModeMeta
}>()
</script>

<template>
    <div
        class="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2"
    >
        <div
            class="rounded-lg bg-white/85 px-2 py-1.5 font-mono text-[10px] text-gray-600 shadow-sm backdrop-blur-sm"
        >
            {{ coordinates }}
        </div>
        <div
            class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm"
            :class="mode.cls"
        >
            <UIcon :name="mode.icon" class="size-3" />
            {{ mode.label }}
        </div>
    </div>
</template>
