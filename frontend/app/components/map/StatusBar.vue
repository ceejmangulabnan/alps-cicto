<script setup lang="ts">
import type { DrawModeMeta } from '~/composables/useParcelDrawing'

defineProps<{
    coordinates: string
    mode: DrawModeMeta
}>()
</script>

<template>
    <!--
        Sits above MapLibre's own bottom-left logo, which would otherwise be
        covered by this bar.
    -->
    <div
        class="pointer-events-none absolute bottom-9 left-4 z-10 flex max-w-[calc(100%-2rem)] items-center gap-2"
    >
        <div
            class="truncate rounded-lg bg-white/85 px-2 py-1.5 font-mono text-[10px] text-gray-600 shadow-sm backdrop-blur-sm"
        >
            {{ coordinates }}
        </div>
        <div
            class="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm"
            :class="mode.cls"
        >
            <UIcon :name="mode.icon" class="size-3" />
            {{ mode.label }}
        </div>
    </div>
</template>
