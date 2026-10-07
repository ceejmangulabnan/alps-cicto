<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TableMeta } from '@tanstack/vue-table'
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusClass, statusDot } from '~/utils/landStatus'
import { avatarColor, initials } from '~/utils/initials'

const props = defineProps<{
    parcels: ParcelRow[]
    selectedDocumentId: string | null
    loading: boolean
    /** Suppresses the empty state while an error banner is already showing. */
    hasError: boolean
}>()

const emit = defineEmits<{
    select: [parcel: ParcelRow]
}>()

/**
 * The parcel table's columns.
 *
 * Area is the one number, sorting on the raw hectares (`sortDescFirst: false`
 * stops TanStack peeking at the first row and starting it descending-first
 * while the text columns start on ascending); Farmer sorts on the joined name
 * list, which puts a farm's lead farmer first.
 */
const columns: TableColumn<ParcelRow>[] = [
    { accessorKey: 'parcel_code', header: sortHeader('Parcel Code') },
    {
        id: 'farmer',
        accessorFn: (row) =>
            row.farmerNames.join(' ') || row.farmerName || '',
        header: sortHeader('Farmer'),
    },
    {
        accessorKey: 'barangay',
        header: sortHeader('Barangay'),
        meta: { class: { td: 'text-slate-600' } },
    },
    {
        id: 'area',
        accessorFn: (row) => Number(row.area_hectares),
        header: sortHeader('Area (ha)', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold text-slate-800',
            },
        },
    },
    { accessorKey: 'land_status', header: sortHeader('Status') },
    {
        id: 'current_use',
        accessorFn: (row) => row.current_use ?? '',
        header: sortHeader('Current Use'),
        meta: { class: { td: 'text-slate-600' } },
    },
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
const parcelTableMeta = computed<TableMeta<ParcelRow>>(() => ({
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
            :data="parcels"
            :columns="columns"
            :meta="parcelTableMeta"
            :loading="loading"
            :get-row-id="(p: ParcelRow) => p.documentId"
            :ui="{
                th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                td: 'px-5 py-4 text-sm',
                tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
            }"
            @select="(e, row) => emit('select', row.original)"
        >
            <template #parcel_code-cell="{ row }">
                <div class="flex items-center gap-3">
                    <span
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    >
                        <UIcon name="i-lucide-layers-3" class="size-4.5" />
                    </span>

                    <div class="min-w-0">
                        <div
                            class="truncate font-mono font-semibold text-slate-700"
                        >
                            {{ row.original.parcel_code }}
                        </div>
                        <div class="mt-0.5 text-xs text-slate-400">
                            Parcel record
                        </div>
                    </div>
                </div>
            </template>

            <template #farmer-cell="{ row }">
                <div
                    v-if="row.original.farmerNames.length > 0"
                    class="space-y-2"
                >
                    <div
                        v-for="name in row.original.farmerNames"
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
                    <UIcon name="i-lucide-user-round-x" class="size-3.5" />
                    {{ row.original.farmerName || 'Unassigned' }}
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

            <template #area-cell="{ row }">
                {{ Number(row.original.area_hectares).toFixed(2) }}
            </template>

            <template #land_status-cell="{ row }">
                <span
                    :class="
                        statusClass(row.original.land_status) ||
                        'status-idle'
                    "
                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                >
                    <span
                        class="h-1.5 w-1.5 rounded-full"
                        :style="{
                            background: statusDot(row.original.land_status),
                        }"
                    />
                    {{ row.original.land_status }}
                </span>
            </template>

            <template #current_use-cell="{ row }">
                <span
                    v-if="row.original.current_use"
                    class="font-medium text-slate-700"
                >
                    {{ row.original.current_use }}
                </span>
                <span v-else class="text-slate-400">—</span>
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
                    Loading parcels...
                </span>
            </template>

            <template #empty>
                <!-- hasError: an error banner is already visible above; do not
                     stack a second empty message under it. -->
                <template v-if="!hasError">
                    <div
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
                            No parcels match the current search or land-status
                            filters.
                        </div>
                    </div>
                </template>
            </template>
        </UTable>
    </div>
</template>
