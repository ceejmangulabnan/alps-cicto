<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'

defineProps<{
    parcelCount: number
    parcels: FarmParcel[]
    selectedParcelId: string | null
}>()

const emit = defineEmits<{
    edit: []
    add: []
    selectParcel: [documentId: string]
    fitAll: []
}>()
</script>

<template>
    <div
        class="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
        <div class="flex min-w-0 items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d6a2d] text-white shadow-sm"
            >
                <UIcon name="i-lucide-map" class="size-4.5" />
            </span>
            <div class="min-w-0">
                <span
                    class="block truncate text-sm font-bold text-gray-900 font-sans"
                >
                    Agricultural Parcel Map
                </span>
                <div class="hidden text-[11px] text-gray-400 sm:block">
                    Base map · OpenStreetMap / MapTiler GL
                </div>
            </div>
        </div>
        <div class="flex w-full items-center gap-3 sm:w-auto">
            <!--
                The parcel picker lives in the toolbar rather than over the map.
                As a floating panel it sat on top of the zoom and fullscreen
                controls, and it covered a quarter of the canvas to list what a
                search box handles better.
            -->
            <MapParcelPicker
                :parcels="parcels"
                :selected-id="selectedParcelId"
                @select="emit('selectParcel', $event)"
                @fit-all="emit('fitAll')"
            />
            <span
                class="hidden items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600 md:flex"
            >
                <UIcon
                    name="i-lucide-vector-polygon"
                    class="size-3.5 text-[#2d6a2d]"
                />
                <span class="font-semibold text-gray-800">{{
                    parcelCount
                }}</span>
                parcel{{ parcelCount === 1 ? '' : 's' }} drawn
            </span>
            <button
                type="button"
                :disabled="parcelCount === 0"
                class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                @click="emit('edit')"
            >
                <UIcon name="i-lucide-pencil" class="size-3.5" />
                Edit
            </button>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#245524] sm:px-4"
                @click="emit('add')"
            >
                <UIcon name="i-lucide-layers" class="size-3.5" />
                Add Parcel
            </button>
        </div>
    </div>
</template>
