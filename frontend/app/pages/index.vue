<script setup lang="ts">
import type { StyleSpecification } from 'maplibre-gl'

type RiskItem = {
    type: string
    parcels: number
    area: number
    trend: 'up' | 'down' | 'stable'
}

const landStatusData = [
    { name: 'Cultivated', value: 842, color: '#2d6a2d' },
    { name: 'Fallow', value: 234, color: '#ca8a04' },
    { name: 'Idle', value: 178, color: '#94a3b8' },
    { name: 'Other Uses', value: 102, color: '#059669' },
]

const cropDistributionData = [
    { name: 'Rice', value: 46, color: '#16a34a' },
    { name: 'Corn', value: 22, color: '#ca8a04' },
    { name: 'Sugarcane', value: 14, color: '#d97706' },
    { name: 'Vegetables', value: 11, color: '#059669' },
    { name: 'Others', value: 7, color: '#94a3b8' },
]

const barangayAreaData = [
    { barangay: 'Sto. Niño', area: 45.2, cultivated: 21.4 },
    { barangay: 'Telabastagan', area: 40.6, cultivated: 18.9 },
    { barangay: 'Sindalan', area: 38.3, cultivated: 16.2 },
    { barangay: 'Pulung Bulu', area: 35.7, cultivated: 14.8 },
    { barangay: 'Calulut', area: 33.1, cultivated: 15.4 },
    { barangay: 'Del Pilar', area: 30.5, cultivated: 12.1 },
    { barangay: 'Dolores', area: 28.9, cultivated: 13.6 },
    { barangay: 'San Pedro', area: 26.2, cultivated: 11.3 },
    { barangay: 'Maimpis', area: 24.4, cultivated: 9.8 },
]

const monthlyHarvestData = [
    { month: 'Jan', rice: 42, corn: 18, sugarcane: 12, vegetables: 9 },
    { month: 'Feb', rice: 36, corn: 21, sugarcane: 14, vegetables: 11 },
    { month: 'Mar', rice: 51, corn: 24, sugarcane: 15, vegetables: 10 },
    { month: 'Apr', rice: 44, corn: 19, sugarcane: 13, vegetables: 12 },
    { month: 'May', rice: 58, corn: 27, sugarcane: 16, vegetables: 14 },
    { month: 'Jun', rice: 63, corn: 22, sugarcane: 18, vegetables: 13 },
    { month: 'Jul', rice: 55, corn: 20, sugarcane: 17, vegetables: 15 },
    { month: 'Aug', rice: 48, corn: 25, sugarcane: 19, vegetables: 12 },
    { month: 'Sep', rice: 66, corn: 28, sugarcane: 21, vegetables: 16 },
    { month: 'Oct', rice: 59, corn: 23, sugarcane: 20, vegetables: 14 },
    { month: 'Nov', rice: 71, corn: 30, sugarcane: 22, vegetables: 17 },
    { month: 'Dec', rice: 64, corn: 26, sugarcane: 20, vegetables: 15 },
]

const riskData: RiskItem[] = [
    { type: 'Waterlogging', parcels: 12, area: 31.4, trend: 'up' },
    { type: 'Pests & Diseases', parcels: 9, area: 24.7, trend: 'up' },
    { type: 'Soil Degradation', parcels: 7, area: 18.2, trend: 'stable' },
    { type: 'Drought Risk', parcels: 4, area: 11.6, trend: 'down' },
    { type: 'Post-Harvest Loss', parcels: 2, area: 5.1, trend: 'up' },
]

const upcomingHarvests = [
    {
        farmer: 'Jose Mendoza',
        crop: 'Palay',
        barangay: 'Telabastagan',
        area: 2.4,
        expectedDate: 'Dec 02, 2024',
        status: 'At Risk',
    },
    {
        farmer: 'Rosa Dizon',
        crop: 'Corn',
        barangay: 'Sindalan',
        area: 3.1,
        expectedDate: 'Dec 05, 2024',
        status: 'On Track',
    },
    {
        farmer: 'Pedro Santos',
        crop: 'Sugarcane',
        barangay: 'Sto. Niño',
        area: 4.2,
        expectedDate: 'Dec 08, 2024',
        status: 'On Track',
    },
    {
        farmer: 'Ana Reyes',
        crop: 'Ampalaya',
        barangay: 'Calulut',
        area: 1.8,
        expectedDate: 'Dec 12, 2024',
        status: 'On Track',
    },
    {
        farmer: 'Carlos Garcia',
        crop: 'Palay',
        barangay: 'Pulung Bulu',
        area: 2.9,
        expectedDate: 'Dec 15, 2024',
        status: 'At Risk',
    },
    {
        farmer: 'Liza Ramos',
        crop: 'Corn',
        barangay: 'Dolores',
        area: 2.2,
        expectedDate: 'Dec 18, 2024',
        status: 'On Track',
    },
]

const alpsInsights = [
    {
        id: 1,
        title: 'Replant 12 waterlogged parcels before monsoon onset',
        priority: 'high',
        description:
            'Parcels in Telabastagan and Sindalan show sustained waterlogging for 14+ days.',
    },
    {
        id: 2,
        title: 'Monitor pest pressure on early-planted rice',
        priority: 'high',
        description:
            '9 parcels exceed the damage threshold for stem borer; schedule field validation.',
    },
    {
        id: 3,
        title: 'Rotate fallow plots to legumes in Q1',
        priority: 'medium',
        description:
            '234 ha of fallow land is suitable for nitrogen-fixing cover crops.',
    },
    {
        id: 4,
        title: 'Update idle parcel ownership records',
        priority: 'low',
        description:
            '34 idle parcels lack a validated latest owner profile in the registry.',
    },
]

const kpis = [
    {
        label: 'Total Agricultural Land',
        value: '1,893 ha',
        sub: 'Registered parcels: 312',
        icon: 'i-lucide-layers',
        color: '#2d6a2d',
        bg: '#e8f5e8',
        trend: '+2.4%',
        up: true,
        to: '/farms',
    },
    {
        label: 'Active Farmers',
        value: '1,248',
        sub: 'RSBSA registered: 1,186',
        icon: 'i-lucide-users',
        color: '#1d6fa4',
        bg: '#e0f0fb',
        trend: '+3.1%',
        up: true,
        to: '/farmers',
    },
    {
        label: 'Cultivated Land',
        value: '842 ha',
        sub: '44.5% of total agri area',
        icon: 'i-lucide-wheat',
        color: '#16a34a',
        bg: '#dcfce7',
        trend: '+1.8%',
        up: true,
        to: '/farms',
    },
    {
        label: 'Idle / Fallow Land',
        value: '412 ha',
        sub: '178 idle · 234 fallow',
        icon: 'i-lucide-map-pin',
        color: '#9ca3af',
        bg: '#f3f4f6',
        trend: '-5.2%',
        up: false,
        to: '/farms',
    },
    {
        label: 'At-Risk Land',
        value: '95 ha',
        sub: '34 parcels flagged',
        icon: 'i-lucide-alert-triangle',
        color: '#dc2626',
        bg: '#fee2e2',
        trend: '+12.1%',
        up: false,
        alert: true,
        to: '/risks',
    },
    {
        label: 'Upcoming Harvests',
        value: '18 parcels',
        sub: 'Next 30 days · 42.6 ha',
        icon: 'i-lucide-activity',
        color: '#d97706',
        bg: '#fef3c7',
        trend: 'Dec 2024',
        up: null,
        to: '/harvests',
    },
]

const RISK_BADGE: Record<
    RiskItem['trend'],
    { label: string; icon: string; cls: string }
> = {
    up: {
        label: 'Rising',
        icon: 'i-lucide-trending-up',
        cls: 'bg-red-50 text-red-600',
    },
    stable: {
        label: 'Stable',
        icon: 'i-lucide-minus',
        cls: 'bg-amber-50 text-amber-700',
    },
    down: {
        label: 'Improving',
        icon: 'i-lucide-trending-down',
        cls: 'bg-green-50 text-green-700',
    },
}

const landStatusOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ${p.value} ha`,
    },
    series: [
        {
            type: 'pie',
            radius: ['55%', '85%'],
            center: ['50%', '50%'],
            padAngle: 2,
            label: { show: false },
            emphasis: { label: { show: false } },
            data: landStatusData.map((d) => ({
                name: d.name,
                value: d.value,
                itemStyle: { color: d.color },
            })),
        },
    ],
}))

const harvestOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: {
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        top: 0,
        right: 8,
        textStyle: { fontSize: 11 },
    },
    grid: {
        left: 8,
        right: 16,
        top: 34,
        bottom: 24,
        containLabel: true,
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: monthlyHarvestData.map((d) => d.month),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 11, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Rice',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#16a34a' },
            itemStyle: { color: '#16a34a' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(22, 163, 74, 0.2)' },
                        { offset: 1, color: 'rgba(22, 163, 74, 0)' },
                    ],
                },
            },
            data: monthlyHarvestData.map((d) => d.rice),
        },
        {
            name: 'Corn',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#ca8a04' },
            itemStyle: { color: '#ca8a04' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(202, 138, 4, 0.2)' },
                        { offset: 1, color: 'rgba(202, 138, 4, 0)' },
                    ],
                },
            },
            data: monthlyHarvestData.map((d) => d.corn),
        },
        {
            name: 'Sugarcane',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#d97706' },
            itemStyle: { color: '#d97706' },
            data: monthlyHarvestData.map((d) => d.sugarcane),
        },
        {
            name: 'Vegetables',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: '#059669' },
            itemStyle: { color: '#059669' },
            data: monthlyHarvestData.map((d) => d.vegetables),
        },
    ],
}))

const barangayOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: {
        left: 8,
        right: 16,
        top: 8,
        bottom: 8,
        containLabel: true,
    },
    xAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLabel: { fontSize: 12, color: '#9ca3af' },
    },
    yAxis: {
        type: 'category',
        data: [...barangayAreaData].reverse().map((d) => d.barangay),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 12, color: '#374151' },
    },
    series: [
        {
            name: 'Total Area',
            type: 'bar',
            barWidth: 18,
            itemStyle: { color: '#dde5dd', borderRadius: [0, 3, 3, 0] },
            data: [...barangayAreaData].reverse().map((d) => d.area),
        },
        {
            name: 'Cultivated',
            type: 'bar',
            barWidth: 18,
            barGap: '-100%',
            itemStyle: { color: '#2d6a2d', borderRadius: [0, 3, 3, 0] },
            data: [...barangayAreaData].reverse().map((d) => d.cultivated),
        },
    ],
}))

const cropDistributionOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ${p.value}%`,
    },
    series: [
        {
            type: 'pie',
            radius: ['35%', '70%'],
            center: ['50%', '50%'],
            padAngle: 2,
            label: { show: false },
            emphasis: { label: { show: false } },
            data: cropDistributionData.map((d) => ({
                name: d.name,
                value: d.value,
                itemStyle: { color: d.color },
            })),
        },
    ],
}))

const highPriorityCount = computed(
    () => alpsInsights.filter((i) => i.priority === 'high').length
)
const mediumPriorityCount = computed(
    () => alpsInsights.filter((i) => i.priority === 'medium').length
)
const lowPriorityCount = computed(
    () => alpsInsights.filter((i) => i.priority === 'low').length
)

const landClassifiedTotal = landStatusData.reduce((s, d) => s + d.value, 0)
const harvestYearTotal = monthlyHarvestData.reduce(
    (s, d) => s + d.rice + d.corn + d.sugarcane + d.vegetables,
    0
)
const barangayTotal =
    Math.round(barangayAreaData.reduce((s, d) => s + d.area, 0) * 10) / 10
const riskTotals = {
    parcels: riskData.reduce((s, r) => s + r.parcels, 0),
    area: Math.round(riskData.reduce((s, r) => s + r.area, 0) * 10) / 10,
}

const AS_OF = new Date('November 25, 2024')
const daysUntil = (dateStr: string) =>
    Math.round((new Date(dateStr).getTime() - AS_OF.getTime()) / 86_400_000)

const initials = (name: string) =>
    name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

const AVATAR_COLORS = [
    '#2d6a2d',
    '#1d6fa4',
    '#7c3aed',
    '#b45309',
    '#0f766e',
    '#be123c',
]
const avatarColor = (name: string) =>
    AVATAR_COLORS[
        name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) %
            AVATAR_COLORS.length
    ]

const clock = ref('')
let clockTimer: ReturnType<typeof setInterval> | undefined
const tick = () => {
    clock.value = new Date().toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    })
}
onMounted(() => {
    tick()
    clockTimer = setInterval(tick, 1000)
})
onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer)
})

const config = useRuntimeConfig()
const maptilerKey = config.public.maptilerKey as string | undefined

const MINI_OSM_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        openstreetmap: {
            type: 'raster',
            attribution: '© OpenStreetMap contributors',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
        },
    },
    layers: [
        {
            id: 'osm-tiles',
            type: 'raster',
            source: 'openstreetmap',
        },
    ],
}
const miniMapStyle = computed<StyleSpecification | string>(() =>
    maptilerKey
        ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerKey}`
        : MINI_OSM_STYLE
)
const miniMapCenter = ref<[number, number]>([120.6896, 15.0282])
const miniMapZoom = ref(13)
</script>

<template>
    <div class="space-y-6 p-6">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Agricultural Command Center
                </h1>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span class="text-sm text-gray-500">
                        City Agriculture Office · San Fernando, Pampanga
                    </span>
                    <span
                        class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm"
                    >
                        <UIcon
                            name="i-lucide-calendar-days"
                            class="size-3 text-[#2d6a2d]"
                        />
                        Nov 1 – Nov 25, 2024
                    </span>
                    <span
                        class="inline-flex items-center gap-1 text-[11px] text-gray-400"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full bg-green-500"
                        ></span>
                        Live · {{ clock }}
                    </span>
                </div>
            </div>
            <div class="flex gap-2">
                <button
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                    Export Report
                </button>
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                    @click="navigateTo('/map')"
                >
                    <UIcon name="i-lucide-map-pin" class="size-3.5" />
                    Open GIS Map
                </button>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <NuxtLink
                v-for="kpi in kpis"
                :key="kpi.label"
                :to="kpi.to"
                class="alps-card group relative block overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                :class="kpi.alert ? 'ring-1 ring-red-200' : ''"
            >
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${kpi.color}, transparent)`,
                    }"
                />
                <div class="mb-3 flex items-start justify-between">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                        :style="{ backgroundColor: kpi.bg }"
                    >
                        <UIcon
                            :name="kpi.icon"
                            class="size-5"
                            :style="{ color: kpi.color }"
                        />
                    </div>
                    <span
                        v-if="kpi.up !== null"
                        class="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        :class="
                            kpi.up
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-600'
                        "
                    >
                        <UIcon
                            :name="
                                kpi.up
                                    ? 'i-lucide-trending-up'
                                    : 'i-lucide-trending-down'
                            "
                            class="size-3"
                        />
                        {{ kpi.trend }}
                    </span>
                    <span
                        v-else
                        class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                    >
                        {{ kpi.trend }}
                    </span>
                </div>
                <div class="mb-1 text-2xl font-bold text-gray-900 font-sans">
                    {{ kpi.value }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
                <div class="mt-1 text-[11px] text-gray-400">
                    {{ kpi.sub }}
                </div>
                <div
                    v-if="kpi.alert"
                    class="absolute right-0 top-0 h-full w-1 rounded-r bg-red-400"
                />
            </NuxtLink>
        </div>

        <!-- ALPS Insights Banner -->
        <div
            class="alps-card relative overflow-hidden border-l-4 border-[#2d6a2d] bg-gradient-to-r from-[#e6f2e6] via-[#f0f7f0] to-white p-4"
        >
            <div
                class="pointer-events-none absolute inset-y-0 right-0 w-44 opacity-40"
                style="background-image: radial-gradient(#2d6a2d55 1.2px, transparent 1.2px); background-size: 12px 12px;"
            />
            <div class="relative flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d6a2d]"
                    >
                        <UIcon
                            name="i-lucide-activity"
                            class="size-4 text-white"
                        />
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-[#2d6a2d]">
                            ALPS Insights — {{ alpsInsights.length }} active
                            recommendations
                        </div>
                        <div class="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                                class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100"
                            >
                                {{ highPriorityCount }} high
                            </span>
                            <span
                                class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100"
                            >
                                {{ mediumPriorityCount }} medium
                            </span>
                            <span
                                class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200"
                            >
                                {{ lowPriorityCount }} low
                            </span>
                            <span class="text-[11px] text-gray-400">
                                · Rule-based decision support
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    class="flex items-center gap-1 text-xs font-medium text-[#2d6a2d] hover:underline"
                    @click="navigateTo('/risks')"
                >
                    View All
                    <UIcon name="i-lucide-arrow-right" class="size-3" />
                </button>
            </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="grid grid-cols-12 gap-4">
            <!-- Land Status Pie -->
            <div class="alps-card col-span-12 p-5 md:col-span-4">
                <div
                    class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="flex h-7 w-7 items-center justify-center rounded-md bg-[#e8f5e8] text-[#2d6a2d]"
                        >
                            <UIcon name="i-lucide-pie-chart" class="size-4" />
                        </span>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Land Status Distribution
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                {{ landClassifiedTotal.toLocaleString() }} ha
                                classified
                            </p>
                        </div>
                    </div>
                </div>
                <ClientOnly>
                    <div class="relative">
                        <VChart
                            :option="landStatusOption"
                            :style="{ height: '200px', width: '100%' }"
                            autoresize
                        />
                        <div
                            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                        >
                            <div class="text-xl font-bold text-gray-900">
                                {{ landClassifiedTotal.toLocaleString() }}
                            </div>
                            <div class="text-[10px] text-gray-400">
                                hectares
                            </div>
                        </div>
                    </div>
                    <template #fallback>
                        <div class="w-full" :style="{ height: '200px' }"></div>
                    </template>
                </ClientOnly>
                <div class="mt-2 grid grid-cols-2 gap-1">
                    <div
                        v-for="d in landStatusData"
                        :key="d.name"
                        class="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                        <div
                            class="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                            :style="{ backgroundColor: d.color }"
                        />
                        <span class="truncate">{{ d.name }}</span>
                        <span class="ml-auto font-mono text-gray-500">
                            {{ d.value }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Harvest Trend -->
            <div class="alps-card col-span-12 p-5 md:col-span-8">
                <div
                    class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="flex h-7 w-7 items-center justify-center rounded-md bg-[#fef3c7] text-amber-600"
                        >
                            <UIcon name="i-lucide-line-chart" class="size-4" />
                        </span>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Monthly Harvest Volume (ha)
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                FY 2024 · {{ harvestYearTotal.toLocaleString() }}
                                ha total
                            </p>
                        </div>
                    </div>
                </div>
                <ClientOnly>
                    <VChart
                        :option="harvestOption"
                        :style="{ height: '220px', width: '100%' }"
                        autoresize
                    />
                    <template #fallback>
                        <div class="w-full" :style="{ height: '220px' }"></div>
                    </template>
                </ClientOnly>
            </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="grid grid-cols-12 gap-4">
            <!-- Barangay Area Bar -->
            <div class="alps-card col-span-12 p-5 md:col-span-7">
                <div
                    class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="flex h-8 w-8 items-center justify-center rounded-md bg-[#e8f5e8] text-[#2d6a2d]"
                        >
                            <UIcon name="i-lucide-map" class="size-4.5" />
                        </span>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800">
                                Barangay Agricultural Area (ha)
                            </h3>
                            <p class="text-xs text-gray-400">
                                Top 9 barangays · {{ barangayTotal }} ha total
                            </p>
                        </div>
                    </div>
                    <div
                        class="flex items-center gap-3 text-xs text-gray-500"
                    >
                        <span class="flex items-center gap-1.5">
                            <span
                                class="h-2.5 w-2.5 rounded-sm bg-[#dde5dd]"
                            ></span>
                            Total
                        </span>
                        <span class="flex items-center gap-1.5">
                            <span
                                class="h-2.5 w-2.5 rounded-sm bg-[#2d6a2d]"
                            ></span>
                            Cultivated
                        </span>
                    </div>
                </div>
                <ClientOnly>
                    <VChart
                        :option="barangayOption"
                        :style="{ height: '300px', width: '100%' }"
                        autoresize
                    />
                    <template #fallback>
                        <div class="w-full" :style="{ height: '300px' }"></div>
                    </template>
                </ClientOnly>
            </div>

            <!-- Risk Summary + Mini Map -->
            <div class="col-span-12 space-y-4 md:col-span-5">
                <!-- Risk Table -->
                <div class="alps-card p-5">
                    <div class="mb-3 flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-gray-700">
                            Active Risks
                        </h3>
                        <button
                            type="button"
                            class="flex items-center gap-1 text-xs text-green-700 hover:underline"
                            @click="navigateTo('/risks')"
                        >
                            View all
                            <UIcon
                                name="i-lucide-arrow-right"
                                class="size-2.5"
                            />
                        </button>
                    </div>
                    <div class="space-y-1">
                        <div
                            v-for="r in riskData"
                            :key="r.type"
                            class="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-gray-50"
                        >
                            <div class="min-w-0">
                                <div class="truncate font-medium text-gray-800">
                                    {{ r.type }}
                                </div>
                                <div class="text-gray-400">
                                    {{ r.parcels }} parcels · {{ r.area }} ha
                                </div>
                            </div>
                            <span
                                class="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                :class="RISK_BADGE[r.trend].cls"
                            >
                                <UIcon
                                    :name="RISK_BADGE[r.trend].icon"
                                    class="size-3"
                                />
                                {{ RISK_BADGE[r.trend].label }}
                            </span>
                        </div>
                    </div>
                    <div
                        class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px]"
                    >
                        <span class="text-gray-400">Total affected</span>
                        <span class="font-semibold text-gray-700">
                            {{ riskTotals.parcels }} parcels ·
                            {{ riskTotals.area }} ha
                        </span>
                    </div>
                </div>

                <!-- Mini Map -->
                <div
                    class="alps-card group overflow-hidden"
                >
                    <div class="relative h-36 overflow-hidden bg-[#e8f0e8]">
                        <ClientOnly>
                            <div class="absolute inset-0">
                                <MglMap
                                    v-model:center="miniMapCenter"
                                    v-model:zoom="miniMapZoom"
                                    :map-style="miniMapStyle"
                                    :attribution-control="false"
                                    height="100%"
                                    width="100%"
                                />
                            </div>
                            <template #fallback>
                                <div
                                    class="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                                >
                                    Loading map...
                                </div>
                            </template>
                        </ClientOnly>

                        <div class="pointer-events-none absolute bottom-2 left-3">
                            <div
                                class="rounded bg-[#2d6a2d]/85 px-2 py-1 backdrop-blur-sm"
                            >
                                <div
                                    class="text-xs font-medium text-white drop-shadow"
                                >
                                    Agricultural Map
                                </div>
                                <div class="text-[10px] text-white/70">
                                    San Fernando, Pampanga · OpenStreetMap
                                </div>
                            </div>
                        </div>
                        <div
                            class="pointer-events-none absolute right-2 top-2 rounded bg-white/80 px-2 py-1 text-[10px] text-gray-600 backdrop-blur-sm"
                        >
                            312 parcels mapped
                        </div>
                        <NuxtLink
                            to="/map"
                            class="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#2d6a2d] shadow-md backdrop-blur-sm hover:bg-white"
                        >
                            Open Map
                            <UIcon name="i-lucide-arrow-right" class="size-3" />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upcoming Harvests + Crop Distribution -->
        <div class="grid grid-cols-12 gap-4">
            <div class="alps-card col-span-12 p-5 md:col-span-8">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-700">
                        Upcoming Harvests (Next 30 Days)
                    </h3>
                    <button
                        type="button"
                        class="flex items-center gap-1 text-xs text-green-700 hover:underline"
                        @click="navigateTo('/harvests')"
                    >
                        View all
                        <UIcon name="i-lucide-arrow-right" class="size-2.5" />
                    </button>
                </div>
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-gray-100 text-gray-400">
                            <th class="pb-2 text-left font-medium">Farmer</th>
                            <th class="pb-2 text-left font-medium">Crop</th>
                            <th class="pb-2 text-left font-medium">Barangay</th>
                            <th class="pb-2 text-right font-medium">Area</th>
                            <th class="pb-2 pl-8 text-left font-medium">
                                Est. Date
                            </th>
                            <th class="pb-2 text-left font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(h, i) in upcomingHarvests"
                            :key="i"
                            class="border-b border-gray-50 transition-colors last:border-0 hover:bg-[#f0f7f0]/70"
                        >
                            <td class="py-2.5">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                        :style="{
                                            backgroundColor:
                                                avatarColor(h.farmer),
                                        }"
                                    >
                                        {{ initials(h.farmer) }}
                                    </span>
                                    <span
                                        class="font-medium text-gray-800"
                                    >
                                        {{ h.farmer }}
                                    </span>
                                </div>
                            </td>
                            <td class="py-2.5 text-gray-600">{{ h.crop }}</td>
                            <td class="py-2.5 text-gray-500">
                                {{ h.barangay }}
                            </td>
                            <td
                                class="py-2.5 text-right font-mono text-gray-600"
                            >
                                {{ h.area }} ha
                            </td>
                            <td class="py-2.5 pl-8">
                                <div class="text-gray-600">
                                    {{ h.expectedDate }}
                                </div>
                                <div
                                    class="text-[10px]"
                                    :class="
                                        daysUntil(h.expectedDate) <= 10
                                            ? 'font-medium text-amber-600'
                                            : 'text-gray-400'
                                    "
                                >
                                    in {{ daysUntil(h.expectedDate) }} days
                                </div>
                            </td>
                            <td class="py-2.5">
                                <span
                                    :class="
                                        h.status === 'At Risk'
                                            ? 'status-atrisk'
                                            : 'status-cultivated'
                                    "
                                    class="rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {{ h.status }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Crop Distribution -->
            <div class="alps-card col-span-12 p-5 md:col-span-4">
                <div
                    class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="flex h-7 w-7 items-center justify-center rounded-md bg-[#dcfce7] text-green-700"
                        >
                            <UIcon name="i-lucide-sprout" class="size-4" />
                        </span>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Crop Distribution
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Share of planted area
                            </p>
                        </div>
                    </div>
                </div>
                <ClientOnly>
                    <div class="relative">
                        <VChart
                            :option="cropDistributionOption"
                            :style="{ height: '160px', width: '100%' }"
                            autoresize
                        />
                        <div
                            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                        >
                            <div class="text-lg font-bold text-gray-900">
                                {{ cropDistributionData[0].value }}%
                            </div>
                            <div class="text-[10px] text-gray-400">
                                Rice leads
                            </div>
                        </div>
                    </div>
                    <template #fallback>
                        <div class="w-full" :style="{ height: '160px' }"></div>
                    </template>
                </ClientOnly>
                <div class="mt-2 space-y-1.5">
                    <div
                        v-for="d in cropDistributionData"
                        :key="d.name"
                        class="flex items-center gap-2 text-xs text-gray-600"
                    >
                        <div
                            class="h-2 w-2 flex-shrink-0 rounded-sm"
                            :style="{ backgroundColor: d.color }"
                        />
                        <span>{{ d.name }}</span>
                        <div
                            class="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-gray-100"
                        >
                            <div
                                class="h-full rounded-full"
                                :style="{
                                    width: `${d.value}%`,
                                    backgroundColor: d.color,
                                }"
                            />
                        </div>
                        <span class="w-8 text-right font-mono text-gray-400">
                            {{ d.value }}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
