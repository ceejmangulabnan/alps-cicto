<script setup lang="ts">
import type { HarvestRow, HarvestStatus } from '~/composables/useCycleRegistry'
import { harvestStatus } from '~/composables/useCycleRegistry'
import { avatarColor, initials } from '~/utils/initials'
import { num, shortId } from '~/utils/format'
import { cropColor } from '~/utils/cropColors'
import { statusClass, statusDot } from '~/utils/landStatus'

/**
 * The harvest records card: columns, cells and row actions on top of the
 * shared RecordsTable shell. The layout in the page grid arrives through the
 * class fallthrough.
 */
interface Props {
    /** Already filtered by the page's search/status state. */
    rows: HarvestRow[]
    /** All harvests, so an empty registry can be told from an empty filter. */
    total: number
    loading: boolean
    loadError: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    edit: [row: HarvestRow]
    delete: [row: HarvestRow]
    retry: []
}>()

/** Page status -> land-status palette, so the shared badges can be reused. */

const statusBackground = (status: HarvestStatus) =>
    status === 'Completed' ? 'Cultivated' : 'Harvesting'
</script>

<template>
    <RecordsTable
        title="Harvest Records"
        description="Review production, yield, harvested area, and record status."
        :colspan="10"
        min-width="min-w-[1100px]"
        :loading="props.loading"
        loading-text="Loading harvests..."
        :load-error="props.loadError"
        :empty="props.total === 0"
        empty-icon="i-lucide-wheat"
        empty-title="No harvests recorded yet"
        empty-description="Record the first harvest against a planted parcel to begin production tracking."
        :no-results="props.rows.length === 0"
        no-results-text="No harvests match the current search or status filter."
        :count="`${props.rows.length} records`"
        @retry="emit('retry')"
    >
        <template #head>
            <th class="px-5 py-3.5 text-left">ID</th>
            <th class="px-5 py-3.5 text-left">Farmer</th>
            <th class="px-5 py-3.5 text-left">Crop</th>
            <th class="px-5 py-3.5 text-left">Parcel</th>
            <th class="px-5 py-3.5 text-left">Barangay</th>
            <th class="px-5 py-3.5 text-right">Area (ha)</th>
            <th class="px-5 py-3.5 text-right">Production (kg)</th>
            <th class="px-5 py-3.5 text-left">Date</th>
            <th class="px-5 py-3.5 text-left">Status</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
        </template>

        <template #body>
            <tr
                v-for="h in props.rows"
                :key="h.documentId"
                class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
            >
                <td class="px-5 py-4">
                    <span
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                    >
                        {{ shortId(h.documentId) }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: avatarColor(
                                    h.farmerNames[0] ?? ''
                                ),
                            }"
                        >
                            {{ initials(h.farmerNames[0] ?? '') }}
                        </span>

                        <div class="min-w-0">
                            <div class="truncate font-medium text-slate-800">
                                {{ farmerLabel(h.farmerNames) }}
                            </div>
                            <div
                                v-if="h.variety"
                                class="mt-0.5 text-xs text-slate-400"
                            >
                                Variety: {{ h.variety }}
                            </div>
                        </div>
                    </div>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                        <span
                            class="h-2.5 w-2.5 shrink-0 rounded-full"
                            :style="{ background: cropColor(h.crop) }"
                        />
                        <span class="font-semibold text-slate-700">
                            {{ h.crop || '—' }}
                        </span>
                    </div>
                </td>

                <td class="px-5 py-4">
                    <NuxtLink
                        :to="`/parcels/${h.parcel_code}`"
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        {{ h.parcel_code }}
                    </NuxtLink>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    <span class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-map-pin"
                            class="size-3.5 text-slate-400"
                        />
                        {{ h.barangay }}
                    </span>
                </td>

                <td
                    class="px-5 py-4 text-right font-mono font-semibold text-slate-700"
                >
                    {{ h.area_hectares.toFixed(1) }}
                </td>

                <td class="px-5 py-4 text-right">
                    <div class="font-mono font-semibold text-slate-900">
                        {{ num(h.production_kg) }}
                    </div>
                    <div
                        v-if="h.yield_per_hectare != null"
                        class="mt-0.5 text-xs text-slate-400"
                    >
                        {{ num(h.yield_per_hectare) }} kg/ha
                    </div>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    {{ h.harvest_date ?? '—' }}
                </td>

                <td class="px-5 py-4">
                    <span
                        :class="statusClass(statusBackground(harvestStatus(h)))"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                backgroundColor: statusDot(
                                    statusBackground(harvestStatus(h))
                                ),
                            }"
                        />
                        {{ harvestStatus(h) }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                            title="Edit harvest"
                            @click="emit('edit', h)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-3.5" />
                        </button>

                        <button
                            type="button"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Delete harvest"
                            @click="emit('delete', h)"
                        >
                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
        </template>
    </RecordsTable>
</template>
