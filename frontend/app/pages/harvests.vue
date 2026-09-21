<script setup lang="ts">

type HarvestStatus = 'Completed' | 'Upcoming'

type HarvestRecord = {
    id: string
    farmer: string
    crop: string
    barangay: string
    area_hectares: number
    production_kg: number | null
    yield_per_hectare: number | null
    harvest_date: string
}

const harvestRecords: HarvestRecord[] = [
    {
        id: 'HRV-001',
        farmer: 'Ricardo Santos',
        crop: 'Rice',
        barangay: 'Sindalan',
        area_hectares: 1.8,
        production_kg: 7400,
        yield_per_hectare: 4.1,
        harvest_date: '2024-10-20',
    },
    {
        id: 'HRV-002',
        farmer: 'Felicitas Ocampo',
        crop: 'Rice',
        barangay: 'Dolores',
        area_hectares: 2.8,
        production_kg: 11800,
        yield_per_hectare: 4.2,
        harvest_date: '2024-10-25',
    },
    {
        id: 'HRV-003',
        farmer: 'Eduardo Pampanga',
        crop: 'Corn',
        barangay: 'San Felipe',
        area_hectares: 1.9,
        production_kg: 5500,
        yield_per_hectare: 2.9,
        harvest_date: '2024-11-02',
    },
    {
        id: 'HRV-004',
        farmer: 'Roberto Lansangan',
        crop: 'Sugarcane',
        barangay: 'Calulut',
        area_hectares: 3.1,
        production_kg: null,
        yield_per_hectare: null,
        harvest_date: '2025-01-05',
    },
    {
        id: 'HRV-005',
        farmer: 'Maria Dela Cruz',
        crop: 'Corn',
        barangay: 'San Jose',
        area_hectares: 1.8,
        production_kg: null,
        yield_per_hectare: null,
        harvest_date: '2024-12-22',
    },
    {
        id: 'HRV-006',
        farmer: 'Benjamin Torres',
        crop: 'Rice',
        barangay: 'Santa Lucia',
        area_hectares: 3.4,
        production_kg: 14300,
        yield_per_hectare: 4.2,
        harvest_date: '2024-10-30',
    },
]

const harvestStatus = (h: HarvestRecord): HarvestStatus =>
    h.production_kg != null ? 'Completed' : 'Upcoming'

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
    base.forEach((b, i) => byMonth.set(i + 1, b))

    for (const h of harvestRecords) {
        const d = new Date(h.harvest_date)
        if (Number.isNaN(d.getTime()) || d.getFullYear() !== 2024) continue
        const bucket = byMonth.get(d.getMonth() + 1)
        if (!bucket) continue
        if (h.crop === 'Rice') bucket.rice += h.area_hectares
        else if (h.crop === 'Corn') bucket.corn += h.area_hectares
        else if (h.crop === 'Sugarcane') bucket.sugarcane += h.area_hectares
        else bucket.vegetables += h.area_hectares
    }
    return base
})

const statusClass = (s: HarvestStatus) =>
    s === 'Completed' ? 'status-cultivated' : 'status-harvesting'

const kpis = computed(() => [
    {
        label: 'Total Harvests (2024)',
        val: harvestRecords.filter((h) => h.harvest_date.startsWith('2024-'))
            .length,
        icon: 'i-lucide-wheat',
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Total Yield (MT)',
        val: (
            harvestRecords.reduce((a, h) => a + (h.production_kg ?? 0), 0) /
            1000
        ).toFixed(1),
        icon: 'i-lucide-trending-up',
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Avg Yield Rice (t/ha)',
        val: (
            harvestRecords
                .filter((h) => h.crop === 'Rice')
                .reduce((a, h) => a + (h.yield_per_hectare ?? 0), 0) /
            Math.max(harvestRecords.filter((h) => h.crop === 'Rice').length, 1)
        ).toFixed(1),
        icon: 'i-lucide-trending-up',
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
    {
        label: 'Upcoming Harvests',
        val: harvestRecords.filter((h) => h.production_kg == null).length,
        icon: 'i-lucide-calendar',
        color: '#d97706',
        bg: '#fef3c7',
    },
])

const harvestOption = computed(() => ({
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
    grid: { left: 8, right: 16, top: 36, bottom: 24, containLabel: true },
    xAxis: {
        type: 'category',
        data: monthlyHarvestData.value.map((d) => d.month),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 11, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Rice',
            type: 'bar',
            barWidth: 6,
            itemStyle: { color: '#16a34a', borderRadius: [2, 2, 0, 0] },
            data: monthlyHarvestData.value.map((d) => d.rice),
        },
        {
            name: 'Corn',
            type: 'bar',
            barWidth: 6,
            itemStyle: { color: '#ca8a04', borderRadius: [2, 2, 0, 0] },
            data: monthlyHarvestData.value.map((d) => d.corn),
        },
        {
            name: 'Sugarcane',
            type: 'bar',
            barWidth: 6,
            itemStyle: { color: '#d97706', borderRadius: [2, 2, 0, 0] },
            data: monthlyHarvestData.value.map((d) => d.sugarcane),
        },
        {
            name: 'Vegetables',
            type: 'bar',
            barWidth: 6,
            itemStyle: { color: '#059669', borderRadius: [2, 2, 0, 0] },
            data: monthlyHarvestData.value.map((d) => d.vegetables),
        },
    ],
}))
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Harvests
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Yield records · Season tracking · Production data
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-wheat" class="size-3.5" />
                Record Harvest
            </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-4 gap-4">
            <div v-for="kpi in kpis" :key="kpi.label" class="alps-card p-5">
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: kpi.bg }"
                >
                    <UIcon
                        :name="kpi.icon"
                        class="size-[18px]"
                        :style="{ color: kpi.color }"
                    />
                </div>
                <div
                    class="text-2xl font-bold"
                    :style="{
                        color: kpi.color,
                        fontFamily: 'DM Sans, sans-serif',
                    }"
                >
                    {{ kpi.val }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- Chart -->
        <div class="alps-card p-5">
            <h3
                class="mb-4 text-sm font-semibold text-gray-700"
                style="font-family: 'DM Sans', sans-serif"
            >
                Monthly Harvest Volume (ha) — 2024
            </h3>
            <ClientOnly>
                <div class="w-full" :style="{ height: '220px' }">
                    <VChart
                        :option="harvestOption"
                        :style="{ height: '220px', width: '100%' }"
                        autoresize
                    />
                </div>
            </ClientOnly>
        </div>

        <!-- Harvest Records Table -->
        <div class="alps-card overflow-hidden">
            <div class="border-b border-gray-100 px-5 py-4">
                <h3
                    class="text-sm font-semibold text-gray-700"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Harvest Records
                </h3>
            </div>
            <table class="w-full text-xs">
                <thead class="border-b border-gray-100 bg-gray-50">
                    <tr>
                        <th
                            class="px-5 py-3 text-left font-semibold text-gray-600"
                        >
                            ID
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Farmer
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Crop
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Barangay
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Area (ha)
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Production (kg)
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            t/ha
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Date
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="h in harvestRecords"
                        :key="h.id"
                        class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                        <td class="px-5 py-3 font-mono text-gray-400">
                            {{ h.id }}
                        </td>
                        <td class="px-4 py-3 font-medium text-gray-800">
                            {{ h.farmer }}
                        </td>
                        <td class="px-4 py-3 text-gray-600">{{ h.crop }}</td>
                        <td class="px-4 py-3 text-gray-500">
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-map-pin"
                                    class="size-[10px] text-gray-400"
                                />
                                {{ h.barangay }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right font-mono">
                            {{ h.area_hectares }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono font-semibold text-green-700"
                        >
                            {{ h.production_kg?.toLocaleString() ?? '—' }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono text-gray-500"
                        >
                            {{ h.yield_per_hectare ?? '—' }}
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            {{ h.harvest_date }}
                        </td>
                        <td class="px-4 py-3">
                            <span
                                :class="statusClass(harvestStatus(h))"
                                class="rounded px-2 py-0.5 text-[10px] font-medium"
                            >
                                {{ harvestStatus(h) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
