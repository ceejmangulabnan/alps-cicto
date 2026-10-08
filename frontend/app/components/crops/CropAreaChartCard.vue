<script setup lang="ts">
/**
 * The crop-area bar chart card: header, ECharts bar, legend and the planted
 * total. The page aggregates per-crop area; this only renders it.
 */
interface CropAreaDatum {
    name: string
    area: number
    color: string
}

interface Props {
    data: CropAreaDatum[]
    total: number
}

const props = defineProps<Props>()

const option = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLabel: { fontSize: 10, color: '#9ca3af' },
    },
    yAxis: {
        type: 'category',
        data: [...props.data].reverse().map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#374151' },
    },
    series: [
        {
            type: 'bar',
            barWidth: 14,
            itemStyle: { borderRadius: [0, 3, 3, 0] },
            data: [...props.data]
                .reverse()
                .map((d) => ({ value: d.area, itemStyle: { color: d.color } })),
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
                        Crop Area
                    </h3>
                    <p class="text-xs text-slate-500">
                        {{ props.data.length }} crop types ·
                        {{ props.total }} ha planted
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
                class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4"
            >
                <span
                    v-for="d in props.data"
                    :key="d.name"
                    class="flex items-center gap-1.5 text-sm text-slate-600"
                >
                    <span
                        class="h-2.5 w-2.5 rounded-full"
                        :style="{ background: d.color }"
                    />
                    {{ d.name }} · {{ d.area }} ha
                </span>
            </div>

            <div
                class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
                <span class="text-sm text-slate-500"> Planted area total </span>
                <span class="text-sm font-bold text-[#2d6a2d]">
                    {{ props.total }} ha
                </span>
            </div>
        </div>
    </div>
</template>
