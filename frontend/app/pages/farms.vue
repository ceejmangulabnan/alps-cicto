<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
type LandStatus =
    | 'Cultivated'
    | 'Preparation'
    | 'Harvesting'
    | 'Fallow'
    | 'Idle'
    | 'At Risk'
    | 'Converted'

type Parcel = {
    parcel_code: string
    farm_code: string
    farmerName: string
    barangay: string
    area_hectares: number
    land_status: LandStatus
    current_use: string | null
}

const parcels: Parcel[] = [
    {
        parcel_code: 'PLC-0101',
        farmerName: 'Jose Mendoza',
        farm_code: 'F-0001',
        barangay: 'Sto. Niño',
        area_hectares: 2.0,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0102',
        farmerName: 'Jose Mendoza',
        farm_code: 'F-0001',
        barangay: 'Sto. Niño',
        area_hectares: 2.0,
        land_status: 'Harvesting',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0103',
        farmerName: 'Jose Mendoza',
        farm_code: 'F-0001',
        barangay: 'Sto. Niño',
        area_hectares: 1.8,
        land_status: 'Preparation',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0201',
        farmerName: 'Rosa Dizon',
        farm_code: 'F-0002',
        barangay: 'Sindalan',
        area_hectares: 2.2,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0202',
        farmerName: 'Rosa Dizon',
        farm_code: 'F-0002',
        barangay: 'Sindalan',
        area_hectares: 2.0,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0301',
        farmerName: 'Pedro Santos',
        farm_code: 'F-0003',
        barangay: 'Sto. Niño',
        area_hectares: 3.4,
        land_status: 'Cultivated',
        current_use: 'Sugarcane',
    },
    {
        parcel_code: 'PLC-0302',
        farmerName: 'Pedro Santos',
        farm_code: 'F-0003',
        barangay: 'Sto. Niño',
        area_hectares: 2.7,
        land_status: 'Fallow',
        current_use: 'Sugarcane',
    },
    {
        parcel_code: 'PLC-0401',
        farmerName: 'Ana Reyes',
        farm_code: 'F-0004',
        barangay: 'Calulut',
        area_hectares: 1.8,
        land_status: 'Cultivated',
        current_use: 'Ampalaya',
    },
    {
        parcel_code: 'PLC-0501',
        farmerName: 'Carlos Garcia',
        farm_code: 'F-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 2.1,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0502',
        farmerName: 'Carlos Garcia',
        farm_code: 'F-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 1.8,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0503',
        farmerName: 'Carlos Garcia',
        farm_code: 'F-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0601',
        farmerName: 'Liza Ramos',
        farm_code: 'F-0006',
        barangay: 'Dolores',
        area_hectares: 1.9,
        land_status: 'Cultivated',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0602',
        farmerName: 'Liza Ramos',
        farm_code: 'F-0006',
        barangay: 'Dolores',
        area_hectares: 1.7,
        land_status: 'Harvesting',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0701',
        farmerName: 'Mario Cruz',
        farm_code: 'F-0007',
        barangay: 'Telabastagan',
        area_hectares: 2.4,
        land_status: 'Fallow',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0702',
        farmerName: 'Mario Cruz',
        farm_code: 'F-0007',
        barangay: 'Telabastagan',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0801',
        farmerName: 'Elena Bautista',
        farm_code: 'F-0008',
        barangay: 'San Pedro',
        area_hectares: 2.7,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0901',
        farmerName: 'Ramon Villanueva',
        farm_code: 'F-0009',
        barangay: 'Maimpis',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Vegetables',
    },
    {
        parcel_code: 'PLC-1001',
        farmerName: 'Fe Domingo',
        farm_code: 'F-0010',
        barangay: 'Del Pilar',
        area_hectares: 2.6,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-1002',
        farmerName: 'Fe Domingo',
        farm_code: 'F-0010',
        barangay: 'Del Pilar',
        area_hectares: 2.2,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-1101',
        farmerName: 'Arturo Salazar',
        farm_code: 'F-0011',
        barangay: 'Pulung Bulu',
        area_hectares: 1.8,
        land_status: 'Cultivated',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-1102',
        farmerName: 'Arturo Salazar',
        farm_code: 'F-0011',
        barangay: 'Pulung Bulu',
        area_hectares: 1.4,
        land_status: 'Preparation',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-1201',
        farmerName: 'Corazon Lim',
        farm_code: 'F-0012',
        barangay: 'Sindalan',
        area_hectares: 2.4,
        land_status: 'Fallow',
        current_use: 'Sugarcane',
    },
    {
        parcel_code: 'PLC-1301',
        farmerName: 'Mario Cruz',
        farm_code: 'F-0007',
        barangay: 'Telabastagan',
        area_hectares: 1.2,
        land_status: 'Converted',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-1302',
        farmerName: 'Pedro Santos',
        farm_code: 'F-0003',
        barangay: 'Sto. Niño',
        area_hectares: 0.9,
        land_status: 'Converted',
        current_use: 'Sugarcane',
    },
]

const STATUS_CLASS: Record<LandStatus, string> = {
    Cultivated: 'status-cultivated',
    Preparation: 'status-preparation',
    Harvesting: 'status-harvesting',
    Fallow: 'status-fallow',
    Idle: 'status-idle',
    'At Risk': 'status-atrisk',
    Converted: 'status-converted',
}

const STATUS_OPTIONS: LandStatus[] = [
    'Cultivated',
    'Preparation',
    'Harvesting',
    'Fallow',
    'Idle',
    'At Risk',
    'Converted',
]

const search = ref('')
const filterStatus = ref('All')
const selected = ref<Parcel | null>(null)

const filtered = computed(() =>
    parcels.filter((p) => {
        const match =
            !search.value ||
            p.farmerName.toLowerCase().includes(search.value.toLowerCase()) ||
            p.parcel_code.toLowerCase().includes(search.value.toLowerCase())
        const status =
            filterStatus.value === 'All' || p.land_status === filterStatus.value
        return match && status
    })
)

const summaryCards = computed(() => [
    {
        label: 'Total Parcels',
        val: parcels.length,
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Cultivated',
        val: parcels.filter((p) => p.land_status === 'Cultivated').length,
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Idle / Fallow',
        val: parcels.filter(
            (p) => p.land_status === 'Idle' || p.land_status === 'Fallow'
        ).length,
        color: '#9ca3af',
        bg: '#f3f4f6',
    },
    {
        label: 'At Risk',
        val: parcels.filter((p) => p.land_status === 'At Risk').length,
        color: '#dc2626',
        bg: '#fee2e2',
    },
])

const detailFields = computed(() => {
    const s = selected.value
    if (!s) return []
    return [
        { label: 'Farm Code', val: s.farm_code },
        { label: 'Farmer', val: s.farmerName },
        { label: 'Barangay', val: s.barangay },
        { label: 'Area', val: `${s.area_hectares} ha` },
        { label: 'Current Use', val: s.current_use ?? '—' },
    ]
})
</script>

<template>
    <div class="p-6">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Farms & Parcels
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Agricultural land inventory ·
                    {{ parcels.length }} registered parcels
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="navigateTo('/map?addParcel=1')"
            >
                <UIcon name="i-lucide-layers" class="size-3.5" />
                Add Parcel
            </button>
        </div>

        <!-- Summary -->
        <div class="mb-5 grid grid-cols-4 gap-4">
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

        <!-- Filters -->
        <div class="mb-5 flex gap-3">
            <div class="relative max-w-xs flex-1">
                <UIcon
                    name="i-lucide-search"
                    class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                />
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search farmer or parcel code..."
                    class="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
            </div>
            <select
                v-model="filterStatus"
                class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
            >
                <option value="All">All Statuses</option>
                <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">
                    {{ s }}
                </option>
            </select>
        </div>

        <div class="flex gap-4">
            <!-- Table -->
            <div class="alps-card flex-1 overflow-hidden">
                <table class="w-full text-xs">
                    <thead class="border-b border-gray-100 bg-gray-50">
                        <tr>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Parcel Code
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Farmer
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
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Status
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                                Current Use
                            </th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="p in filtered"
                            :key="p.parcel_code"
                            class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-green-50/30"
                            :class="
                                selected?.parcel_code === p.parcel_code
                                    ? 'bg-green-50/50'
                                    : ''
                            "
                            @click="selected = p"
                        >
                            <td class="px-4 py-2.5 font-mono text-gray-700">
                                {{ p.parcel_code }}
                            </td>
                            <td class="px-4 py-2.5 font-medium text-gray-800">
                                {{ p.farmerName }}
                            </td>
                            <td class="px-4 py-2.5 text-gray-500">
                                {{ p.barangay }}
                            </td>
                            <td
                                class="px-4 py-2.5 text-right font-mono font-medium text-gray-900"
                            >
                                {{ p.area_hectares }}
                            </td>
                            <td class="px-4 py-2.5">
                                <span
                                    :class="
                                        STATUS_CLASS[p.land_status] ||
                                        'status-idle'
                                    "
                                    class="rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {{ p.land_status }}
                                </span>
                            </td>
                            <td class="px-4 py-2.5 text-gray-600">
                                {{ p.current_use ?? '—' }}
                            </td>
                            <td class="px-4 py-2.5">
                                <UIcon
                                    name="i-lucide-chevron-right"
                                    class="size-3.5 text-gray-400"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div
                    v-if="filtered.length === 0"
                    class="py-12 text-center text-gray-400"
                >
                    <UIcon
                        name="i-lucide-layers"
                        class="mx-auto mb-3 size-8 opacity-30"
                    />
                    <div class="text-sm">
                        No parcels found matching your filters.
                    </div>
                </div>
            </div>

            <!-- Detail Side Panel -->
            <div v-if="selected" class="w-72 flex-shrink-0">
                <div class="alps-card sticky top-4 p-5">
                    <div class="mb-1 font-mono text-xs text-gray-600">
                        {{ selected.parcel_code }}
                    </div>
                    <h3
                        class="mb-1 text-sm font-bold text-gray-800"
                        style="font-family: 'DM Sans', sans-serif"
                    >
                        {{ selected.farm_code }}
                    </h3>
                    <span
                        :class="
                            STATUS_CLASS[selected.land_status] || 'status-idle'
                        "
                        class="rounded px-2 py-0.5 text-[10px] font-medium"
                    >
                        {{ selected.land_status }}
                    </span>

                    <div class="mt-4 space-y-2 text-xs">
                        <div
                            v-for="(f, i) in detailFields"
                            :key="i"
                            class="flex justify-between border-b border-gray-50 py-1 last:border-0"
                        >
                            <span class="text-gray-400">{{ f.label }}</span>
                            <span class="font-medium text-gray-700">{{
                                f.val
                            }}</span>
                        </div>
                    </div>

                    <div class="mt-4 space-y-2">
                        <button
                            type="button"
                            class="w-full rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            View Full Profile
                        </button>
                        <button
                            type="button"
                            class="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                            View on Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
