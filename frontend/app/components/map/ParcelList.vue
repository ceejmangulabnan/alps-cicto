<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { statusColor } from '~/utils/landStatus'

defineProps<{
    parcels: FarmParcel[]
    selectedId: string | null
}>()

const emit = defineEmits<{
    select: [documentId: string]
    fitAll: []
}>()
</script>

<template>
    <div
        class="absolute right-4 top-24 z-10 w-60 overflow-hidden rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
    >
        <div class="flex items-center justify-between px-3 py-2">
            <span
                class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
            >
                Parcels ({{ parcels.length }})
            </span>
            <button
                type="button"
                class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[#2d6a2d] hover:bg-[#2d6a2d]/10"
                @click="emit('fitAll')"
            >
                <UIcon name="i-lucide-scan" class="size-3" />
                Fit all
            </button>
        </div>
        <ul
            class="max-h-64 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100"
        >
            <li v-for="parcel in parcels" :key="parcel.documentId">
                <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                    :class="
                        selectedId === parcel.documentId
                            ? 'bg-[#2d6a2d]/10'
                            : ''
                    "
                    @click="emit('select', parcel.documentId)"
                >
                    <span
                        class="size-2 shrink-0 rounded-full"
                        :style="{
                            backgroundColor: statusColor(parcel.land_status),
                        }"
                    />
                    <span class="min-w-0 flex-1">
                        <span
                            class="block truncate text-xs font-semibold text-gray-800"
                        >
                            {{ parcel.parcel_code }}
                        </span>
                        <span class="block truncate text-[10px] text-gray-500">
                            {{ parcel.land_status }} ·
                            {{ parcel.area_hectares.toFixed(2) }} ha
                        </span>
                    </span>
                </button>
            </li>
        </ul>
    </div>
</template>
