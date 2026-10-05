<script setup lang="ts">
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
    <div class="space-y-6 p-4 sm:p-6">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Risk Monitoring
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Active alerts · ALPS decision support · Intervention
                    tracking
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                @click="openReportModal()"
            >
                <UIcon name="i-lucide-plus" class="size-3.5" />
                Generate Risk Report
            </button>
        </div>

        <LoadErrorBanner
            v-if="loadError"
            :message="loadError.message"
            :action="loadError.action"
            @retry="load"
        />

        <!-- Risk KPIs -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
                v-for="kpi in kpis"
                :key="kpi.label"
                class="alps-card relative overflow-hidden p-5"
            >
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${kpi.color}, transparent)`,
                    }"
                />
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: kpi.bg }"
                >
                    <UIcon
                        :name="kpi.icon"
                        class="size-[18px]"
                        :style="{ color: kpi.color }"
                    />
                </div>
                <div
                    class="text-2xl font-bold font-sans"
                    :style="{ color: kpi.color }"
                >
                    {{ kpi.val }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- ALPS Insights Section -->
        <div>
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2">
                    <div
                        class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2d6a2d]"
                    >
                        <UIcon
                            name="i-lucide-activity"
                            class="size-3.5 text-white"
                        />
                    </div>
                    <h2 class="text-base font-bold text-gray-800">
                        ALPS Insights
                    </h2>
                    <span
                        class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                    >
                        Rule-based · Transparent
                    </span>
                    <span
                        class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
                    >
                        {{ filteredInsights.length }} active ·
                        {{ insightTotals.parcels }} parcels ·
                        {{ insightTotals.area }} ha
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                    <button
                        v-for="t in insightTypeFilterOptions"
                        :key="t"
                        type="button"
                        class="rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize transition-colors"
                        :class="
                            filterType === t
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        "
                        @click="filterType = t"
                    >
                        {{ t }}
                    </button>
                </div>
            </div>

            <!-- Loading -->
            <div
                v-if="loading"
                class="alps-card flex items-center justify-center gap-2 py-10 text-xs text-gray-400"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="size-4 animate-spin"
                />
                Loading risk reports...
            </div>

            <!-- Loaded, but nothing is flagged -->
            <div v-else-if="insights.length === 0" class="alps-card">
                <div class="flex flex-col items-center gap-2 py-10 text-center">
                    <UIcon
                        name="i-lucide-shield-check"
                        class="size-6 text-green-400"
                    />
                    <p class="text-sm font-medium text-gray-700">
                        No active risks
                    </p>
                    <p class="max-w-sm text-xs text-gray-400">
                        Every filed risk report has been resolved, or none have
                        been filed yet. Generate one to start tracking.
                    </p>
                    <button
                        type="button"
                        class="mt-2 rounded-lg bg-[#2d6a2d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#245524]"
                        @click="openReportModal()"
                    >
                        <UIcon name="i-lucide-plus" class="size-3" />
                        Generate Risk Report
                    </button>
                </div>
            </div>

            <!-- Loaded, but the filter matches nothing -->
            <div
                v-else-if="filteredInsights.length === 0"
                class="alps-card py-10 text-center text-xs text-gray-400"
            >
                No {{ filterType }} insights right now.
            </div>

            <div v-else class="space-y-4">
                <div
                    v-for="insight in filteredInsights"
                    :key="insight.key"
                    class="alps-card border-l-4 p-5"
                    :style="{
                        borderLeftColor: PRIORITY_STYLE[insight.priority].dot,
                    }"
                >
                    <div
                        class="flex flex-wrap items-start justify-between gap-4"
                    >
                        <div class="flex min-w-0 flex-1 items-start gap-3">
                            <div
                                class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                :style="{ background: TYPE_BG[insight.type] }"
                            >
                                <UIcon
                                    :name="TYPE_ICON[insight.type]"
                                    class="size-4"
                                    :class="TYPE_ICON_CLASS[insight.type]"
                                />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div
                                    class="mb-1 flex flex-wrap items-center gap-2"
                                >
                                    <span
                                        class="font-sans text-sm font-semibold text-gray-800"
                                    >
                                        {{ insight.title }}
                                    </span>
                                    <span
                                        class="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
                                        :style="{
                                            background: TYPE_BG[insight.type],
                                            color: TYPE_TEXT[insight.type],
                                        }"
                                    >
                                        {{ TYPE_LABEL[insight.type] }}
                                    </span>
                                    <span
                                        class="rounded px-2 py-0.5 text-[10px] font-semibold"
                                        :style="{
                                            background:
                                                PRIORITY_STYLE[insight.priority]
                                                    .bg,
                                            color: PRIORITY_STYLE[
                                                insight.priority
                                            ].text,
                                            border: `1px solid ${PRIORITY_STYLE[insight.priority].border}`,
                                        }"
                                    >
                                        {{ insight.priority }} Priority
                                    </span>
                                </div>
                                <p class="mb-3 text-xs text-gray-600">
                                    {{ insight.description }}
                                </p>

                                <!-- Detection Rule -->
                                <div
                                    class="mb-3 rounded-lg bg-gray-50 px-3 py-2"
                                >
                                    <div
                                        class="mb-1 flex items-center gap-1 text-[10px] font-semibold text-gray-400"
                                    >
                                        <UIcon
                                            name="i-lucide-code-2"
                                            class="size-3"
                                        />
                                        Detection Rule
                                    </div>
                                    <code
                                        class="font-mono text-[10px] break-all text-gray-600"
                                    >
                                        {{ insight.rule }}
                                    </code>
                                </div>

                                <div
                                    class="flex flex-wrap items-center gap-2 text-xs"
                                >
                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600"
                                    >
                                        <UIcon
                                            name="i-lucide-map-pin"
                                            class="size-3 text-gray-400"
                                        />
                                        {{ insight.affectedParcels }} parcels ·
                                        {{ insight.affectedArea }} ha
                                    </span>
                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700"
                                    >
                                        <UIcon
                                            name="i-lucide-trending-up"
                                            class="size-3 text-green-600"
                                        />
                                        Impact score
                                        {{ insight.potentialScore }}
                                    </span>
                                </div>

                                <!-- Recommendation -->
                                <div
                                    class="mt-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2"
                                >
                                    <div
                                        class="mb-1 text-[10px] font-semibold text-green-700"
                                    >
                                        Recommendation
                                    </div>
                                    <div class="text-xs text-gray-700">
                                        {{ insight.recommendation }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-shrink-0 flex-col gap-2">
                            <button
                                type="button"
                                class="flex items-center gap-1 rounded-lg bg-[#2d6a2d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#245524]"
                                @click="openReportModal(insight.title)"
                            >
                                <UIcon
                                    name="i-lucide-plus"
                                    class="size-[11px]"
                                />
                                Create Action
                            </button>
                            <NuxtLink
                                :to="`/map?parcel=${insight.rows[0]?.parcelDocumentId ?? ''}`"
                                class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                                <UIcon
                                    name="i-lucide-eye"
                                    class="size-[11px]"
                                />
                                View Parcels
                            </NuxtLink>
                            <div
                                class="flex justify-end gap-1 border-t border-gray-100 pt-2"
                            >
                                <span
                                    class="text-[10px] text-gray-400"
                                    :title="`${insight.rows.length} open reports behind this insight`"
                                >
                                    {{ insight.rows.length }} open reports
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-12 gap-4">
            <div class="alps-card col-span-12 p-5 md:col-span-7">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50"
                        >
                            <UIcon
                                name="i-lucide-bar-chart-3"
                                class="size-4 text-red-600"
                            />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Risk Distribution by Type
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Parcels flagged by category and severity
                            </p>
                        </div>
                    </div>
                    <span
                        class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                    >
                        {{
                            riskBarTotals.High +
                            riskBarTotals.Medium +
                            riskBarTotals.Low
                        }}
                        flagged
                    </span>
                </div>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '220px' }">
                        <VChart
                            :option="riskBarOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div
                    class="mt-3 flex items-center justify-end gap-4 border-t border-gray-100 pt-3 text-[11px] font-medium"
                >
                    <span
                        v-for="priority in PRIORITY_STACK"
                        :key="priority"
                        class="flex items-center gap-1.5 text-gray-600"
                    >
                        <span
                            class="h-2 w-2 rounded-full"
                            :style="{
                                background: riskBarColor[priority],
                            }"
                        />
                        {{ priority }} {{ riskBarTotals[priority] }}
                    </span>
                </div>
            </div>

            <div class="alps-card col-span-12 p-5 md:col-span-5">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50"
                        >
                            <UIcon
                                name="i-lucide-alert-octagon"
                                class="size-4 text-orange-600"
                            />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                At-Risk Parcels
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Parcels under active risk monitoring
                            </p>
                        </div>
                    </div>
                    <span
                        class="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700"
                    >
                        {{ atRiskTotals.count }} parcels
                    </span>
                </div>

                <div
                    v-if="atRiskParcels.length === 0"
                    class="flex flex-col items-center gap-2 py-8 text-center"
                >
                    <UIcon
                        name="i-lucide-shield-check"
                        class="size-5 text-green-400"
                    />
                    <p class="text-xs text-gray-400">
                        No parcels under active risk monitoring.
                    </p>
                </div>

                <div
                    v-else
                    class="max-h-[300px] space-y-2 overflow-y-auto pr-1"
                >
                    <div
                        v-for="p in atRiskParcels"
                        :key="p.parcelDocumentId"
                        class="flex items-center justify-between border-b border-gray-50 py-2 text-xs last:border-0"
                    >
                        <NuxtLink
                            :to="`/parcels/${p.parcel_code}`"
                            class="flex min-w-0 items-center gap-2.5"
                        >
                            <span
                                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                :style="{
                                    background: avatarColor(p.farmerName),
                                }"
                            >
                                {{ initials(p.farmerName) }}
                            </span>
                            <div class="min-w-0">
                                <div class="truncate font-medium text-gray-800">
                                    {{ p.farmerName }}
                                </div>
                                <div class="truncate text-gray-400">
                                    {{ p.parcel_code }}
                                    <template v-if="p.barangay">
                                        · {{ p.barangay }}
                                    </template>
                                </div>
                            </div>
                        </NuxtLink>
                        <div class="flex flex-shrink-0 items-center gap-2">
                            <span class="font-mono text-gray-500"
                                >{{ p.area }} ha</span
                            >
                            <span
                                :style="{
                                    background: SEVERITY_DOT[p.severity],
                                }"
                                class="h-1.5 w-1.5 rounded-full"
                            />
                            <span
                                :class="SEVERITY_STYLE[p.severity]"
                                class="rounded px-2 py-0.5 text-[10px] font-semibold"
                            >
                                {{ p.severity }}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500"
                >
                    <span class="font-medium">
                        {{ atRiskTotals.area }} ha total monitored
                    </span>
                    <span>avg {{ atRiskTotals.avg }} ha / parcel</span>
                </div>
            </div>
        </div>

        <!-- Risk Report Records -->
        <div class="alps-card overflow-hidden">
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"
            >
                <h3 class="text-sm font-semibold text-gray-700">
                    Risk Reports
                </h3>
                <div class="relative w-full sm:w-64">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search risk type, parcel or farmer..."
                        class="w-full rounded-full border border-gray-200 bg-white py-1.5 pr-8 pl-8 text-xs shadow-sm focus:border-[#2d6a2d] focus:ring-1 focus:ring-green-500 focus:outline-none"
                    />
                    <button
                        v-if="search"
                        type="button"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                        @click="search = ''"
                    >
                        <UIcon name="i-lucide-x" class="size-3" />
                    </button>
                </div>
            </div>

            <div
                class="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-5 py-3"
            >
                <button
                    v-for="s in statusFilterOptions"
                    :key="s"
                    type="button"
                    class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                    :class="
                        filterStatus === s
                            ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
                <span class="ml-auto text-[11px] text-gray-400">
                    {{ filteredReports.length }} of {{ riskReports.length }}
                    reports
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[900px] text-xs">
                    <thead class="border-b border-gray-100 bg-gray-50">
                        <tr>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                ID
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Risk Type
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Parcel
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Farmer
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Observed
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Severity
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Status
                            </th>
                            <th class="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td
                                colspan="8"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                <span class="inline-flex items-center gap-2">
                                    <UIcon
                                        name="i-lucide-loader-circle"
                                        class="size-4 animate-spin"
                                    />
                                    Loading risk reports...
                                </span>
                            </td>
                        </tr>
                        <tr v-else-if="riskReports.length === 0">
                            <td
                                colspan="8"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                <div class="flex flex-col items-center gap-2">
                                    <UIcon
                                        name="i-lucide-alert-triangle"
                                        class="size-6 text-gray-300"
                                    />
                                    <p>
                                        No risk reports filed yet. Generate one
                                        against a parcel to get started.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="filteredReports.length === 0">
                            <td
                                colspan="8"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                No risk reports match these filters.
                            </td>
                        </tr>
                        <tr
                            v-for="(row, i) in filteredReports"
                            :key="row.documentId"
                            class="border-b border-gray-50 transition-colors last:border-0 hover:bg-green-50/30"
                            :class="i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'"
                        >
                            <td class="px-4 py-3 font-mono text-gray-400">
                                {{ shortId(row.documentId) }}
                            </td>
                            <td class="px-4 py-3 font-medium text-gray-800">
                                {{ row.riskType }}
                            </td>
                            <td class="px-4 py-3">
                                <NuxtLink
                                    :to="`/parcels/${row.parcel_code}`"
                                    class="font-mono text-gray-500 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                >
                                    {{ row.parcel_code }}
                                </NuxtLink>
                                <div class="text-[10px] text-gray-400">
                                    {{ row.barangay || '—' }} ·
                                    {{ row.area }} ha
                                </div>
                            </td>
                            <td class="px-4 py-3 text-gray-500">
                                {{ row.farmerName }}
                            </td>
                            <td class="px-4 py-3 text-gray-500">
                                {{ row.observedAt ?? '—' }}
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    :class="SEVERITY_STYLE[row.severity]"
                                    class="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                SEVERITY_DOT[row.severity],
                                        }"
                                    />
                                    {{ row.severity }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    :class="STATUS_STYLE[row.parcelStatus]"
                                    class="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                STATUS_DOT[row.parcelStatus],
                                        }"
                                    />
                                    {{ row.parcelStatus }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <div
                                    class="flex items-center justify-end gap-1"
                                >
                                    <button
                                        type="button"
                                        title="Edit report"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                        @click="openEdit(row)"
                                    >
                                        <UIcon
                                            name="i-lucide-pencil"
                                            class="size-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        title="Delete report"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        @click="askDelete(row)"
                                    >
                                        <UIcon
                                            name="i-lucide-trash-2"
                                            class="size-3.5"
                                        />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Generate Risk Report Modal -->
    <Teleport to="body">
        <div
            v-if="showReportModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeReportModal"
        >
            <div
                class="w-full max-w-lg rounded-xl bg-white p-6 font-sans shadow-xl"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                            style="box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12)"
                        >
                            <UIcon
                                name="i-lucide-alert-triangle"
                                class="size-5"
                            />
                        </span>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Generate Risk Report
                            </h3>
                            <p class="text-xs text-gray-500">
                                File a risk against a parcel. It is grouped into
                                an ALPS insight automatically.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
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
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Risk report filed.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitNew">
                    <p
                        v-if="allParcels.length === 0"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        No parcels registered yet. Register a parcel first, then
                        file its risk report here.
                    </p>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="newForm.parcelDocumentId"
                            :disabled="submittingNew || allParcels.length === 0"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Risk Type <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="newForm.risk_type"
                            type="text"
                            list="risk-type-options"
                            :disabled="submittingNew"
                            placeholder="e.g. Flood Risk, Soil Erosion"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                        />
                        <datalist id="risk-type-options">
                            <option
                                v-for="type in riskTypeSuggestions"
                                :key="type"
                                :value="type"
                            />
                        </datalist>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Observed <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.observed_at"
                                type="date"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.severity"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.parcel_status"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ newError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingNew"
                            @click="closeReportModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEditModal"
        >
            <div
                class="w-full max-w-lg rounded-xl bg-white p-6 font-sans shadow-xl"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#e0f0fb] text-[#1d6ab3]"
                            style="box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-5" />
                        </span>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Edit Risk Report
                            </h3>
                            <p class="text-xs text-gray-500">
                                Update the report's scope, severity and status.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
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
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Risk report updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div
                        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="editForm.parcelDocumentId"
                            :disabled="submittingEdit"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Risk Type <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="editForm.risk_type"
                            type="text"
                            list="risk-type-options"
                            :disabled="submittingEdit"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Observed <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.observed_at"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.severity"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.parcel_status"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
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
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingEdit"
                            @click="closeEditModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDeleteModal"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 font-sans shadow-xl"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon
                        name="i-lucide-trash-2"
                        class="size-5 text-red-600"
                    />
                </div>
                <h3 class="text-lg font-bold text-gray-900">
                    Delete Risk Report
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove the
                    <span class="font-medium text-gray-700">
                        {{ deleteTarget?.riskType }}
                    </span>
                    report on
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ({{ deleteTarget?.observedAt ?? 'no date' }})? This action
                    cannot be undone, and the parcel's insight totals will
                    change.
                </p>
                <p
                    v-if="deleteError"
                    class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                    {{ deleteError }}
                </p>
                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        :disabled="deleting"
                        @click="closeDeleteModal"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
