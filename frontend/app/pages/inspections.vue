<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type RiskLevel = 'High' | 'Medium' | 'Low' | 'None'
type InspStatus = 'Completed' | 'Pending' | 'In Progress'

type Inspection = {
    id: string
    parcelId: string
    farmer: string
    barangay: string
    type: string
    date: string
    officer: string
    gps: string
    photos: number
    findings: string
    riskLevel: RiskLevel
    status: InspStatus
}

const inspections: Inspection[] = [
    {
        id: 'INSP-001',
        parcelId: 'PLC-0202',
        farmer: 'Rosa Dizon',
        barangay: 'Sindalan',
        type: 'Pre-harvest Assessment',
        date: '2024-11-18',
        officer: 'J. Villanueva',
        gps: '15.0328° N, 120.6937° E',
        photos: 6,
        findings:
            'Persistent waterlogging observed on the eastern portion of the parcel. Drainage channels are partially blocked; recommends dredging and elevated planting beds before the next season.',
        riskLevel: 'High',
        status: 'Completed',
    },
    {
        id: 'INSP-002',
        parcelId: 'PLC-0502',
        farmer: 'Carlos Garcia',
        barangay: 'Pulung Bulu',
        type: 'Pest & Disease Scouting',
        date: '2024-11-20',
        officer: 'R. Mendoza',
        gps: '15.0711° N, 120.6394° E',
        photos: 3,
        findings:
            'Early signs of stem borer infestation found in 4 sample hills. Threshold not yet exceeded but warrants re-scouting within 10 days.',
        riskLevel: 'Medium',
        status: 'Completed',
    },
    {
        id: 'INSP-003',
        parcelId: 'PLC-1002',
        farmer: 'Fe Domingo',
        barangay: 'Del Pilar',
        type: 'Pre-harvest Assessment',
        date: '2024-11-22',
        officer: 'A. Santos',
        gps: '15.0281° N, 120.6713° E',
        photos: 4,
        findings:
            'Crop maturity attained at 85%. Moisture content within acceptable range. Harvest window recommended within the week.',
        riskLevel: 'Low',
        status: 'Completed',
    },
    {
        id: 'INSP-004',
        parcelId: 'PLC-0601',
        farmer: 'Liza Ramos',
        barangay: 'Dolores',
        type: 'Compliance Check',
        date: '2024-11-25',
        officer: 'J. Villanueva',
        gps: '15.0402° N, 120.7015° E',
        photos: 2,
        findings:
            'Documentation in order. Seed certification tags present. No compliance issues noted.',
        riskLevel: 'None',
        status: 'Completed',
    },
    {
        id: 'INSP-005',
        parcelId: 'PLC-1101',
        farmer: 'Arturo Salazar',
        barangay: 'Pulung Bulu',
        type: 'Crop Establishment Visit',
        date: '2024-11-28',
        officer: 'R. Mendoza',
        gps: '15.0634° N, 120.6458° E',
        photos: 5,
        findings:
            'Stand establishment below target at 62%. Replanting of missing hills advised. Nutrient deficiency suspected in sandy areas.',
        riskLevel: 'Medium',
        status: 'Pending',
    },
    {
        id: 'INSP-006',
        parcelId: 'PLC-0301',
        farmer: 'Pedro Santos',
        barangay: 'Sto. Niño',
        type: 'Irrigation Audit',
        date: '2024-12-02',
        officer: 'A. Santos',
        gps: '15.0497° N, 120.6872° E',
        photos: 0,
        findings:
            'Ratoon crop showing good vigor. Soil moisture adequate for current growth stage.',
        riskLevel: 'Low',
        status: 'In Progress',
    },
    {
        id: 'INSP-007',
        parcelId: 'PLC-0102',
        farmer: 'Jose Mendoza',
        barangay: 'Sto. Niño',
        type: 'Harvest Monitoring',
        date: '2024-12-05',
        officer: 'J. Villanueva',
        gps: '15.0553° N, 120.6909° E',
        photos: 3,
        findings:
            'Harvest progress at 40%. Threshing losses within acceptable limits. Coordinate drying schedule with LGU facility.',
        riskLevel: 'Low',
        status: 'In Progress',
    },
]

const RISK_STYLE: Record<RiskLevel, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-yellow-100 text-yellow-700',
    None: 'bg-gray-100 text-gray-500',
}

const STATUS_STYLE: Record<InspStatus, string> = {
    Completed: 'status-cultivated',
    Pending: 'status-harvesting',
    'In Progress': 'status-preparation',
}

const PHOTO_URLS = [
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1500651238895-b48e5d6c8f86?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop&auto=format',
]

const search = ref('')
const selected = ref<Inspection | null>(null)

const filtered = computed(() =>
    inspections.filter(
        (i) =>
            !search.value ||
            i.farmer.toLowerCase().includes(search.value.toLowerCase()) ||
            i.id.toLowerCase().includes(search.value.toLowerCase())
    )
)

const stats = [
    {
        label: 'Total Inspections',
        val: inspections.length,
        color: '#2d6a2d',
    },
    {
        label: 'Completed',
        val: inspections.filter((i) => i.status === 'Completed').length,
        color: '#16a34a',
    },
    {
        label: 'Pending',
        val: inspections.filter((i) => i.status === 'Pending').length,
        color: '#ca8a04',
    },
    {
        label: 'High Risk Found',
        val: inspections.filter((i) => i.riskLevel === 'High').length,
        color: '#dc2626',
    },
]

const detailFields = computed(() => {
    const s = selected.value
    if (!s) return []
    return [
        { label: 'Farmer', val: s.farmer },
        { label: 'Barangay', val: s.barangay },
        { label: 'Parcel', val: s.parcelId },
        { label: 'Type', val: s.type },
        { label: 'Date', val: s.date },
        { label: 'Officer', val: s.officer },
        { label: 'GPS Coordinates', val: s.gps },
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
                    Field Inspections
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    GPS-tagged visits · Photo documentation ·
                    {{ inspections.length }}
                    total
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-plus" class="size-3.5" />
                New Inspection
            </button>
        </div>

        <!-- Stats -->
        <div class="mb-5 grid grid-cols-4 gap-4">
            <div v-for="s in stats" :key="s.label" class="alps-card p-4">
                <div
                    class="mb-1 text-2xl font-bold"
                    :style="{
                        color: s.color,
                        fontFamily: 'DM Sans, sans-serif',
                    }"
                >
                    {{ s.val }}
                </div>
                <div class="text-xs text-gray-500">{{ s.label }}</div>
            </div>
        </div>

        <div class="flex gap-4">
            <!-- List -->
            <div class="flex-1">
                <div class="relative mb-4">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search inspections..."
                        class="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                </div>
                <div class="space-y-3">
                    <div
                        v-for="ins in filtered"
                        :key="ins.id"
                        class="alps-card cursor-pointer p-4 transition-all hover:border-green-200"
                        :class="
                            selected?.id === ins.id
                                ? 'border-green-300 bg-green-50/30'
                                : ''
                        "
                        @click="selected = ins"
                    >
                        <div class="mb-2 flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <div
                                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50"
                                >
                                    <UIcon
                                        name="i-lucide-clipboard-check"
                                        class="size-3.5 text-green-700"
                                    />
                                </div>
                                <div>
                                    <div
                                        class="text-xs font-bold text-gray-800"
                                    >
                                        {{ ins.id }}
                                    </div>
                                    <div
                                        class="font-mono text-[10px] text-gray-400"
                                    >
                                        {{ ins.parcelId }}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    :class="RISK_STYLE[ins.riskLevel]"
                                    class="rounded px-2 py-0.5 text-[10px] font-semibold"
                                >
                                    {{ ins.riskLevel }} Risk
                                </span>
                                <span
                                    :class="STATUS_STYLE[ins.status]"
                                    class="rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {{ ins.status }}
                                </span>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-4 text-xs text-gray-500"
                        >
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-user"
                                    class="size-[10px]"
                                />
                                {{ ins.farmer }}
                            </span>
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-map-pin"
                                    class="size-[10px]"
                                />
                                {{ ins.barangay }}
                            </span>
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-calendar"
                                    class="size-[10px]"
                                />
                                {{ ins.date }}
                            </span>
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-camera"
                                    class="size-[10px]"
                                />
                                {{ ins.photos }} photos
                            </span>
                        </div>
                        <div class="mt-2 line-clamp-2 text-xs text-gray-600">
                            {{ ins.findings }}
                        </div>
                    </div>
                </div>
                <div
                    v-if="filtered.length === 0"
                    class="py-12 text-center text-gray-400"
                >
                    <UIcon
                        name="i-lucide-clipboard-check"
                        class="mx-auto mb-3 size-8 opacity-30"
                    />
                    <div class="text-sm">
                        No inspections found matching your search.
                    </div>
                </div>
            </div>

            <!-- Detail Panel -->
            <div v-if="selected" class="w-80 flex-shrink-0">
                <div class="alps-card sticky top-4 p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <h3
                            class="text-sm font-bold text-gray-800"
                            style="font-family: 'DM Sans', sans-serif"
                        >
                            {{ selected.id }}
                        </h3>
                        <span
                            :class="RISK_STYLE[selected.riskLevel]"
                            class="rounded px-2 py-0.5 text-[10px] font-semibold"
                        >
                            {{ selected.riskLevel }} Risk
                        </span>
                    </div>

                    <div class="mb-4 space-y-3">
                        <div
                            v-for="f in detailFields"
                            :key="f.label"
                            class="text-xs"
                        >
                            <div class="mb-0.5 text-gray-400">
                                {{ f.label }}
                            </div>
                            <div class="font-medium text-gray-700">
                                {{ f.val }}
                            </div>
                        </div>
                    </div>

                    <div class="mb-4 rounded-lg bg-gray-50 p-3">
                        <div class="mb-1 text-xs font-semibold text-gray-600">
                            Findings
                        </div>
                        <div class="text-xs text-gray-600">
                            {{ selected.findings }}
                        </div>
                    </div>

                    <!-- Mock photo grid -->
                    <div v-if="selected.photos > 0" class="mb-4">
                        <div class="mb-2 text-xs font-semibold text-gray-600">
                            {{ selected.photos }} Field Photos
                        </div>
                        <div class="grid grid-cols-2 gap-1">
                            <div
                                v-for="i in Math.min(selected.photos, 4)"
                                :key="i"
                                class="h-16 overflow-hidden rounded bg-gray-200"
                            >
                                <img
                                    :src="PHOTO_URLS[i - 1]"
                                    class="h-full w-full object-cover"
                                    alt="Field photo"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="w-full rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                    >
                        View Full Inspection Report
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
