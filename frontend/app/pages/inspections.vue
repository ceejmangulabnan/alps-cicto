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

const inspections = reactive<Inspection[]>([
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
])

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

const RISK_DOT: Record<RiskLevel, string> = {
    High: '#b91c1c',
    Medium: '#c2410c',
    Low: '#a16207',
    None: '#6b7280',
}

const STATUS_DOT: Record<InspStatus, string> = {
    Completed: '#166534',
    Pending: '#a16207',
    'In Progress': '#0369a1',
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

const PHOTO_URLS = [
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1500651238895-b48e5d6c8f86?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&h=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop&auto=format',
]

const search = ref('')
const selected = ref<Inspection | null>(null)
const filterStatus = ref('All')
const statusFilterOptions = ['All', 'Completed', 'Pending', 'In Progress'] as string[]

const filtered = computed(() =>
    inspections.filter((i) => {
        const match =
            !search.value ||
            i.farmer.toLowerCase().includes(search.value.toLowerCase()) ||
            i.id.toLowerCase().includes(search.value.toLowerCase()) ||
            i.barangay.toLowerCase().includes(search.value.toLowerCase()) ||
            i.type.toLowerCase().includes(search.value.toLowerCase())
        const status =
            filterStatus.value === 'All' || i.status === filterStatus.value
        return match && status
    })
)

const stats = [
    {
        label: 'Total Inspections',
        val: inspections.length,
        color: '#2d6a2d',
        bg: '#e8f5e8',
        icon: 'i-lucide-clipboard-check',
    },
    {
        label: 'Completed',
        val: inspections.filter((i) => i.status === 'Completed').length,
        color: '#16a34a',
        bg: '#dcfce7',
        icon: 'i-lucide-check-circle',
    },
    {
        label: 'Pending',
        val: inspections.filter((i) => i.status === 'Pending').length,
        color: '#ca8a04',
        bg: '#fef3c7',
        icon: 'i-lucide-clock',
    },
    {
        label: 'High Risk Found',
        val: inspections.filter((i) => i.riskLevel === 'High').length,
        color: '#dc2626',
        bg: '#fee2e2',
        icon: 'i-lucide-triangle-alert',
    },
]

const detailFields = computed(() => {
    const s = selected.value
    if (!s) return []
    return [
        { label: 'Parcel', val: s.parcelId },
        { label: 'Date', val: s.date },
        { label: 'Officer', val: s.officer },
    ]
})

const showNewModal = ref(false)
const inspectionForm = reactive({
    parcel: '',
    farmer: '',
    barangay: '',
    type: 'Pre-harvest Assessment',
    date: '',
    officer: '',
    gps: '',
    photos: '',
    findings: '',
    riskLevel: 'Low',
    status: 'Pending',
})

const inspectionTypeOptions = [
    'Pre-harvest Assessment',
    'Pest & Disease Scouting',
    'Compliance Check',
    'Crop Establishment Visit',
    'Irrigation Audit',
    'Harvest Monitoring',
]
const riskLevelOptions: RiskLevel[] = ['High', 'Medium', 'Low', 'None']
const inspStatusOptions: InspStatus[] = ['Completed', 'Pending', 'In Progress']
const farmerOptions = computed(() =>
    [...new Set(inspections.map((i) => i.farmer))].sort()
)
const barangayOptions = computed(() =>
    [...new Set(inspections.map((i) => i.barangay))].sort()
)

const showEditModal = ref(false)
const editForm = reactive({
    id: '',
    parcelId: '',
    farmer: '',
    barangay: '',
    type: 'Pre-harvest Assessment',
    date: '',
    officer: '',
    gps: '',
    photos: '',
    findings: '',
    riskLevel: 'Low',
    status: 'Pending',
})

function openEditModal(ins: Inspection) {
    editForm.id = ins.id
    editForm.parcelId = ins.parcelId
    editForm.farmer = ins.farmer
    editForm.barangay = ins.barangay
    editForm.type = ins.type
    editForm.date = ins.date
    editForm.officer = ins.officer
    editForm.gps = ins.gps
    editForm.photos = String(ins.photos)
    editForm.findings = ins.findings
    editForm.riskLevel = ins.riskLevel
    editForm.status = ins.status
    showEditModal.value = true
}

function saveEdit() {
    const idx = inspections.findIndex(
        (r) => r.id === editForm.id
    )
    if (idx === -1) return
    const i = inspections[idx]
    i.parcelId = editForm.parcelId
    i.farmer = editForm.farmer
    i.barangay = editForm.barangay
    i.type = editForm.type
    i.date = editForm.date
    i.officer = editForm.officer
    i.gps = editForm.gps
    i.photos = Number(editForm.photos)
    i.findings = editForm.findings
    i.riskLevel = editForm.riskLevel as RiskLevel
    i.status = editForm.status as InspStatus
    showEditModal.value = false
}

const showDeleteModal = ref(false)
const deleteTarget = ref<Inspection | null>(null)

function askDelete(ins: Inspection) {
    deleteTarget.value = ins
    showDeleteModal.value = true
}

function confirmDelete() {
    const t = deleteTarget.value
    if (!t) return
    const idx = inspections.findIndex((r) => r.id === t.id)
    if (idx !== -1) inspections.splice(idx, 1)
    if (selected.value?.id === t.id) selected.value = null
    deleteTarget.value = null
    showDeleteModal.value = false
}
</script>

<template>
    <div class="p-6">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Field Inspections
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    GPS-tagged visits · Photo documentation
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="showNewModal = true"
            >
                <UIcon name="i-lucide-plus" class="size-3.5" />
                New Inspection
            </button>
        </div>

        <!-- Stats -->
        <div class="mb-5 grid grid-cols-4 gap-4">
            <div
                v-for="s in stats"
                :key="s.label"
                class="alps-card relative overflow-hidden p-4"
            >
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${s.color}, transparent)`,
                    }"
                />
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: s.bg }"
                >
                    <UIcon
                        :name="s.icon"
                        class="size-4.5"
                        :style="{ color: s.color }"
                    />
                </div>
                <div
                    class="mb-1 text-xl font-bold font-sans"
                    :style="{
                        color: s.color,
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
                <div class="relative mb-3 max-w-sm">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search farmer, barangay, or type..."
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
                    class="mb-4 flex flex-wrap items-center gap-1.5"
                >
                    <button
                        v-for="s in statusFilterOptions"
                        :key="s"
                        type="button"
                        class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                        :class="
                            filterStatus === s
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        "
                        @click="filterStatus = s"
                    >
                        <span
                            v-if="s !== 'All'"
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: STATUS_DOT[s as InspStatus],
                            }"
                        />
                        {{ s }}
                    </button>
                    <span
                        class="ml-auto text-[11px] text-gray-400"
                    >
                        {{ filtered.length }} of {{ inspections.length }} shown
                    </span>
                </div>
                <div class="space-y-3">
                    <div
                        v-for="ins in filtered"
                        :key="ins.id"
                        class="alps-card relative cursor-pointer overflow-hidden p-4 transition-all hover:border-green-200"
                        :class="
                            selected?.id === ins.id
                                ? 'border-green-300 bg-green-50/30'
                                : ''
                        "
                        @click="selected = ins"
                    >
                        <div
                            v-if="selected?.id === ins.id"
                            class="absolute inset-y-0 left-0 w-1 bg-[#2d6a2d]"
                        />
                        <div class="mb-2 flex items-start justify-between">
                            <div class="flex items-center gap-2.5">
                                <span
                                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                    :style="{
                                        backgroundColor: avatarColor(
                                            ins.farmer
                                        ),
                                    }"
                                >
                                    {{ initials(ins.farmer) }}
                                </span>
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
                            <div class="flex flex-col items-end gap-2">
                                <div class="flex items-center gap-2">
                                    <span
                                        :class="RISK_STYLE[ins.riskLevel]"
                                        class="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background: RISK_DOT[
                                                    ins.riskLevel
                                                ],
                                            }"
                                        />
                                        {{ ins.riskLevel }} Risk
                                    </span>
                                    <span
                                        :class="STATUS_STYLE[ins.status]"
                                        class="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background:
                                                    STATUS_DOT[ins.status],
                                            }"
                                        />
                                        {{ ins.status }}
                                    </span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button
                                        type="button"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                        @click.stop="openEditModal(ins)"
                                    >
                                        <UIcon
                                            name="i-lucide-pencil"
                                            class="size-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        @click.stop="askDelete(ins)"
                                    >
                                        <UIcon
                                            name="i-lucide-trash-2"
                                            class="size-3.5"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
                        >
                            <span
                                class="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                            >
                                <UIcon
                                    name="i-lucide-tags"
                                    class="size-2.5"
                                />
                                {{ ins.type }}
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
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-user"
                                    class="size-[10px]"
                                />
                                {{ ins.farmer }}
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
                <div class="alps-card sticky top-4 overflow-hidden">
                    <div
                        class="absolute inset-x-0 top-0 h-1 opacity-80"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${STATUS_DOT[selected.status]}, transparent)`,
                        }"
                    />
                    <div class="p-5">
                        <div class="flex items-start justify-between">
                            <div>
                                <h3
                                    class="text-sm font-bold text-gray-800"
                                >
                                    {{ selected.id }}
                                </h3>
                                <div
                                    class="mt-0.5 font-mono text-[10px] text-gray-400"
                                >
                                    {{ selected.parcelId }} ·
                                    {{ selected.type }}
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1.5">
                                <span
                                    :class="RISK_STYLE[selected.riskLevel]"
                                    class="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                RISK_DOT[selected.riskLevel],
                                        }"
                                    />
                                    {{ selected.riskLevel }} Risk
                                </span>
                                <span
                                    :class="STATUS_STYLE[selected.status]"
                                    class="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                STATUS_DOT[selected.status],
                                        }"
                                    />
                                    {{ selected.status }}
                                </span>
                            </div>
                        </div>

                        <div class="mt-4 flex items-center gap-2.5">
                            <span
                                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                :style="{
                                    backgroundColor: avatarColor(
                                        selected.farmer
                                    ),
                                }"
                            >
                                {{ initials(selected.farmer) }}
                            </span>
                            <div>
                                <div
                                    class="text-xs font-semibold text-gray-800"
                                >
                                    {{ selected.farmer }}
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

                        <div
                            class="mt-4 grid grid-cols-2 gap-2.5"
                        >
                            <div
                                v-for="f in detailFields"
                                :key="f.label"
                                class="rounded-lg bg-gray-50 px-3 py-2"
                            >
                                <div class="text-[10px] text-gray-400">
                                    {{ f.label }}
                                </div>
                                <div
                                    class="mt-0.5 font-medium text-gray-700"
                                >
                                    {{ f.val }}
                                </div>
                            </div>
                            <div class="rounded-lg bg-gray-50 px-3 py-2">
                                <div class="text-[10px] text-gray-400">
                                    Photos
                                </div>
                                <div
                                    class="mt-0.5 flex items-center gap-1 font-medium text-gray-700"
                                >
                                    <UIcon
                                        name="i-lucide-camera"
                                        class="size-3"
                                    />
                                    {{ selected.photos }} taken
                                </div>
                            </div>
                        </div>

                        <div class="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                            <div
                                class="mb-0.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase"
                            >
                                <UIcon
                                    name="i-lucide-crosshair"
                                    class="size-2.5"
                                />
                                GPS Coordinates
                            </div>
                            <div class="font-mono text-[11px] text-gray-700">
                                {{ selected.gps }}
                            </div>
                        </div>

                        <div class="mt-4 rounded-lg bg-amber-50/70 p-3">
                            <div
                                class="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-600"
                            >
                                <UIcon
                                    name="i-lucide-pen-line"
                                    class="size-3"
                                />
                                Findings
                            </div>
                            <div class="text-xs leading-relaxed text-gray-600">
                                {{ selected.findings }}
                            </div>
                        </div>

                        <!-- Mock photo grid -->
                        <div v-if="selected.photos > 0" class="mt-4">
                            <div
                                class="mb-2 text-xs font-semibold text-gray-600"
                            >
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
                            class="mt-4 w-full rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            View Full Inspection Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showNewModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showNewModal = false"
        >
            <div
                class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-clipboard-check"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                New Inspection
                            </h3>
                            <p class="text-xs text-gray-500">
                                Log a field inspection visit with findings.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showNewModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="showNewModal = false">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Parcel
                            </label>
                            <input
                                v-model="inspectionForm.parcel"
                                type="text"
                                placeholder="e.g. PLC-0202"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farmer
                            </label>
                            <input
                                v-model="inspectionForm.farmer"
                                type="text"
                                list="insp-farmer-options"
                                placeholder="e.g. Rosa Dizon"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="insp-farmer-options">
                                <option
                                    v-for="f in farmerOptions"
                                    :key="f"
                                    :value="f"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <input
                                v-model="inspectionForm.barangay"
                                type="text"
                                list="insp-barangay-options"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="insp-barangay-options">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Type
                            </label>
                            <select
                                v-model="inspectionForm.type"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="t in inspectionTypeOptions"
                                    :key="t"
                                    :value="t"
                                >
                                    {{ t }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date
                            </label>
                            <input
                                v-model="inspectionForm.date"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Officer
                            </label>
                            <input
                                v-model="inspectionForm.officer"
                                type="text"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                GPS Coordinates
                            </label>
                            <input
                                v-model="inspectionForm.gps"
                                type="text"
                                placeholder="15.03° N, 120.69° E"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                No. of Photos
                            </label>
                            <input
                                v-model="inspectionForm.photos"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="inspectionForm.findings"
                            rows="3"
                            placeholder="Observations, potential issues, and recommended follow-ups..."
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="inspectionForm.riskLevel"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="r in riskLevelOptions"
                                    :key="r"
                                    :value="r"
                                >
                                    {{ r }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status
                            </label>
                            <select
                                v-model="inspectionForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in inspStatusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showNewModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Start Inspection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showEditModal = false"
        >
            <div
                class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f0fb]"
                        >
                            <UIcon
                                name="i-lucide-pencil"
                                class="size-5 text-[#1d6fa4]"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Edit Inspection
                            </h3>
                            <p class="text-xs text-gray-500">
                                Update the inspection visit details.
                            </p>
                        </div>
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
                                Parcel
                            </label>
                            <input
                                v-model="editForm.parcelId"
                                type="text"
                                placeholder="e.g. PLC-0202"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Farmer
                            </label>
                            <input
                                v-model="editForm.farmer"
                                type="text"
                                list="insp-farmer-options-edit"
                                placeholder="e.g. Rosa Dizon"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="insp-farmer-options-edit">
                                <option
                                    v-for="f in farmerOptions"
                                    :key="f"
                                    :value="f"
                                />
                            </datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <input
                                v-model="editForm.barangay"
                                type="text"
                                list="insp-barangay-options-edit"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="insp-barangay-options-edit">
                                <option
                                    v-for="b in barangayOptions"
                                    :key="b"
                                    :value="b"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Type
                            </label>
                            <select
                                v-model="editForm.type"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="t in inspectionTypeOptions"
                                    :key="t"
                                    :value="t"
                                >
                                    {{ t }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date
                            </label>
                            <input
                                v-model="editForm.date"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Officer
                            </label>
                            <input
                                v-model="editForm.officer"
                                type="text"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                GPS Coordinates
                            </label>
                            <input
                                v-model="editForm.gps"
                                type="text"
                                placeholder="15.03° N, 120.69° E"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                No. of Photos
                            </label>
                            <input
                                v-model="editForm.photos"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="editForm.findings"
                            rows="3"
                            placeholder="Observations and recommended follow-ups..."
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="editForm.riskLevel"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="r in riskLevelOptions"
                                    :key="r"
                                    :value="r"
                                >
                                    {{ r }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status
                            </label>
                            <select
                                v-model="editForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in inspStatusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
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

    <!-- Delete Inspection Modal -->
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
                    Delete Inspection
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
