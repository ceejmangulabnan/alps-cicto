<script setup lang="ts">
import type { StatusLegendEntry } from '~/utils/landStatus'

defineProps<{ entries: StatusLegendEntry[] }>()

/**
 * Collapsed by default. Expanded it is a panel wide enough to sit over the map's
 * bottom-right corner, which is where the attribution lives, so the compact
 * pill is what most of the time is on screen.
 */
const expanded = ref(false)
</script>

<template>
    <div
        class="absolute bottom-10 right-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
    >
        <button
            type="button"
            class="flex w-full items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
            :aria-expanded="expanded"
            @click="expanded = !expanded"
        >
            <UIcon name="i-lucide-swatch-book" class="size-3 text-[#2d6a2d]" />
            Land Status
            <UIcon
                :name="
                    expanded
                        ? 'i-lucide-chevron-down'
                        : 'i-lucide-chevron-right'
                "
                class="ml-auto size-3"
            />
        </button>

        <div
            v-if="expanded"
            class="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-gray-100 px-3 py-2.5"
        >
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
