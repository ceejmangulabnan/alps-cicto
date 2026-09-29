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
    <div class="alps-card overflow-x-auto">
        <table class="w-full min-w-[720px] text-xs">
            <thead class="border-b border-gray-100 bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Farm
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Farm Code
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Barangay
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Farmer
                    </th>
                    <th
                        class="px-4 py-3 text-right font-semibold text-gray-600"
                    >
                        Parcels
                    </th>
                    <th
                        class="px-4 py-3 text-right font-semibold text-gray-600"
                    >
                        Total Area (ha)
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Status
                    </th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(row, i) in farms"
                    :key="row.documentId"
                    class="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-green-50/40"
                    :class="[
                        i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white',
                        selectedDocumentId === row.documentId
                            ? 'bg-green-50/60!'
                            : '',
                    ]"
                    @click="emit('select', row)"
                >
                    <td class="px-4 py-2.5 font-medium text-gray-800">
                        {{ row.name }}
                    </td>
                    <td class="px-4 py-2.5 font-mono text-gray-700">
                        {{ row.farm_code }}
                    </td>
                    <td class="px-4 py-2.5 text-gray-500">
                        {{ row.barangay }}
                    </td>
                    <td class="px-4 py-2.5">
                        <div
                            v-if="leadFarmer(row)"
                            class="flex items-center gap-2.5"
                        >
                            <span
                                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                :style="{
                                    backgroundColor: avatarColor(
                                        leadFarmer(row)!
                                    ),
                                }"
                            >
                                {{ initials(leadFarmer(row)!) }}
                            </span>
                            <span class="font-medium text-gray-800">
                                {{ leadFarmer(row) }}
                            </span>
                            <span
                                v-if="extraFarmerCount(row) > 0"
                                class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                            >
                                +{{ extraFarmerCount(row) }}
                            </span>
                        </div>
                        <span v-else class="text-gray-400">Unassigned</span>
                    </td>
                    <td
                        class="px-4 py-2.5 text-right font-mono font-medium"
                        :class="
                            row.parcelCount === 0
                                ? 'text-amber-600'
                                : 'text-gray-900'
                        "
                    >
                        {{ row.parcelCount }}
                    </td>
                    <td
                        class="px-4 py-2.5 text-right font-mono font-medium text-gray-900"
                    >
                        {{ row.totalAreaHectares.toFixed(4) }}
                    </td>
                    <td class="px-4 py-2.5">
                        <span
                            :class="farmStatusClass(row.farmer_status)"
                            class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
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
                    <td class="px-4 py-2.5">
                        <div class="flex items-center justify-end gap-1.5">
                            <span
                                class="text-[10px] font-semibold text-[#2d6a2d] opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                View
                            </span>
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="size-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#2d6a2d]"
                            />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div
            v-if="!loading && farms.length === 0"
            class="py-12 text-center text-gray-400"
        >
            <UIcon
                name="i-lucide-tractor"
                class="mx-auto mb-3 size-8 opacity-30"
            />
            <div class="text-sm">No farms found matching your filters.</div>
        </div>
    </div>
</template>
