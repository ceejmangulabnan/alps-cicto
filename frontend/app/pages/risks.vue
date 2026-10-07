<script setup lang="ts">
//@ts-nocheck
import type { TableColumn } from '@nuxt/ui'
import type {
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
import { useRiskRegistry } from '~/composables/useRiskRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import type { InsightType, RiskPriority, RiskRow } from '~/utils/riskInsights'
import { getErrorMessage } from '~/utils/apiError'
import { avatarColor, initials } from '~/utils/initials'

definePageMeta({ middleware: 'auth' })

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
const { createRiskReport, updateRiskReport, deleteRiskReport } =
    useFarmRecordsApi()

/* ------------------------------------------------------------------ */
/* Presentation maps                                                    */
/* ------------------------------------------------------------------ */

const PRIORITY_STYLE: Record<
    RiskPriority,
    { bg: string; text: string; border: string; dot: string }
> = {
    High: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
    Medium: {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        dot: '#ca8a04',
    },
    Low: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', dot: '#0891b2' },
}

const TYPE_ICON: Record<InsightType, string> = {
    risk: 'i-lucide-alert-triangle',
    warning: 'i-lucide-zap',
    opportunity: 'i-lucide-trending-up',
}

const TYPE_ICON_CLASS: Record<InsightType, string> = {
    risk: 'text-red-500',
    warning: 'text-yellow-500',
    opportunity: 'text-green-600',
}

const TYPE_BG: Record<InsightType, string> = {
    risk: '#fee2e2',
    warning: '#fef9c3',
    opportunity: '#dcfce7',
}

const TYPE_TEXT: Record<InsightType, string> = {
    risk: '#b91c1c',
    warning: '#a16207',
    opportunity: '#166534',
}

const TYPE_LABEL: Record<InsightType, string> = {
    risk: 'Risk',
    warning: 'Warning',
    opportunity: 'Opportunity',
}

/** Severity uses the same red/orange/amber ramp the priority bands use. */
const SEVERITY_STYLE: Record<RiskSeverity, string> = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-yellow-100 text-yellow-700',
}

const SEVERITY_DOT: Record<RiskSeverity, string> = {
    Critical: '#7f1d1d',
    High: '#dc2626',
    Medium: '#ea580c',
    Low: '#ca8a04',
}

const STATUS_STYLE: Record<RiskParcelStatus, string> = {
    Active: 'bg-red-100 text-red-700',
    Monitoring: 'bg-orange-100 text-orange-700',
    Resolved: 'bg-green-100 text-green-700',
}

const STATUS_DOT: Record<RiskParcelStatus, string> = {
    Active: '#dc2626',
    Monitoring: '#ea580c',
    Resolved: '#16a34a',
}

const riskBarColor: Record<RiskPriority, string> = {
    High: '#dc2626',
    Medium: '#ea580c',
    Low: '#ca8a04',
}

const riskStatusOptions: RiskParcelStatus[] = [
    'Active',
    'Monitoring',
    'Resolved',
]

/* ------------------------------------------------------------------ */
/* KPIs                                                                 */
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
    },
    {
        label: 'Medium Risk',
        val: openReports.value.filter((row) => row.severity === 'Medium')
            .length,
        icon: 'i-lucide-zap',
        color: '#ea580c',
        bg: '#ffedd5',
    },
    {
        label: 'Area at Risk',
        val: `${areaAtRisk.value} ha`,
        icon: 'i-lucide-activity',
        color: '#d97706',
        bg: '#fef3c7',
    },
    {
        label: 'Interventions Done',
        val: riskReports.value.filter((row) => row.parcelStatus === 'Resolved')
            .length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
    },
])

/* ------------------------------------------------------------------ */
/* Charts                                                               */
/* ------------------------------------------------------------------ */

const riskBarTotals = computed(() => {
    const totals = { High: 0, Medium: 0, Low: 0 }
    for (const insight of insights.value) {
        totals.High += insight.severityCounts.High
        totals.Medium += insight.severityCounts.Medium
        totals.Low += insight.severityCounts.Low
    }
    return totals
})

const riskBarData = computed(() =>
    insights.value.map((insight) => ({
        name: insight.title,
        High: insight.severityCounts.High,
        Medium: insight.severityCounts.Medium,
        Low: insight.severityCounts.Low,
    }))
)

const PRIORITY_STACK: RiskPriority[] = ['High', 'Medium', 'Low']

const riskBarOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        top: 0,
        right: 8,
        textStyle: { fontSize: 11 },
    },
    grid: { left: 8, right: 16, top: 30, bottom: 24, containLabel: true },
    xAxis: {
        type: 'category',
        data: riskBarData.value.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: {
            fontSize: 10,
            color: '#6b7280',
            // Long free-text risk types overlap badly on the category axis.
            interval: 0,
            rotate: riskBarData.value.length > 4 ? 20 : 0,
        },
    },
    yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 10, color: '#9ca3af' },
    },
    series: PRIORITY_STACK.map((priority, index) => ({
        name: priority,
        type: 'bar',
        stack: 'total',
        barWidth: 18,
        itemStyle: {
            color: riskBarColor[priority],
            // Round only the top segment of the stack.
            ...(index === PRIORITY_STACK.length - 1
                ? {
                      borderRadius: [3, 3, 0, 0] as [
                          number,
                          number,
                          number,
                          number,
                      ],
                  }
                : {}),
        },
        data: riskBarData.value.map((d) => d[priority]),
    })),
}))

const atRiskTotals = computed(() => {
    const area = Math.round(
        atRiskParcels.value.reduce((sum, p) => sum + p.area, 0) * 10
    )
    return {
        area: area / 10,
        count: atRiskParcels.value.length,
        avg:
            atRiskParcels.value.length === 0
                ? 0
                : Math.round((area / 10 / atRiskParcels.value.length) * 10) /
                  10,
    }
})

onMounted(() => {
    load()
})

/* ------------------------------------------------------------------ */
/* Insight filters                                                      */
/* ------------------------------------------------------------------ */

const insightTypeFilterOptions = [
    'All',
    'risk',
    'warning',
    'opportunity',
] as const
type InsightFilter = (typeof insightTypeFilterOptions)[number]
const filterType = ref<InsightFilter>('All')

const filteredInsights = computed(() =>
    insights.value.filter(
        (insight) =>
            filterType.value === 'All' || insight.type === filterType.value
    )
)

const insightTotals = computed(() => ({
    parcels: filteredInsights.value.reduce((s, i) => s + i.affectedParcels, 0),
    area:
        Math.round(
            filteredInsights.value.reduce((s, i) => s + i.affectedArea, 0) * 10
        ) / 10,
}))

/* ------------------------------------------------------------------ */
/* Record table filters                                                 */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', ...riskStatusOptions] as const
type StatusFilter = (typeof statusFilterOptions)[number]
const filterStatus = ref<StatusFilter>('All')
const search = ref('')


/**
 * The risk-report table's columns.
 *
 * Every sortable value is a flat string except Observed, which sorts on its
 * raw `string | null` via accessorFn, and none of the columns starts on
 * descending because nothing here is numeric.
 */
const columns: TableColumn<RiskRow>[] = [
    { accessorKey: 'documentId', header: sortHeader('ID') },
    {
        accessorKey: 'riskType',
        header: sortHeader('Risk Type'),
        meta: { class: { td: 'font-semibold text-slate-800' } },
    },
    { accessorKey: 'parcel_code', header: sortHeader('Parcel') },
    { accessorKey: 'farmerName', header: sortHeader('Farmer') },
    {
        id: 'observed',
        accessorFn: (row) => row.observedAt ?? '',
        header: sortHeader('Observed'),
        meta: { class: { td: 'text-slate-600' } },
    },
    { accessorKey: 'severity', header: sortHeader('Severity') },
    { accessorKey: 'parcelStatus', header: sortHeader('Status') },
    {
        // Buttons, not data: nothing to sort on.
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { th: 'text-right' } },
    },
]

const filteredReports = computed(() =>
    riskReports.value.filter((row) => {
        const haystack = [
            row.riskType,
            row.parcel_code,
            row.barangay,
            row.farmerName,
        ]
            .join(' ')
            .toLowerCase()
        const matchesSearch =
            !search.value || haystack.includes(search.value.toLowerCase())
        const matchesStatus =
            filterStatus.value === 'All' ||
            row.parcelStatus === filterStatus.value
        return matchesSearch && matchesStatus
    })
)

const shortId = (documentId: string): string =>
    `#${documentId.slice(-6).toUpperCase()}`

/* ------------------------------------------------------------------ */
/* Generate risk report                                                 */
/* ------------------------------------------------------------------ */

const severityOptions: RiskSeverity[] = ['Critical', 'High', 'Medium', 'Low']

/** Offered alongside whatever the registry has already seen. */
const SUGGESTED_RISK_TYPES = [
    'Flood Risk',
    'Soil Erosion',
    'Pest Infestation',
    'Drought',
    'Waterlogging',
    'Disease Outbreak',
]

const riskTypeSuggestions = computed<string[]>(() => [
    ...new Set([...knownRiskTypes.value, ...SUGGESTED_RISK_TYPES]),
])

/** Local calendar date, which is what Strapi's `date` columns expect. */
function today(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

const parcelOptions = computed(() =>
    allParcels.value.map((parcel) => {
        const farmer = parcel.farmers?.[0]?.name
        return {
            value: parcel.documentId,
            label: [parcel.parcel_code, farmer, parcel.farm?.barangay?.name]
                .filter(Boolean)
                .join(' · '),
        }
    })
)

const showReportModal = ref(false)
const submittingNew = ref(false)
const newError = ref<string | null>(null)
const newSaved = ref(false)
let newCloseTimer: ReturnType<typeof setTimeout> | null = null

const newForm = reactive({
    parcelDocumentId: '',
    risk_type: '',
    observed_at: today(),
    severity: 'Medium' as RiskSeverity,
    parcel_status: 'Active' as RiskParcelStatus,
})

const canSaveNew = computed(
    () =>
        !submittingNew.value &&
        Boolean(newForm.parcelDocumentId) &&
        Boolean(newForm.risk_type.trim()) &&
        Boolean(newForm.observed_at)
)

/** `presetRiskType` is how an insight card's "Create Action" pre-fills the form. */
function openReportModal(presetRiskType = '') {
    newForm.parcelDocumentId = allParcels.value[0]?.documentId ?? ''
    newForm.risk_type = presetRiskType
    newForm.observed_at = today()
    newForm.severity = 'Medium'
    newForm.parcel_status = 'Active'
    newError.value = null
    newSaved.value = false
    showReportModal.value = true
}

function closeReportModal() {
    if (submittingNew.value) return
    if (newCloseTimer) {
        clearTimeout(newCloseTimer)
        newCloseTimer = null
    }
    newSaved.value = false
    showReportModal.value = false
}

async function submitNew() {
    newError.value = null
    submittingNew.value = true
    try {
        await createRiskReport({
            farm_parcel: newForm.parcelDocumentId,
            risk_type: newForm.risk_type.trim(),
            observed_at: newForm.observed_at,
            severity: newForm.severity,
            parcel_status: newForm.parcel_status,
        })
        newSaved.value = true
        newCloseTimer = setTimeout(() => {
            newCloseTimer = null
            newSaved.value = false
            showReportModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        newError.value = getErrorMessage(
            cause,
            'Failed to file the risk report. Please try again.'
        )
    } finally {
        submittingNew.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Edit risk report                                                     */
/* ------------------------------------------------------------------ */

const showEditModal = ref(false)
const submittingEdit = ref(false)
const editError = ref<string | null>(null)
const editSaved = ref(false)
let editCloseTimer: ReturnType<typeof setTimeout> | null = null

const editForm = reactive({
    documentId: '',
    contextLabel: '',
    parcelDocumentId: '',
    risk_type: '',
    observed_at: '',
    severity: 'Medium' as RiskSeverity,
    parcel_status: 'Active' as RiskParcelStatus,
})

const canSaveEdit = computed(
    () =>
        !submittingEdit.value &&
        Boolean(editForm.parcelDocumentId) &&
        Boolean(editForm.risk_type.trim()) &&
        Boolean(editForm.observed_at)
)

function openEdit(row: RiskRow) {
    editForm.documentId = row.documentId
    editForm.contextLabel = `${row.parcel_code} · ${row.barangay || 'no barangay'}`
    editForm.parcelDocumentId = row.parcelDocumentId
    editForm.risk_type = row.riskType
    editForm.observed_at = row.observedAt ?? ''
    editForm.severity = row.severity
    editForm.parcel_status = row.parcelStatus
    editError.value = null
    editSaved.value = false
    showEditModal.value = true
}

function closeEditModal() {
    if (submittingEdit.value) return
    if (editCloseTimer) {
        clearTimeout(editCloseTimer)
        editCloseTimer = null
    }
    editSaved.value = false
    showEditModal.value = false
}

async function submitEdit() {
    editError.value = null
    submittingEdit.value = true
    try {
        await updateRiskReport(editForm.documentId, {
            farm_parcel: editForm.parcelDocumentId,
            risk_type: editForm.risk_type.trim(),
            observed_at: editForm.observed_at,
            severity: editForm.severity,
            parcel_status: editForm.parcel_status,
        })
        editSaved.value = true
        editCloseTimer = setTimeout(() => {
            editCloseTimer = null
            editSaved.value = false
            showEditModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        editError.value = getErrorMessage(
            cause,
            'Failed to update the risk report. Please try again.'
        )
    } finally {
        submittingEdit.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Delete risk report                                                   */
/* ------------------------------------------------------------------ */

const showDeleteModal = ref(false)
const deleteTarget = ref<RiskRow | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function askDelete(row: RiskRow) {
    deleteTarget.value = row
    deleteError.value = null
    showDeleteModal.value = true
}

function closeDeleteModal() {
    if (deleting.value) return
    deleteTarget.value = null
    showDeleteModal.value = false
}

async function confirmDelete() {
    const target = deleteTarget.value
    if (!target) return
    deleting.value = true
    deleteError.value = null
    try {
        await deleteRiskReport(target.documentId)
        deleteTarget.value = null
        showDeleteModal.value = false
        await load()
    } catch (cause) {
        deleteError.value = getErrorMessage(
            cause,
            'Failed to delete the risk report. Please try again.'
        )
    } finally {
        deleting.value = false
    }
}
</script>

<template>
    <div class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8">
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-red-100/80 bg-gradient-to-r from-white via-white to-red-50/50 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-red-300/10 blur-3xl"
                />

                <div class="relative flex flex-wrap items-center justify-between gap-5">
                    <div class="flex min-w-0 items-start gap-4">
                        <div
                            class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-[0_8px_22px_rgba(220,38,38,0.20)] sm:flex"
                        >
                            <UIcon name="i-lucide-alert-triangle" class="size-6" />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-700"
                                >
                                    <span class="size-1.5 rounded-full bg-red-500" />
                                    Risk & Intervention Monitoring
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ openReports.length }} open risk reports
                                </span>
                            </div>

                            <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                Risk Monitoring
                            </h1>

                            <p class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                                Monitor active agricultural risks, ALPS decision support insights, and intervention progress.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.20)] transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_10px_24px_rgba(220,38,38,0.24)]"
                        @click="openReportModal()"
                    >
                        <UIcon name="i-lucide-plus" class="size-4.5" />
                        Generate Risk Report
                    </button>
                </div>
            </div>

            <LoadErrorBanner
                v-if="loadError"
                :message="loadError.message"
                :action="loadError.action"
                @retry="load"
            />

            <!-- KPIs -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="kpi in kpis"
                    :key="kpi.label"
                    class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}55, transparent)`,
                        }"
                    />

                    <div
                        class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                        :style="{ backgroundColor: kpi.color }"
                    />

                    <div class="relative flex h-full flex-col">
                        <div class="flex items-start justify-between gap-3">
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
                                :style="{ background: kpi.bg }"
                            >
                                <UIcon
                                    :name="kpi.icon"
                                    class="size-5"
                                    :style="{ color: kpi.color }"
                                />
                            </div>

                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{ backgroundColor: kpi.color }"
                                />
                                Live
                            </span>
                        </div>

                        <div class="mt-5">
                            <div class="text-3xl font-bold tracking-tight text-slate-950">
                                {{ kpi.val }}
                            </div>
                            <div class="mt-1 text-sm font-semibold text-slate-700">
                                {{ kpi.label }}
                            </div>
                        </div>

                        <div
                            class="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="size-3.5"
                                :style="{ color: kpi.color }"
                            />
                            <span>
                                {{
                                    kpi.label === 'High Risk Reports'
                                        ? 'Open high and critical reports'
                                        : kpi.label === 'Medium Risk'
                                          ? 'Open medium-severity reports'
                                          : kpi.label === 'Area at Risk'
                                            ? 'Distinct area under open reports'
                                            : 'Resolved intervention records'
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ALPS Insights -->
            <section
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
                >
                    <div class="flex flex-wrap items-center gap-3">
                        <div
                            class="flex size-10 items-center justify-center rounded-xl bg-[#2d6a2d] text-white shadow-sm"
                        >
                            <UIcon name="i-lucide-activity" class="size-4.5" />
                        </div>

                        <div>
                            <div class="flex flex-wrap items-center gap-2">
                                <h2 class="text-base font-bold tracking-tight text-slate-800">
                                    ALPS Insights
                                </h2>
                                <span
                                    class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                >
                                    Rule-based · Transparent
                                </span>
                            </div>
                            <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                                {{ filteredInsights.length }} active insights ·
                                {{ insightTotals.parcels }} parcels ·
                                {{ insightTotals.area }} ha
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <button
                            v-for="t in insightTypeFilterOptions"
                            :key="t"
                            type="button"
                            class="rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all"
                            :class="
                                filterType === t
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                            "
                            @click="filterType = t"
                        >
                            {{ t }}
                        </button>
                    </div>
                </div>

                <div class="p-4 sm:p-5">
                    <div
                        v-if="loading"
                        class="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-12 text-sm text-slate-400"
                    >
                        <UIcon
                            name="i-lucide-loader-circle"
                            class="size-4 animate-spin"
                        />
                        Loading risk reports...
                    </div>

                    <div
                        v-else-if="insights.length === 0"
                        class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center"
                    >
                        <div
                            class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
                        >
                            <UIcon name="i-lucide-shield-check" class="size-6" />
                        </div>
                        <p class="text-base font-semibold text-slate-700">
                            No active risks
                        </p>
                        <p class="max-w-md text-sm text-slate-400">
                            Every filed risk report has been resolved, or none have been filed yet.
                        </p>
                        <button
                            type="button"
                            class="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f5125]"
                            @click="openReportModal()"
                        >
                            <UIcon name="i-lucide-plus" class="size-4" />
                            Generate Risk Report
                        </button>
                    </div>

                    <div
                        v-else-if="filteredInsights.length === 0"
                        class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-sm text-slate-400"
                    >
                        No {{ filterType }} insights right now.
                    </div>

                    <div v-else class="space-y-4">
                        <div
                            v-for="insight in filteredInsights"
                            :key="insight.key"
                            class="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:p-6"
                        >
                            <div
                                class="absolute inset-y-0 left-0 w-1"
                                :style="{
                                    background: PRIORITY_STYLE[insight.priority].dot,
                                }"
                            />

                            <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div class="flex min-w-0 flex-1 items-start gap-4">
                                    <div
                                        class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                                        :style="{ background: TYPE_BG[insight.type] }"
                                    >
                                        <UIcon
                                            :name="TYPE_ICON[insight.type]"
                                            class="size-4.5"
                                            :class="TYPE_ICON_CLASS[insight.type]"
                                        />
                                    </div>

                                    <div class="min-w-0 flex-1">
                                        <div class="flex flex-wrap items-center gap-2">
                                            <h3 class="text-base font-bold text-slate-800">
                                                {{ insight.title }}
                                            </h3>

                                            <span
                                                class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                                                :style="{
                                                    background: TYPE_BG[insight.type],
                                                    color: TYPE_TEXT[insight.type],
                                                }"
                                            >
                                                {{ TYPE_LABEL[insight.type] }}
                                            </span>

                                            <span
                                                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                                :style="{
                                                    background:
                                                        PRIORITY_STYLE[insight.priority].bg,
                                                    color:
                                                        PRIORITY_STYLE[insight.priority].text,
                                                    border: `1px solid ${PRIORITY_STYLE[insight.priority].border}`,
                                                }"
                                            >
                                                {{ insight.priority }} Priority
                                            </span>
                                        </div>

                                        <p class="mt-2 text-sm leading-6 text-slate-600">
                                            {{ insight.description }}
                                        </p>

                                        <div
                                            class="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"
                                        >
                                            <div
                                                class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
                                            >
                                                <UIcon
                                                    name="i-lucide-code-2"
                                                    class="size-3.5"
                                                />
                                                Detection Rule
                                            </div>
                                            <code class="break-all font-mono text-xs text-slate-600">
                                                {{ insight.rule }}
                                            </code>
                                        </div>

                                        <div class="mt-4 flex flex-wrap items-center gap-2">
                                            <span
                                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                                            >
                                                <UIcon
                                                    name="i-lucide-map-pin"
                                                    class="size-3.5 text-slate-400"
                                                />
                                                {{ insight.affectedParcels }} parcels ·
                                                {{ insight.affectedArea }} ha
                                            </span>

                                            <span
                                                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                                            >
                                                <UIcon
                                                    name="i-lucide-trending-up"
                                                    class="size-3.5"
                                                />
                                                Impact score {{ insight.potentialScore }}
                                            </span>
                                        </div>

                                        <div
                                            class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                                        >
                                            <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                Recommendation
                                            </div>
                                            <div class="text-sm leading-6 text-slate-700">
                                                {{ insight.recommendation }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex shrink-0 flex-row gap-2 xl:flex-col">
                                    <button
                                        type="button"
                                        class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f5125]"
                                        @click="openReportModal(insight.title)"
                                    >
                                        <UIcon name="i-lucide-plus" class="size-4" />
                                        Create Action
                                    </button>

                                    <NuxtLink
                                        :to="`/map?parcel=${insight.rows[0]?.parcelDocumentId ?? ''}`"
                                        class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <UIcon name="i-lucide-eye" class="size-4" />
                                        View Parcels
                                    </NuxtLink>

                                    <span class="text-right text-xs text-slate-400">
                                        {{ insight.rows.length }} open reports
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Charts -->
            <div class="grid grid-cols-12 gap-4">
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] md:col-span-7"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100"
                                >
                                    <UIcon
                                        name="i-lucide-chart-no-axes-column-increasing"
                                        class="size-4.5"
                                    />
                                </div>
                                <div>
                                    <h3 class="text-base font-bold tracking-tight text-slate-800">
                                        Risk Distribution by Type
                                    </h3>
                                    <p class="text-xs text-slate-500">
                                        Parcels flagged by category and severity
                                    </p>
                                </div>
                            </div>

                            <span
                                class="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            >
                                {{
                                    riskBarTotals.High +
                                    riskBarTotals.Medium +
                                    riskBarTotals.Low
                                }}
                                flagged
                            </span>
                        </div>
                    </div>

                    <div class="p-5 sm:p-6">
                        <ClientOnly>
                            <div class="w-full" :style="{ height: '260px' }">
                                <VChart
                                    :option="riskBarOption"
                                    :style="{ height: '260px', width: '100%' }"
                                    autoresize
                                />
                            </div>
                        </ClientOnly>

                        <div
                            class="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-4 text-sm font-medium"
                        >
                            <span
                                v-for="priority in PRIORITY_STACK"
                                :key="priority"
                                class="flex items-center gap-1.5 text-slate-600"
                            >
                                <span
                                    class="h-2.5 w-2.5 rounded-full"
                                    :style="{
                                        background: riskBarColor[priority],
                                    }"
                                />
                                {{ priority }} {{ riskBarTotals[priority] }}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] md:col-span-5"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100"
                                >
                                    <UIcon name="i-lucide-alert-octagon" class="size-4.5" />
                                </div>
                                <div>
                                    <h3 class="text-base font-bold tracking-tight text-slate-800">
                                        At-Risk Parcels
                                    </h3>
                                    <p class="text-xs text-slate-500">
                                        Parcels under active risk monitoring
                                    </p>
                                </div>
                            </div>

                            <span
                                class="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                            >
                                {{ atRiskTotals.count }} parcels
                            </span>
                        </div>
                    </div>

                    <div class="p-5 sm:p-6">
                        <div
                            v-if="atRiskParcels.length === 0"
                            class="flex flex-col items-center gap-2 py-10 text-center"
                        >
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
                            >
                                <UIcon name="i-lucide-shield-check" class="size-6" />
                            </div>
                            <p class="text-sm text-slate-400">
                                No parcels under active risk monitoring.
                            </p>
                        </div>

                        <div
                            v-else
                            class="max-h-[320px] space-y-2 overflow-y-auto pr-1"
                        >
                            <div
                                v-for="p in atRiskParcels"
                                :key="p.parcelDocumentId"
                                class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3"
                            >
                                <NuxtLink
                                    :to="`/parcels/${p.parcel_code}`"
                                    class="flex min-w-0 items-center gap-3"
                                >
                                    <span
                                        class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                        :style="{
                                            background: avatarColor(p.farmerName),
                                        }"
                                    >
                                        {{ initials(p.farmerName) }}
                                    </span>

                                    <div class="min-w-0">
                                        <div class="truncate text-sm font-semibold text-slate-800">
                                            {{ p.farmerName }}
                                        </div>
                                        <div class="truncate text-xs text-slate-400">
                                            {{ p.parcel_code }}
                                            <template v-if="p.barangay">
                                                · {{ p.barangay }}
                                            </template>
                                        </div>
                                    </div>
                                </NuxtLink>

                                <div class="flex shrink-0 items-center gap-2">
                                    <span class="font-mono text-sm font-semibold text-slate-600">
                                        {{ p.area }} ha
                                    </span>
                                    <span
                                        :class="SEVERITY_STYLE[p.severity]"
                                        class="rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                    >
                                        {{ p.severity }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"
                        >
                            <span class="font-semibold">
                                {{ atRiskTotals.area }} ha total monitored
                            </span>
                            <span>avg {{ atRiskTotals.avg }} ha / parcel</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Risk Reports -->
            <div
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
                >
                    <div>
                        <h3 class="text-base font-bold tracking-tight text-slate-800">
                            Risk Reports
                        </h3>
                        <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                            Review risk type, parcel, farmer, severity, and intervention status.
                        </p>
                    </div>

                    <div class="relative w-full sm:w-80">
                        <UIcon
                            name="i-lucide-search"
                            class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            v-model="search"
                            type="text"
                            placeholder="Search risk type, parcel or farmer..."
                            class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                        />
                        <button
                            v-if="search"
                            type="button"
                            class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            @click="search = ''"
                        >
                            <UIcon name="i-lucide-x" class="size-3.5" />
                        </button>
                    </div>
                </div>

                <div
                    class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
                >
                    <button
                        v-for="s in statusFilterOptions"
                        :key="s"
                        type="button"
                        class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        :class="
                            filterStatus === s
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                        "
                        @click="filterStatus = s"
                    >
                        <span
                            v-if="s !== 'All'"
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{ background: STATUS_DOT[s] }"
                        />
                        {{ s }}
                    </button>

                    <span class="ml-auto text-sm font-medium text-slate-500">
                        {{ filteredReports.length }} of {{ riskReports.length }} reports
                    </span>
                </div>

                    <div class="overflow-x-auto">
                        <UTable
                            :data="filteredReports"
                            :columns="columns"
                            :loading="loading"
                            :get-row-id="(row: RiskRow) => row.documentId"
                            :ui="{
                                th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                                td: 'px-5 py-4 text-sm',
                                tr: 'border-b border-slate-100 last:border-0 hover:bg-red-50/30',
                            }"
                        >
                            <template #documentId-cell="{ row }">
                                <span
                                    class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                                >
                                    {{ shortId(row.original.documentId) }}
                                </span>
                            </template>

                            <template #riskType-cell="{ row }">
                                {{ row.original.riskType }}
                            </template>

                            <template #parcel_code-cell="{ row }">
                                <NuxtLink
                                    :to="`/parcels/${row.original.parcel_code}`"
                                    class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                                >
                                    {{ row.original.parcel_code }}
                                </NuxtLink>
                                <div class="mt-1 text-xs text-slate-400">
                                    {{ row.original.barangay || '—' }} ·
                                    {{ row.original.area }} ha
                                </div>
                            </template>

                            <template #farmerName-cell="{ row }">
                                <div class="flex items-center gap-2.5">
                                    <span
                                        class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                        :style="{
                                            backgroundColor: avatarColor(
                                                row.original.farmerName
                                            ),
                                        }"
                                    >
                                        {{ initials(row.original.farmerName) }}
                                    </span>
                                    <span
                                        class="font-medium text-slate-700"
                                    >
                                        {{ row.original.farmerName }}
                                    </span>
                                </div>
                            </template>

                            <template #observed-cell="{ row }">
                                {{ row.original.observedAt ?? '—' }}
                            </template>

                            <template #severity-cell="{ row }">
                                <span
                                    :class="
                                        SEVERITY_STYLE[
                                            row.original.severity
                                        ]
                                    "
                                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                SEVERITY_DOT[
                                                    row.original.severity
                                                ],
                                        }"
                                    />
                                    {{ row.original.severity }}
                                </span>
                            </template>

                            <template #parcelStatus-cell="{ row }">
                                <span
                                    :class="
                                        STATUS_STYLE[
                                            row.original.parcelStatus
                                        ]
                                    "
                                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                STATUS_DOT[
                                                    row.original.parcelStatus
                                                ],
                                        }"
                                    />
                                    {{ row.original.parcelStatus }}
                                </span>
                            </template>

                            <template #actions-cell="{ row }">
                                <div
                                    class="flex items-center justify-end gap-2"
                                >
                                    <button
                                        type="button"
                                        title="Edit report"
                                        class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                        @click="openEdit(row.original)"
                                    >
                                        <UIcon
                                            name="i-lucide-pencil"
                                            class="size-3.5"
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        title="Delete report"
                                        class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        @click="askDelete(row.original)"
                                    >
                                        <UIcon
                                            name="i-lucide-trash-2"
                                            class="size-3.5"
                                        />
                                    </button>
                                </div>
                            </template>

                            <template #loading>
                                <span class="inline-flex items-center gap-2">
                                    <UIcon
                                        name="i-lucide-loader-circle"
                                        class="size-4 animate-spin"
                                    />
                                    Loading risk reports...
                                </span>
                            </template>

                            <template #empty>
                                <div
                                    v-if="riskReports.length === 0"
                                    class="px-5 py-14 text-center"
                                >
                                    <div
                                        class="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                        >
                                            <UIcon
                                                name="i-lucide-alert-triangle"
                                                class="size-6"
                                            />
                                        </div>
                                        <p
                                            class="text-base font-semibold text-slate-700"
                                        >
                                            No risk reports filed yet
                                        </p>
                                        <p
                                            class="max-w-sm text-sm text-slate-400"
                                        >
                                            Generate the first risk report
                                            against a parcel to begin
                                            monitoring.
                                        </p>
                                    </div>
                                </div>

                                <div
                                    v-else
                                    class="px-5 py-12 text-center text-sm text-slate-400"
                                >
                                    No risk reports match the current filters.
                                </div>
                            </template>
                        </UTable>
                    </div>
            </div>
        </div>
    </div>

    <!-- Generate Risk Report Modal -->
    <Teleport to="body">
        <div
            v-if="showReportModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeReportModal"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100"
                        >
                            <UIcon
                                name="i-lucide-alert-triangle"
                                class="size-5"
                            />
                        </span>
                        <div>
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Generate Risk Report
                            </h3>
                            <p class="text-sm text-slate-500">
                                File a risk against a parcel. ALPS groups it into an insight automatically.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        :disabled="submittingNew"
                        @click="closeReportModal"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="newSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Risk report filed.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitNew">
                    <p
                        v-if="allParcels.length === 0"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        No parcels registered yet. Register a parcel first, then
                        file its risk report here.
                    </p>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="newForm.parcelDocumentId"
                            :disabled="submittingNew || allParcels.length === 0"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        >
                            <option value="" disabled>Select a parcel</option>
                            <option
                                v-for="option in parcelOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Risk Type <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="newForm.risk_type"
                            type="text"
                            list="risk-type-options"
                            :disabled="submittingNew"
                            placeholder="e.g. Flood Risk, Soil Erosion"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                        <datalist id="risk-type-options">
                            <option
                                v-for="type in riskTypeSuggestions"
                                :key="type"
                                :value="type"
                            />
                        </datalist>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Observed <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.observed_at"
                                type="date"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.severity"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            >
                                <option
                                    v-for="s in severityOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.parcel_status"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            >
                                <option
                                    v-for="s in riskStatusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="newError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ newError }}
                    </p>

                    <div class="flex justify-end gap-2 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingNew"
                            @click="closeReportModal"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveNew"
                        >
                            <UIcon
                                v-if="submittingNew"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submittingNew ? 'Filing...' : 'File Report' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Risk Report Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEditModal"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e0f0fb] text-[#1d6ab3] ring-1 ring-blue-100"
                        >
                            <UIcon name="i-lucide-pencil" class="size-5" />
                        </span>
                        <div>
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Edit Risk Report
                            </h3>
                            <p class="text-sm text-slate-500">
                                Update the report's scope, severity and status.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        :disabled="submittingEdit"
                        @click="closeEditModal"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="editSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Risk report updated.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitEdit">
                    <div class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                        <span class="font-semibold text-slate-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="editForm.parcelDocumentId"
                            :disabled="submittingEdit"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        >
                            <option
                                v-for="option in parcelOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Risk Type <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="editForm.risk_type"
                            type="text"
                            list="risk-type-options"
                            :disabled="submittingEdit"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Observed <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.observed_at"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.severity"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            >
                                <option
                                    v-for="s in severityOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.parcel_status"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            >
                                <option
                                    v-for="s in riskStatusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="editError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div class="flex justify-end gap-2 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingEdit"
                            @click="closeEditModal"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveEdit"
                        >
                            <UIcon
                                v-if="submittingEdit"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submittingEdit ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Delete Risk Report Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDeleteModal"
        >
            <div
                class="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            >
                <div
                    class="mb-4 flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                >
                    <UIcon name="i-lucide-trash-2" class="size-5" />
                </div>

                <h3 class="text-xl font-bold tracking-tight text-slate-950">
                    Delete Risk Report
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                    Remove the
                    <span class="font-semibold text-slate-700">
                        {{ deleteTarget?.riskType }}
                    </span>
                    report on
                    <span class="font-mono font-semibold text-slate-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ({{ deleteTarget?.observedAt ?? 'no date' }})? This action
                    cannot be undone, and the parcel's insight totals will change.
                </p>

                <p
                    v-if="deleteError"
                    class="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                    {{ deleteError }}
                </p>

                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        :disabled="deleting"
                        @click="closeDeleteModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="deleting"
                        @click="confirmDelete"
                    >
                        <UIcon
                            v-if="deleting"
                            name="i-lucide-loader-circle"
                            class="size-3.5 animate-spin"
                        />
                        {{ deleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
