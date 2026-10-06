<script setup lang="ts">
//@ts-nocheck
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
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div
                    class="relative flex flex-wrap items-center justify-between gap-5"
                >
                    <div class="flex min-w-0 items-start gap-4">
                        <div
                            class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                        >
                            <UIcon
                                name="i-lucide-chart-no-axes-combined"
                                class="size-6"
                            />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-emerald-500"
                                    />
                                    Analytics & Reporting Center
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ fmtCount(parcelCount) }} parcels ·
                                    {{ fmtWhole(totalArea) }} ha
                                </span>
                            </div>

                            <h1
                                class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                Reports &amp; Analytics
                            </h1>

                            <p
                                class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                            >
                                Review production summaries, land-use analytics,
                                barangay comparisons, and export-ready registry
                                reports.
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="loading"
                            @click="load"
                        >
                            <UIcon
                                name="i-lucide-refresh-cw"
                                class="size-4"
                                :class="loading ? 'animate-spin' : ''"
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="datasets.length === 0"
                            @click="openGenerate"
                        >
                            <UIcon name="i-lucide-file-down" class="size-4" />
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            <LoadErrorBanner
                v-if="loadError"
                :message="loadError.message"
                :action="loadError.action"
                @retry="load"
                @sign-in="signInAgain"
            />

            <!-- Loading -->
            <div
                v-if="loading"
                class="flex items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-12 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="size-5 animate-spin text-[#2d6a2d]"
                />
                Loading report figures...
            </div>

            <!-- No parcel data -->
            <div
                v-else-if="parcelCount === 0"
                class="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
                <div
                    class="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                >
                    <UIcon name="i-lucide-map-pin-off" class="size-7" />
                </div>

                <div class="text-lg font-bold text-slate-800">
                    No parcels mapped yet
                </div>

                <p class="max-w-md text-sm leading-6 text-slate-500">
                    The charts and exports on this page are derived from the
                    parcel registry. Once a parcel is drawn on the GIS map, the
                    analytics will populate automatically.
                </p>

                <NuxtLink
                    to="/map"
                    class="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5125]"
                >
                    <UIcon name="i-lucide-map-pin" class="size-4" />
                    Open GIS Map
                </NuxtLink>
            </div>

            <template v-else>
                <!-- Analytics Overview -->
                <div
                    class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div
                        class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                    >
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-300 to-transparent"
                        />
                        <div
                            class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-emerald-300/10 blur-2xl"
                        />

                        <div class="relative flex h-full flex-col">
                            <div class="flex items-start justify-between">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                >
                                    <UIcon
                                        name="i-lucide-layers"
                                        class="size-5"
                                    />
                                </div>
                                <span
                                    class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                                >
                                    Live
                                </span>
                            </div>

                            <div class="mt-5">
                                <div
                                    class="text-3xl font-bold tracking-tight text-slate-950"
                                >
                                    {{ fmtCount(parcelCount) }}
                                </div>
                                <div
                                    class="mt-1 text-sm font-semibold text-slate-700"
                                >
                                    Registered Parcels
                                </div>
                            </div>

                            <div
                                class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                            >
                                Current parcel registry coverage
                            </div>
                        </div>
                    </div>

                    <div
                        class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                    >
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-300 to-transparent"
                        />
                        <div
                            class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-blue-300/10 blur-2xl"
                        />

                        <div class="relative flex h-full flex-col">
                            <div class="flex items-start justify-between">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                                >
                                    <UIcon
                                        name="i-lucide-ruler"
                                        class="size-5"
                                    />
                                </div>
                                <span
                                    class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                                >
                                    Live
                                </span>
                            </div>

                            <div class="mt-5">
                                <div
                                    class="text-3xl font-bold tracking-tight text-slate-950"
                                >
                                    {{ fmtWhole(totalArea) }}
                                    <span
                                        class="text-lg font-semibold text-slate-400"
                                        >ha</span
                                    >
                                </div>
                                <div
                                    class="mt-1 text-sm font-semibold text-slate-700"
                                >
                                    Total Agricultural Area
                                </div>
                            </div>

                            <div
                                class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                            >
                                Combined registered parcel area
                            </div>
                        </div>
                    </div>

                    <div
                        class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                    >
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-transparent"
                        />
                        <div
                            class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-amber-300/10 blur-2xl"
                        />

                        <div class="relative flex h-full flex-col">
                            <div class="flex items-start justify-between">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                                >
                                    <UIcon
                                        name="i-lucide-wheat"
                                        class="size-5"
                                    />
                                </div>
                                <span
                                    class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                                >
                                    Live
                                </span>
                            </div>

                            <div class="mt-5">
                                <div
                                    class="text-3xl font-bold tracking-tight text-slate-950"
                                >
                                    {{ fmtWhole(monthlyProduction.total) }}
                                    <span
                                        class="text-lg font-semibold text-slate-400"
                                        >kg</span
                                    >
                                </div>
                                <div
                                    class="mt-1 text-sm font-semibold text-slate-700"
                                >
                                    Production Window
                                </div>
                            </div>

                            <div
                                class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                            >
                                Last {{ productionWindowMonths }} months
                            </div>
                        </div>
                    </div>

                    <div
                        class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                    >
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-violet-300 to-transparent"
                        />
                        <div
                            class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-violet-300/10 blur-2xl"
                        />

                        <div class="relative flex h-full flex-col">
                            <div class="flex items-start justify-between">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                                >
                                    <UIcon
                                        name="i-lucide-map-pinned"
                                        class="size-5"
                                    />
                                </div>
                                <span
                                    class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                                >
                                    Live
                                </span>
                            </div>

                            <div class="mt-5">
                                <div
                                    class="text-3xl font-bold tracking-tight text-slate-950"
                                >
                                    {{ barangayCount }}
                                </div>
                                <div
                                    class="mt-1 text-sm font-semibold text-slate-700"
                                >
                                    Barangays Covered
                                </div>
                            </div>

                            <div
                                class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                            >
                                Areas represented in analytics
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-12 gap-4">
                    <!-- Monthly Production -->
                    <div
                        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] md:col-span-8"
                    >
                        <div
                            class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                        >
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                                >
                                    <UIcon
                                        name="i-lucide-chart-no-axes-combined"
                                        class="size-4.5"
                                    />
                                </span>

                                <div>
                                    <h3
                                        class="text-base font-bold tracking-tight text-slate-800"
                                    >
                                        Monthly Production by Crop
                                    </h3>
                                    <p class="text-xs text-slate-500">
                                        Kilograms recorded against current
                                        planting cycles · trailing
                                        {{ productionWindowMonths }} months
                                    </p>
                                </div>
                            </div>

                            <span
                                class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                            >
                                <template
                                    v-if="
                                        monthlyProduction.averageYield !== null
                                    "
                                >
                                    {{
                                        fmtWhole(monthlyProduction.averageYield)
                                    }}
                                    kg/ha avg
                                </template>
                                <template v-else>no yield recorded</template>
                            </span>
                        </div>

                        <div class="p-5 sm:p-6">
                            <ClientOnly>
                                <VChart
                                    v-if="hasProduction"
                                    :option="productionOption"
                                    :style="{ height: '280px', width: '100%' }"
                                    autoresize
                                />

                                <div
                                    v-else
                                    class="flex items-center justify-center px-6 text-center text-sm text-slate-400"
                                    :style="{ height: '280px' }"
                                >
                                    No harvest with a production figure in the
                                    last
                                    {{ productionWindowMonths }} months.
                                </div>

                                <template #fallback>
                                    <div
                                        class="w-full"
                                        :style="{ height: '280px' }"
                                    ></div>
                                </template>
                            </ClientOnly>

                            <div
                                class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-medium"
                            >
                                <span class="flex flex-wrap items-center gap-3">
                                    <span
                                        v-for="crop in monthlyProduction.series"
                                        :key="crop.name"
                                        class="flex items-center gap-1.5 text-slate-600"
                                    >
                                        <span
                                            class="h-2.5 w-2.5 rounded-full"
                                            :style="{ background: crop.color }"
                                        />
                                        {{ crop.name }}
                                    </span>
                                </span>

                                <span class="text-slate-400">
                                    {{ fmtWhole(monthlyProduction.total) }} kg
                                    from
                                    {{ monthlyProduction.records }} harvest{{
                                        monthlyProduction.records === 1
                                            ? ''
                                            : 's'
                                    }}
                                    <template
                                        v-if="monthlyProduction.leadingCrop"
                                    >
                                        ·
                                        {{
                                            monthlyProduction.leadingCrop
                                        }}
                                        leads
                                    </template>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Land Status -->
                    <div
                        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] md:col-span-4"
                    >
                        <div
                            class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                        >
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                                >
                                    <UIcon
                                        name="i-lucide-chart-pie"
                                        class="size-4.5"
                                    />
                                </span>

                                <div>
                                    <h3
                                        class="text-base font-bold tracking-tight text-slate-800"
                                    >
                                        Land Status
                                    </h3>
                                    <p class="text-xs text-slate-500">
                                        {{
                                            fmtWhole(
                                                landStatusTotals.classified
                                            )
                                        }}
                                        ha classified
                                    </p>
                                </div>
                            </div>

                            <span
                                class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                            >
                                {{ landStatusTotals.cultivatedPct }}% cultivated
                            </span>
                        </div>

                        <div class="p-5 sm:p-6">
                            <ClientOnly>
                                <VChart
                                    v-if="hasLandStatus"
                                    :option="landStatusOption"
                                    :style="{ height: '210px', width: '100%' }"
                                    autoresize
                                />
                                <div
                                    v-else
                                    class="flex items-center justify-center text-sm text-slate-400"
                                    :style="{ height: '210px' }"
                                >
                                    No parcel carries a land status.
                                </div>
                                <template #fallback>
                                    <div
                                        class="w-full"
                                        :style="{ height: '210px' }"
                                    ></div>
                                </template>
                            </ClientOnly>

                            <div class="mt-3 space-y-2">
                                <div
                                    v-for="slice in landStatusSlices"
                                    :key="slice.name"
                                    class="flex items-center justify-between text-sm text-slate-600"
                                >
                                    <span class="flex items-center gap-2">
                                        <span
                                            class="inline-block h-2.5 w-2.5 rounded-full"
                                            :style="{ background: slice.color }"
                                        />
                                        {{ slice.name }}
                                    </span>

                                    <span
                                        class="font-mono text-sm font-semibold text-slate-700"
                                    >
                                        {{ fmtWhole(slice.area) }} ha
                                        <span
                                            class="font-sans font-normal text-slate-400"
                                        >
                                            · {{ slice.parcels }}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div
                                class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"
                            >
                                <span class="font-semibold">
                                    {{
                                        fmtWhole(landStatusTotals.cultivated)
                                    }}
                                    ha cultivated
                                </span>
                                <span>
                                    {{ landStatusTotals.cultivatedPct }}% of
                                    area
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Barangay Comparative Analysis -->
                <div
                    class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                    >
                        <div class="flex items-center gap-3">
                            <span
                                class="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                            >
                                <UIcon
                                    name="i-lucide-chart-no-axes-column-increasing"
                                    class="size-4.5"
                                />
                            </span>

                            <div>
                                <h3
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Barangay Comparative Analysis
                                </h3>
                                <p class="text-xs text-slate-500">
                                    Total agricultural area versus cultivated
                                    area
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <span
                                class="flex items-center gap-3 text-xs font-medium text-slate-500"
                            >
                                <span class="flex items-center gap-1.5">
                                    <span
                                        class="size-2.5 rounded-sm bg-[#dde5dd]"
                                    />
                                    Total
                                </span>
                                <span class="flex items-center gap-1.5">
                                    <span
                                        class="size-2.5 rounded-sm bg-[#2d6a2d]"
                                    />
                                    Cultivated
                                </span>
                            </span>

                            <span
                                class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                            >
                                {{ barangayCount }} barangays
                            </span>
                        </div>
                    </div>

                    <div class="p-5 sm:p-6">
                        <ClientOnly>
                            <VChart
                                v-if="hasBarangay"
                                :option="barangayOption"
                                :style="{ height: '300px', width: '100%' }"
                                autoresize
                            />

                            <div
                                v-else
                                class="flex items-center justify-center text-sm text-slate-400"
                                :style="{ height: '300px' }"
                            >
                                No parcel is linked to a farm or barangay yet.
                            </div>

                            <template #fallback>
                                <div
                                    class="w-full"
                                    :style="{ height: '300px' }"
                                ></div>
                            </template>
                        </ClientOnly>

                        <div
                            v-if="leadingBarangay"
                            class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm font-medium"
                        >
                            <span
                                class="flex items-center gap-2 text-slate-600"
                            >
                                <span
                                    class="h-2.5 w-2.5 rounded-full bg-[#2d6a2d]"
                                />
                                {{ leadingBarangay.name }} leads cultivated area
                                ({{ fmtWhole(leadingBarangay.cultivated) }} ha)
                            </span>

                            <span class="text-slate-400">
                                {{ fmtWhole(leadingBarangay.area) }} ha total
                                area
                            </span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Export Center -->
            <div
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                        >
                            <UIcon
                                name="i-lucide-folder-open"
                                class="size-4.5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-base font-bold tracking-tight text-slate-800"
                            >
                                Export Center
                            </h2>
                            <p class="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                {{ datasets.length }} reports ·
                                {{ fmtCount(rowTotal) }} rows · generated in
                                your browser as CSV
                            </p>
                        </div>
                    </div>

                    <div
                        class="flex w-full flex-wrap items-center gap-2 xl:w-auto"
                    >
                        <div class="relative w-full sm:w-72">
                            <UIcon
                                name="i-lucide-search"
                                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                v-model="searchQuery"
                                type="search"
                                placeholder="Search reports…"
                                class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>
                </div>

                <div
                    class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
                >
                    <button
                        type="button"
                        class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        :class="
                            filterCategory === 'All'
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                        "
                        @click="filterCategory = 'All'"
                    >
                        All
                    </button>

                    <button
                        v-for="category in categories"
                        :key="category"
                        type="button"
                        class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        :class="
                            filterCategory === category
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                        "
                        @click="filterCategory = category"
                    >
                        <UIcon
                            :name="CATEGORY_STYLE[category].icon"
                            class="size-3.5"
                        />
                        {{ category }}
                        <span class="opacity-60">
                            {{ categoryCount(category) }}
                        </span>
                    </button>

                    <span class="ml-auto text-sm font-medium text-slate-500">
                        {{ filteredDatasets.length }} shown
                    </span>
                </div>

                <div
                    v-if="filteredDatasets.length"
                    class="divide-y divide-slate-100"
                >
                    <div
                        v-for="dataset in filteredDatasets"
                        :key="dataset.key"
                        class="group flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/30 sm:px-6"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            <div
                                class="flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                                :style="{
                                    background:
                                        CATEGORY_STYLE[dataset.category].bg,
                                }"
                            >
                                <UIcon
                                    :name="
                                        CATEGORY_STYLE[dataset.category].icon
                                    "
                                    class="size-4.5"
                                    :style="{
                                        color: CATEGORY_STYLE[dataset.category]
                                            .text,
                                    }"
                                />
                            </div>

                            <div class="min-w-0">
                                <div
                                    class="text-sm font-semibold text-slate-800"
                                >
                                    {{ dataset.title }}
                                </div>

                                <div
                                    class="mt-0.5 truncate text-xs text-slate-500"
                                >
                                    {{ dataset.description }}
                                </div>

                                <div
                                    class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400"
                                >
                                    <span>{{ dataset.category }}</span>
                                    <span
                                        class="h-1 w-1 rounded-full bg-slate-300"
                                    />
                                    <span>
                                        {{ fmtCount(dataset.rows.length) }} rows
                                    </span>

                                    <template v-if="dataset.latest">
                                        <span
                                            class="h-1 w-1 rounded-full bg-slate-300"
                                        />
                                        <span>
                                            latest {{ fmtDate(dataset.latest) }}
                                        </span>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                            <span
                                class="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600"
                            >
                                CSV
                            </span>

                            <button
                                type="button"
                                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-[#2d6a2d] hover:bg-[#2d6a2d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="dataset.rows.length === 0"
                                :title="
                                    dataset.rows.length === 0
                                        ? 'Nothing recorded to export yet'
                                        : `Download ${csvFilename(dataset.title)}`
                                "
                                @click="download(dataset)"
                            >
                                <UIcon
                                    name="i-lucide-download"
                                    class="size-4"
                                />
                                Download
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center px-5 py-14 text-center"
                >
                    <div
                        class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                    >
                        <UIcon name="i-lucide-file-question" class="size-6" />
                    </div>

                    <div class="text-base font-semibold text-slate-700">
                        No reports match this filter
                    </div>

                    <button
                        type="button"
                        class="mt-2 text-sm font-semibold text-[#2d6a2d] hover:underline"
                        @click="clearFilters"
                    >
                        Clear the filters
                    </button>
                </div>

                <div
                    class="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-400 sm:px-6"
                >
                    <UIcon name="i-lucide-info" class="size-3.5" />
                    Exports are generated from the current registries, so every
                    downloaded file matches the figures above. Nothing is stored
                    server-side.
                </div>
            </div>
        </div>
    </div>

    <!-- Generate Report Modal -->
    <Teleport to="body">
        <div
            v-if="showGenerate"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeGenerate"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e8] text-[#2d6a2d] ring-1 ring-emerald-100"
                        >
                            <UIcon name="i-lucide-file-down" class="size-5" />
                        </span>

                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Generate Report
                            </h3>
                            <p class="text-sm text-slate-500">
                                Pick a report to generate a CSV from the current
                                registry figures.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                        @click="closeGenerate"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div class="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                    <button
                        v-for="dataset in datasets"
                        :key="dataset.key"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all"
                        :class="
                            dataset.key === selectedKey
                                ? 'border-emerald-300 bg-emerald-50/70 shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                        "
                        @click="selectedKey = dataset.key"
                    >
                        <span
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                            :style="{
                                background: CATEGORY_STYLE[dataset.category].bg,
                            }"
                        >
                            <UIcon
                                :name="CATEGORY_STYLE[dataset.category].icon"
                                class="size-4.5"
                                :style="{
                                    color: CATEGORY_STYLE[dataset.category]
                                        .text,
                                }"
                            />
                        </span>

                        <span class="min-w-0 flex-1">
                            <span
                                class="block text-sm font-semibold text-slate-800"
                            >
                                {{ dataset.title }}
                            </span>
                            <span class="mt-0.5 block text-xs text-slate-400">
                                {{ dataset.category }} ·
                                {{ fmtCount(dataset.rows.length) }} rows
                            </span>
                        </span>

                        <UIcon
                            v-if="dataset.key === selectedKey"
                            name="i-lucide-circle-check"
                            class="size-5 shrink-0 text-[#2d6a2d]"
                        />
                    </button>
                </div>

                <div
                    v-if="selectedDataset"
                    class="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3"
                >
                    <div
                        class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                        Columns
                    </div>
                    <div class="mt-1.5 text-sm leading-6 text-slate-600">
                        {{ datasetColumns(selectedDataset) }}
                    </div>
                </div>

                <p
                    v-if="generatedName"
                    class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700"
                >
                    <UIcon name="i-lucide-circle-check" class="size-4" />
                    Downloaded {{ generatedName }}
                </p>

                <div
                    class="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5"
                >
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        @click="closeGenerate"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="!selectedDataset"
                        @click="generateSelected"
                    >
                        <UIcon name="i-lucide-download" class="size-4" />
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
