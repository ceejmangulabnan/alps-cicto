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

const typeFilterOptions = [
    'All',
    'Land Use',
    'Registry',
    'Production',
    'Risk',
    'Assistance',
]

const filterType = ref('All')
const searchQuery = ref('')

const filteredReports = computed(() =>
    reports.filter((r) => {
        const matchesType =
            filterType.value === 'All' || r.type === filterType.value
        const q = searchQuery.value.trim().toLowerCase()
        const matchesSearch =
            !q ||
            r.title.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q)
        return matchesType && matchesSearch
    })
)

const reportMeta = computed(() => {
    const mb = reports.reduce((s, r) => {
        const n = parseFloat(r.size)
        const unit = r.size.toLowerCase().includes('mb') ? 1 : 0.001
        return s + n * unit
    }, 0)
    return {
        count: reports.length,
        total: Math.round(mb * 10) / 10,
    }
})

const FORMAT_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
    PDF: { bg: '#fee2e2', color: '#dc2626', icon: 'i-lucide-file-text' },
    XLSX: { bg: '#dcfce7', color: '#15803d', icon: 'i-lucide-file-spreadsheet' },
}

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

function niceDate(date: string) {
    const d = new Date(date + 'T00:00:00')
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

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

const landStatusTotals = computed(() => {
    const total = landStatusData.reduce((s, d) => s + d.value, 0)
    const cultivated =
        landStatusData.find((d) => d.name === 'Cultivated')?.value ?? 0
    return {
        total,
        cultivatedPct: Math.round((cultivated / total) * 100),
    }
})

const topBarangay = computed(() =>
    barangayAreaData.reduce((a, b) =>
        b.cultivated > a.cultivated ? b : a
    )
)

const yieldLatest = computed(() =>
    yieldTrendData[yieldTrendData.length - 1]
)

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
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50"
                        >
                            <UIcon
                                name="i-lucide-line-chart"
                                class="size-4 text-emerald-600"
                            />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Rice & Corn Yield Trend (t/ha) vs. National
                                Average
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Local productivity year over year against the
                                national baseline
                            </p>
                        </div>
                    </div>
                    <span
                        class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    >
                        {{ yieldLatest.year }} · {{ yieldLatest.rice }} /{{
                            yieldLatest.corn
                        }}
                        t/ha
                    </span>
                </div>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '220px' }">
                        <VChart
                            :option="yieldOption"
                            :style="{ height: '220px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div
                    class="mt-3 flex items-center justify-end gap-4 border-t border-gray-100 pt-3 text-[11px] font-medium text-gray-600"
                >
                    <span class="flex items-center gap-1.5">
                        <span
                            class="h-2 w-2 rounded-full"
                            style="background: #16a34a"
                        />
                        Rice vs corn
                    </span>
                    <span class="flex items-center gap-1.5">
                        <span
                            class="h-0.5 w-3 border-t border-dashed border-gray-400"
                        />
                        National avg {{ yieldLatest.national }} t/ha
                    </span>
                </div>
            </div>

            <div class="alps-card col-span-12 p-5 md:col-span-4">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-pie-chart"
                                class="size-4 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                Land Status
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Current agricultural land utilization
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
                        <span class="font-mono">
                            {{ d.value.toLocaleString() }} ha
                        </span>
                    </div>
                </div>
                <div
                    class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-500"
                >
                    <span class="font-medium">
                        {{ landStatusTotals.total.toLocaleString() }} ha total
                    </span>
                    <span>
                        {{ landStatusTotals.cultivatedPct }}% of parcel area in
                        active use
                    </span>
                </div>
            </div>
        </div>

        <div class="alps-card p-5">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50"
                    >
                        <UIcon
                            name="i-lucide-bar-chart-2"
                            class="size-4 text-blue-600"
                        />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-700">
                            Barangay Comparative Analysis
                        </h3>
                        <p class="text-[11px] text-gray-400">
                            Total agricultural area vs. cultivated area by
                            barangay
                        </p>
                    </div>
                </div>
                <span
                    class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                >
                    {{ barangayAreaData.length }} barangays
                </span>
            </div>
            <ClientOnly>
                <div class="w-full" :style="{ height: '220px' }">
                    <VChart
                        :option="barangayOption"
                        :style="{ height: '220px', width: '100%' }"
                        autoresize
                    />
                </div>
            </ClientOnly>
            <div
                class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-medium"
            >
                <span class="flex items-center gap-1.5 text-gray-600">
                    <span
                        class="h-2 w-2 rounded-full"
                        style="background: #2d6a2d"
                    />
                    {{ topBarangay.barangay }} leads cultivated area
                    ({{ topBarangay.cultivated }} ha)
                </span>
                <span class="text-gray-400">
                    {{ topBarangay.area }} ha total area
                </span>
            </div>
        </div>

        <!-- Report Library -->
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
                        <h3 class="text-sm font-semibold text-gray-700">
                            Report Library
                        </h3>
                        <p class="text-[11px] text-gray-400">
                            Generated exports · {{ reportMeta.count }} files ·
                            {{ reportMeta.total }} MB total
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div
                        class="relative"
                    >
                        <UIcon
                            name="i-lucide-search"
                            class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search reports…"
                            class="w-52 rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <button
                            v-if="searchQuery"
                            type="button"
                            class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            @click="searchQuery = ''"
                        >
                            <UIcon name="i-lucide-x" class="size-3" />
                        </button>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        <button
                            v-for="t in typeFilterOptions"
                            :key="t"
                            type="button"
                            class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                            :class="
                                filterType === t
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            "
                            @click="filterType = t"
                        >
                            {{ t }}
                        </button>
                    </div>
                </div>
            </div>
            <div v-if="filteredReports.length" class="divide-y divide-gray-50">
                <div
                    v-for="(r, i) in filteredReports"
                    :key="r.title"
                    class="group flex items-center justify-between px-5 py-3 transition-colors"
                    :class="
                        i % 2 === 1
                            ? 'bg-gray-50/40'
                            : 'bg-white hover:bg-gray-50/50'
                    "
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                            :style="{
                                background: FORMAT_STYLE[r.format].bg,
                            }"
                        >
                            <UIcon
                                :name="FORMAT_STYLE[r.format].icon"
                                class="size-4"
                                :style="{ color: FORMAT_STYLE[r.format].color }"
                            />
                        </div>
                        <div>
                            <div class="text-xs font-medium text-gray-800">
                                {{ r.title }}
                            </div>
                            <div
                                class="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400"
                            >
                                <span>{{ r.type }}</span>
                                <span
                                    class="h-0.5 w-0.5 rounded-full bg-gray-300"
                                />
                                <span>{{ niceDate(r.date) }}</span>
                                <span
                                    class="h-0.5 w-0.5 rounded-full bg-gray-300"
                                />
                                <span>{{ r.size }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span
                            class="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-600"
                        >
                            {{ r.format }}
                        </span>
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#2d6a2d] hover:text-white"
                        >
                            <UIcon
                                name="i-lucide-download"
                                class="size-3.5"
                            />
                        </button>
                    </div>
                </div>
            </div>
            <div
                v-else
                class="flex flex-col items-center justify-center px-5 py-12 text-center"
            >
                <div
                    class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50"
                >
                    <UIcon
                        name="i-lucide-file-question"
                        class="size-5 text-gray-400"
                    />
                </div>
                <div class="text-xs font-medium text-gray-500">
                    No reports found
                </div>
                <div class="mt-0.5 text-[11px] text-gray-400">
                    Try a different search term or clear the type filter.
                </div>
            </div>
        </div>
    </div>
</template>
