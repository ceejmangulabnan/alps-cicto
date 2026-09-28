<script setup lang="ts">
defineProps<{ parcelCount: number }>()

const emit = defineEmits<{
    edit: []
    add: []
}>()
</script>

<template>
    <div
        class="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d6a2d] text-white shadow-sm"
            >
                <UIcon name="i-lucide-map" class="size-4.5" />
            </span>
            <div>
                <span class="text-sm font-bold text-gray-900 font-sans">
                    Agricultural Parcel Map
                </span>
                <div class="text-[11px] text-gray-400">
                    Base map · OpenStreetMap / MapTiler GL
                </div>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span
                class="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600"
            >
                <UIcon
                    name="i-lucide-vector-polygon"
                    class="size-3.5 text-[#2d6a2d]"
                />
                <span class="font-semibold text-gray-800">{{ parcelCount }}</span>
                parcel{{ parcelCount === 1 ? '' : 's' }} drawn
            </span>
            <button
                type="button"
                :disabled="parcelCount === 0"
                class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                @click="emit('edit')"
            >
                <UIcon name="i-lucide-pencil" class="size-3.5" />
                Edit
            </button>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#245524]"
                @click="emit('add')"
            >
                <UIcon name="i-lucide-layers" class="size-3.5" />
                Add Parcel
            </button>
        </div>
    </div>
</template>
