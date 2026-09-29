<script setup lang="ts">
import type { Farm } from '~/composables/useFarmsApi'
import type { FarmRow } from '~/composables/useFarmsData'
import { STATUS_COLOR, STATUS_LEGEND } from '~/utils/landStatus'
import { farmStatusClass, farmStatusDot } from '~/utils/farmStatus'
import { avatarColor, initials } from '~/utils/initials'

const props = defineProps<{
    farm: FarmRow
    /** The one-farm fetch, which carries the parcels by code. */
    detail: Farm | null
    detailLoading: boolean
}>()

const emit = defineEmits<{
    edit: []
    addParcel: []
    viewOnMap: []
}>()

const parcels = computed(() => props.detail?.farm_parcels ?? [])

const parcelSummary = computed(
    () => props.detail?.parcel_summary ?? props.farm.farm.parcel_summary
)

/** Only the statuses this farm actually has, in the canonical order. */
const statusBreakdown = computed(() => {
    const counts = parcelSummary.value?.status_breakdown ?? {}

    return STATUS_LEGEND.map((entry) => ({
        label: entry.label,
        color: STATUS_COLOR[entry.label],
        count: counts[entry.label] ?? 0,
    })).filter((entry) => entry.count > 0)
})

/** The farmers working one parcel, by name. */
const tenantNames = (farmers: Array<{ name: string }>) =>
    farmers.map((farmer) => farmer.name).join(', ')
</script>

<template>
    <div class="w-72 shrink-0">
        <div class="alps-card sticky top-4 overflow-hidden">
            <div
                class="absolute inset-x-0 top-0 h-1 opacity-80"
                :style="{
                    backgroundImage: `linear-gradient(90deg, ${farmStatusDot(farm.farmer_status)}, transparent)`,
                }"
            />
            <div class="p-4 sm:p-5">
                <div
                    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div class="min-w-0">
                        <h3 class="text-sm font-bold text-gray-800">
                            {{ farm.name }}
                        </h3>
                        <div class="mt-0.5 text-[11px] text-gray-500">
                            {{ farm.barangay }}
                        </div>
                        <div class="mt-0.5 font-mono text-xs text-gray-600">
                            {{ farm.farm_code }}
                        </div>
                    </div>
                    <span
                        :class="farmStatusClass(farm.farmer_status)"
                        class="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: farmStatusDot(farm.farmer_status),
                            }"
                        />
                        {{ farm.farmer_status }}
                    </span>
                </div>

                <div
                    class="mt-4 rounded-xl bg-linear-to-br from-[#f0faf0] to-[#e8f5e8] p-4"
                >
                    <div class="text-2xl font-bold text-[#2d6a2d]">
                        {{ farm.totalAreaHectares.toFixed(2) }} ha
                    </div>
                    <div class="text-[11px] text-gray-500">
                        Across {{ farm.parcelCount }}
                        {{ farm.parcelCount === 1 ? 'parcel' : 'parcels' }}
                    </div>
                </div>

                <div class="mt-4">
                    <div
                        class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                        Farmers
                    </div>
                    <div
                        v-if="farm.farmers.length === 0"
                        class="text-[11px] text-gray-400"
                    >
                        No farmers assigned to this farm.
                    </div>
                    <div v-else class="space-y-2">
                        <div
                            v-for="name in farm.farmers"
                            :key="name"
                            class="flex items-center gap-2.5"
                        >
                            <span
                                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                :style="{ backgroundColor: avatarColor(name) }"
                            >
                                {{ initials(name) }}
                            </span>
                            <span class="text-xs font-medium text-gray-800">
                                {{ name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="statusBreakdown.length > 0" class="mt-4">
                    <div
                        class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                        Land Status Mix
                    </div>
                    <div class="space-y-1.5">
                        <div
                            v-for="entry in statusBreakdown"
                            :key="entry.label"
                            class="flex items-center gap-2 text-[11px]"
                        >
                            <span
                                class="h-1.5 w-1.5 shrink-0 rounded-full"
                                :style="{ background: entry.color }"
                            />
                            <span class="flex-1 text-gray-600">
                                {{ entry.label }}
                            </span>
                            <span class="font-mono font-medium text-gray-800">
                                {{ entry.count }}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    v-if="detailLoading"
                    class="mt-4 flex items-center gap-2 text-[11px] text-gray-400"
                >
                    <UIcon
                        name="i-lucide-loader-circle"
                        class="size-3 animate-spin"
                    />
                    Loading parcels...
                </div>
                <div
                    v-else-if="parcels.length > 0"
                    class="mt-4 border-t border-gray-100 pt-3"
                >
                    <div
                        class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                        Parcels
                    </div>
                    <div class="max-h-40 space-y-1 overflow-y-auto">
                        <div
                            v-for="parcel in parcels"
                            :key="parcel.documentId"
                            class="rounded px-1 py-0.5 text-[11px] hover:bg-gray-50"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-mono text-gray-700">
                                    {{ parcel.parcel_code }}
                                </span>
                                <span class="font-mono text-gray-500">
                                    {{
                                        Number(parcel.area_hectares).toFixed(2)
                                    }}
                                    ha
                                </span>
                            </div>
                            <!--
                                A parcel names its own tendees, which is what
                                keeps a farm with several farmers on one parcel
                                readable.
                            -->
                            <div
                                v-if="parcel.farmers?.length"
                                class="mt-0.5 truncate text-[10px] text-gray-400"
                            >
                                {{ tenantNames(parcel.farmers) }}
                            </div>
                            <div
                                v-else
                                class="mt-0.5 text-[10px] text-gray-300"
                            >
                                No farmer assigned
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 space-y-2">
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                        @click="emit('edit')"
                    >
                        <UIcon name="i-lucide-pencil" class="size-3.5" />
                        Edit Farm
                    </button>
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="emit('addParcel')"
                    >
                        <UIcon name="i-lucide-layers" class="size-3.5" />
                        Add Parcel
                    </button>
                    <button
                        v-if="farm.parcelCount > 0"
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
