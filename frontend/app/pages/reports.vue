<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const reports = [
    {
        title: 'Agricultural Land Status Report',
        type: 'Land Use',
        date: '2024-11-25',
        format: 'PDF',
        size: '1.2 MB',
    },
    {
        title: 'Farmer Registry Q4 2024',
        type: 'Registry',
        date: '2024-11-20',
        format: 'XLSX',
        size: '840 KB',
    },
    {
        title: 'Harvest Production Summary',
        type: 'Production',
        date: '2024-11-15',
        format: 'PDF',
        size: '2.1 MB',
    },
    {
        title: 'Risk Monitoring Monthly Report',
        type: 'Risk',
        date: '2024-11-10',
        format: 'PDF',
        size: '3.4 MB',
    },
    {
        title: 'Assistance Program Disbursement',
        type: 'Assistance',
        date: '2024-11-05',
        format: 'XLSX',
        size: '560 KB',
    },
]

const yieldTrendData = [
    { year: '2020', rice: 3.6, corn: 2.8, national: 3.9 },
    { year: '2021', rice: 3.8, corn: 2.9, national: 4.0 },
    { year: '2022', rice: 3.9, corn: 3.0, national: 4.1 },
    { year: '2023', rice: 4.0, corn: 3.1, national: 4.2 },
    { year: '2024', rice: 4.1, corn: 3.2, national: 4.3 },
]

const landStatusData = [
    { name: 'Cultivated', value: 842, color: '#2d6a2d' },
    { name: 'Fallow', value: 234, color: '#ca8a04' },
    { name: 'Idle', value: 178, color: '#94a3b8' },
    { name: 'Other Uses', value: 102, color: '#059669' },
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

const yieldOption = computed(() => ({
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
    grid: { left: 8, right: 16, top: 34, bottom: 24, containLabel: true },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: yieldTrendData.map((d) => d.year),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        min: 2,
        max: 5,
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 11, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Rice (local)',
            type: 'line',
            smooth: true,
            symbolSize: 4,
            lineStyle: { width: 2.5, color: '#16a34a' },
            itemStyle: { color: '#16a34a' },
            data: yieldTrendData.map((d) => d.rice),
        },
        {
            name: 'Corn (local)',
            type: 'line',
            smooth: true,
            symbolSize: 4,
            lineStyle: { width: 2.5, color: '#ca8a04' },
            itemStyle: { color: '#ca8a04' },
            data: yieldTrendData.map((d) => d.corn),
        },
        {
            name: 'National Avg',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1.5, color: '#9ca3af', type: 'dashed' },
            itemStyle: { color: '#9ca3af' },
            data: yieldTrendData.map((d) => d.national),
        },
    ],
}))

const landStatusOption = computed(() => ({
    animation: false,
    tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ${p.value} ha`,
    },
    series: [
        {
            type: 'pie',
            radius: '80%',
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

const barangayOption = computed(() => ({
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
    grid: { left: 8, right: 16, top: 34, bottom: 48, containLabel: true },
    xAxis: {
        type: 'category',
        data: barangayAreaData.map((d) => d.barangay),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 10, color: '#6b7280', rotate: -20 },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 10, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Total Agri Area',
            type: 'bar',
            barWidth: 14,
            itemStyle: { color: '#dde5dd', borderRadius: [3, 3, 0, 0] },
            data: barangayAreaData.map((d) => d.area),
        },
        {
            name: 'Cultivated',
            type: 'bar',
            barWidth: 14,
            itemStyle: { color: '#2d6a2d', borderRadius: [3, 3, 0, 0] },
            data: barangayAreaData.map((d) => d.cultivated),
        },
    ],
}))
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Reports & Analytics
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Production summaries · Land use analytics · Export center
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-bar-chart-3" class="size-3.5" />
                Generate Report
            </button>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-12 gap-4">
            <div class="alps-card col-span-12 p-5 md:col-span-8">
                <h3 class="mb-4 text-sm font-semibold text-gray-700">
                    Rice & Corn Yield Trend (t/ha) vs. National Average
                </h3>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '220px' }">
                        <VChart
                            :option="yieldOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
            </div>

            <div class="alps-card col-span-12 p-5 md:col-span-4">
                <h3 class="mb-4 text-sm font-semibold text-gray-700">
                    Land Status
                </h3>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '180px' }">
                        <VChart
                            :option="landStatusOption"
                            :style="{ height: '180px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div class="mt-1 space-y-1">
                    <div
                        v-for="d in landStatusData.slice(0, 4)"
                        :key="d.name"
                        class="flex items-center justify-between text-xs text-gray-600"
                    >
                        <span class="flex items-center gap-1.5">
                            <span
                                class="inline-block h-2 w-2 rounded-sm"
                                :style="{ background: d.color }"
                            />
                            {{ d.name }}
                        </span>
                        <span class="font-mono">{{ d.value }} ha</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="alps-card p-5">
            <h3 class="mb-4 text-sm font-semibold text-gray-700">
                Barangay Comparative Analysis
            </h3>
            <ClientOnly>
                <div class="w-full" :style="{ height: '220px' }">
                    <VChart
                        :option="barangayOption"
                        :style="{ height: '220px', width: '100%' }"
                        autoresize
                    />
                </div>
            </ClientOnly>
        </div>

        <!-- Report Library -->
        <div class="alps-card overflow-hidden">
            <div class="border-b border-gray-100 px-5 py-4">
                <h3 class="text-sm font-semibold text-gray-700">
                    Report Library
                </h3>
            </div>
            <div class="divide-y divide-gray-50">
                <div
                    v-for="r in reports"
                    :key="r.title"
                    class="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50"
                        >
                            <UIcon
                                name="i-lucide-bar-chart-3"
                                class="size-3.5 text-green-700"
                            />
                        </div>
                        <div>
                            <div class="text-xs font-medium text-gray-800">
                                {{ r.title }}
                            </div>
                            <div class="text-[10px] text-gray-400">
                                {{ r.type }} · {{ r.date }} · {{ r.size }}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span
                            class="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500"
                        >
                            {{ r.format }}
                        </span>
                        <button
                            type="button"
                            class="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                        >
                            <UIcon name="i-lucide-download" class="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
