<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type PlantingStatus = 'Harvested' | 'Growing'

type PlantingRecord = {
    id: string
    farmer: string
    barangay: string
    parcel: string
    crop: string
    category: string
    variety: string
    area_hectares: number
    planting_date: string
    expected_harvest: string
    harvest_count: number
}

const plantingRecords = reactive<PlantingRecord[]>([
    {
        id: 'PLT-001',
        farmer: 'Ricardo Santos',
        barangay: 'Sindalan',
        parcel: 'PAR-001',
        crop: 'Rice',
        category: 'Cereal',
        variety: 'NSIC Rc222',
        area_hectares: 1.8,
        planting_date: '2024-07-15',
        expected_harvest: '2024-10-28',
        harvest_count: 1,
    },
    {
        id: 'PLT-002',
        farmer: 'Maria Dela Cruz',
        barangay: 'San Jose',
        parcel: 'PAR-003',
        crop: 'Corn',
        category: 'Cereal',
        variety: 'Pioneer 3177',
        area_hectares: 1.8,
        planting_date: '2024-09-01',
        expected_harvest: '2024-12-22',
        harvest_count: 0,
    },
    {
        id: 'PLT-003',
        farmer: 'Lorna Guiao',
        barangay: 'Quebiawan',
        parcel: 'PAR-006',
        crop: 'Eggplant',
        category: 'Vegetables',
        variety: 'FL 777',
        area_hectares: 2.1,
        planting_date: '2024-09-20',
        expected_harvest: '2024-12-04',
        harvest_count: 0,
    },
    {
        id: 'PLT-004',
        farmer: 'Eduardo Pampanga',
        barangay: 'San Felipe',
        parcel: 'PAR-009',
        crop: 'Corn',
        category: 'Cereal',
        variety: 'Dekalb 9088',
        area_hectares: 1.9,
        planting_date: '2024-09-10',
        expected_harvest: '2024-12-17',
        harvest_count: 0,
    },
    {
        id: 'PLT-005',
        farmer: 'Felicitas Ocampo',
        barangay: 'Dolores',
        parcel: 'PAR-010',
        crop: 'Rice',
        category: 'Cereal',
        variety: 'NSIC Rc160',
        area_hectares: 2.8,
        planting_date: '2024-07-22',
        expected_harvest: '2024-11-04',
        harvest_count: 1,
    },
    {
        id: 'PLT-006',
        farmer: 'Rosario Bautista',
        barangay: 'Telabastagan',
        parcel: 'PAR-008',
        crop: 'Tomato',
        category: 'Vegetables',
        variety: 'Diamante Max',
        area_hectares: 1.5,
        planting_date: '2024-10-15',
        expected_harvest: '2025-01-13',
        harvest_count: 0,
    },
])

const showEditModal = ref(false)
const editForm = reactive({
    id: '',
    farmer: '',
    barangay: '',
    parcel: '',
    crop: 'Rice',
    category: 'Cereal',
    variety: '',
    area_hectares: '',
    planting_date: '',
    expected_harvest: '',
})

function openEditModal(r: PlantingRecord) {
    editForm.id = r.id
    editForm.farmer = r.farmer
    editForm.barangay = r.barangay
    editForm.parcel = r.parcel
    editForm.crop = r.crop
    editForm.category = r.category
    editForm.variety = r.variety
    editForm.area_hectares = String(r.area_hectares)
    editForm.planting_date = r.planting_date
    editForm.expected_harvest = r.expected_harvest
    showEditModal.value = true
}

function saveEdit() {
    const idx = plantingRecords.findIndex(
        (r) => r.id === editForm.id
    )
    if (idx === -1) return
    const r = plantingRecords[idx]
    r.farmer = editForm.farmer
    r.barangay = editForm.barangay
    r.parcel = editForm.parcel
    r.crop = editForm.crop
    r.category = editForm.category
    r.variety = editForm.variety
    r.area_hectares = Number(editForm.area_hectares)
    r.planting_date = editForm.planting_date
    r.expected_harvest = editForm.expected_harvest
    showEditModal.value = false
}

const showDeleteModal = ref(false)
const deleteTarget = ref<PlantingRecord | null>(null)

function askDelete(r: PlantingRecord) {
    deleteTarget.value = r
    showDeleteModal.value = true
}

function confirmDelete() {
    const t = deleteTarget.value
    if (!t) return
    const idx = plantingRecords.findIndex((r) => r.id === t.id)
    if (idx !== -1) plantingRecords.splice(idx, 1)
    deleteTarget.value = null
    showDeleteModal.value = false
}

const cycleStatus = (r: PlantingRecord): PlantingStatus =>
    r.harvest_count > 0 ? 'Harvested' : 'Growing'

const CROP_COLORS: Record<string, string> = {
    Rice: '#16a34a',
    Corn: '#ca8a04',
    Sugarcane: '#d97706',
    Vegetables: '#059669',
    Eggplant: '#7c3aed',
    Tomato: '#dc2626',
}

const cropAreaData = computed(() => {
    const areas = new Map<string, number>()
    for (const r of plantingRecords) {
        areas.set(r.crop, (areas.get(r.crop) ?? 0) + r.area_hectares)
    }
    return [...areas.entries()].map(([name, area]) => ({
        name,
        area: Math.round(area * 10) / 10,
        color: CROP_COLORS[name] ?? '#94a3b8',
    }))
})

const statusClass = (s: PlantingStatus) =>
    s === 'Harvested' ? 'status-cultivated' : 'status-preparation'

const summaryCards = computed(() => [
    {
        label: 'Active Plantings',
        val: plantingRecords.filter((p) => p.harvest_count === 0).length,
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Crop Types',
        val: new Set(plantingRecords.map((p) => p.crop)).size,
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Total Planted Area',
        val: `${plantingRecords
            .reduce((a, p) => a + p.area_hectares, 0)
            .toFixed(1)} ha`,
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
    {
        label: 'Harvested Cycles',
        val: plantingRecords.filter((p) => p.harvest_count > 0).length,
        color: '#ca8a04',
        bg: '#fef3c7',
    },
])

const cropAreaOption = computed(() => ({
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
        data: [...cropAreaData.value].reverse().map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#374151' },
    },
    series: [
        {
            type: 'bar',
            barWidth: 14,
            itemStyle: { borderRadius: [0, 3, 3, 0] },
            data: [...cropAreaData.value]
                .reverse()
                .map((d) => ({ value: d.area, itemStyle: { color: d.color } })),
        },
    ],
}))

const showRegisterModal = ref(false)
const registerForm = reactive({
    farmer: '',
    barangay: '',
    parcel: '',
    crop: 'Rice',
    category: 'Cereal',
    variety: '',
    area_hectares: '',
    planting_date: '',
    expected_harvest: '',
})

const cropOptions = [
    'Rice',
    'Corn',
    'Sugarcane',
    'Vegetables',
    'Eggplant',
    'Tomato',
    'Root Crops',
]
const categoryOptions = ['Cereal', 'Vegetables', 'Fruits', 'Root Crops']
const farmerOptions = computed(() =>
    [...new Set(plantingRecords.map((p) => p.farmer))].sort()
)
const barangayOptions = computed(() =>
    [...new Set(plantingRecords.map((p) => p.barangay))].sort()
)
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Planting & Crops
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Planting cycles · Crop and variety tracking · Season
                    monitoring
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="showRegisterModal = true"
            >
                <UIcon name="i-lucide-sprout" class="size-3.5" />
                Register Planting Cycle
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-4 gap-4">
            <div
                v-for="card in summaryCards"
                :key="card.label"
                class="alps-card p-4"
            >
                <div
                    class="mb-1 text-2xl font-bold"
                    :style="{
                        color: card.color,
                        fontFamily: 'DM Sans, sans-serif',
                    }"
                >
                    {{ card.val }}
                </div>
                <div class="text-xs text-gray-500">{{ card.label }}</div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
            <!-- Crop Area Chart -->
            <div class="alps-card col-span-5 p-5">
                <h3
                    class="mb-4 text-sm font-semibold text-gray-700"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Crop Area (ha)
                </h3>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '200px' }">
                        <VChart
                            :option="cropAreaOption"
                            :style="{ height: '200px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
            </div>

            <!-- Planting Records -->
            <div class="alps-card col-span-7 overflow-hidden">
                <div class="border-b border-gray-100 px-5 py-4">
                    <h3
                        class="text-sm font-semibold text-gray-700"
                        style="font-family: 'DM Sans', sans-serif"
                    >
                        Planting Cycle Records
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead class="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Farmer
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Crop / Variety
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Parcel
                                </th>
                                <th
                                    class="px-4 py-3 text-right font-semibold text-gray-600"
                                >
                                    Area
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Planted
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Harvest
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
                                v-for="p in plantingRecords"
                                :key="p.id"
                                class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                            >
                                <td class="px-4 py-3">
                                    <div class="font-medium text-gray-800">
                                        {{ p.farmer }}
                                    </div>
                                    <div class="text-gray-400">
                                        {{ p.barangay }}
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="font-medium text-gray-700">
                                        {{ p.crop }}
                                    </div>
                                    <div class="italic text-gray-400">
                                        {{ p.variety }}
                                    </div>
                                </td>
                                <td class="px-4 py-3 font-mono text-gray-500">
                                    {{ p.parcel }}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono font-semibold text-gray-900"
                                >
                                    {{ p.area_hectares }} ha
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ p.planting_date }}
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ p.expected_harvest }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        :class="statusClass(cycleStatus(p))"
                                        class="rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        {{ cycleStatus(p) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div
                                        class="flex items-center justify-end gap-1"
                                    >
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                            @click="openEditModal(p)"
                                        >
                                            <UIcon
                                                name="i-lucide-pencil"
                                                class="size-3.5"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            @click="askDelete(p)"
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
        </div>
    </div>

    <!-- Register Planting Cycle Modal -->
    <Teleport to="body">
        <div
            v-if="showRegisterModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showRegisterModal = false"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Register Planting Cycle
                        </h3>
                        <p class="text-xs text-gray-500">
                            Log a new planting cycle for a parcel.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showRegisterModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form
                    class="space-y-4"
                    @submit.prevent="showRegisterModal = false"
                >
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farmer
                            </label>
                            <input
                                v-model="registerForm.farmer"
                                type="text"
                                list="crop-farmer-options"
                                placeholder="e.g. Ricardo Santos"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="crop-farmer-options">
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
                                v-model="registerForm.barangay"
                                type="text"
                                list="crop-barangay-options"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="crop-barangay-options">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel
                        </label>
                        <input
                            v-model="registerForm.parcel"
                            type="text"
                            placeholder="e.g. PAR-001"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Crop
                            </label>
                            <select
                                v-model="registerForm.crop"
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
                                Category
                            </label>
                            <select
                                v-model="registerForm.category"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="c in categoryOptions"
                                    :key="c"
                                    :value="c"
                                >
                                    {{ c }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Variety
                        </label>
                        <input
                            v-model="registerForm.variety"
                            type="text"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Area (ha)
                            </label>
                            <input
                                v-model="registerForm.area_hectares"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="registerForm.planting_date"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Expected Harvest
                        </label>
                        <input
                            v-model="registerForm.expected_harvest"
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
                            @click="showRegisterModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Register Planting Cycle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Planting Cycle Modal -->
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
                            Edit Planting Cycle
                        </h3>
                        <p class="text-xs text-gray-500">
                            Update the details for this planting cycle.
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
                                list="crop-farmer-options-edit"
                                placeholder="e.g. Ricardo Santos"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="crop-farmer-options-edit">
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
                                list="crop-barangay-options-edit"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="crop-barangay-options-edit">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel
                        </label>
                        <input
                            v-model="editForm.parcel"
                            type="text"
                            placeholder="e.g. PAR-001"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
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
                                Category
                            </label>
                            <select
                                v-model="editForm.category"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="c in categoryOptions"
                                    :key="c"
                                    :value="c"
                                >
                                    {{ c }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Variety
                        </label>
                        <input
                            v-model="editForm.variety"
                            type="text"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
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
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="editForm.planting_date"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Expected Harvest
                        </label>
                        <input
                            v-model="editForm.expected_harvest"
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

    <!-- Delete Planting Cycle Modal -->
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
                    Delete Planting Cycle
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
