<script setup lang="ts">
import type { RiskRow } from '~/utils/riskInsights'
import {
    RISK_SEVERITY_DOT,
    RISK_SEVERITY_STYLE,
    RISK_STATUS_DOT,
    RISK_STATUS_STYLE,
} from '~/utils/riskStatus'
import { shortId } from '~/utils/format'
import { avatarColor, initials } from '~/utils/initials'

/**
 * The risk records card: columns, cells and row actions on top of the shared
 * RecordsTable shell. The search field and the status pills arrive from the
 * page through the forwarded header/toolbar slots. Load failures stay on the
 * page's banner, so this table never shows the error row itself.
 */
interface Props {
    /** Already filtered by the page's search/status state. */
    rows: RiskRow[]
    /** All reports, so an empty registry can be told from an empty filter. */
    total: number
    loading: boolean
    /** Read-only (Viewer role) hides the edit / delete row actions. */
    canEdit?: boolean
    /** Delete right (administrator + authenticated): shows the delete action. */
    canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    canEdit: true,
    canDelete: true,
})

const emit = defineEmits<{
    edit: [row: RiskRow]
    delete: [row: RiskRow]
    retry: []
}>()

/** A report filed from a finding cannot be deleted here; the examination owns it. */
const isInspectionRow = (row: RiskRow): boolean => row.fromInspection
</script>

<template>
    <RecordsTable
        title="Risk Reports"
        description="Review risk type, parcel, farmer, severity, and intervention status."
        :colspan="9"
        min-width="min-w-[1120px]"
        :loading="props.loading"
        loading-text="Loading risk reports..."
        :empty="props.total === 0"
        empty-icon="i-lucide-alert-triangle"
        empty-title="No risk reports filed yet"
        empty-description="Generate the first risk report against a parcel to begin monitoring."
        :no-results="props.rows.length === 0"
        no-results-text="No risk reports match the current filters."
        @retry="emit('retry')"
    >
        <template #header-right>
            <slot name="header-right" />
        </template>

        <template #toolbar>
            <slot name="toolbar" />
        </template>

        <template #head>
            <th class="px-5 py-3.5 text-left">ID</th>
            <th class="px-5 py-3.5 text-left">Risk Type</th>
            <th class="px-5 py-3.5 text-left">Parcel</th>
            <th class="px-5 py-3.5 text-left">Farmer</th>
            <th class="px-5 py-3.5 text-left">Observed</th>
            <th class="px-5 py-3.5 text-left">Source</th>
            <th class="px-5 py-3.5 text-left">Severity</th>
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
                v-for="row in props.rows"
                :key="row.documentId"
                class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-red-50/30"
            >
                <td class="px-5 py-4">
                    <span
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                    >
                        {{ shortId(row.documentId) }}
                    </span>
                </td>

                <td class="px-5 py-4 font-semibold text-slate-800">
                    {{ row.riskType }}
                </td>

                <td class="px-5 py-4">
                    <NuxtLink
                        :to="`/parcels/${row.parcel_code}`"
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                        {{ row.parcel_code }}
                    </NuxtLink>
                    <div class="mt-1 text-xs text-slate-400">
                        {{ row.barangay || '—' }} · {{ row.area }} ha
                    </div>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-2.5">
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: avatarColor(row.farmerName),
                            }"
                        >
                            {{ initials(row.farmerName) }}
                        </span>
                        <span class="font-medium text-slate-700">
                            {{ row.farmerName }}
                        </span>
                    </div>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    {{ row.observedAt ?? '—' }}
                </td>

                <td class="px-5 py-4">
                    <span
                        :class="RISK_SEVERITY_STYLE[row.severity]"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: RISK_SEVERITY_DOT[row.severity],
                            }"
                        />
                        {{ row.severity }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <span
                        :class="RISK_STATUS_STYLE[row.parcelStatus]"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: RISK_STATUS_DOT[row.parcelStatus],
                            }"
                        />
                        {{ row.parcelStatus }}
                    </span>
                </td>

                <td v-if="props.canEdit || props.canDelete" class="px-5 py-4">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            v-if="props.canEdit"
                            type="button"
                            title="Edit report"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                            @click="emit('edit', row)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-3.5" />
                        </button>

                        <button
                            v-if="props.canDelete"
                            type="button"
                            title="Delete report"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            @click="emit('delete', row)"
                        >
                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
        </template>
    </RecordsTable>
</template>
