<script setup lang="ts">
import type { FarmRow } from '~/composables/useFarmsData'
import { farmStatusClass, farmStatusDot } from '~/utils/farmStatus'
import { avatarColor, initials } from '~/utils/initials'

defineProps<{
    farms: FarmRow[]
    selectedDocumentId: string | null
    loading: boolean
}>()

const emit = defineEmits<{
    select: [farm: FarmRow]
}>()

/** The farmer shown in the row, or a dash when the farm has none yet. */
function leadFarmer(row: FarmRow): string | null {
    return row.farmers[0] ?? null
}

function extraFarmerCount(row: FarmRow): number {
    return Math.max(row.farmers.length - 1, 0)
}
</script>

<template>
    <div class="overflow-x-auto">
        <table class="w-full min-w-[860px] text-sm">
            <thead class="border-b border-slate-100 bg-slate-50/70">
                <tr
                    class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                    <th class="px-5 py-3.5 text-left">Farm</th>
                    <th class="px-5 py-3.5 text-left">Farm Code</th>
                    <th class="px-5 py-3.5 text-left">Barangay</th>
                    <th class="px-5 py-3.5 text-left">Farmer</th>
                    <th class="px-5 py-3.5 text-right">Parcels</th>
                    <th class="px-5 py-3.5 text-right">Total Area (ha)</th>
                    <th class="px-5 py-3.5 text-left">Status</th>
                    <th class="px-5 py-3.5"></th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="row in farms"
                    :key="row.documentId"
                    class="group cursor-pointer border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                    :class="
                        selectedDocumentId === row.documentId
                            ? 'bg-emerald-50/70'
                            : ''
                    "
                    @click="emit('select', row)"
                >
                    <!-- Farm -->
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <span
                                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-tractor"
                                    class="size-4.5"
                                />
                            </span>

                            <div class="min-w-0">
                                <div
                                    class="truncate font-semibold text-slate-800"
                                >
                                    {{ row.name }}
                                </div>
                                <div
                                    class="mt-0.5 text-xs text-slate-400"
                                >
                                    Farm record
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Farm Code -->
                    <td class="px-5 py-4">
                        <span
                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600"
                        >
                            {{ row.farm_code }}
                        </span>
                    </td>

                    <!-- Barangay -->
                    <td class="px-5 py-4 text-slate-600">
                        <span class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-map-pin"
                                class="size-3.5 text-slate-400"
                            />
                            {{ row.barangay }}
                        </span>
                    </td>

                    <!-- Farmer -->
                    <td class="px-5 py-4">
                        <div
                            v-if="leadFarmer(row)"
                            class="flex items-center gap-2.5"
                        >
                            <span
                                class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                :style="{
                                    backgroundColor: avatarColor(
                                        leadFarmer(row)!
                                    ),
                                }"
                            >
                                {{ initials(leadFarmer(row)!) }}
                            </span>

                            <div class="min-w-0">
                                <div
                                    class="truncate font-medium text-slate-800"
                                >
                                    {{ leadFarmer(row) }}
                                </div>

                                <div
                                    v-if="extraFarmerCount(row) > 0"
                                    class="mt-0.5 text-xs text-slate-400"
                                >
                                    +{{ extraFarmerCount(row) }} more assigned
                                </div>
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
                            Unassigned
                        </span>
                    </td>

                    <!-- Parcels -->
                    <td
                        class="px-5 py-4 text-right font-mono font-semibold"
                        :class="
                            row.parcelCount === 0
                                ? 'text-amber-600'
                                : 'text-slate-800'
                        "
                    >
                        {{ row.parcelCount }}
                    </td>

                    <!-- Area -->
                    <td
                        class="px-5 py-4 text-right font-mono font-semibold text-slate-800"
                    >
                        {{ row.totalAreaHectares.toFixed(2) }}
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-4">
                        <span
                            :class="farmStatusClass(row.farmer_status)"
                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full"
                                :style="{
                                    background: farmStatusDot(
                                        row.farmer_status
                                    ),
                                }"
                            />
                            {{ row.farmer_status }}
                        </span>
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
            v-if="!loading && farms.length === 0"
            class="flex flex-col items-center justify-center px-6 py-14 text-center"
        >
            <div
                class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
            >
                <UIcon name="i-lucide-tractor" class="size-6" />
            </div>

            <div class="text-base font-semibold text-slate-700">
                No farms found
            </div>

            <div class="mt-1 max-w-sm text-sm text-slate-400">
                No farms match the current search or status filters.
            </div>
        </div>
    </div>
</template>
