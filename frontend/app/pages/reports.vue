<script setup lang="ts">
import type { ReportCategory, ReportDataset } from '~/utils/analytics'
import { csvFilename, downloadCsv, toCsv } from '~/utils/csv'
import { parseDateOnly } from '~/utils/monthWindow'

definePageMeta({ middleware: 'auth' })

const { logout } = useAuth()

/**
 * Every figure and every export below comes from `useReportAnalytics`, which
 * derives each one from the registries. Nothing on this page is a typed-in
 * constant, so a chart cannot disagree with the registry page it summarises, and
 * an export always contains the same rows the chart above it is drawn from.
 */
const {
    load,
    loading,
    loadError,
    parcelCount,
    totalArea,
    landStatusSlices,
    landStatusTotals,
    barangayRows,
    barangayCount,
    leadingBarangay,
    monthlyProduction,
    productionWindowMonths,
    datasets,
    categories,
    rowTotal,
} = useReportAnalytics()

async function signInAgain() {
    await logout()
    await navigateTo('/login')
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const fmtCount = (value: number): string => value.toLocaleString()

/** Hectares and kilograms: whole numbers, since nothing here is sub-unit. */
const fmtWhole = (value: number): string =>
    value.toLocaleString(undefined, { maximumFractionDigits: 0 })

/** A recorded date, or an em dash when the row carries none. */
const fmtDate = (value: string | null): string => {
    const date = parseDateOnly(value)
    return date
        ? date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—'
}

/** `#rrggbb` + alpha, for the production chart's area fill. */
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
        { offset: 0, color: withAlpha(hex, 0.22) },
        { offset: 1, color: withAlpha(hex, 0) },
    ],
})

/* ------------------------------------------------------------------ */
/* Presentation maps                                                   */
/* ------------------------------------------------------------------ */

/** Category chips on the export centre: icon, tint and the file badge. */
const CATEGORY_STYLE: Record<
    ReportCategory,
    { icon: string; bg: string; text: string; ring: string }
> = {
    'Land Use': {
        icon: 'i-lucide-mountain',
        bg: '#e8f5e8',
        text: '#2d6a2d',
        ring: '#bfe0bf',
    },
    Registry: {
        icon: 'i-lucide-users',
        bg: '#e0f0fb',
        text: '#1d6fa4',
        ring: '#bcd9ee',
    },
    Production: {
        icon: 'i-lucide-wheat',
        bg: '#fef3c7',
        text: '#b45309',
        ring: '#f5dfa8',
    },
    Risk: {
        icon: 'i-lucide-alert-triangle',
        bg: '#fee2e2',
        text: '#b91c1c',
        ring: '#f7c9c9',
    },
    Assistance: {
        icon: 'i-lucide-hand-heart',
        bg: '#ede9fe',
        text: '#6d28d9',
        ring: '#d9d0fb',
    },
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

const hasProduction = computed(() => monthlyProduction.value.series.length > 0)

const hasLandStatus = computed(() => landStatusSlices.value.length > 0)

const hasBarangay = computed(() => barangayRows.value.length > 0)

const productionOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => `${fmtWhole(Number(value))} kg`,
    },
    legend: {
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        top: 0,
        right: 8,
        textStyle: { fontSize: 11 },
    },
    grid: { left: 8, right: 16, top: 34, bottom: 24, containLabel: true },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: monthlyProduction.value.months,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: {
            fontSize: 11,
            color: '#9ca3af',
            formatter: (value: number) => fmtWhole(value),
        },
    },
    series: monthlyProduction.value.series.map((crop, index) => ({
        name: crop.name,
        type: 'line',
        smooth: true,
        showSymbol: crop.data.some((value) => value > 0),
        symbolSize: 4,
        lineStyle: { width: 2.5, color: crop.color },
        itemStyle: { color: crop.color },
        // Only the leading crop is filled: the series set is derived from the
        // data, and a variable number of overlapping fills reads as mud once
        // there is more than one or two.
        ...(index === 0
            ? { areaStyle: { color: areaGradient(crop.color) } }
            : {}),
        data: crop.data,
    })),
}))

const landStatusOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: (point: any) =>
            `${point.name}: ${fmtWhole(point.value)} ha (${point.percent}%)`,
    },
    series: [
        {
            type: 'pie',
            radius: '78%',
            center: ['50%', '50%'],
            padAngle: 2,
            label: { show: false },
            emphasis: { label: { show: false } },
            data: landStatusSlices.value.map((slice) => ({
                name: slice.name,
                value: slice.area,
                itemStyle: { color: slice.color },
            })),
        },
    ],
}))

const barangayOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: unknown) => `${fmtWhole(Number(value))} ha`,
    },
    grid: { left: 8, right: 16, top: 30, bottom: 46, containLabel: true },
    xAxis: {
        type: 'category',
        data: barangayRows.value.map((row) => row.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        // Barangay names run long, so they lean rather than collide.
        axisLabel: {
            fontSize: 10,
            color: '#6b7280',
            interval: 0,
            rotate: barangayRows.value.length > 5 ? 20 : 0,
        },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: {
            fontSize: 10,
            color: '#9ca3af',
            formatter: (value: number) => fmtWhole(value),
        },
    },
    series: [
        {
            name: 'Total area',
            type: 'bar',
            barWidth: 16,
            itemStyle: { color: '#dde5dd', borderRadius: [3, 3, 0, 0] },
            data: barangayRows.value.map((row) => row.area),
        },
        {
            name: 'Cultivated',
            type: 'bar',
            barWidth: 16,
            itemStyle: { color: '#2d6a2d', borderRadius: [3, 3, 0, 0] },
            data: barangayRows.value.map((row) => row.cultivated),
        },
    ],
}))

/* ------------------------------------------------------------------ */
/* Export centre                                                       */
/* ------------------------------------------------------------------ */

type CategoryFilter = ReportCategory | 'All'

const filterCategory = ref<CategoryFilter>('All')
const searchQuery = ref('')

const filteredDatasets = computed<ReportDataset[]>(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return datasets.value.filter((dataset) => {
        const matchesCategory =
            filterCategory.value === 'All' ||
            dataset.category === filterCategory.value
        const matchesSearch =
            !query ||
            dataset.title.toLowerCase().includes(query) ||
            dataset.description.toLowerCase().includes(query) ||
            dataset.category.toLowerCase().includes(query)

        return matchesCategory && matchesSearch
    })
})

const categoryCount = (category: ReportCategory): number =>
    datasets.value.filter((dataset) => dataset.category === category).length

/** Backs the empty-state escape hatch, so both filters widen at once. */
function clearFilters() {
    filterCategory.value = 'All'
    searchQuery.value = ''
}

/** Hands a dataset to the browser as a CSV, named for the day it was taken. */
function download(dataset: ReportDataset) {
    downloadCsv(csvFilename(dataset.title), toCsv(dataset))
}

/* ------------------------------------------------------------------ */
/* Generate report modal                                               */
/* ------------------------------------------------------------------ */

const showGenerate = ref(false)
const selectedKey = ref('')
const generatedName = ref<string | null>(null)
let generatedTimer: ReturnType<typeof setTimeout> | null = null

/** Opens on the first report that has rows, so the modal is never empty. */
function openGenerate() {
    selectedKey.value = datasets.value[0]?.key ?? ''
    generatedName.value = null
    showGenerate.value = true
}

const selectedDataset = computed(
    () =>
        datasets.value.find((dataset) => dataset.key === selectedKey.value) ??
        null
)

/** The first column of a dataset, which is what its file opens on. */
const datasetColumns = (dataset: ReportDataset): string =>
    dataset.columns.map((column) => column.label).join(' · ')

function generateSelected() {
    const dataset = selectedDataset.value
    if (!dataset) return

    const filename = csvFilename(dataset.title)
    download(dataset)
    generatedName.value = filename

    if (generatedTimer) clearTimeout(generatedTimer)
    generatedTimer = setTimeout(() => {
        generatedTimer = null
        generatedName.value = null
    }, 4000)
}

function closeGenerate() {
    if (generatedTimer) {
        clearTimeout(generatedTimer)
        generatedTimer = null
    }
    generatedName.value = null
    showGenerate.value = false
}

onMounted(() => {
    load()
})

onUnmounted(() => {
    if (generatedTimer) clearTimeout(generatedTimer)
})
</script>

<template>
    <div class="space-y-6 p-4 sm:p-6">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Reports &amp; Analytics
                </h1>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                    <p class="text-sm text-gray-500">
                        Production summaries · Land use analytics · Export
                        center
                    </p>
                    <span
                        class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm"
                    >
                        <UIcon
                            name="i-lucide-layers"
                            class="size-3 text-[#2d6a2d]"
                        />
                        {{ fmtCount(parcelCount) }} parcels ·
                        {{ fmtWhole(totalArea) }} ha
                    </span>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    :disabled="loading"
                    @click="load"
                >
                    <UIcon
                        name="i-lucide-refresh-cw"
                        class="size-3.5"
                        :class="loading ? 'animate-spin' : ''"
                    />
                    Refresh
                </button>
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                    :disabled="datasets.length === 0"
                    @click="openGenerate"
                >
                    <UIcon name="i-lucide-file-down" class="size-3.5" />
                    Generate Report
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
            Loading report figures...
        </div>

        <!-- Nothing to report on yet -->
        <div
            v-else-if="parcelCount === 0"
            class="alps-card flex flex-col items-center gap-2 p-10 text-center"
        >
            <UIcon name="i-lucide-map-pin-off" class="size-8 text-gray-300" />
            <div class="text-sm font-semibold text-gray-700">
                No parcels mapped yet
            </div>
            <p class="max-w-md text-xs text-gray-500">
                The charts and the exports below are all derived from the parcel
                registry. Once a parcel is drawn on the GIS map, the analytics
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
            <!-- Charts Row -->
            <div class="grid grid-cols-12 gap-4">
                <div class="alps-card col-span-12 p-5 md:col-span-8">
                    <div
                        class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="flex size-7 items-center justify-center rounded-md bg-[#fef3c7] text-amber-600"
                            >
                                <UIcon
                                    name="i-lucide-line-chart"
                                    class="size-4"
                                />
                            </span>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-700">
                                    Monthly Production by Crop
                                </h3>
                                <p class="text-[11px] text-gray-400">
                                    Kilograms recorded against a parcel's
                                    current cycle · trailing
                                    {{ productionWindowMonths }} months
                                </p>
                            </div>
                        </div>
                        <span
                            class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                        >
                            <template
                                v-if="monthlyProduction.averageYield !== null"
                            >
                                {{ fmtWhole(monthlyProduction.averageYield) }}
                                kg/ha avg
                            </template>
                            <template v-else>no yield recorded</template>
                        </span>
                    </div>

                    <ClientOnly>
                        <VChart
                            v-if="hasProduction"
                            :option="productionOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                        <div
                            v-else
                            class="flex items-center justify-center px-6 text-center text-xs text-gray-400"
                            :style="{ height: '220px' }"
                        >
                            No harvest with a production figure in the last
                            {{ productionWindowMonths }} months.
                        </div>
                        <template #fallback>
                            <div
                                class="w-full"
                                :style="{ height: '220px' }"
                            ></div>
                        </template>
                    </ClientOnly>

                    <div
                        class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[11px] font-medium"
                    >
                        <span class="flex flex-wrap items-center gap-3">
                            <span
                                v-for="crop in monthlyProduction.series"
                                :key="crop.name"
                                class="flex items-center gap-1.5 text-gray-600"
                            >
                                <span
                                    class="h-2 w-2 rounded-full"
                                    :style="{ background: crop.color }"
                                />
                                {{ crop.name }}
                            </span>
                        </span>
                        <span class="text-gray-400">
                            {{ fmtWhole(monthlyProduction.total) }} kg from
                            {{ monthlyProduction.records }} harvest{{
                                monthlyProduction.records === 1 ? '' : 's'
                            }}
                            <template v-if="monthlyProduction.leadingCrop">
                                · {{ monthlyProduction.leadingCrop }} leads
                            </template>
                        </span>
                    </div>
                </div>

                <div class="alps-card col-span-12 p-5 md:col-span-4">
                    <div
                        class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                        <div class="flex items-center gap-2">
                            <span
                                class="flex size-7 items-center justify-center rounded-md bg-[#e8f5e8] text-[#2d6a2d]"
                            >
                                <UIcon
                                    name="i-lucide-pie-chart"
                                    class="size-4"
                                />
                            </span>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-700">
                                    Land Status
                                </h3>
                                <p class="text-[11px] text-gray-400">
                                    {{
                                        fmtWhole(landStatusTotals.classified)
                                    }}
                                    ha classified
                                </p>
                            </div>
                        </div>
                        <span
                            class="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"
                        >
                            {{ landStatusTotals.cultivatedPct }}% cultivated
                        </span>
                    </div>

                    <ClientOnly>
                        <VChart
                            v-if="hasLandStatus"
                            :option="landStatusOption"
                            :style="{ height: '180px', width: '100%' }"
                            autoresize
                        />
                        <div
                            v-else
                            class="flex items-center justify-center text-xs text-gray-400"
                            :style="{ height: '180px' }"
                        >
                            No parcel carries a land status.
                        </div>
                        <template #fallback>
                            <div
                                class="w-full"
                                :style="{ height: '180px' }"
                            ></div>
                        </template>
                    </ClientOnly>

                    <div class="mt-2 space-y-1">
                        <div
                            v-for="slice in landStatusSlices"
                            :key="slice.name"
                            class="flex items-center justify-between text-xs text-gray-600"
                        >
                            <span class="flex items-center gap-1.5">
                                <span
                                    class="inline-block h-2 w-2 rounded-sm"
                                    :style="{ background: slice.color }"
                                />
                                {{ slice.name }}
                            </span>
                            <span class="font-mono">
                                {{ fmtWhole(slice.area) }} ha
                                <span class="text-gray-400"
                                    >· {{ slice.parcels }}</span
                                >
                            </span>
                        </div>
                    </div>

                    <div
                        class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500"
                    >
                        <span class="font-medium">
                            {{ fmtWhole(landStatusTotals.cultivated) }} ha under
                            cultivation
                        </span>
                        <span
                            >{{ landStatusTotals.cultivatedPct }}% of the
                            area</span
                        >
                    </div>
                </div>
            </div>

            <!-- Barangay comparison -->
            <div class="alps-card p-5">
                <div
                    class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"
                        >
                            <UIcon name="i-lucide-bar-chart-2" class="size-4" />
                        </span>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Barangay Comparative Analysis
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Total agricultural area vs. cultivated area
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span
                            class="flex items-center gap-3 text-[11px] text-gray-500"
                        >
                            <span class="flex items-center gap-1.5">
                                <span
                                    class="size-2.5 rounded-sm bg-[#dde5dd]"
                                ></span>
                                Total
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span
                                    class="size-2.5 rounded-sm bg-[#2d6a2d]"
                                ></span>
                                Cultivated
                            </span>
                        </span>
                        <span
                            class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                        >
                            {{ barangayCount }} barangays
                        </span>
                    </div>
                </div>

                <ClientOnly>
                    <VChart
                        v-if="hasBarangay"
                        :option="barangayOption"
                        :style="{ height: '240px', width: '100%' }"
                        autoresize
                    />
                    <div
                        v-else
                        class="flex items-center justify-center text-xs text-gray-400"
                        :style="{ height: '240px' }"
                    >
                        No parcel is linked to a farm or a barangay yet.
                    </div>
                    <template #fallback>
                        <div class="w-full" :style="{ height: '240px' }"></div>
                    </template>
                </ClientOnly>

                <div
                    v-if="leadingBarangay"
                    class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] font-medium"
                >
                    <span class="flex items-center gap-1.5 text-gray-600">
                        <span
                            class="h-2 w-2 rounded-full"
                            style="background: #2d6a2d"
                        />
                        {{ leadingBarangay.name }} leads cultivated area ({{
                            fmtWhole(leadingBarangay.cultivated)
                        }}
                        ha)
                    </span>
                    <span class="text-gray-400">
                        {{ fmtWhole(leadingBarangay.area) }} ha total area
                    </span>
                </div>
            </div>
        </template>

        <!-- Export centre -->
        <div class="alps-card overflow-hidden">
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"
            >
                <div class="flex items-center gap-2">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e8]"
                    >
                        <UIcon
                            name="i-lucide-folder-open"
                            class="size-4 text-[#2d6a2d]"
                        />
                    </div>
                    <div>
                        <h2 class="text-sm font-semibold text-gray-700">
                            Export Center
                        </h2>
                        <p class="text-[11px] text-gray-400">
                            {{ datasets.length }} reports ·
                            {{ fmtCount(rowTotal) }} rows · generated in the
                            browser as CSV
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <div class="relative">
                        <UIcon
                            name="i-lucide-search"
                            class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            v-model="searchQuery"
                            type="search"
                            placeholder="Search reports…"
                            class="w-52 rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
                        />
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                            :class="
                                filterCategory === 'All'
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            "
                            @click="filterCategory = 'All'"
                        >
                            All
                        </button>
                        <button
                            v-for="category in categories"
                            :key="category"
                            type="button"
                            class="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                            :class="
                                filterCategory === category
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            "
                            @click="filterCategory = category"
                        >
                            <UIcon
                                :name="CATEGORY_STYLE[category].icon"
                                class="size-3"
                            />
                            {{ category }}
                            <span class="opacity-60">{{
                                categoryCount(category)
                            }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="filteredDatasets.length" class="divide-y divide-gray-50">
                <div
                    v-for="(dataset, index) in filteredDatasets"
                    :key="dataset.key"
                    class="group flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors"
                    :class="index % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'"
                >
                    <div class="flex min-w-0 items-center gap-3">
                        <div
                            class="flex size-9 flex-shrink-0 items-center justify-center rounded-lg"
                            :style="{
                                background: CATEGORY_STYLE[dataset.category].bg,
                            }"
                        >
                            <UIcon
                                :name="CATEGORY_STYLE[dataset.category].icon"
                                class="size-4"
                                :style="{
                                    color: CATEGORY_STYLE[dataset.category]
                                        .text,
                                }"
                            />
                        </div>
                        <div class="min-w-0">
                            <div class="text-xs font-medium text-gray-800">
                                {{ dataset.title }}
                            </div>
                            <div class="truncate text-[11px] text-gray-400">
                                {{ dataset.description }}
                            </div>
                            <div
                                class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400"
                            >
                                <span>{{ dataset.category }}</span>
                                <span
                                    class="h-0.5 w-0.5 rounded-full bg-gray-300"
                                />
                                <span>
                                    {{ fmtCount(dataset.rows.length) }} rows
                                </span>
                                <template v-if="dataset.latest">
                                    <span
                                        class="h-0.5 w-0.5 rounded-full bg-gray-300"
                                    />
                                    <span
                                        >latest
                                        {{ fmtDate(dataset.latest) }}</span
                                    >
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-shrink-0 items-center gap-2">
                        <span
                            class="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-600"
                        >
                            CSV
                        </span>
                        <button
                            type="button"
                            class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-500 opacity-70 transition-opacity group-hover:opacity-100 hover:border-[#2d6a2d] hover:bg-[#2d6a2d] hover:text-white"
                            :disabled="dataset.rows.length === 0"
                            :title="
                                dataset.rows.length === 0
                                    ? 'Nothing recorded to export yet'
                                    : `Download ${csvFilename(dataset.title)}`
                            "
                            @click="download(dataset)"
                        >
                            <UIcon name="i-lucide-download" class="size-3.5" />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-else
                class="flex flex-col items-center justify-center px-5 py-12 text-center"
            >
                <div
                    class="mb-2 flex size-10 items-center justify-center rounded-lg bg-gray-50"
                >
                    <UIcon
                        name="i-lucide-file-question"
                        class="size-5 text-gray-400"
                    />
                </div>
                <div class="text-xs font-medium text-gray-500">
                    No reports match this filter
                </div>
                <button
                    type="button"
                    class="mt-2 text-[11px] font-medium text-[#2d6a2d] hover:underline"
                    @click="clearFilters"
                >
                    Clear the filters
                </button>
            </div>

            <div
                class="flex flex-wrap items-center gap-1.5 border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 text-[10px] text-gray-400"
            >
                <UIcon name="i-lucide-info" class="size-3" />
                Exports are built from the registries as they stand right now,
                so a file always matches the figures above it. Nothing is stored
                server-side.
            </div>
        </div>
    </div>

    <!-- Generate report modal -->
    <Teleport to="body">
        <div
            v-if="showGenerate"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeGenerate"
        >
            <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div class="mb-4 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f5e8] text-[#2d6a2d]"
                        >
                            <UIcon name="i-lucide-file-down" class="size-5" />
                        </span>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Generate Report
                            </h3>
                            <p class="text-xs text-gray-500">
                                Pick a report. It is written as a CSV from the
                                current registry figures.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        aria-label="Close"
                        @click="closeGenerate"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div class="max-h-[45vh] space-y-1.5 overflow-y-auto pr-1">
                    <button
                        v-for="dataset in datasets"
                        :key="dataset.key"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
                        :class="
                            dataset.key === selectedKey
                                ? 'border-[#2d6a2d] bg-[#f0f7f0]'
                                : 'border-gray-200 hover:bg-gray-50'
                        "
                        @click="selectedKey = dataset.key"
                    >
                        <span
                            class="flex size-8 flex-shrink-0 items-center justify-center rounded-lg"
                            :style="{
                                background: CATEGORY_STYLE[dataset.category].bg,
                            }"
                        >
                            <UIcon
                                :name="CATEGORY_STYLE[dataset.category].icon"
                                class="size-4"
                                :style="{
                                    color: CATEGORY_STYLE[dataset.category]
                                        .text,
                                }"
                            />
                        </span>
                        <span class="min-w-0 flex-1">
                            <span
                                class="block text-xs font-medium text-gray-800"
                            >
                                {{ dataset.title }}
                            </span>
                            <span class="block text-[11px] text-gray-400">
                                {{ dataset.category }} ·
                                {{ fmtCount(dataset.rows.length) }} rows
                            </span>
                        </span>
                        <UIcon
                            v-if="dataset.key === selectedKey"
                            name="i-lucide-check"
                            class="size-4 flex-shrink-0 text-[#2d6a2d]"
                        />
                    </button>
                </div>

                <div
                    v-if="selectedDataset"
                    class="mt-3 rounded-lg bg-gray-50 px-3 py-2"
                >
                    <div
                        class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase"
                    >
                        Columns
                    </div>
                    <div class="mt-1 text-[11px] text-gray-600">
                        {{ datasetColumns(selectedDataset) }}
                    </div>
                </div>

                <p
                    v-if="generatedName"
                    class="mt-3 flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-[11px] text-green-700"
                >
                    <UIcon name="i-lucide-check-circle" class="size-3.5" />
                    Downloaded {{ generatedName }}
                </p>

                <div class="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        @click="closeGenerate"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524] disabled:opacity-50"
                        :disabled="!selectedDataset"
                        @click="generateSelected"
                    >
                        <UIcon name="i-lucide-download" class="size-3.5" />
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
