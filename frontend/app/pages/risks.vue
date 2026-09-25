<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type InsightPriority = 'High' | 'Medium' | 'Low'
type InsightType = 'risk' | 'warning' | 'opportunity'

type AlpsInsight = {
    id: number
    type: InsightType
    priority: InsightPriority
    title: string
    description: string
    rule: string
    affectedParcels: number
    affectedArea: number
    potentialScore: string
    recommendation: string
}

const alpsInsights = reactive<AlpsInsight[]>([
    {
        id: 1,
        type: 'risk',
        priority: 'High',
        title: 'Replant 12 waterlogged parcels before monsoon onset',
        description:
            'Parcels in Telabastagan and Sindalan show sustained waterlogging for 14+ days.',
        rule: 'waterlog_days > 14 AND status = "Cultivated"',
        affectedParcels: 12,
        affectedArea: 31.4,
        potentialScore: '4.2 t/ha potential loss',
        recommendation:
            'Dredge drainage channels and schedule replanting within 7 days before monsoon onset.',
    },
    {
        id: 2,
        type: 'risk',
        priority: 'High',
        title: 'Monitor pest pressure on early-planted rice',
        description:
            '9 parcels exceed the damage threshold for stem borer; schedule field validation.',
        rule: 'stem_borer_damage > 10% sample hills',
        affectedParcels: 9,
        affectedArea: 24.7,
        potentialScore: '18% yield impact',
        recommendation:
            'Schedule field validation within 10 days and prepare targeted bio-pesticide application.',
    },
    {
        id: 3,
        type: 'warning',
        priority: 'Medium',
        title: 'Rotate fallow plots to legumes in Q1',
        description:
            '234 ha of fallow land is suitable for nitrogen-fixing cover crops.',
        rule: 'status = "Fallow" AND soil_n < 45 ppm',
        affectedParcels: 34,
        affectedArea: 234.0,
        potentialScore: 'Soil N +30 ppm',
        recommendation:
            'Distribute legume seed packs to registered farmers of eligible fallow parcels.',
    },
    {
        id: 4,
        type: 'opportunity',
        priority: 'Low',
        title: 'Update idle parcel ownership records',
        description:
            '34 idle parcels lack a validated latest owner profile in the registry.',
        rule: 'status = "Idle" AND owner_validated = FALSE',
        affectedParcels: 34,
        affectedArea: 61.8,
        potentialScore: 'Registry coverage +100%',
        recommendation:
            'Coordinate with barangay captains to validate ownership records before Q1 planting.',
    },
])

const atRiskParcels = [
    {
        id: 'PLC-0202',
        farmerName: 'Rosa Dizon',
        barangay: 'Sindalan',
        area: 2.0,
        risk: 'High',
    },
    {
        id: 'PLC-0502',
        farmerName: 'Carlos Garcia',
        barangay: 'Pulung Bulu',
        area: 1.8,
        risk: 'High',
    },
    {
        id: 'PLC-1002',
        farmerName: 'Fe Domingo',
        barangay: 'Del Pilar',
        area: 2.2,
        risk: 'High',
    },
    {
        id: 'PLC-0301',
        farmerName: 'Pedro Santos',
        barangay: 'Sto. Niño',
        area: 3.4,
        risk: 'Medium',
    },
    {
        id: 'PLC-0602',
        farmerName: 'Liza Ramos',
        barangay: 'Dolores',
        area: 1.7,
        risk: 'Medium',
    },
    {
        id: 'PLC-1101',
        farmerName: 'Arturo Salazar',
        barangay: 'Pulung Bulu',
        area: 1.8,
        risk: 'Medium',
    },
    {
        id: 'PLC-0701',
        farmerName: 'Mario Cruz',
        barangay: 'Telabastagan',
        area: 2.4,
        risk: 'Medium',
    },
    {
        id: 'PLC-0401',
        farmerName: 'Ana Reyes',
        barangay: 'Calulut',
        area: 1.8,
        risk: 'Medium',
    },
]

const PRIORITY_STYLE: Record<
    InsightPriority,
    { bg: string; text: string; border: string; dot: string }
> = {
    High: {
        bg: '#fee2e2',
        text: '#b91c1c',
        border: '#fecaca',
        dot: '#dc2626',
    },
    Medium: {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        dot: '#ca8a04',
    },
    Low: {
        bg: '#e0f2fe',
        text: '#0369a1',
        border: '#bae6fd',
        dot: '#0891b2',
    },
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

const insightTypeFilterOptions = [
    'All',
    'risk',
    'warning',
    'opportunity',
] as string[]

const filterType = ref('All')

const filteredInsights = computed(() =>
    alpsInsights.filter(
        (i) => filterType.value === 'All' || i.type === filterType.value
    )
)

const insightTotals = computed(() => ({
    parcels: filteredInsights.value.reduce((s, i) => s + i.affectedParcels, 0),
    area:
        Math.round(
            filteredInsights.value.reduce((s, i) => s + i.affectedArea, 0) * 10
        ) / 10,
}))

const riskBarTotals = computed(() => ({
    high: riskBarData.reduce((s, d) => s + d.high, 0),
    medium: riskBarData.reduce((s, d) => s + d.medium, 0),
    low: riskBarData.reduce((s, d) => s + d.low, 0),
}))

const atRiskTotals = computed(() => ({
    area: Math.round(atRiskParcels.reduce((s, p) => s + p.area, 0) * 10) / 10,
    count: atRiskParcels.length,
}))

const PARCEL_RISK_DOT: Record<string, string> = {
    High: '#dc2626',
    Medium: '#ea580c',
}

const AVATAR_COLORS = [
    '#2d6a2d',
    '#3b82f6',
    '#7c3aed',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#db2777',
    '#65a30d',
]

function initials(name: string) {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function avatarColor(name: string) {
    let h = 0
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
    return AVATAR_COLORS[h]
}

function formatCoord(v: number) {
    return v.toFixed(5)
}

const riskBarData = [
    { name: 'Pest/Disease', high: 14, medium: 12, low: 8 },
    { name: 'Drought', high: 10, medium: 11, low: 7 },
    { name: 'Flood Risk', high: 5, medium: 9, low: 5 },
    { name: 'Soil Issue', high: 3, medium: 7, low: 4 },
    { name: 'Pest Spread', high: 8, medium: 6, low: 3 },
]

const kpis = [
    {
        label: 'High Risk Parcels',
        val: '34',
        icon: 'i-lucide-alert-triangle',
        color: '#dc2626',
        bg: '#fee2e2',
    },
    {
        label: 'Medium Risk',
        val: '28',
        icon: 'i-lucide-zap',
        color: '#ea580c',
        bg: '#ffedd5',
    },
    {
        label: 'Area at Risk',
        val: '95 ha',
        icon: 'i-lucide-activity',
        color: '#d97706',
        bg: '#fef3c7',
    },
    {
        label: 'Interventions Done',
        val: '12',
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
    },
]

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
        data: riskBarData.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 10, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 10, color: '#9ca3af' },
    },
    series: [
        {
            name: 'High',
            type: 'bar',
            stack: 'total',
            barWidth: 18,
            itemStyle: { color: '#dc2626' },
            data: riskBarData.map((d) => d.high),
        },
        {
            name: 'Medium',
            type: 'bar',
            stack: 'total',
            barWidth: 18,
            itemStyle: { color: '#ea580c' },
            data: riskBarData.map((d) => d.medium),
        },
        {
            name: 'Low',
            type: 'bar',
            stack: 'total',
            barWidth: 18,
            itemStyle: { color: '#ca8a04', borderRadius: [3, 3, 0, 0] },
            data: riskBarData.map((d) => d.low),
        },
    ],
}))

const showReportModal = ref(false)
const reportForm = reactive({
    title: '',
    category: 'Pest/Disease',
    priority: 'High',
    date_from: '',
    date_to: '',
    notes: '',
})

const riskCategoryOptions = [
    'Pest/Disease',
    'Drought',
    'Flood Risk',
    'Soil Issue',
    'Pest Spread',
]
const priorityOptions: InsightPriority[] = ['High', 'Medium', 'Low']
const insightTypeOptions: InsightType[] = ['risk', 'warning', 'opportunity']

const showEditModal = ref(false)
const editForm = reactive({
    id: 0,
    type: 'risk',
    priority: 'High',
    title: '',
    description: '',
    rule: '',
    affectedParcels: '',
    affectedArea: '',
    potentialScore: '',
    recommendation: '',
})

function openEditModal(insight: AlpsInsight) {
    editForm.id = insight.id
    editForm.type = insight.type
    editForm.priority = insight.priority
    editForm.title = insight.title
    editForm.description = insight.description
    editForm.rule = insight.rule
    editForm.affectedParcels = String(insight.affectedParcels)
    editForm.affectedArea = String(insight.affectedArea)
    editForm.potentialScore = insight.potentialScore
    editForm.recommendation = insight.recommendation
    showEditModal.value = true
}

function saveEdit() {
    const idx = alpsInsights.findIndex((r) => r.id === editForm.id)
    if (idx === -1) return
    const i = alpsInsights[idx]
    if (i) {
        i.type = editForm.type as InsightType
        i.priority = editForm.priority as InsightPriority
        i.title = editForm.title
        i.description = editForm.description
        i.rule = editForm.rule
        i.affectedParcels = Number(editForm.affectedParcels)
        i.affectedArea = Number(editForm.affectedArea)
        i.potentialScore = editForm.potentialScore
        i.recommendation = editForm.recommendation
        showEditModal.value = false
    }
}

const showDeleteModal = ref(false)
const deleteTarget = ref<AlpsInsight | null>(null)

function askDelete(insight: AlpsInsight) {
    deleteTarget.value = insight
    showDeleteModal.value = true
}

function confirmDelete() {
    const t = deleteTarget.value
    if (!t) return
    const idx = alpsInsights.findIndex((r) => r.id === t.id)
    if (idx !== -1) alpsInsights.splice(idx, 1)
    deleteTarget.value = null
    showDeleteModal.value = false
}
</script>

<template>
    <div class="space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-gray-900">
                        Risk Monitoring
                    </h1>
                    <span
                        class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                    >
                        {{ kpis[0]?.val }} high risk
                    </span>
                    <span
                        class="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700"
                    >
                        {{ kpis[2]?.val }} area at risk
                    </span>
                    <span
                        class="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"
                    >
                        {{ kpis[3]?.val }} interventions
                    </span>
                </div>
                <p class="mt-0.5 text-sm text-gray-500">
                    Active alerts · ALPS decision support · Intervention
                    tracking
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                @click="showReportModal = true"
            >
                <UIcon name="i-lucide-alert-triangle" class="size-3.5" />
                Generate Risk Report
            </button>
        </div>

        <!-- Risk KPIs -->
        <div class="grid grid-cols-4 gap-4">
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
                    :style="{
                        color: kpi.color,
                    }"
                >
                    {{ kpi.val }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- ALPS Insights Section -->
        <div>
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
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
            <div class="space-y-4">
                <div
                    v-for="insight in filteredInsights"
                    :key="insight.id"
                    class="alps-card border-l-4 p-5"
                    :style="{
                        borderLeftColor: PRIORITY_STYLE[insight.priority].dot,
                    }"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex flex-1 items-start gap-3">
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
                            <div class="flex-1">
                                <div class="mb-1 flex items-center gap-2">
                                    <span
                                        class="text-sm font-semibold text-gray-800 font-sans"
                                    >
                                        {{ insight.title }}
                                    </span>
                                    <span
                                        class="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
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

                                <!-- Decision Rule -->
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
                                        class="font-mono text-[10px] text-gray-600"
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
                            >
                                <UIcon
                                    name="i-lucide-eye"
                                    class="size-[11px]"
                                />
                                View Parcels
                            </button>
                            <button
                                type="button"
                                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Create Action
                            </button>
                            <div
                                class="flex justify-end gap-1 border-t border-gray-100 pt-2"
                            >
                                <button
                                    type="button"
                                    class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    @click="openEditModal(insight)"
                                >
                                    <UIcon
                                        name="i-lucide-pencil"
                                        class="size-3.5"
                                    />
                                </button>
                                <button
                                    type="button"
                                    class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                    @click="askDelete(insight)"
                                >
                                    <UIcon
                                        name="i-lucide-trash-2"
                                        class="size-3.5"
                                    />
                                </button>
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
                            riskBarTotals.high +
                            riskBarTotals.medium +
                            riskBarTotals.low
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
                    <span class="flex items-center gap-1.5 text-gray-600">
                        <span
                            class="h-2 w-2 rounded-full"
                            style="background: #dc2626"
                        />
                        High {{ riskBarTotals.high }}
                    </span>
                    <span class="flex items-center gap-1.5 text-gray-600">
                        <span
                            class="h-2 w-2 rounded-full"
                            style="background: #f59e0b"
                        />
                        Medium {{ riskBarTotals.medium }}
                    </span>
                    <span class="flex items-center gap-1.5 text-gray-600">
                        <span
                            class="h-2 w-2 rounded-full"
                            style="background: #22c55e"
                        />
                        Low {{ riskBarTotals.low }}
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
                <div class="space-y-2">
                    <div
                        v-for="p in atRiskParcels"
                        :key="p.id"
                        class="flex items-center justify-between border-b border-gray-50 py-2 text-xs last:border-0"
                    >
                        <div class="flex items-center gap-2.5">
                            <span
                                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                :style="{
                                    background: avatarColor(p.farmerName),
                                }"
                            >
                                {{ initials(p.farmerName) }}
                            </span>
                            <div>
                                <div class="font-medium text-gray-800">
                                    {{ p.farmerName }}
                                </div>
                                <div class="text-gray-400">
                                    {{ p.id }} · {{ p.barangay }}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-gray-500"
                                >{{ p.area }} ha</span
                            >
                            <span
                                :style="{
                                    background: PARCEL_RISK_DOT[p.risk],
                                }"
                                class="h-1.5 w-1.5 rounded-full"
                            />
                            <span
                                :class="
                                    p.risk === 'High'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-orange-100 text-orange-700'
                                "
                                class="rounded px-2 py-0.5 text-[10px] font-semibold"
                            >
                                {{ p.risk }}
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
                    <span>
                        avg
                        {{
                            Math.round(
                                (atRiskTotals.area / atRiskTotals.count) * 10
                            ) / 10
                        }}
                        ha / parcel
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Generate Risk Report Modal -->
    <Teleport to="body">
        <div
            v-if="showReportModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showReportModal = false"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
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
                                Run a rule-based risk assessment for the
                                selected scope.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showReportModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form
                    class="space-y-4"
                    @submit.prevent="showReportModal = false"
                >
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Report Title
                        </label>
                        <input
                            v-model="reportForm.title"
                            type="text"
                            placeholder="e.g. Monsoon Waterlogging Assessment"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Risk Category
                            </label>
                            <select
                                v-model="reportForm.category"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="c in riskCategoryOptions"
                                    :key="c"
                                    :value="c"
                                >
                                    {{ c }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Priority
                            </label>
                            <select
                                v-model="reportForm.priority"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="p in priorityOptions"
                                    :key="p"
                                    :value="p"
                                >
                                    {{ p }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date From
                            </label>
                            <input
                                v-model="reportForm.date_from"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date To
                            </label>
                            <input
                                v-model="reportForm.date_to"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Notes
                        </label>
                        <textarea
                            v-model="reportForm.notes"
                            rows="3"
                            placeholder="Scope, assumptions, or follow-up actions for this report..."
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showReportModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                        >
                            Generate Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Insight Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showEditModal = false"
        >
            <div
                class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
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
                                Edit Insight
                            </h3>
                            <p class="text-xs text-gray-500">
                                Update the ALPS rule-based insight details.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showEditModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="saveEdit">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Type
                            </label>
                            <select
                                v-model="editForm.type"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="t in insightTypeOptions"
                                    :key="t"
                                    :value="t"
                                >
                                    {{ t }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Priority
                            </label>
                            <select
                                v-model="editForm.priority"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="p in priorityOptions"
                                    :key="p"
                                    :value="p"
                                >
                                    {{ p }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Title
                        </label>
                        <input
                            v-model="editForm.title"
                            type="text"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Description
                        </label>
                        <textarea
                            v-model="editForm.description"
                            rows="2"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Detection Rule
                        </label>
                        <textarea
                            v-model="editForm.rule"
                            rows="2"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[10px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Affected Parcels
                            </label>
                            <input
                                v-model="editForm.affectedParcels"
                                type="number"
                                step="1"
                                min="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Affected Area (ha)
                            </label>
                            <input
                                v-model="editForm.affectedArea"
                                type="number"
                                step="0.1"
                                min="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Impact Score
                        </label>
                        <input
                            v-model="editForm.potentialScore"
                            type="text"
                            placeholder="e.g. 4.2 t/ha potential loss"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Recommendation
                        </label>
                        <textarea
                            v-model="editForm.recommendation"
                            rows="2"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showEditModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Delete Insight Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showDeleteModal = false"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon
                        name="i-lucide-trash-2"
                        class="size-5 text-red-600"
                    />
                </div>
                <h3 class="text-lg font-bold text-gray-900">Delete Insight</h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove insight
                    <span class="font-mono text-gray-700">
                        #{{ deleteTarget?.id }}
                    </span>
                    “{{ deleteTarget?.title }}”? This action cannot be undone.
                </p>
                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showDeleteModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                        @click="confirmDelete"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
