<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

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

const harvestRecords = reactive<HarvestRecord[]>([
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
])

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

const showRecordModal = ref(false)
const harvestForm = reactive({
    farmer: '',
    crop: 'Rice',
    barangay: '',
    area_hectares: '',
    production_kg: '',
    yield_per_hectare: '',
    harvest_date: '',
})

const cropOptions = ['Rice', 'Corn', 'Sugarcane', 'Vegetables', 'Root Crops']
const farmerOptions = computed(() =>
    [...new Set(harvestRecords.map((h) => h.farmer))].sort()
)
const barangayOptions = computed(() =>
    [...new Set(harvestRecords.map((h) => h.barangay))].sort()
)

const showEditModal = ref(false)
const editForm = reactive({
    id: '',
    farmer: '',
    crop: 'Rice',
    barangay: '',
    area_hectares: '',
    production_kg: '',
    yield_per_hectare: '',
    harvest_date: '',
})

function openEditModal(h: HarvestRecord) {
    editForm.id = h.id
    editForm.farmer = h.farmer
    editForm.crop = h.crop
    editForm.barangay = h.barangay
    editForm.area_hectares = String(h.area_hectares)
    editForm.production_kg =
        h.production_kg != null ? String(h.production_kg) : ''
    editForm.yield_per_hectare =
        h.yield_per_hectare != null ? String(h.yield_per_hectare) : ''
    editForm.harvest_date = h.harvest_date
    showEditModal.value = true
}

function saveEdit() {
    const idx = harvestRecords.findIndex(
        (r) => r.id === editForm.id
    )
    if (idx === -1) return
    const r = harvestRecords[idx]
    r.farmer = editForm.farmer
    r.crop = editForm.crop
    r.barangay = editForm.barangay
    r.area_hectares = Number(editForm.area_hectares)
    r.production_kg =
        editForm.production_kg !== '' ? Number(editForm.production_kg) : null
    r.yield_per_hectare =
        editForm.yield_per_hectare !== ''
            ? Number(editForm.yield_per_hectare)
            : null
    r.harvest_date = editForm.harvest_date
    showEditModal.value = false
}

const showDeleteModal = ref(false)
const deleteTarget = ref<HarvestRecord | null>(null)

function askDelete(h: HarvestRecord) {
    deleteTarget.value = h
    showDeleteModal.value = true
}

function confirmDelete() {
    const t = deleteTarget.value
    if (!t) return
    const idx = harvestRecords.findIndex((r) => r.id === t.id)
    if (idx !== -1) harvestRecords.splice(idx, 1)
    deleteTarget.value = null
    showDeleteModal.value = false
}
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Harvests</h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Yield records · Season tracking · Production data
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="showRecordModal = true"
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
                    class="text-2xl font-bold font-sans"
                    :style="{
                        color: kpi.color,
                    }"
                >
                    {{ kpi.val }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
            </div>
        </div>

        <!-- Chart -->
        <div class="alps-card p-5">
            <h3 class="mb-4 text-sm font-semibold text-gray-700">
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
                <h3 class="text-sm font-semibold text-gray-700">
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
                        <th class="px-4 py-3 text-right"></th>
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
                        <td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                            {{ h.area_hectares }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono font-semibold text-green-700"
                        >
                            {{ h.production_kg?.toLocaleString() ?? '—' }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono text-gray-700"
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
                            <td class="px-4 py-3">
                                <div
                                    class="flex items-center justify-end gap-1"
                                >
                                    <button
                                        type="button"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                        @click="openEditModal(h)"
                                    >
                                        <UIcon
                                            name="i-lucide-pencil"
                                            class="size-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        @click="askDelete(h)"
                                    >
                                        <UIcon
                                            name="i-lucide-trash-2"
                                            class="size-3.5"
                                        />
                                    </button>
                                </div>
                            </td>
                        </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Record Harvest Modal -->
    <Teleport to="body">
        <div
            v-if="showRecordModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showRecordModal = false"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Record Harvest
                        </h3>
                        <p class="text-xs text-gray-500">
                            Record a harvest or schedule an upcoming one.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showRecordModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form
                    class="space-y-4"
                    @submit.prevent="showRecordModal = false"
                >
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farmer
                            </label>
                            <input
                                v-model="harvestForm.farmer"
                                type="text"
                                list="harvest-farmer-options"
                                placeholder="e.g. Ricardo Santos"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="harvest-farmer-options">
                                <option
                                    v-for="f in farmerOptions"
                                    :key="f"
                                    :value="f"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <input
                                v-model="harvestForm.barangay"
                                type="text"
                                list="harvest-barangay-options"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="harvest-barangay-options">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Crop
                            </label>
                            <select
                                v-model="harvestForm.crop"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="c in cropOptions"
                                    :key="c"
                                    :value="c"
                                >
                                    {{ c }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Area (ha)
                            </label>
                            <input
                                v-model="harvestForm.area_hectares"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Production (kg)
                            </label>
                            <input
                                v-model="harvestForm.production_kg"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="Optional"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Yield (t/ha)
                            </label>
                            <input
                                v-model="harvestForm.yield_per_hectare"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Optional"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Harvest Date
                        </label>
                        <input
                            v-model="harvestForm.harvest_date"
                            type="date"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showRecordModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Record Harvest
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Harvest Record Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showEditModal = false"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Edit Harvest Record
                        </h3>
                        <p class="text-xs text-gray-500">
                            Update the yield and production details.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showEditModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="saveEdit">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farmer
                            </label>
                            <input
                                v-model="editForm.farmer"
                                type="text"
                                list="harvest-farmer-options-edit"
                                placeholder="e.g. Ricardo Santos"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="harvest-farmer-options-edit">
                                <option
                                    v-for="f in farmerOptions"
                                    :key="f"
                                    :value="f"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <input
                                v-model="editForm.barangay"
                                type="text"
                                list="harvest-barangay-options-edit"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="harvest-barangay-options-edit">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Crop
                            </label>
                            <select
                                v-model="editForm.crop"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="c in cropOptions"
                                    :key="c"
                                    :value="c"
                                >
                                    {{ c }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Area (ha)
                            </label>
                            <input
                                v-model="editForm.area_hectares"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Production (kg)
                            </label>
                            <input
                                v-model="editForm.production_kg"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="Optional"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Yield (t/ha)
                            </label>
                            <input
                                v-model="editForm.yield_per_hectare"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Optional"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Harvest Date
                        </label>
                        <input
                            v-model="editForm.harvest_date"
                            type="date"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showEditModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Delete Harvest Record Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showDeleteModal = false"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon
                        name="i-lucide-trash-2"
                        class="size-5 text-red-600"
                    />
                </div>
                <h3 class="text-lg font-bold text-gray-900">
                    Delete Harvest Record
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.id }}
                    </span>
                    for {{ deleteTarget?.farmer }}? This action cannot be
                    undone.
                </p>
                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showDeleteModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                        @click="confirmDelete"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
