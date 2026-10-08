<script setup lang="ts">
/**
 * The analytics charts row: monthly production by crop (line series) and the
 * land-status pie with its legend and totals. Both render through the
 * globally-registered `VChart` (vue-echarts); the option objects are built
 * here so the presentation lives with the card that draws it.
 */
import type { LandStatusSlice, MonthlyProduction } from '~/utils/analytics'
import { fmtWhole } from '~/utils/reportPresentation'

interface LandStatusTotals {
    classified: number
    cultivated: number
    cultivatedPct: number
}

interface Props {
    monthlyProduction: MonthlyProduction
    landStatusSlices: LandStatusSlice[]
    landStatusTotals: LandStatusTotals
    productionWindowMonths: number
}

const {
    monthlyProduction,
    landStatusSlices,
    landStatusTotals,
    productionWindowMonths,
} = defineProps<Props>()

const hasProduction = computed(() => monthlyProduction.series.length > 0)

const hasLandStatus = computed(() => landStatusSlices.length > 0)

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
        data: monthlyProduction.months,
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
    series: monthlyProduction.series.map((crop, index) => ({
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
            data: landStatusSlices.map((slice) => ({
                name: slice.name,
                value: slice.area,
                itemStyle: { color: slice.color },
            })),
        },
    ],
}))
</script>

<template>
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
                            Kilograms recorded against current planting cycles ·
                            trailing {{ productionWindowMonths }} months
                        </p>
                    </div>
                </div>

                <span
                    class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                >
                    <template v-if="monthlyProduction.averageYield !== null">
                        {{ fmtWhole(monthlyProduction.averageYield) }}
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
                        No harvest with a production figure in the last
                        {{ productionWindowMonths }} months.
                    </div>

                    <template #fallback>
                        <div class="w-full" :style="{ height: '280px' }"></div>
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
                        {{ fmtWhole(monthlyProduction.total) }} kg from
                        {{ monthlyProduction.records }} harvest{{
                            monthlyProduction.records === 1 ? '' : 's'
                        }}
                        <template v-if="monthlyProduction.leadingCrop">
                            ·
                            {{ monthlyProduction.leadingCrop }}
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
                        <UIcon name="i-lucide-chart-pie" class="size-4.5" />
                    </span>

                    <div>
                        <h3
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            Land Status
                        </h3>
                        <p class="text-xs text-slate-500">
                            {{ fmtWhole(landStatusTotals.classified) }}
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
                        <div class="w-full" :style="{ height: '210px' }"></div>
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
                            <span class="font-sans font-normal text-slate-400">
                                · {{ slice.parcels }}
                            </span>
                        </span>
                    </div>
                </div>

                <div
                    class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"
                >
                    <span class="font-semibold">
                        {{ fmtWhole(landStatusTotals.cultivated) }}
                        ha cultivated
                    </span>
                    <span> {{ landStatusTotals.cultivatedPct }}% of area </span>
                </div>
            </div>
        </div>
    </div>
</template>
