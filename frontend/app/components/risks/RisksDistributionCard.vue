<script setup lang="ts">
import type { AlpsInsight, RiskPriority } from '~/utils/riskInsights'

/**
 * The stacked bar of open reports per insight, split by severity band. The
 * fold lives here so the chart and its legend footer read from one totals
 * object — the page only passes the insights in.
 */
interface Props {
    insights: AlpsInsight[]
}

const props = defineProps<Props>()

const riskBarColor: Record<RiskPriority, string> = {
    High: '#dc2626',
    Medium: '#ea580c',
    Low: '#ca8a04',
}

const riskBarTotals = computed(() => {
    const totals = { High: 0, Medium: 0, Low: 0 }
    for (const insight of props.insights) {
        totals.High += insight.severityCounts.High
        totals.Medium += insight.severityCounts.Medium
        totals.Low += insight.severityCounts.Low
    }
    return totals
})

const riskBarData = computed(() =>
    props.insights.map((insight) => ({
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
</script>

<template>
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
                        <h3
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
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
</template>
