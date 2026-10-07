<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TableMeta } from '@tanstack/vue-table'
import type { FarmRow } from '~/composables/useFarmsData'
import { farmStatusClass, farmStatusDot } from '~/utils/farmStatus'
import { avatarColor, initials } from '~/utils/initials'

const props = defineProps<{
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

/**
 * The farm table's columns.
 *
 * Parcels and Total Area are the two numbers; `sortDescFirst: false` on both
 * stops TanStack peeking at the first row and starting them on descending
 * while the text columns start on ascending. Farmer sorts on the name of the
 * lead farmer only, which is what the visible row leads with.
 */
const columns: TableColumn<FarmRow>[] = [
    { accessorKey: 'name', header: sortHeader('Farm') },
    { accessorKey: 'farm_code', header: sortHeader('Farm Code') },
    {
        accessorKey: 'barangay',
        header: sortHeader('Barangay'),
        meta: { class: { td: 'text-slate-600' } },
    },
    {
        id: 'farmer',
        accessorFn: (row) => row.farmers[0] ?? '',
        header: sortHeader('Farmer'),
    },
    {
        accessorKey: 'parcelCount',
        header: sortHeader('Parcels', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold',
            },
        },
    },
    {
        accessorKey: 'totalAreaHectares',
        header: sortHeader('Total Area (ha)', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold text-slate-800',
            },
        },
    },
    { accessorKey: 'farmer_status', header: sortHeader('Status') },
    {
        // The chevron that only appears on hover. Not a value, so not sortable.
        id: 'view',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { th: 'text-right', td: 'text-right' } },
    },
]

/**
 * Row pointer plus the selected-row highlight, as a computed so the UTable
 * receives a fresh meta object whenever the selection changes — a static meta
 * would leave the old row highlighted because UTable only re-renders when one
 * of its prop references changes.
 */
const farmTableMeta = computed<TableMeta<FarmRow>>(() => ({
    class: {
        tr: (row) =>
            `group cursor-pointer transition-colors ${
                props.selectedDocumentId === row.original.documentId
                    ? 'bg-emerald-50/70'
                    : ''
            }`,
    },
}))
</script>

<template>
    <div class="overflow-x-auto">
        <UTable
            :data="farms"
            :columns="columns"
            :meta="farmTableMeta"
            :loading="loading"
            :get-row-id="(row: FarmRow) => row.documentId"
            :ui="{
                th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                td: 'px-5 py-4 text-sm',
                tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
            }"
            @select="(e, row) => emit('select', row.original)"
        >
            <template #name-cell="{ row }">
                <div class="flex items-center gap-3">
                    <span
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    >
                        <UIcon name="i-lucide-tractor" class="size-4.5" />
                    </span>

                    <div class="min-w-0">
                        <div class="truncate font-semibold text-slate-800">
                            {{ row.original.name }}
                        </div>
                        <div class="mt-0.5 text-xs text-slate-400">
                            Farm record
                        </div>
                    </div>
                </div>
            </template>

            <template #farm_code-cell="{ row }">
                <span
                    class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600"
                >
                    {{ row.original.farm_code }}
                </span>
            </template>

            <template #barangay-cell="{ row }">
                <span class="flex items-center gap-1.5">
                    <UIcon
                        name="i-lucide-map-pin"
                        class="size-3.5 text-slate-400"
                    />
                    {{ row.original.barangay }}
                </span>
            </template>

            <template #farmer-cell="{ row }">
                <div
                    v-if="leadFarmer(row.original)"
                    class="flex items-center gap-2.5"
                >
                    <span
                        class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                        :style="{
                            backgroundColor: avatarColor(
                                leadFarmer(row.original)!
                            ),
                        }"
                    >
                        {{ initials(leadFarmer(row.original)!) }}
                    </span>

                    <div class="min-w-0">
                        <div class="truncate font-medium text-slate-800">
                            {{ leadFarmer(row.original) }}
                        </div>

                        <div
                            v-if="extraFarmerCount(row.original) > 0"
                            class="mt-0.5 text-xs text-slate-400"
                        >
                            +{{ extraFarmerCount(row.original) }} more assigned
                        </div>
                    </div>
                </div>

                <span
                    v-else
                    class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                    <UIcon name="i-lucide-user-round-x" class="size-3.5" />
                    Unassigned
                </span>
            </template>

            <template #parcelCount-cell="{ row }">
                <span
                    :class="
                        row.original.parcelCount === 0
                            ? 'text-amber-600'
                            : 'text-slate-800'
                    "
                >
                    {{ row.original.parcelCount }}
                </span>
            </template>

            <template #totalAreaHectares-cell="{ row }">
                {{ row.original.totalAreaHectares.toFixed(2) }}
            </template>

            <template #farmer_status-cell="{ row }">
                <span
                    :class="farmStatusClass(row.original.farmer_status)"
                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                >
                    <span
                        class="h-1.5 w-1.5 rounded-full"
                        :style="{
                            background: farmStatusDot(
                                row.original.farmer_status
                            ),
                        }"
                    />
                    {{ row.original.farmer_status }}
                </span>
            </template>

            <template #view-cell>
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
            </template>

            <template #loading>
                <span class="inline-flex items-center gap-2">
                    <UIcon
                        name="i-lucide-loader-circle"
                        class="size-4 animate-spin"
                    />
                    Loading farms...
                </span>
            </template>

            <template #empty>
                <div
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
            </template>
        </UTable>
    </div>
</template>
