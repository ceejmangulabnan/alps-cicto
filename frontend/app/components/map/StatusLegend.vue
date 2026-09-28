<script setup lang="ts">
import type { StatusLegendEntry } from '~/utils/landStatus'

defineProps<{ entries: StatusLegendEntry[] }>()
</script>

<template>
    <div
        class="pointer-events-none absolute bottom-4 right-4 z-10 rounded-xl bg-white/95 px-3 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
    >
        <div
            class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
        >
            Land Status
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1">
            <div
                v-for="entry in entries"
                :key="entry.label"
                class="flex items-center gap-1.5"
            >
                <span
                    class="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10"
                    :style="{ backgroundColor: entry.color }"
                />
                <span class="text-[10px] text-gray-600">{{ entry.label }}</span>
            </div>
        </div>
    </div>
</template>
