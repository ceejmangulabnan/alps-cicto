<script setup lang="ts">

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

const alpsInsights: AlpsInsight[] = [
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
]

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
</script>

<template>
    <div class="space-y-6 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
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
            >
                <UIcon name="i-lucide-alert-triangle" class="size-3.5" />
                Generate Risk Report
            </button>
        </div>

        <!-- Risk KPIs -->
        <div class="grid grid-cols-4 gap-4">
            <div v-for="kpi in kpis" :key="kpi.label" class="alps-card p-5">
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
                    class="text-2xl font-bold"
                    :style="{
                        color: kpi.color,
                        fontFamily: 'DM Sans, sans-serif',
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
                    <h2
                        class="text-base font-bold text-gray-800"
                        style="font-family: 'DM Sans', sans-serif"
                    >
                        ALPS Insights
                    </h2>
                    <span
                        class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                    >
                        Rule-based · Transparent
                    </span>
                </div>
            </div>
            <div class="space-y-4">
                <div
                    v-for="insight in alpsInsights"
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
                                        class="text-sm font-semibold text-gray-800"
                                        style="
                                            font-family: 'DM Sans', sans-serif;
                                        "
                                    >
                                        {{ insight.title }}
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
                                        class="mb-1 text-[10px] font-medium text-gray-400"
                                    >
                                        Detection Rule
                                    </div>
                                    <code
                                        class="font-mono text-[10px] text-gray-600"
                                    >
                                        {{ insight.rule }}
                                    </code>
                                </div>

                                <div class="flex items-start gap-4 text-xs">
                                    <div>
                                        <span class="text-gray-400"
                                            >Affected:</span
                                        >
                                        <span
                                            class="ml-1 font-semibold text-gray-700"
                                        >
                                            {{
                                                insight.affectedParcels
                                            }}
                                            parcels ·
                                            {{ insight.affectedArea }} ha
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400"
                                            >Impact:</span
                                        >
                                        <span
                                            class="ml-1 font-semibold text-green-700"
                                        >
                                            {{ insight.potentialScore }}
                                        </span>
                                    </div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-12 gap-4">
            <div class="alps-card col-span-12 p-5 md:col-span-7">
                <h3
                    class="mb-4 text-sm font-semibold text-gray-700"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Risk Distribution by Type
                </h3>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '220px' }">
                        <VChart
                            :option="riskBarOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
            </div>

            <div class="alps-card col-span-12 p-5 md:col-span-5">
                <h3
                    class="mb-4 text-sm font-semibold text-gray-700"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    At-Risk Parcels
                </h3>
                <div class="space-y-2">
                    <div
                        v-for="p in atRiskParcels"
                        :key="p.id"
                        class="flex items-center justify-between border-b border-gray-50 py-2 text-xs last:border-0"
                    >
                        <div>
                            <div class="font-medium text-gray-800">
                                {{ p.farmerName }}
                            </div>
                            <div class="text-gray-400">
                                {{ p.id }} · {{ p.barangay }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-gray-500"
                                >{{ p.area }} ha</span
                            >
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
            </div>
        </div>
    </div>
</template>
