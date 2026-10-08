<script setup lang="ts">
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusClass, statusDot } from '~/utils/landStatus'
import { avatarColor, initials } from '~/utils/initials'

defineProps<{
    parcels: ParcelRow[]
    selectedDocumentId: string | null
    loading: boolean
    /** Suppresses the empty state while an error banner is already showing. */
    hasError: boolean
}>()

const emit = defineEmits<{
    select: [parcel: ParcelRow]
}>()
</script>

<template>
    <div class="overflow-x-auto">
        <table class="w-full min-w-[820px] text-sm">
            <thead class="border-b border-slate-100 bg-slate-50/70">
                <tr
                    class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                    <th class="px-5 py-3.5 text-left">Parcel Code</th>
                    <th class="px-5 py-3.5 text-left">Farmer</th>
                    <th class="px-5 py-3.5 text-left">Barangay</th>
                    <th class="px-5 py-3.5 text-right">Area (ha)</th>
                    <th class="px-5 py-3.5 text-left">Status</th>
                    <th class="px-5 py-3.5 text-left">Current Use</th>
                    <th class="px-5 py-3.5"></th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="p in parcels"
                    :key="p.documentId"
                    class="group cursor-pointer border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                    :class="
                        selectedDocumentId === p.documentId
                            ? 'bg-emerald-50/70'
                            : ''
                    "
                    @click="emit('select', p)"
                >
                    <!-- Parcel Code -->
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <span
                                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-layers-3"
                                    class="size-4.5"
                                />
                            </span>

                            <div class="min-w-0">
                                <div
                                    class="truncate font-mono font-semibold text-slate-700"
                                >
                                    {{ p.parcel_code }}
                                </div>
                                <div class="mt-0.5 text-xs text-slate-400">
                                    Parcel record
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Farmers -->
                    <td class="px-5 py-4">
                        <div v-if="p.farmerNames.length > 0" class="space-y-2">
                            <div
                                v-for="name in p.farmerNames"
                                :key="name"
                                class="flex items-center gap-2.5"
                            >
                                <span
                                    class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                    :style="{
                                        backgroundColor: avatarColor(name),
                                    }"
                                >
                                    {{ initials(name) }}
                                </span>

                                <span
                                    class="min-w-0 truncate font-medium text-slate-800"
                                >
                                    {{ name }}
                                </span>
                            </div>
                        </div>

                        <span
                            v-else
                            class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                        >
                            <UIcon
                                name="i-lucide-user-round-x"
                                class="size-3.5"
                            />
                            {{ p.farmerName || 'Unassigned' }}
                        </span>
                    </td>

                    <!-- Barangay -->
                    <td class="px-5 py-4 text-slate-600">
                        <span class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-map-pin"
                                class="size-3.5 text-slate-400"
                            />
                            {{ p.barangay }}
                        </span>
                    </td>

                    <!-- Area -->
                    <td
                        class="px-5 py-4 text-right font-mono font-semibold text-slate-800"
                    >
                        {{ Number(p.area_hectares).toFixed(2) }}
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-4">
                        <span
                            :class="statusClass(p.land_status) || 'status-idle'"
                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full"
                                :style="{
                                    background: statusDot(p.land_status),
                                }"
                            />
                            {{ p.land_status }}
                        </span>
                    </td>

                    <!-- Current Use -->
                    <td class="px-5 py-4 text-slate-600">
                        <span
                            v-if="p.current_use"
                            class="font-medium text-slate-700"
                        >
                            {{ p.current_use }}
                        </span>
                        <span v-else class="text-slate-400">—</span>
                    </td>

                    <!-- View -->
                    <td class="px-5 py-4">
                        <div class="flex items-center justify-end gap-1.5">
                            <span
                                class="text-sm font-semibold text-[#245c2a] opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                View
                            </span>
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#245c2a]"
                            />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div
            v-if="!loading && !hasError && parcels.length === 0"
            class="flex flex-col items-center justify-center px-6 py-14 text-center"
        >
            <div
                class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
            >
                <UIcon name="i-lucide-layers-3" class="size-6" />
            </div>

            <div class="text-base font-semibold text-slate-700">
                No parcels found
            </div>

            <div class="mt-1 max-w-sm text-sm text-slate-400">
                No parcels match the current search or land-status filters.
            </div>
        </div>
    </div>
</template>
