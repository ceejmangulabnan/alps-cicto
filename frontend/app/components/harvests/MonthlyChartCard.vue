<script setup lang="ts">
import type { HarvestRow } from '~/composables/useCycleRegistry'

/**
 * The monthly harvested-area chart card. Buckets each harvest into its month
 * for the latest year present, then renders the stacked bar, the header
 * subtitle and the yearly total — the page only passes the rows.
 */
interface Props {
    harvests: HarvestRow[]
}

const props = defineProps<Props>()

/** Latest year present in the data, so the chart always shows full months. */

const chartYear = computed(() => {
    const years = props.harvests
        .map((h) => (h.harvest_date ? Number(h.harvest_date.slice(0, 4)) : NaN))
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

const monthlyHarvestData = computed(() => {
    const base = MONTHS.map((month) => ({
        month,
        rice: 0,
        corn: 0,
        sugarcane: 0,
        vegetables: 0,
    }))

    const byMonth = new Map<number, (typeof base)[number]>()

    base.forEach((bucket, index) => byMonth.set(index + 1, bucket))

    for (const h of props.harvests) {
        const date = h.harvest_date

        if (!date || !date.startsWith(`${chartYear.value}-`)) continue

        const parsed = new Date(`${date}T00:00:00`)

        const bucket = byMonth.get(parsed.getMonth() + 1)

        if (!bucket) continue

        if (h.crop === 'Rice') bucket.rice += h.area_hectares
        else if (h.crop === 'Corn') bucket.corn += h.area_hectares
        else if (h.crop === 'Sugarcane') bucket.sugarcane += h.area_hectares
        else bucket.vegetables += h.area_hectares
    }

    return base
})

const chartTotals = computed(() => {
    const inYear = props.harvests.filter((h) =>
        h.harvest_date?.startsWith(`${chartYear.value}-`)
    )

    return {
        area:
            Math.round(
                inYear.reduce((sum, h) => sum + h.area_hectares, 0) * 10
            ) / 10,

        completed: inYear.filter((h) => h.production_kg != null).length,

        total: inYear.length,
    }
})

const option = computed(() => ({
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
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Rice',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            itemStyle: { borderRadius: [0, 0, 0, 0] },
            data: [...monthlyHarvestData.value.map((d) => d.rice)],
            color: '#16a34a',
        },
        {
            name: 'Corn',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            data: [...monthlyHarvestData.value.map((d) => d.corn)],
            color: '#ca8a04',
        },
        {
            name: 'Sugarcane',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            data: [...monthlyHarvestData.value.map((d) => d.sugarcane)],
            color: '#d97706',
        },
        {
            name: 'Vegetables',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            itemStyle: { borderRadius: [3, 3, 0, 0] },
            data: [...monthlyHarvestData.value.map((d) => d.vegetables)],
            color: '#059669',
        },
    ],
}))
</script>

<template>
    <div
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
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
                        Harvested Area by Crop
                    </h3>
                    <p class="text-xs text-slate-500">
                        {{ chartYear }} · {{ chartTotals.area }} ha ·
                        {{ chartTotals.completed }} completed of
                        {{ chartTotals.total }}
                    </p>
                </div>
            </div>
        </div>

        <div class="p-5 sm:p-6">
            <ClientOnly>
                <div class="w-full" :style="{ height: '240px' }">
                    <VChart
                        :option="option"
                        :style="{ height: '240px', width: '100%' }"
                        autoresize
                    />
                </div>
            </ClientOnly>

            <div
                class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
                <span class="text-sm text-slate-500">
                    Area harvested this year
                </span>
                <span class="text-sm font-bold text-[#2d6a2d]">
                    {{ chartTotals.area }} ha
                </span>
            </div>
        </div>
    </div>
</template>
