<script setup lang="ts">

type LandStatus =
    | 'Cultivated'
    | 'Preparation'
    | 'Harvesting'
    | 'Fallow'
    | 'Idle'
    | 'At Risk'
    | 'Converted'

type Barangay = {
    name: string
}

type Farmer = {
    farmer_code: string
    name: string
    barangays: Barangay[]
    farms: number
}

type Parcel = {
    parcel_code: string
    farmer_code: string
    barangay: string
    area_hectares: number
    land_status: LandStatus
    current_use: string | null
}

const farmers: Farmer[] = [
    {
        farmer_code: 'FRM-0001',
        name: 'Jose Mendoza',
        barangays: [{ name: 'Sto. Niño' }],
        farms: 3,
    },
    {
        farmer_code: 'FRM-0002',
        name: 'Rosa Dizon',
        barangays: [{ name: 'Sindalan' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0003',
        name: 'Pedro Santos',
        barangays: [{ name: 'Sto. Niño' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0004',
        name: 'Ana Reyes',
        barangays: [{ name: 'Calulut' }],
        farms: 1,
    },
    {
        farmer_code: 'FRM-0005',
        name: 'Carlos Garcia',
        barangays: [{ name: 'Pulung Bulu' }],
        farms: 3,
    },
    {
        farmer_code: 'FRM-0006',
        name: 'Liza Ramos',
        barangays: [{ name: 'Dolores' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0007',
        name: 'Mario Cruz',
        barangays: [{ name: 'Telabastagan' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0008',
        name: 'Elena Bautista',
        barangays: [{ name: 'San Pedro' }],
        farms: 1,
    },
    {
        farmer_code: 'FRM-0009',
        name: 'Ramon Villanueva',
        barangays: [{ name: 'Maimpis' }],
        farms: 1,
    },
    {
        farmer_code: 'FRM-0010',
        name: 'Fe Domingo',
        barangays: [{ name: 'Del Pilar' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0011',
        name: 'Arturo Salazar',
        barangays: [{ name: 'Pulung Bulu' }],
        farms: 2,
    },
    {
        farmer_code: 'FRM-0012',
        name: 'Corazon Lim',
        barangays: [{ name: 'Sindalan' }],
        farms: 1,
    },
]

const parcels: Parcel[] = [
    {
        parcel_code: 'PLC-0101',
        farmer_code: 'FRM-0001',
        barangay: 'Sto. Niño',
        area_hectares: 2.0,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0102',
        farmer_code: 'FRM-0001',
        barangay: 'Sto. Niño',
        area_hectares: 2.0,
        land_status: 'Harvesting',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0103',
        farmer_code: 'FRM-0001',
        barangay: 'Sto. Niño',
        area_hectares: 1.8,
        land_status: 'Preparation',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0201',
        farmer_code: 'FRM-0002',
        barangay: 'Sindalan',
        area_hectares: 2.2,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0202',
        farmer_code: 'FRM-0002',
        barangay: 'Sindalan',
        area_hectares: 2.0,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0301',
        farmer_code: 'FRM-0003',
        barangay: 'Sto. Niño',
        area_hectares: 3.4,
        land_status: 'Cultivated',
        current_use: 'Sugarcane',
    },
    {
        parcel_code: 'PLC-0302',
        farmer_code: 'FRM-0003',
        barangay: 'Sto. Niño',
        area_hectares: 2.7,
        land_status: 'Fallow',
        current_use: 'Sugarcane',
    },
    {
        parcel_code: 'PLC-0401',
        farmer_code: 'FRM-0004',
        barangay: 'Calulut',
        area_hectares: 1.8,
        land_status: 'Cultivated',
        current_use: 'Ampalaya',
    },
    {
        parcel_code: 'PLC-0501',
        farmer_code: 'FRM-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 2.1,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0502',
        farmer_code: 'FRM-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 1.8,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0503',
        farmer_code: 'FRM-0005',
        barangay: 'Pulung Bulu',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0601',
        farmer_code: 'FRM-0006',
        barangay: 'Dolores',
        area_hectares: 1.9,
        land_status: 'Cultivated',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0602',
        farmer_code: 'FRM-0006',
        barangay: 'Dolores',
        area_hectares: 1.7,
        land_status: 'Harvesting',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-0701',
        farmer_code: 'FRM-0007',
        barangay: 'Telabastagan',
        area_hectares: 2.4,
        land_status: 'Fallow',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0702',
        farmer_code: 'FRM-0007',
        barangay: 'Telabastagan',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0801',
        farmer_code: 'FRM-0008',
        barangay: 'San Pedro',
        area_hectares: 2.7,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-0901',
        farmer_code: 'FRM-0009',
        barangay: 'Maimpis',
        area_hectares: 1.5,
        land_status: 'Idle',
        current_use: 'Vegetables',
    },
    {
        parcel_code: 'PLC-1001',
        farmer_code: 'FRM-0010',
        barangay: 'Del Pilar',
        area_hectares: 2.6,
        land_status: 'Cultivated',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-1002',
        farmer_code: 'FRM-0010',
        barangay: 'Del Pilar',
        area_hectares: 2.2,
        land_status: 'At Risk',
        current_use: 'Rice',
    },
    {
        parcel_code: 'PLC-1101',
        farmer_code: 'FRM-0011',
        barangay: 'Pulung Bulu',
        area_hectares: 1.8,
        land_status: 'Cultivated',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-1102',
        farmer_code: 'FRM-0011',
        barangay: 'Pulung Bulu',
        area_hectares: 1.4,
        land_status: 'Preparation',
        current_use: 'Corn',
    },
    {
        parcel_code: 'PLC-1201',
        farmer_code: 'FRM-0012',
        barangay: 'Sindalan',
        area_hectares: 2.4,
        land_status: 'Fallow',
        current_use: 'Sugarcane',
    },
]

const farmerBarangay = (f: Farmer) => f.barangays.map((b) => b.name).join(', ')

const parcelStatusClass = (s: LandStatus) =>
    s === 'At Risk'
        ? 'status-atrisk'
        : s === 'Cultivated'
          ? 'status-cultivated'
          : s === 'Idle'
            ? 'status-idle'
            : s === 'Fallow'
              ? 'status-fallow'
              : s === 'Harvesting'
                ? 'status-harvesting'
                : s === 'Preparation'
                  ? 'status-preparation'
                  : s === 'Converted'
                    ? 'status-converted'
                    : 'status-idle'

const areaByFarmer = computed(() => {
    const totals = new Map<string, number>()
    for (const p of parcels) {
        totals.set(
            p.farmer_code,
            (totals.get(p.farmer_code) ?? 0) + p.area_hectares
        )
    }
    return totals
})

const search = ref('')
const filterBarangay = ref('All')
const selectedFarmer = ref<Farmer | null>(null)

const filtered = computed(() =>
    farmers.filter((f) => {
        const matchSearch =
            !search.value ||
            f.name.toLowerCase().includes(search.value.toLowerCase()) ||
            f.farmer_code.toLowerCase().includes(search.value.toLowerCase())
        const matchBarangay =
            filterBarangay.value === 'All' ||
            farmerBarangay(f).includes(filterBarangay.value)
        return matchSearch && matchBarangay
    })
)

const barangays = computed(() =>
    [...new Set(parcels.map((p) => p.barangay))].sort()
)

const summaryCards = computed(() => [
    {
        label: 'Total Farmers',
        val: farmers.length,
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Barangays Covered',
        val: barangays.value.length,
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
    {
        label: 'Registered Parcels',
        val: parcels.length,
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Total Registered Area',
        val: `${parcels
            .reduce((a, p) => a + p.area_hectares, 0)
            .toFixed(1)} ha`,
        color: '#ca8a04',
        bg: '#fef3c7',
    },
])

const selectedFarmerParcels = computed(() =>
    parcels.filter((p) => p.farmer_code === selectedFarmer.value?.farmer_code)
)

const profileFields = computed(() =>
    selectedFarmer.value
        ? [
              {
                  icon: 'i-lucide-map-pin',
                  label: 'Barangay',
                  val: farmerBarangay(selectedFarmer.value),
              },
              {
                  icon: 'i-lucide-wheat',
                  label: 'Registry Code',
                  val: selectedFarmer.value.farmer_code,
              },
              {
                  icon: 'i-lucide-layers',
                  label: 'Farms',
                  val: `${selectedFarmer.value.farms} farm(s)`,
              },
              {
                  icon: 'i-lucide-clipboard-check',
                  label: 'Parcels',
                  val: `${selectedFarmerParcels.value.length} parcel(s)`,
              },
          ]
        : []
)

const detailStats = computed(() => {
    const fp = selectedFarmerParcels.value
    return [
        {
            label: 'Total Farms',
            val: selectedFarmer.value?.farms ?? 0,
            icon: 'i-lucide-layers',
            color: '#2d6a2d',
            bg: '#e8f5e8',
        },
        {
            label: 'Total Area',
            val: `${fp.reduce((a, p) => a + p.area_hectares, 0).toFixed(1)} ha`,
            icon: 'i-lucide-map-pin',
            color: '#1d6fa4',
            bg: '#e0f0fb',
        },
        {
            label: 'Cultivated Parcels',
            val: fp.filter((p) => p.land_status === 'Cultivated').length,
            icon: 'i-lucide-activity',
            color: '#16a34a',
            bg: '#dcfce7',
        },
        {
            label: 'At-Risk Parcels',
            val: fp.filter((p) => p.land_status === 'At Risk').length,
            icon: 'i-lucide-alert-triangle',
            color: '#dc2626',
            bg: '#fee2e2',
        },
    ]
})
</script>

<template>
    <!-- Farmer Detail View -->
    <div v-if="selectedFarmer" class="p-6">
        <div class="max-w-5xl">
            <button
                type="button"
                class="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                @click="selectedFarmer = null"
            >
                <UIcon name="i-lucide-arrow-left" class="size-3.5" />
                Back to Farmers Registry
            </button>

            <!-- Profile Header -->
            <div class="alps-card mb-5 p-6">
                <div class="flex items-start gap-5">
                    <div
                        class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f5e8]"
                    >
                        <UIcon
                            name="i-lucide-user"
                            class="size-7 text-[#2d6a2d]"
                        />
                    </div>
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <h2
                                    class="text-xl font-bold text-gray-900"
                                    style="font-family: 'DM Sans', sans-serif"
                                >
                                    {{ selectedFarmer.name }}
                                </h2>
                                <div class="mt-1 flex items-center gap-3">
                                    <span
                                        class="font-mono text-xs text-gray-400"
                                    >
                                        {{ selectedFarmer.farmer_code }}
                                    </span>
                                    <span class="text-xs text-gray-400">
                                        {{ farmerBarangay(selectedFarmer) }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    type="button"
                                    class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                                >
                                    Add Assistance
                                </button>
                            </div>
                        </div>
                        <div
                            class="mt-4 grid grid-cols-4 gap-4 border-t border-gray-100 pt-4"
                        >
                            <div
                                v-for="field in profileFields"
                                :key="field.label"
                                class="text-xs"
                            >
                                <div class="mb-0.5 text-gray-400">
                                    {{ field.label }}
                                </div>
                                <div
                                    class="flex items-center gap-1 font-medium text-gray-700"
                                >
                                    <UIcon
                                        :name="field.icon"
                                        class="size-[11px] text-gray-400"
                                    />
                                    {{ field.val }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="mb-5 grid grid-cols-4 gap-4">
                <div
                    v-for="stat in detailStats"
                    :key="stat.label"
                    class="alps-card p-4"
                >
                    <div
                        class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                        :style="{ background: stat.bg }"
                    >
                        <UIcon
                            :name="stat.icon"
                            class="size-4"
                            :style="{ color: stat.color }"
                        />
                    </div>
                    <div
                        class="text-xl font-bold text-gray-900"
                        style="font-family: 'DM Sans', sans-serif"
                    >
                        {{ stat.val }}
                    </div>
                    <div class="text-xs text-gray-500">{{ stat.label }}</div>
                </div>
            </div>

            <!-- Parcels -->
            <div class="alps-card p-5">
                <h3
                    class="mb-4 text-sm font-semibold text-gray-700"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Registered Parcels
                </h3>
                <div
                    v-if="selectedFarmerParcels.length === 0"
                    class="py-8 text-center text-xs text-gray-400"
                >
                    No parcels registered for this farmer.
                </div>
                <table v-else class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-gray-100 text-gray-400">
                            <th class="pb-2 text-left font-medium">
                                Parcel Code
                            </th>
                            <th class="pb-2 text-left font-medium">Barangay</th>
                            <th class="pb-2 text-right font-medium">
                                Area (ha)
                            </th>
                            <th class="pb-2 text-left font-medium">
                                Land Status
                            </th>
                            <th class="pb-2 text-left font-medium">
                                Current Use
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="p in selectedFarmerParcels"
                            :key="p.parcel_code"
                            class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                        >
                            <td class="py-2.5 font-mono text-gray-600">
                                {{ p.parcel_code }}
                            </td>
                            <td class="py-2.5 text-gray-600">
                                {{ p.barangay }}
                            </td>
                            <td class="py-2.5 text-right font-mono">
                                {{ p.area_hectares }}
                            </td>
                            <td class="py-2.5">
                                <span
                                    :class="parcelStatusClass(p.land_status)"
                                    class="rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {{ p.land_status }}
                                </span>
                            </td>
                            <td class="py-2.5 text-gray-600">
                                {{ p.current_use ?? '—' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Farmers Registry List -->
    <div v-else class="p-6">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Farmers Registry
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Registered farmers · {{ farmers.length }} total
                </p>
            </div>
            <button
                type="button"
                class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                + Register Farmer
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="mb-5 grid grid-cols-4 gap-4">
            <div
                v-for="card in summaryCards"
                :key="card.label"
                class="alps-card p-4"
            >
                <div
                    class="mb-1 text-xl font-bold"
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
                    placeholder="Search name or Farmer Code..."
                    class="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
            </div>
            <select
                v-model="filterBarangay"
                class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
            >
                <option value="All">All Barangays</option>
                <option v-for="b in barangays" :key="b" :value="b">
                    {{ b }}
                </option>
            </select>
            <div class="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <UIcon name="i-lucide-filter" class="size-3" />
                {{ filtered.length }} of {{ farmers.length }} farmers
            </div>
        </div>

        <!-- Table -->
        <div class="alps-card overflow-hidden">
            <table class="w-full text-xs">
                <thead class="border-b border-gray-100 bg-gray-50">
                    <tr>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Farmer Code
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Name
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Barangay
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Farms
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Area (ha)
                        </th>
                        <th class="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="f in filtered"
                        :key="f.farmer_code"
                        class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-green-50/30"
                        @click="selectedFarmer = f"
                    >
                        <td class="px-4 py-3 font-mono text-gray-500">
                            {{ f.farmer_code }}
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div
                                    class="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f5e8]"
                                >
                                    <UIcon
                                        name="i-lucide-user"
                                        class="size-3 text-[#2d6a2d]"
                                    />
                                </div>
                                <span class="font-medium text-gray-800">
                                    {{ f.name }}
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-gray-600">
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-map-pin"
                                    class="size-[10px] text-gray-400"
                                />
                                {{ farmerBarangay(f) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right font-mono">
                            {{ f.farms }}
                        </td>
                        <td class="px-4 py-3 text-right font-mono font-medium">
                            {{
                                (areaByFarmer.get(f.farmer_code) ?? 0).toFixed(
                                    1
                                )
                            }}
                        </td>
                        <td class="px-4 py-3">
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
                    name="i-lucide-user"
                    class="mx-auto mb-3 size-8 opacity-30"
                />
                <div class="text-sm">
                    No farmers found matching your filters.
                </div>
            </div>
        </div>
    </div>
</template>