<script setup lang="ts">
/**
 * Barangay Comparative Analysis: total agricultural area versus cultivated
 * area, one grouped bar pair per barangay, rendered through `VChart`.
 */
import type { BarangayAreaRow } from '~/utils/analytics'
import { fmtWhole } from '~/utils/reportPresentation'

interface Props {
    barangayRows: BarangayAreaRow[]
    barangayCount: number
    leadingBarangay: BarangayAreaRow | null | undefined
}

const { barangayRows, barangayCount, leadingBarangay } = defineProps<Props>()

const hasBarangay = computed(() => barangayRows.length > 0)

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
        data: barangayRows.map((row) => row.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        // Barangay names run long, so they lean rather than collide.
        axisLabel: {
            fontSize: 10,
            color: '#6b7280',
            interval: 0,
            rotate: barangayRows.length > 5 ? 20 : 0,
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
            data: barangayRows.map((row) => row.area),
        },
        {
            name: 'Cultivated',
            type: 'bar',
            barWidth: 16,
            itemStyle: { color: '#2d6a2d', borderRadius: [3, 3, 0, 0] },
            data: barangayRows.map((row) => row.cultivated),
        },
    ],
}))
</script>

<template>
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
                        Total agricultural area versus cultivated area
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span
                    class="flex items-center gap-3 text-xs font-medium text-slate-500"
                >
                    <span class="flex items-center gap-1.5">
                        <span class="size-2.5 rounded-sm bg-[#dde5dd]" />
                        Total
                    </span>
                    <span class="flex items-center gap-1.5">
                        <span class="size-2.5 rounded-sm bg-[#2d6a2d]" />
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
                    <div class="w-full" :style="{ height: '300px' }"></div>
                </template>
            </ClientOnly>

            <div
                v-if="leadingBarangay"
                class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm font-medium"
            >
                <span class="flex items-center gap-2 text-slate-600">
                    <span class="h-2.5 w-2.5 rounded-full bg-[#2d6a2d]" />
                    {{ leadingBarangay.name }} leads cultivated area ({{
                        fmtWhole(leadingBarangay.cultivated)
                    }}
                    ha)
                </span>

                <span class="text-slate-400">
                    {{ fmtWhole(leadingBarangay.area) }} ha total area
                </span>
            </div>
        </div>
    </div>
</template>
