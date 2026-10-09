<script setup lang="ts">
/**
 * The farmers registry list shared by `/farmers` and the dashboard: the hero,
 * the four KPI cards, the search and barangay filters, and the directory
 * table. It is presentational — the state comes in via props and the only
 * effects it triggers are `select` (open a farmer's profile), `register`
 * (open the register modal) and `retry` (reload after an error).
 */
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { TableMeta } from '@tanstack/vue-table'
import type { Farmer } from '~/composables/useFarmersApi'
import type { FarmerRow } from '~/composables/useFarmersRegistry'
import { farmerAvatarColor, farmerInitials } from '~/utils/farmerPresentation'

interface SummaryCard {
    label: string
    val: string | number
    icon: string
    color: string
    bg: string
    hint: string
}

interface Props {
    search: string
    filterBarangay: string
    barangayOptions: string[]
    /** The already-filtered rows to show. */
    rows: FarmerRow[]
    /** The unfiltered roster size, for the "X of Y" counters. */
    total: number
    summaryCards: SummaryCard[]
    loading: boolean
    loadError: string | null
    /** Per-farmer tended area, for the Area column's sort and cell. */
    areaByFarmer: Map<string, number>
    /** A farmer's location: residence first, then their parcels' barangays. */
    farmerBarangay: (farmer: Farmer) => string
    /**
     * Read-only (Viewer role) hides the Register Farmer action; the registry
     * itself stays fully browsable.
     */
    canEdit?: boolean
    /** Delete right (administrator + authenticated): shows the row delete action. */
    canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    canEdit: true,
    canDelete: true,
})

const emit = defineEmits<{
    'update:search': [value: string]
    'update:filterBarangay': [value: string]
    select: [row: FarmerRow]
    register: []
    delete: [row: FarmerRow]
    retry: []
}>()

function handleSearchInput(event: Event) {
    emit('update:search', (event.target as HTMLInputElement).value)
}

function clearSearch() {
    emit('update:search', '')
}

/**
 * The registry table's columns.
 *
 * Barangay and Area are not fields on a farmer: one is derived from the
 * parcels they tend and the other from a tally over those same parcels, so
 * both use `accessorFn` to give TanStack something to sort on. The remaining
 * columns sort off their own fields, and their numbers need no comparator
 * because TanStack's default `basic` function compares numerically.
 *
 * `sortDescFirst: false` on the two numeric columns is not a style choice.
 * Left unset, TanStack peeks at the first row and sorts columns
 * descending-first whenever the value is not a string, so Area and Parcels
 * would start on descending while Name and Barangay started on ascending —
 * the same click doing opposite things depending on the column.
 */
const columns: TableColumn<FarmerRow>[] = [
    {
        accessorKey: 'farmer_code',
        header: sortHeader('Farmer Code'),
        cell: ({ row }) => row.getValue('farmer_code'),
        meta: { class: { td: 'font-mono text-gray-700' } },
    },
    {
        accessorKey: 'name',
        header: sortHeader('Name'),
    },
    {
        id: 'barangay',
        accessorFn: (row) => props.farmerBarangay(row),
        header: sortHeader('Barangay'),
        cell: ({ row }) => props.farmerBarangay(row.original),
        meta: { class: { td: 'text-gray-600' } },
    },
    {
        accessorKey: 'parcelCount',
        header: sortHeader('Parcels', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono text-gray-900',
            },
        },
    },
    {
        id: 'area',
        accessorFn: (row) => props.areaByFarmer.get(row.documentId) ?? 0,
        header: sortHeader('Area (ha)', { align: 'right' }),
        sortDescFirst: false,
        cell: ({ row }) => Number(row.getValue('area')).toFixed(1),
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold text-gray-900',
            },
        },
    },
    {
        // The chevron that only appears on hover. Not a value, so not sortable.
        id: 'view',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { td: 'text-right' } },
    },
]

/**
 * Row pointer and the `group` the chevron reveals into. The zebra stripe is
 * not here but in the app-wide table theme, because it has to follow the
 * visible row order and rows are reordered by sorting.
 */
const farmerTableMeta: TableMeta<FarmerRow> = {
    class: {
        tr: 'group cursor-pointer transition-colors',
    },
}

function onFarmerSelect(_event: Event, row: TableRow<FarmerRow>) {
    emit('select', row.original)
}
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div
            class="relative mb-7 overflow-hidden rounded-3xl border border-emerald-100/80 bg-linear-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
        >
            <div
                class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
            />
            <div
                class="relative flex flex-wrap items-center justify-between gap-5"
            >
                <div class="flex min-w-0 items-start gap-4">
                    <div
                        class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                    >
                        <UIcon name="i-lucide-users" class="size-6" />
                    </div>
                    <div>
                        <div class="mb-2 flex flex-wrap items-center gap-2">
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                            >
                                <span
                                    class="size-1.5 rounded-full bg-emerald-500"
                                />
                                Farmer Information Management
                            </span>
                            <span
                                class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                            >
                                {{ total }} registered
                            </span>
                        </div>
                        <h1
                            class="text-3xl font-bold tracking-tight text-slate-950"
                        >
                            Farmers Registry
                        </h1>
                        <p
                            class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                        >
                            Manage farmer profiles, parcel assignments,
                            coverage, and assistance records.
                        </p>
                    </div>
                </div>

                <button
                    v-if="props.canEdit"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-[#245c2a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                    @click="emit('register')"
                >
                    <UIcon name="i-lucide-user-plus" class="size-4.5" />
                    Register Farmer
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="mb-7">
            <StatCards :cards="summaryCards" />
        </div>

        <!-- Filters -->
        <div
            class="mb-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
        >
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                    >
                        <UIcon name="i-lucide-search-check" class="size-4.5" />
                    </div>
                    <div>
                        <h2
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            Find Farmers
                        </h2>
                        <p class="text-xs text-slate-500">
                            Search the registry or filter by barangay.
                        </p>
                    </div>
                </div>
                <div
                    class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex"
                >
                    <UIcon name="i-lucide-filter" class="size-3.5" />
                    {{ rows.length }} of {{ total }} farmers
                </div>
            </div>

            <div class="p-4 sm:p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div class="relative w-full max-w-md flex-1">
                        <UIcon
                            name="i-lucide-search"
                            class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            :value="search"
                            type="text"
                            placeholder="Search farmer name or code..."
                            class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            @input="handleSearchInput"
                        />
                        <UButton
                            v-if="search"
                            type="button"
                            class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                            @click="clearSearch"
                        >
                            <UIcon name="i-lucide-x" class="size-3" />
                        </UButton>
                    </div>
                </div>
                <div
                    class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
                >
                    <button
                        v-for="b in ['All', ...barangayOptions]"
                        :key="b"
                        type="button"
                        class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        :class="
                            filterBarangay === b
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                        "
                        @click="emit('update:filterBarangay', b)"
                    >
                        {{ b }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div
            class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        >
            <div class="border-b border-slate-100 px-6 py-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            Farmer Directory
                        </h2>
                        <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                            Select a farmer to view profile, parcels, and
                            assistance history.
                        </p>
                    </div>
                    <div
                        class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"
                    >
                        {{ rows.length }} records
                    </div>
                </div>
            </div>
            <UTable
                :data="rows"
                :columns="columns"
                :meta="farmerTableMeta"
                :ui="{
                    th: 'bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                    td: 'px-4 py-3.5 text-sm text-slate-600',
                    tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
                }"
                :loading="loading"
                :get-row-id="(row: FarmerRow) => row.documentId"
                @select="onFarmerSelect"
            >
                <template #name-cell="{ row }">
                    <div class="flex items-center gap-2.5">
                        <span
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: farmerAvatarColor(
                                    row.original.name
                                ),
                            }"
                        >
                            {{ farmerInitials(row.original.name) }}
                        </span>
                        <span class="font-medium text-slate-800">
                            {{ row.original.name }}
                        </span>
                    </div>
                </template>
                <template #barangay-cell="{ row }">
                    <span class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-map-pin"
                            class="size-2.5 text-gray-400"
                        />
                        {{ row.getValue('barangay') }}
                    </span>
                </template>
                <template #view-cell="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            v-if="props.canDelete"
                            type="button"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Delete farmer"
                            @click.stop="emit('delete', row.original)"
                        >
                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                        </button>

                        <div
                            class="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <span class="text-sm font-semibold text-[#245c2a]">
                                View
                            </span>
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="size-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#2d6a2d]"
                            />
                        </div>
                    </div>
                </template>
                <template #loading>
                    <span class="inline-flex items-center gap-2">
                        <UIcon
                            name="i-lucide-loader-circle"
                            class="size-4 animate-spin"
                        />
                        Loading farmers...
                    </span>
                </template>
                <template #empty>
                    <!-- Failed: UTable has no error state, so it rides here. -->
                    <div v-if="loadError">
                        <p class="text-red-600">{{ loadError }}</p>
                        <button
                            type="button"
                            class="mt-2 text-xs font-medium text-green-700 underline"
                            @click="emit('retry')"
                        >
                            Try again
                        </button>
                    </div>
                    <div v-else class="flex flex-col items-center gap-2">
                        <UIcon
                            name="i-lucide-user"
                            class="size-6 text-gray-300"
                        />
                        <p class="text-sm">
                            {{
                                total === 0
                                    ? 'No farmers registered yet.'
                                    : 'No farmers match your filters.'
                            }}
                        </p>
                    </div>
                </template>
            </UTable>
        </div>
    </div>
</template>
