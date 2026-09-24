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

const STATUS_DOT: Record<LandStatus, string> = {
    Cultivated: '#166534',
    Preparation: '#0369a1',
    Harvesting: '#a16207',
    Fallow: '#b45309',
    Idle: '#4b5563',
    'At Risk': '#b91c1c',
    Converted: '#0f766e',
}

const AVATAR_COLORS = [
    '#2d6a2d',
    '#3b82f6',
    '#7c3aed',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#db2777',
    '#65a30d',
]

function initials(name: string) {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function avatarColor(name: string) {
    let h = 0
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
    return AVATAR_COLORS[h]
}

const search = ref('')
const filterStatus = ref('All')
const selected = ref<Parcel | null>(null)

function goEditParcel(p: Parcel) {
    navigateTo({
        path: '/map',
        query: {
            editParcel: '1',
            parcel_code: p.parcel_code,
            farm_code: p.farm_code,
            farmer_name: p.farmerName,
            area: String(p.area_hectares),
            land_status: p.land_status,
            current_use: p.current_use ?? '',
        },
    })
}

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

const farmerCount = computed(
    () => new Set(parcels.map((p) => p.farmerName)).size
)

const barangayCount = computed(
    () => new Set(parcels.map((p) => p.barangay)).size
)

const summaryCards = computed(() => [
    {
        label: 'Total Parcels',
        val: parcels.length,
        color: '#2d6a2d',
        bg: '#e8f5e8',
        icon: 'i-lucide-layers',
    },
    {
        label: 'Cultivated',
        val: parcels.filter((p) => p.land_status === 'Cultivated').length,
        color: '#16a34a',
        bg: '#dcfce7',
        icon: 'i-lucide-sprout',
    },
    {
        label: 'Idle / Fallow',
        val: parcels.filter(
            (p) => p.land_status === 'Idle' || p.land_status === 'Fallow'
        ).length,
        color: '#9ca3af',
        bg: '#f3f4f6',
        icon: 'i-lucide-pause',
    },
    {
        label: 'At Risk',
        val: parcels.filter((p) => p.land_status === 'At Risk').length,
        color: '#dc2626',
        bg: '#fee2e2',
        icon: 'i-lucide-triangle-alert',
    },
])

const detailFields = computed(() => {
    const s = selected.value
    if (!s) return []
    return [
        { label: 'Farm Code', val: s.farm_code },
        { label: 'Current Use', val: s.current_use ?? '—' },
    ]
})
</script>

<template>
    <div class="p-6">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-gray-900">
                        Farms & Parcels
                    </h1>
                    <span
                        class="rounded-full bg-[#e8f5e8] px-2 py-0.5 text-[11px] font-semibold text-[#2d6a2d]"
                    >
                        {{ parcels.length }} parcels
                    </span>
                    <span
                        class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500"
                    >
                        {{ farmerCount }} farmers
                    </span>
                    <span
                        class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500"
                    >
                        {{ barangayCount }} barangays
                    </span>
                </div>
                <p class="mt-0.5 text-sm text-gray-500">
                    Agricultural land inventory · cultivated, idle & at-risk
                    parcels
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
                class="alps-card relative overflow-hidden p-4"
            >
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${card.color}, transparent)`,
                    }"
                />
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: card.bg }"
                >
                    <UIcon
                        :name="card.icon"
                        class="size-4.5"
                        :style="{ color: card.color }"
                    />
                </div>
                <div
                    class="mb-1 text-xl font-bold font-sans"
                    :style="{
                        color: card.color,
                    }"
                >
                    {{ card.val }}
                </div>
                <div class="text-xs text-gray-500">{{ card.label }}</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="mb-5 space-y-3">
            <div class="flex items-center gap-3">
                <div class="relative max-w-xs flex-1">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search farmer or parcel code..."
                        class="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-8 text-xs shadow-sm focus:border-[#2d6a2d] focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button
                        v-if="search"
                        type="button"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                        @click="search = ''"
                    >
                        <UIcon name="i-lucide-x" class="size-3" />
                    </button>
                </div>
                <div
                    class="ml-auto flex items-center gap-1.5 text-xs text-gray-400"
                >
                    <UIcon name="i-lucide-filter" class="size-3" />
                    {{ filtered.length }} of {{ parcels.length }} parcels
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <button
                    v-for="s in ['All', ...STATUS_OPTIONS]"
                    :key="s"
                    type="button"
                    class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                    :class="
                        filterStatus === s
                            ? 'bg-[#2d6a2d] text-white border-[#2d6a2d] shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    "
                    @click="filterStatus = s"
                >
                    <span
                        v-if="s !== 'All'"
                        class="h-1.5 w-1.5 rounded-full"
                        :style="{ background: STATUS_DOT[s as LandStatus] }"
                    />
                    {{ s }}
                </button>
            </div>
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
                            v-for="(p, i) in filtered"
                            :key="p.parcel_code"
                            class="group cursor-pointer border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                            :class="[
                                i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white',
                                selected?.parcel_code === p.parcel_code
                                    ? '!bg-green-50/60'
                                    : '',
                            ]"
                            @click="selected = p"
                        >
                            <td
                                class="px-4 py-2.5 font-mono text-gray-700"
                            >
                                {{ p.parcel_code }}
                            </td>
                            <td class="px-4 py-2.5">
                                <div class="flex items-center gap-2.5">
                                    <span
                                        class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                        :style="{
                                            backgroundColor:
                                                avatarColor(p.farmerName),
                                        }"
                                    >
                                        {{ initials(p.farmerName) }}
                                    </span>
                                    <span
                                        class="font-medium text-gray-800"
                                    >
                                        {{ p.farmerName }}
                                    </span>
                                </div>
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
                                    class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                STATUS_DOT[p.land_status],
                                        }"
                                    />
                                    {{ p.land_status }}
                                </span>
                            </td>
                            <td class="px-4 py-2.5 text-gray-600">
                                {{ p.current_use ?? '—' }}
                            </td>
                            <td class="px-4 py-2.5">
                                <div
                                    class="flex items-center justify-end gap-1.5"
                                >
                                    <span
                                        class="text-[10px] font-semibold text-[#2d6a2d] opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        View
                                    </span>
                                    <UIcon
                                        name="i-lucide-chevron-right"
                                        class="size-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#2d6a2d]"
                                    />
                                </div>
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
                <div class="alps-card sticky top-4 overflow-hidden">
                    <div
                        class="absolute inset-x-0 top-0 h-1 opacity-80"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${STATUS_DOT[selected.land_status]}, transparent)`,
                        }"
                    />
                    <div class="p-5">
                        <div class="flex items-start justify-between">
                            <div>
                                <div
                                    class="font-mono text-xs text-gray-600"
                                >
                                    {{ selected.parcel_code }}
                                </div>
                                <h3
                                    class="mt-0.5 text-sm font-bold text-gray-800"
                                >
                                    {{ selected.farm_code }}
                                </h3>
                            </div>
                            <span
                                :class="
                                    STATUS_CLASS[selected.land_status] ||
                                    'status-idle'
                                "
                                class="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{
                                        background:
                                            STATUS_DOT[selected.land_status],
                                    }"
                                />
                                {{ selected.land_status }}
                            </span>
                        </div>

                        <div
                            class="mt-4 rounded-xl bg-gradient-to-br from-[#f0faf0] to-[#e8f5e8] p-4"
                        >
                            <div
                                class="text-2xl font-bold text-[#2d6a2d]"
                            >
                                {{ selected.area_hectares }}
                                ha
                            </div>
                            <div class="text-[11px] text-gray-500">
                                Declared land area
                            </div>
                        </div>

                        <div class="mt-4 flex items-center gap-2.5">
                            <span
                                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                :style="{
                                    backgroundColor: avatarColor(
                                        selected.farmerName
                                    ),
                                }"
                            >
                                {{ initials(selected.farmerName) }}
                            </span>
                            <div>
                                <div
                                    class="text-xs font-semibold text-gray-800"
                                >
                                    {{ selected.farmerName }}
                                </div>
                                <div
                                    class="flex items-center gap-1 text-[11px] text-gray-400"
                                >
                                    <UIcon
                                        name="i-lucide-map-pin"
                                        class="size-2.5"
                                    />
                                    {{ selected.barangay }}
                                </div>
                            </div>
                        </div>

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
                                class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                                @click="goEditParcel(selected)"
                            >
                                <UIcon
                                    name="i-lucide-pencil"
                                    class="size-3.5"
                                />
                                Edit Parcel
                            </button>
                            <button
                                type="button"
                                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                                <UIcon
                                    name="i-lucide-map-pin"
                                    class="size-3.5"
                                />
                                View on Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
