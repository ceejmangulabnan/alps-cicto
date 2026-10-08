<script setup lang="ts">
import type { RiskRow } from '~/utils/riskInsights'
import { useRiskRegistry } from '~/composables/useRiskRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { RISK_STATUS_OPTIONS, RISK_STATUS_DOT } from '~/utils/riskStatus'


const {
    riskReports,
    openReports,
    insights,
    atRiskParcels,
    allParcels,
    knownRiskTypes,
    loading,
    loadError,
    load,
} = useRiskRegistry()

const { deleteRiskReport } = useFarmRecordsApi()

/* ------------------------------------------------------------------ */
/* Summary                                                              */
/* ------------------------------------------------------------------ */

const areaAtRisk = computed(() => {
    const distinct = new Map(
        openReports.value.map((row) => [row.parcelDocumentId, row.area])
    )
    const total = [...distinct.values()].reduce((sum, area) => sum + area, 0)
    return Math.round(total * 10) / 10
})

const kpis = computed(() => [
    {
        label: 'High Risk Reports',
        val: openReports.value.filter(
            (row) => row.severity === 'High' || row.severity === 'Critical'
        ).length,
        icon: 'i-lucide-alert-triangle',
        color: '#dc2626',
        bg: '#fee2e2',
        hint: 'Open high and critical reports',
    },
    {
        label: 'Medium Risk',
        val: openReports.value.filter((row) => row.severity === 'Medium')
            .length,
        icon: 'i-lucide-zap',
        color: '#ea580c',
        bg: '#ffedd5',
        hint: 'Open medium-severity reports',
    },
    {
        label: 'Area at Risk',
        val: `${areaAtRisk.value} ha`,
        icon: 'i-lucide-activity',
        color: '#d97706',
        bg: '#fef3c7',
        hint: 'Distinct area under open reports',
    },
    {
        label: 'Interventions Done',
        val: riskReports.value.filter((row) => row.parcelStatus === 'Resolved')
            .length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
        hint: 'Resolved intervention records',
    },
])

/* ------------------------------------------------------------------ */
/* Search + status filter                                               */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', ...RISK_STATUS_OPTIONS] as const

type StatusFilter = (typeof statusFilterOptions)[number]

const { search, filterStatus, filtered } = useTableFilters<
    RiskRow,
    StatusFilter
>(() => riskReports.value, {
    statusOptions: statusFilterOptions,
    haystack: (row) =>
        [row.riskType, row.parcel_code, row.barangay, row.farmerName]
            .join(' ')
            .toLowerCase(),
    matchesStatus: (row, status) =>
        status === 'All' || row.parcelStatus === status,
})

/* ------------------------------------------------------------------ */
/* Modal open state                                                     */
/* ------------------------------------------------------------------ */

const showReportModal = ref(false)

const reportPreset = ref('')

const showEditModal = ref(false)

const editRow = ref<RiskRow | null>(null)

/** `presetRiskType` is how an insight card's "Create Action" pre-fills the form. */
function openReport(presetRiskType = '') {
    reportPreset.value = presetRiskType

    showReportModal.value = true
}

function openEdit(row: RiskRow) {
    editRow.value = row

    showEditModal.value = true
}

const {
    open: showDeleteModal,
    target: deleteTarget,
    deleting,
    error: deleteError,
    ask: askDelete,
    close: closeDelete,
    confirm: confirmDelete,
} = useDeleteModal<RiskRow>({
    remove: (row) => deleteRiskReport(row.documentId),
    onDeleted: () => load(),
    failureMessage: 'Failed to delete the risk report. Please try again.',
})

onMounted(() => {
    load()
})
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <PageHero
                tone="red"
                icon="i-lucide-alert-triangle"
                badge="Risk & Intervention Monitoring"
                :count="`${openReports.length} open risk reports`"
                title="Risk Monitoring"
                description="Monitor active agricultural risks, ALPS decision support insights, and intervention progress."
                action-label="Generate Risk Report"
                action-icon="i-lucide-plus"
                @action="openReport"
            />

            <LoadErrorBanner
                v-if="loadError"
                :message="loadError.message"
                :action="loadError.action"
                @retry="load"
            />

            <!-- KPIs -->
            <StatCards :cards="kpis" tone="red" />

            <!-- ALPS Insights -->
            <RisksInsightsPanel
                :insights="insights"
                :loading="loading"
                @create="openReport"
                @create-action="openReport"
            />

            <!-- Charts -->
            <div class="grid grid-cols-12 gap-4">
                <RisksDistributionCard :insights="insights" />
                <RisksAtRiskParcelsCard :at-risk-parcels="atRiskParcels" />
            </div>

            <!-- Risk Reports -->
            <RisksReportsTable
                :rows="filtered"
                :total="riskReports.length"
                :loading="loading"
                @edit="openEdit"
                @delete="askDelete"
                @retry="load"
            >
                <template #header-right>
                    <SearchInput
                        v-model:search="search"
                        placeholder="Search risk type, parcel or farmer..."
                        accent="red"
                        class="sm:w-80"
                    />
                </template>

                <template #toolbar>
                    <div
                        class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
                    >
                        <FilterPills
                            v-model:status="filterStatus"
                            :options="statusFilterOptions"
                            :dots="RISK_STATUS_DOT"
                        />

                        <span
                            class="ml-auto text-sm font-medium text-slate-500"
                        >
                            {{ filtered.length }} of
                            {{ riskReports.length }} reports
                        </span>
                    </div>
                </template>
            </RisksReportsTable>
        </div>

        <!-- Generate Risk Report Modal -->
        <RisksReportFormModal
            :show="showReportModal"
            mode="create"
            :parcels="allParcels"
            :known-risk-types="knownRiskTypes"
            :preset="reportPreset"
            @close="showReportModal = false"
            @saved="load"
        />

        <!-- Edit Risk Report Modal -->
        <RisksReportFormModal
            :show="showEditModal"
            mode="edit"
            :row="editRow"
            :parcels="allParcels"
            :known-risk-types="knownRiskTypes"
            @close="showEditModal = false"
            @saved="load"
        />

        <!-- Delete Risk Report Modal -->
        <ConfirmDeleteModal
            :show="showDeleteModal"
            title="Delete Risk Report"
            :deleting="deleting"
            :error="deleteError"
            @close="closeDelete"
            @confirm="confirmDelete"
        >
            Remove the
            <span class="font-semibold text-slate-700">
                {{ deleteTarget?.riskType }}
            </span>
            report on
            <span class="font-mono font-semibold text-slate-700">
                {{ deleteTarget?.parcel_code ?? '' }}
            </span>
            ({{ deleteTarget?.observedAt ?? 'no date' }})? This action cannot be
            undone, and the parcel's insight totals will change.
        </ConfirmDeleteModal>
    </div>
</template>
