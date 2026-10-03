<script setup lang="ts">
import type { StyleSpecification } from 'maplibre-gl'
import type { RiskPriority } from '~/utils/riskInsights'
import { initials, avatarColor } from '~/utils/initials'

definePageMeta({ middleware: 'auth' })

const { logout } = useAuth()

/**
 * Every figure below comes from `useDashboardStats`, which derives each one
 * from the parcel registry and its related records. Nothing on this page is a
 * typed-in constant, so a KPI cannot drift away from the registry page.
 */
const {
    load,
    loading,
    loadError,
    parcelCount,
    farmCount,
    classifiedArea,
    landStatusDistribution,
    cropDistribution,
    plantedArea,
    leadingCrop,
    barangayArea,
    monthlyHarvest,
    upcomingHarvests,
    insightCounts,
    riskSummary,
    atRiskTotals,
    kpis,
    upcomingWindowDays,
} = useDashboardStats()

async function signInAgain() {
    await logout()
    await navigateTo('/login')
}

/* ------------------------------------------------------------------ */
/* Presentation maps                                                    */
/* ------------------------------------------------------------------ */

const PRIORITY_BADGE: Record<
    RiskPriority,
    { label: string; icon: string; cls: string }
> = {
    High: {
        label: 'High',
        icon: 'i-lucide-alert-triangle',
        cls: 'bg-red-50 text-red-600',
    },
    Medium: {
        label: 'Medium',
        icon: 'i-lucide-alert-circle',
        cls: 'bg-amber-50 text-amber-700',
    },
    Low: {
        label: 'Low',
        icon: 'i-lucide-info',
        cls: 'bg-sky-50 text-sky-700',
    },
}

const fmtNumber = (value: number): string => value.toLocaleString()

/** `#rrggbb` + alpha, for the harvest chart's area fill. */
const withAlpha = (hex: string, alpha: number): string => {
    const full = hex.replace('#', '')
    const int = Number.parseInt(full, 16)
    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

const areaGradient = (hex: string) => ({
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
        { offset: 0, color: withAlpha(hex, 0.2) },
        { offset: 1, color: withAlpha(hex, 0) },
    ],
})

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

const landStatusOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ${p.value} ha (${p.percent}%)`,
    },
    series: [
        {
            type: 'pie',
            radius: ['55%', '85%'],
            center: ['50%', '50%'],
            padAngle: 2,
            label: { show: false },
            emphasis: { label: { show: false } },
            data: landStatusDistribution.value.map((slice) => ({
                name: slice.name,
                value: slice.area,
                itemStyle: { color: slice.color },
            })),
        },
    ],
}))

const hasHarvestData = computed(() => monthlyHarvest.value.series.length > 0)

const harvestOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${v} ha` },
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
        data: monthlyHarvest.value.months,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 11, color: '#9ca3af' },
    },
    series: monthlyHarvest.value.series.map((crop, index) => ({
        name: crop.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: crop.color },
        itemStyle: { color: crop.color },
        // Only the leading series is filled. The crop set is derived from the
        // data, and a variable number of overlapping fills reads as mud once
        // there is more than one or two series.
        ...(index === 0 ? { areaStyle: { color: areaGradient(crop.color) } } : {}),
        data: crop.data,
    })),
}))

/**
 * Ascending order, so the largest barangay sits at the top of the horizontal
 * bars — ECharts lays a category axis out from the bottom.
 */
const barangayBars = computed(() => [...barangayArea.value].reverse())

const barangayTotal = computed(() =>
    barangayArea.value.reduce((sum, row) => sum + row.area, 0)
)

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
        data: barangayBars.value.map((row) => row.name),
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
            data: barangayBars.value.map((row) => row.area),
        },
        {
            name: 'Cultivated',
            type: 'bar',
            barWidth: 18,
            barGap: '-100%',
            itemStyle: { color: '#2d6a2d', borderRadius: [0, 3, 3, 0] },
            data: barangayBars.value.map((row) => row.cultivated),
        },
    ],
}))

const hasCropData = computed(() => cropDistribution.value.length > 0)

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
            data: cropDistribution.value.map((slice) => ({
                name: slice.name,
                value: slice.share,
                itemStyle: { color: slice.color },
            })),
        },
    ],
}))

/* ------------------------------------------------------------------ */
/* Header clock                                                        */
/* ------------------------------------------------------------------ */

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
    load()
    tick()
    clockTimer = setInterval(tick, 1000)
})

onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer)
})

/* ------------------------------------------------------------------ */
/* Mini map                                                            */
/* ------------------------------------------------------------------ */

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
    <div class="space-y-6 p-4 sm:p-6">
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
                            name="i-lucide-layers"
                            class="size-3 text-[#2d6a2d]"
                        />
                        {{ fmtNumber(parcelCount) }} parcels ·
                        {{ fmtNumber(farmCount) }} farms
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
                    @click="navigateTo('/reports')"
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

        <LoadErrorBanner
            v-if="loadError"
            :message="loadError.message"
            :action="loadError.action"
            @retry="load"
            @sign-in="signInAgain"
        />

        <div
            v-if="loading"
            class="alps-card flex items-center justify-center gap-3 p-10 text-sm text-gray-500"
        >
            <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
            Loading dashboard figures...
        </div>

        <div
            v-else-if="parcelCount === 0"
            class="alps-card flex flex-col items-center gap-2 p-10 text-center"
        >
            <UIcon name="i-lucide-map-pin-off" class="size-8 text-gray-300" />
            <div class="text-sm font-semibold text-gray-700">
                No parcels mapped yet
            </div>
            <p class="max-w-md text-xs text-gray-500">
                Every figure on this page is derived from the parcel registry.
                Once a parcel is drawn on the GIS map, the KPIs and charts below
                fill in from it.
            </p>
            <NuxtLink
                to="/map"
                class="mt-2 flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-map-pin" class="size-3.5" />
                Open GIS Map
            </NuxtLink>
        </div>

        <template v-else>
            <!-- KPI Grid -->
            <div
                class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
            >
                <NuxtLink
                    v-for="kpi in kpis"
                    :key="kpi.key"
                    :to="kpi.to"
                    class="alps-card group relative block overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    :class="
                        kpi.key === 'at-risk' && atRiskTotals.parcels > 0
                            ? 'ring-1 ring-red-200'
                            : ''
                    "
                >
                    <div
                        class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${kpi.accent}, transparent)`,
                        }"
                    />
                    <div class="mb-3 flex items-start justify-between gap-2">
                        <div
                            class="flex size-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                            :class="kpi.iconClass"
                        >
                            <UIcon :name="kpi.icon" class="size-5" />
                        </div>
                        <span
                            v-if="kpi.badge"
                            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            :class="kpi.badge.class"
                        >
                            {{ kpi.badge.label }}
                        </span>
                    </div>
                    <div class="mb-1 font-sans text-2xl font-bold text-gray-900">
                        {{ kpi.value }}
                    </div>
                    <div class="text-xs text-gray-500">{{ kpi.label }}</div>
                    <div class="mt-1 text-[11px] text-gray-400">
                        {{ kpi.sub }}
                    </div>
                    <div
                        v-if="kpi.key === 'at-risk' && atRiskTotals.parcels > 0"
                        class="absolute inset-y-0 right-0 w-1 rounded-r bg-red-400"
                    />
                </NuxtLink>
            </div>

            <!-- ALPS Insights Banner -->
            <div
                class="alps-card relative overflow-hidden border-l-4 border-[#2d6a2d] bg-gradient-to-r from-[#e6f2e6] via-[#f0f7f0] to-white p-4"
            >
                <div
                    class="pointer-events-none absolute inset-y-0 right-0 w-44 opacity-40"
                    style="
                        background-image: radial-gradient(
                            #2d6a2d55 1.2px,
                            transparent 1.2px
                        );
                        background-size: 12px 12px;
                    "
                />
                <div
                    class="relative flex flex-wrap items-center justify-between gap-3"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-8 items-center justify-center rounded-lg bg-[#2d6a2d]"
                        >
                            <UIcon name="i-lucide-activity" class="size-4 text-white" />
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-[#2d6a2d]">
                                ALPS Insights — {{ insightCounts.total }} active
                                recommendations
                            </div>
                            <div class="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                    class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100"
                                >
                                    {{ insightCounts.high }} high
                                </span>
                                <span
                                    class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100"
                                >
                                    {{ insightCounts.medium }} medium
                                </span>
                                <span
                                    class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200"
                                >
                                    {{ insightCounts.low }} low
                                </span>
                                <span class="text-[11px] text-gray-400">
                                    · Rolled up from open risk reports
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
                                class="flex size-7 items-center justify-center rounded-md bg-[#e8f5e8] text-[#2d6a2d]"
                            >
                                <UIcon name="i-lucide-pie-chart" class="size-4" />
                            </span>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-700">
                                    Land Status Distribution
                                </h3>
                                <p class="text-[11px] text-gray-400">
                                    {{ fmtNumber(classifiedArea) }} ha classified
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
                                <div
                                    class="text-xl font-bold text-gray-900"
                                >
                                    {{ fmtNumber(classifiedArea) }}
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
                            v-for="slice in landStatusDistribution"
                            :key="slice.name"
                            class="flex items-center gap-1.5 text-xs text-gray-600"
                        >
                            <div
                                class="size-2.5 flex-shrink-0 rounded-sm"
                                :style="{ backgroundColor: slice.color }"
                            />
                            <span class="truncate">{{ slice.name }}</span>
                            <span class="ml-auto font-mono text-gray-500">
                                {{ fmtNumber(slice.area) }}
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
                                class="flex size-7 items-center justify-center rounded-md bg-[#fef3c7] text-amber-600"
                            >
                                <UIcon name="i-lucide-line-chart" class="size-4" />
                            </span>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-700">
                                    Monthly Harvested Area (ha)
                                </h3>
                                <p class="text-[11px] text-gray-400">
                                    Trailing
                                    {{ monthlyHarvest.windowMonths }} months ·
                                    {{ fmtNumber(monthlyHarvest.total) }} ha total
                                </p>
                            </div>
                        </div>
                    </div>
                    <ClientOnly>
                        <VChart
                            v-if="hasHarvestData"
                            :option="harvestOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                        <div
                            v-else
                            class="flex items-center justify-center text-xs text-gray-400"
                            :style="{ height: '220px' }"
                        >
                            No harvest records in the last
                            {{ monthlyHarvest.windowMonths }} months.
                        </div>
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
                                class="flex size-8 items-center justify-center rounded-md bg-[#e8f5e8] text-[#2d6a2d]"
                            >
                                <UIcon name="i-lucide-map" class="size-4.5" />
                            </span>
                            <div>
                                <h3 class="text-base font-semibold text-gray-800">
                                    Barangay Agricultural Area (ha)
                                </h3>
                                <p class="text-xs text-gray-400">
                                    {{ barangayArea.length }} barangays ·
                                    {{ fmtNumber(barangayTotal) }} ha
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                            <span class="flex items-center gap-1.5">
                                <span class="size-2.5 rounded-sm bg-[#dde5dd]"></span>
                                Total
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="size-2.5 rounded-sm bg-[#2d6a2d]"></span>
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
                                <UIcon name="i-lucide-arrow-right" class="size-2.5" />
                            </button>
                        </div>
                        <div v-if="riskSummary.length > 0" class="space-y-1">
                            <div
                                v-for="row in riskSummary"
                                :key="row.type"
                                class="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-gray-50"
                            >
                                <div class="min-w-0">
                                    <div
                                        class="truncate font-medium text-gray-800"
                                    >
                                        {{ row.type }}
                                    </div>
                                    <div class="text-gray-400">
                                        {{ row.parcels }} parcels ·
                                        {{ fmtNumber(row.area) }} ha
                                    </div>
                                </div>
                                <span
                                    class="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    :class="PRIORITY_BADGE[row.priority].cls"
                                >
                                    <UIcon
                                        :name="PRIORITY_BADGE[row.priority].icon"
                                        class="size-3"
                                    />
                                    {{ PRIORITY_BADGE[row.priority].label }}
                                </span>
                            </div>
                        </div>
                        <p v-else class="py-4 text-center text-xs text-gray-400">
                            No open risk reports.
                        </p>
                        <div
                            class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px]"
                        >
                            <span class="text-gray-400">Total affected</span>
                            <span class="font-semibold text-gray-700">
                                {{ atRiskTotals.parcels }} parcels ·
                                {{ fmtNumber(atRiskTotals.area) }} ha
                            </span>
                        </div>
                    </div>

                    <!-- Mini Map -->
                    <div class="alps-card group overflow-hidden">
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

                            <div
                                class="pointer-events-none absolute bottom-2 left-3"
                            >
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
                                {{ fmtNumber(parcelCount) }} parcels mapped
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
                            Upcoming Harvests (Next {{ upcomingWindowDays }} Days)
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
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[560px] text-xs">
                            <thead>
                                <tr class="border-b border-gray-100 text-gray-400">
                                    <th class="pb-2 text-left font-medium">
                                        Farmer
                                    </th>
                                    <th class="pb-2 text-left font-medium">Crop</th>
                                    <th class="pb-2 text-left font-medium">
                                        Barangay
                                    </th>
                                    <th class="pb-2 text-right font-medium">
                                        Area
                                    </th>
                                    <th class="pb-2 pl-8 text-left font-medium">
                                        Est. Date
                                    </th>
                                    <th class="pb-2 text-left font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody v-if="upcomingHarvests.length > 0">
                                <tr
                                    v-for="row in upcomingHarvests"
                                    :key="row.parcelDocumentId"
                                    class="border-b border-gray-50 transition-colors last:border-0 hover:bg-[#f0f7f0]/70"
                                >
                                    <td class="py-2.5">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                                :style="{
                                                    backgroundColor:
                                                        avatarColor(row.farmer),
                                                }"
                                            >
                                                {{ initials(row.farmer) }}
                                            </span>
                                            <span
                                                class="font-medium text-gray-800"
                                            >
                                                {{ row.farmer }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="py-2.5 text-gray-600">
                                        {{ row.crop }}
                                    </td>
                                    <td class="py-2.5 text-gray-500">
                                        {{ row.barangay }}
                                    </td>
                                    <td
                                        class="py-2.5 text-right font-mono text-gray-600"
                                    >
                                        {{ row.area }} ha
                                    </td>
                                    <td class="py-2.5 pl-8">
                                        <div class="text-gray-600">
                                            {{ row.expectedDate }}
                                        </div>
                                        <div
                                            class="text-[10px]"
                                            :class="
                                                row.daysUntil <= 10
                                                    ? 'font-medium text-amber-600'
                                                    : 'text-gray-400'
                                            "
                                        >
                                            in {{ row.daysUntil }} day{{
                                                row.daysUntil === 1 ? '' : 's'
                                            }}
                                        </div>
                                    </td>
                                    <td class="py-2.5">
                                        <span
                                            class="rounded px-2 py-0.5 text-[10px] font-medium"
                                            :class="
                                                row.atRisk
                                                    ? 'status-atrisk'
                                                    : 'status-cultivated'
                                            "
                                        >
                                            {{ row.atRisk ? 'At Risk' : 'On Track' }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                            <tbody v-else>
                                <tr>
                                    <td
                                        colspan="6"
                                        class="py-8 text-center text-xs text-gray-400"
                                    >
                                        No harvest expected in the next
                                        {{ upcomingWindowDays }} days.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Crop Distribution -->
                <div class="alps-card col-span-12 p-5 md:col-span-4">
                    <div
                        class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="flex size-7 items-center justify-center rounded-md bg-[#dcfce7] text-green-700"
                            >
                                <UIcon name="i-lucide-sprout" class="size-4" />
                            </span>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-700">
                                    Crop Distribution
                                </h3>
                                <p class="text-[11px] text-gray-400">
                                    {{ fmtNumber(plantedArea) }} ha planted
                                </p>
                            </div>
                        </div>
                    </div>
                    <ClientOnly>
                        <div v-if="hasCropData" class="relative">
                            <VChart
                                :option="cropDistributionOption"
                                :style="{ height: '160px', width: '100%' }"
                                autoresize
                            />
                            <div
                                class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <div class="text-lg font-bold text-gray-900">
                                    {{ cropDistribution[0]?.share ?? 0 }}%
                                </div>
                                <div class="max-w-[80px] truncate text-[10px] text-gray-400">
                                    {{ leadingCrop }} leads
                                </div>
                            </div>
                        </div>
                        <div
                            v-else
                            class="flex items-center justify-center px-4 text-center text-xs text-gray-400"
                            :style="{ height: '160px' }"
                        >
                            No planting cycle recorded on any parcel.
                        </div>
                        <template #fallback>
                            <div class="w-full" :style="{ height: '160px' }"></div>
                        </template>
                    </ClientOnly>
                    <div v-if="hasCropData" class="mt-2 space-y-1.5">
                        <div
                            v-for="slice in cropDistribution"
                            :key="slice.name"
                            class="flex items-center gap-2 text-xs text-gray-600"
                        >
                            <div
                                class="size-2 flex-shrink-0 rounded-sm"
                                :style="{ backgroundColor: slice.color }"
                            />
                            <span class="max-w-[76px] truncate">{{
                                slice.name
                            }}</span>
                            <div
                                class="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-gray-100"
                            >
                                <div
                                    class="h-full rounded-full"
                                    :style="{
                                        width: `${slice.share}%`,
                                        backgroundColor: slice.color,
                                    }"
                                />
                            </div>
                            <span class="w-9 text-right font-mono text-gray-400">
                                {{ slice.share }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
