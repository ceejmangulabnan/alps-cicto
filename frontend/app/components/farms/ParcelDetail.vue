<script setup lang="ts">
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusClass, statusDot } from '~/utils/landStatus'
import { avatarColor, initials } from '~/utils/initials'

const props = defineProps<{
    parcel: ParcelRow
}>()

const emit = defineEmits<{
    edit: []
    viewOnMap: []
    viewFarm: []
}>()

const detailFields = computed(() => [
    { label: 'Farm Code', val: props.parcel.farm_code },
    { label: 'Current Use', val: props.parcel.current_use ?? '—' },
])
</script>

<template>
    <div class="w-72 shrink-0">
        <div class="alps-card sticky top-4 overflow-hidden">
            <div
                class="absolute inset-x-0 top-0 h-1 opacity-80"
                :style="{
                    backgroundImage: `linear-gradient(90deg, ${statusDot(parcel.land_status)}, transparent)`,
                }"
            />
            <div class="p-5">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="font-mono text-xs text-gray-600">
                            {{ parcel.parcel_code }}
                        </div>
                        <h3 class="mt-0.5 text-sm font-bold text-gray-800">
                            {{ parcel.farm_code }}
                        </h3>
                    </div>
                    <span
                        :class="
                            statusClass(parcel.land_status) || 'status-idle'
                        "
                        class="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: statusDot(parcel.land_status),
                            }"
                        />
                        {{ parcel.land_status }}
                    </span>
                </div>

                <div
                    class="mt-4 rounded-xl bg-linear-to-br from-[#f0faf0] to-[#e8f5e8] p-4"
                >
                    <div class="text-2xl font-bold text-[#2d6a2d]">
                        {{ parcel.area_hectares }} ha
                    </div>
                    <div class="text-[11px] text-gray-500">
                        Declared land area
                    </div>
                </div>

                <div class="mt-4 flex items-center gap-2.5">
                    <span
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        :style="{
                            backgroundColor: avatarColor(parcel.farmerName),
                        }"
                    >
                        {{ initials(parcel.farmerName) }}
                    </span>
                    <div>
                        <div class="text-xs font-semibold text-gray-800">
                            {{ parcel.farmerName }}
                        </div>
                        <div
                            class="flex items-center gap-1 text-[11px] text-gray-400"
                        >
                            <UIcon name="i-lucide-map-pin" class="size-2.5" />
                            {{ parcel.barangay }}
                        </div>
                    </div>
                </div>

                <div class="mt-4 space-y-2 text-xs">
                    <div
                        v-for="(f, i) in detailFields"
                        :key="i"
                        class="flex justify-between border-b border-gray-50 py-1 last:border-0"
                    >
                        <span class="text-gray-400">{{ f.label }}</span>
                        <span class="font-medium text-gray-700">{{
                            f.val
                        }}</span>
                    </div>
                </div>

                <div class="mt-4 space-y-2">
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                        @click="emit('edit')"
                    >
                        <UIcon name="i-lucide-pencil" class="size-3.5" />
                        Edit Parcel
                    </button>
                    <button
                        v-if="parcel.farmDocumentId"
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="emit('viewFarm')"
                    >
                        <UIcon name="i-lucide-tractor" class="size-3.5" />
                        View Farm
                    </button>
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="emit('viewOnMap')"
                    >
                        <UIcon name="i-lucide-map-pin" class="size-3.5" />
                        View on Map
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
