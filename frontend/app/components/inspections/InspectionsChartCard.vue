<script setup lang="ts">
import type { RiskInspectionLevel } from '~/composables/useFarmParcelApi'
import type { InspectionRow } from '~/composables/useInspectionRegistry'

/**
 * The "Inspections by Month" card: a stacked bar chart of inspections per
 * month coloured by risk level, plus the high-risk total for the year. All
 * chart state (year, buckets, ECharts option) lives here; the page only
 * passes the rows.
 */
const props = defineProps<{
    inspections: InspectionRow[]
}>()

/** Latest year present in the data, so the chart always shows full months. */
const chartYear = computed(() => {
    const years = props.inspections
        .map((row) => (row.date ? Number(row.date.slice(0, 4)) : NaN))
        .filter((year) => Number.isFinite(year))
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear()
})

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

const RISK_COLORS: Record<RiskInspectionLevel, string> = {
    None: '#94a3b8',
    Low: '#ca8a04',
    Medium: '#d97706',
    High: '#dc2626',
}

const RISK_ORDER: RiskInspectionLevel[] = ['None', 'Low', 'Medium', 'High']

const monthlyInspectionData = computed(() => {
    const base = MONTHS.map((month) => ({
        month,
        None: 0,
        Low: 0,
        Medium: 0,
        High: 0,
    }))
    const byMonth = new Map<number, (typeof base)[number]>()
    base.forEach((bucket, index) => byMonth.set(index + 1, bucket))

    for (const row of props.inspections) {
        if (!row.date || !row.date.startsWith(`${chartYear.value}-`)) continue
        const parsed = new Date(`${row.date}T00:00:00`)
        const bucket = byMonth.get(parsed.getMonth() + 1)
        if (!bucket) continue
        bucket[row.riskLevel] += 1
    }
    return base
})

const chartTotals = computed(() => {
    const inYear = props.inspections.filter((row) =>
        row.date?.startsWith(`${chartYear.value}-`)
    )
    return {
        total: inYear.length,
        highRisk: inYear.filter((row) => row.riskLevel === 'High').length,
    }
})

const chartOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
        textStyle: { fontSize: 10, color: '#6b7280' },
    },
    grid: { left: 8, right: 12, top: 32, bottom: 4, containLabel: true },
    xAxis: {
        type: 'category',
        data: MONTHS,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    series: RISK_ORDER.map((risk, index) => ({
        name: risk,
        type: 'bar',
        stack: 'total',
        barWidth: 12,
        data: [...monthlyInspectionData.value.map((d) => d[risk])],
        color: RISK_COLORS[risk],
        // Round only the top segment of the stack.
        itemStyle:
            index === RISK_ORDER.length - 1
                ? { borderRadius: [3, 3, 0, 0] }
                : undefined,
    })),
}))
</script>

<template>
    <div
        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] lg:col-span-5"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0faf0]"
                >
                    <UIcon
                        name="i-lucide-chart-no-axes-column-increasing"
                        class="size-4.5"
                    />
                </div>
                <div>
                    <h3
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        Inspections by Month
                    </h3>
                    <p class="text-xs text-slate-500">
                        {{ chartYear }} · {{ chartTotals.total }} inspections,
                        {{ chartTotals.highRisk }} high-risk
                    </p>
                </div>
            </div>
        </div>
        <div class="p-5 sm:p-6">
            <ClientOnly>
                <div class="w-full" :style="{ height: '240px' }">
                    <VChart
                        :option="chartOption"
                        :style="{ height: '240px', width: '100%' }"
                        autoresize
                    />
                </div>
            </ClientOnly>
            <div
                class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
                <span class="text-sm text-slate-500"
                    >High-risk findings this year</span
                >
                <span class="text-sm font-bold text-red-600">
                    {{ chartTotals.highRisk }}
                </span>
            </div>
        </div>
    </div>
</template>
