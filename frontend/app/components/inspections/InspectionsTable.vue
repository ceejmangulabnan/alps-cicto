<script setup lang="ts">
import type { InspectionRow } from '~/composables/useInspectionRegistry'
import { shortId } from '~/utils/format'
import {
    INSPECTION_RISK_DOT,
    INSPECTION_RISK_STYLE,
    INSPECTION_STATUS_DOT,
    INSPECTION_STATUS_STYLE,
} from '~/utils/inspectionStatus'

/**
 * The inspection records table: every row shows the short id, type, parcel
 * (linked), barangay, date with a photo count, inspector, and the risk and
 * status pills, with view / edit / delete actions. Wraps the shared
 * RecordsTable shell; the page owns the rows and the actions.
 */
interface Props {
    rows: InspectionRow[]
    loading?: boolean
    loadError?: string | null
    /** No rows at all, as opposed to none matching the current filter. */
    empty?: boolean
    /** The filter matched nothing. */
    noResults?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    loadError: null,
    empty: false,
    noResults: false,
})

const emit = defineEmits<{
    view: [row: InspectionRow]
    edit: [row: InspectionRow]
    delete: [row: InspectionRow]
    retry: []
}>()

const countLabel = computed(() => `${props.rows.length} records`)
</script>

<template>
    <div
        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-7"
    >
        <RecordsTable
            title="Inspection Records"
            description="Review inspection type, parcel, risk level, status, and supporting documentation."
            :colspan="9"
            min-width="min-w-[1040px]"
            :loading="loading"
            loading-text="Loading inspections..."
            :load-error="loadError"
            :empty="empty"
            empty-icon="i-lucide-clipboard-check"
            empty-title="No inspections recorded yet"
            empty-description="Log the first inspection against a parcel to begin field monitoring."
            :no-results="noResults"
            no-results-text="No inspections match this search."
            :count="countLabel"
            @retry="emit('retry')"
        >
            <template #head>
                <th class="px-5 py-3.5 text-left">ID</th>
                <th class="px-5 py-3.5 text-left">Type</th>
                <th class="px-5 py-3.5 text-left">Parcel</th>
                <th class="px-5 py-3.5 text-left">Barangay</th>
                <th class="px-5 py-3.5 text-left">Date</th>
                <th class="px-5 py-3.5 text-left">Inspector</th>
                <th class="px-5 py-3.5 text-left">Risk</th>
                <th class="px-5 py-3.5 text-left">Status</th>
                <th class="px-5 py-3.5 text-right"></th>
            </template>

            <template #body>
                <tr
                    v-for="row in rows"
                    :key="row.documentId"
                    class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                >
                    <td class="px-5 py-4">
                        <span
                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                            >{{ shortId(row.documentId) }}</span
                        >
                    </td>
                    <td class="px-5 py-4">
                        <span
                            class="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                        >
                            <UIcon name="i-lucide-tags" class="size-3.5" />
                            {{ row.inspection_type }}
                        </span>
                    </td>
                    <td class="px-5 py-4">
                        <NuxtLink
                            :to="`/parcels/${row.parcel_code}`"
                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                            {{ row.parcel_code }}
                        </NuxtLink>
                    </td>
                    <td class="px-5 py-4 text-slate-600">
                        {{ row.barangay }}
                    </td>
                    <td class="px-5 py-4">
                        <div class="text-gray-500">
                            {{ row.date ?? '—' }}
                        </div>
                        <div
                            v-if="row.photos.length > 0"
                            class="mt-1 flex items-center gap-1 text-xs text-slate-400"
                        >
                            <UIcon name="i-lucide-camera" class="size-3.5" />
                            {{ row.photos.length }}
                        </div>
                    </td>
                    <td class="px-5 py-4 text-slate-600">
                        {{ row.inspector || '—' }}
                    </td>
                    <td class="px-5 py-4">
                        <span
                            :class="INSPECTION_RISK_STYLE[row.riskLevel]"
                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full"
                                :style="{
                                    background:
                                        INSPECTION_RISK_DOT[row.riskLevel],
                                }"
                            />
                            {{ row.riskLevel }}
                        </span>
                    </td>
                    <td class="px-5 py-4">
                        <span
                            :class="INSPECTION_STATUS_STYLE[row.status]"
                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full"
                                :style="{
                                    background:
                                        INSPECTION_STATUS_DOT[row.status],
                                }"
                            />
                            {{ row.status }}
                        </span>
                    </td>
                    <td class="px-5 py-4">
                        <div class="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                title="View details"
                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                @click="emit('view', row)"
                            >
                                <UIcon name="i-lucide-eye" class="size-3.5" />
                            </button>
                            <button
                                type="button"
                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                @click="emit('edit', row)"
                            >
                                <UIcon
                                    name="i-lucide-pencil"
                                    class="size-3.5"
                                />
                            </button>
                            <button
                                type="button"
                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                @click="emit('delete', row)"
                            >
                                <UIcon name="i-lucide-trash" class="size-3.5" />
                            </button>
                        </div>
                    </td>
                </tr>
            </template>
        </RecordsTable>
    </div>
</template>
