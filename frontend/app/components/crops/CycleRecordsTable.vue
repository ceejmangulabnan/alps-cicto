<script setup lang="ts">
import type { CycleRow, PlantingStatus } from '~/composables/useCycleRegistry'
import { avatarColor, initials } from '~/utils/initials'
import { statusClass, statusDot } from '~/utils/landStatus'

/**
 * The planting-cycle records card: columns, cells and the row actions. The
 * shell (states, header, badge) is the shared RecordsTable; layout in the
 * page grid arrives through the class fallthrough.
 */
interface Props {
    /** Already filtered by the page's search/status state. */
    rows: CycleRow[]
    /** All cycles, so an empty registry can be told from an empty filter. */
    total: number
    loading: boolean
    loadError: string | null
    /** Read-only (Viewer role): the row actions are hidden. */
    canEdit?: boolean
    /** Delete right (administrator + authenticated): shows the delete action. */
    canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    canEdit: true,
    canDelete: true,
})

const emit = defineEmits<{
    edit: [row: CycleRow]
    delete: [row: CycleRow]
    retry: []
}>()

/** Page status -> land-status palette, so the shared badges can be reused. */

const statusBackground = (status: PlantingStatus) =>
    status === 'Harvested' ? 'Cultivated' : 'Preparation'

/** Days from today until a date; negative when the date has passed. */

function daysUntil(dateStr: string): number {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const target = new Date(`${dateStr}T00:00:00`)

    return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

const expectedHint = (row: CycleRow) => {
    const date = row.cycle.expected_harvest

    if (!date) return { text: '', urgent: false, hasExpected: false }

    const days = daysUntil(date)

    if (days >= 0) {
        return {
            text: `in ${days} days`,
            urgent: days <= 10,
            hasExpected: true,
        }
    }

    return {
        text: `${Math.abs(days)} days ago`,
        urgent: true,
        hasExpected: true,
    }
}
</script>

<template>
    <RecordsTable
        title="Planting Cycle Records"
        description="Review crop assignments, planting dates, harvest schedules, and cycle status."
        :colspan="8"
        min-width="min-w-225"
        :loading="props.loading"
        loading-text="Loading planting cycles..."
        :load-error="props.loadError"
        :empty="props.total === 0"
        empty-icon="i-lucide-sprout"
        empty-title="No planting cycles yet"
        empty-description="Register the first planting cycle to begin tracking crops."
        :no-results="props.rows.length === 0"
        no-results-text="No cycles match the current search or status filter."
        :count="`${props.rows.length} records`"
        @retry="emit('retry')"
    >
        <template #head>
            <th class="px-5 py-3.5 text-left">Farmer</th>
            <th class="px-5 py-3.5 text-left">Crop / Variety</th>
            <th class="px-5 py-3.5 text-left">Parcel</th>
            <th class="px-5 py-3.5 text-right">Area</th>
            <th class="px-5 py-3.5 text-left">Planted</th>
            <th class="px-5 py-3.5 text-left">Harvest</th>
            <th class="px-5 py-3.5 text-left">Status</th>
            <th
                v-if="props.canEdit || props.canDelete"
                class="px-5 py-3.5 text-right"
            >
                Actions
            </th>
        </template>

        <template #body>
            <tr
                v-for="p in props.rows"
                :key="p.cycle.documentId"
                class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
            >
                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: avatarColor(
                                    p.farmerNames[0] ?? ''
                                ),
                            }"
                        >
                            {{ initials(p.farmerNames[0] ?? '') }}
                        </span>
                        <div class="min-w-0">
                            <div class="truncate font-medium text-slate-800">
                                {{ farmerLabel(p.farmerNames) }}
                            </div>
                            <div class="mt-0.5 text-xs text-slate-400">
                                {{ p.barangay }}
                            </div>
                        </div>
                    </div>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                        <span
                            class="h-2.5 w-2.5 shrink-0 rounded-full"
                            :style="{
                                background: cropColor(p.cycle.crop?.name),
                            }"
                        />
                        <span class="font-semibold text-slate-700">
                            {{ p.cycle.crop?.name ?? '—' }}
                        </span>
                    </div>
                    <div
                        v-if="p.cycle.variety"
                        class="mt-1 pl-4.5 text-xs italic text-slate-400"
                    >
                        {{ p.cycle.variety }}
                    </div>
                </td>

                <td class="px-5 py-4">
                    <NuxtLink
                        :to="`/parcels/${p.parcel_code}`"
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        {{ p.parcel_code }}
                    </NuxtLink>
                </td>

                <td
                    class="px-5 py-4 text-right font-mono font-semibold text-slate-800"
                >
                    {{ p.area_hectares.toFixed(1) }} ha
                </td>

                <td class="px-5 py-4 text-slate-600">
                    {{ p.cycle.planting_date ?? '—' }}
                </td>

                <td class="px-5 py-4">
                    <div class="text-slate-600">
                        {{ p.cycle.expected_harvest ?? '—' }}
                    </div>

                    <div
                        v-if="cycleStatus(p) === 'Harvested'"
                        class="mt-1 text-xs text-slate-400"
                    >
                        completed
                    </div>

                    <div
                        v-else-if="expectedHint(p).hasExpected"
                        :class="
                            expectedHint(p).urgent
                                ? 'text-amber-600'
                                : 'text-[#2d6a2d]'
                        "
                        class="mt-1 flex items-center gap-1 text-xs font-semibold"
                    >
                        <UIcon name="i-lucide-hourglass" class="size-3" />
                        {{ expectedHint(p).text }}
                    </div>
                </td>

                <td class="px-5 py-4">
                    <span
                        :class="statusClass(statusBackground(cycleStatus(p)))"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                backgroundColor: statusDot(
                                    statusBackground(cycleStatus(p))
                                ),
                            }"
                        />
                        {{ cycleStatus(p) }}
                    </span>
                </td>

                <td v-if="props.canEdit || props.canDelete" class="px-5 py-4">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            v-if="props.canEdit"
                            type="button"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                            title="Edit planting cycle"
                            @click="emit('edit', p)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-3.5" />
                        </button>

                        <button
                            v-if="props.canDelete"
                            type="button"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Delete planting cycle"
                            @click="emit('delete', p)"
                        >
                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
        </template>
    </RecordsTable>
</template>
