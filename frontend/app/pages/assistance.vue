<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type AssistanceStatus = 'Released' | 'For Release' | 'Pending' | 'Scheduled'

type AssistanceProgram = {
    id: string
    program: string
    recipient: string
    barangay: string
    items: string
    value: number
    date: string
    status: AssistanceStatus
}

const assistancePrograms = reactive<AssistanceProgram[]>([
    {
        id: 'AST-001',
        program: 'Rice Seed Subsidy',
        recipient: 'Rosa Dizon',
        barangay: 'Sindalan',
        items: '4 bags certified rice seed (40 kg), 1 bag fertilizer',
        value: 5200,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        id: 'AST-002',
        program: 'Rice Seed Subsidy',
        recipient: 'Jose Mendoza',
        barangay: 'Sto. Niño',
        items: '5 bags certified rice seed (40 kg), 2 bags urea',
        value: 7800,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        id: 'AST-003',
        program: 'Corn Seed Assistance',
        recipient: 'Arturo Salazar',
        barangay: 'Pulung Bulu',
        items: '3 bags hybrid corn seed, 1 bag complete fertilizer',
        value: 6400,
        date: '2024-11-12',
        status: 'Released',
    },
    {
        id: 'AST-004',
        program: 'Veggie Growers Kit',
        recipient: 'Ana Reyes',
        barangay: 'Calulut',
        items: 'Assorted vegetable seeds, organic fertilizers, drip hoses',
        value: 3850,
        date: '2024-11-18',
        status: 'For Release',
    },
    {
        id: 'AST-005',
        program: 'Farm Machinery Access',
        recipient: 'Carlos Garcia',
        barangay: 'Pulung Bulu',
        items: 'Tractor service (2 ha), 1 pump engine rental',
        value: 9400,
        date: '2024-11-22',
        status: 'For Release',
    },
    {
        id: 'AST-006',
        program: 'Livelihood Starter Pack',
        recipient: 'Liza Ramos',
        barangay: 'Dolores',
        items: 'Feeds, 10 native chickens, starter housing',
        value: 15000,
        date: '2024-11-28',
        status: 'Pending',
    },
    {
        id: 'AST-007',
        program: 'Training - Rice Production',
        recipient: 'Elena Bautista',
        barangay: 'San Pedro',
        items: 'Capacity building (3-day), training kits',
        value: 2500,
        date: '2024-12-05',
        status: 'Scheduled',
    },
    {
        id: 'AST-008',
        program: 'Soil Amendment Support',
        recipient: 'Fe Domingo',
        barangay: 'Del Pilar',
        items: '10 bags biochar, 5 bags lime',
        value: 4600,
        date: '2024-12-08',
        status: 'Pending',
    },
])

const STATUS_STYLE: Record<AssistanceStatus, string> = {
    Released: 'status-cultivated',
    'For Release': 'status-preparation',
    Pending: 'status-harvesting',
    Scheduled: 'status-idle',
}

const STATUS_DOT: Record<AssistanceStatus, string> = {
    Released: '#166534',
    'For Release': '#0369a1',
    Pending: '#a16207',
    Scheduled: '#4b5563',
}

const PROGRAM_COLORS: Record<string, string> = {
    'Rice Seed Subsidy': '#16a34a',
    'Corn Seed Assistance': '#ca8a04',
    'Veggie Growers Kit': '#7c3aed',
    'Farm Machinery Access': '#1d6fa4',
    'Livelihood Starter Pack': '#0891b2',
    'Training - Rice Production': '#6b7280',
    'Soil Amendment Support': '#d97706',
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

const statusFilterOptions = [
    'All',
    'Released',
    'For Release',
    'Pending',
    'Scheduled',
] as string[]

const search = ref('')
const filterStatus = ref('All')

const filtered = computed(() =>
    assistancePrograms.filter((a) => {
        const match =
            !search.value ||
            a.recipient.toLowerCase().includes(search.value.toLowerCase()) ||
            a.program.toLowerCase().includes(search.value.toLowerCase()) ||
            a.barangay.toLowerCase().includes(search.value.toLowerCase()) ||
            a.items.toLowerCase().includes(search.value.toLowerCase())
        const status =
            filterStatus.value === 'All' || a.status === filterStatus.value
        return match && status
    })
)

const kpis = computed(() => [
    {
        label: 'Total Programs',
        val: assistancePrograms.length,
        icon: 'i-lucide-hand-heart',
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Released',
        val: assistancePrograms.filter((a) => a.status === 'Released').length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Pending Release',
        val: assistancePrograms.filter((a) => a.status !== 'Released').length,
        icon: 'i-lucide-clock',
        color: '#ca8a04',
        bg: '#fef3c7',
    },
    {
        label: 'Total Value (₱)',
        val: `${assistancePrograms
            .reduce((acc, a) => acc + a.value, 0)
            .toLocaleString()}`,
        icon: 'i-lucide-package',
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
])

const showRecordModal = ref(false)
const assistanceForm = reactive({
    program: '',
    recipient: '',
    barangay: '',
    items: '',
    value: '',
    date: '',
    status: 'Pending',
})

const programOptions = computed(() =>
    [...new Set(assistancePrograms.map((a) => a.program))].sort()
)
const recipientOptions = computed(() =>
    [...new Set(assistancePrograms.map((a) => a.recipient))].sort()
)
const barangayOptions = computed(() =>
    [...new Set(assistancePrograms.map((a) => a.barangay))].sort()
)
const assistStatusOptions: AssistanceStatus[] = [
    'Released',
    'For Release',
    'Pending',
    'Scheduled',
]

const showEditModal = ref(false)
const editForm = reactive({
    id: '',
    program: '',
    recipient: '',
    barangay: '',
    items: '',
    value: '',
    date: '',
    status: 'Pending',
})

function openEditModal(a: AssistanceProgram) {
    editForm.id = a.id
    editForm.program = a.program
    editForm.recipient = a.recipient
    editForm.barangay = a.barangay
    editForm.items = a.items
    editForm.value = String(a.value)
    editForm.date = a.date
    editForm.status = a.status
    showEditModal.value = true
}

function saveEdit() {
    const idx = assistancePrograms.findIndex(
        (r) => r.id === editForm.id
    )
    if (idx === -1) return
    const a = assistancePrograms[idx]
    a.program = editForm.program
    a.recipient = editForm.recipient
    a.barangay = editForm.barangay
    a.items = editForm.items
    a.value = Number(editForm.value)
    a.date = editForm.date
    a.status = editForm.status as AssistanceStatus
    showEditModal.value = false
}

const showDeleteModal = ref(false)
const deleteTarget = ref<AssistanceProgram | null>(null)

function askDelete(a: AssistanceProgram) {
    deleteTarget.value = a
    showDeleteModal.value = true
}

function confirmDelete() {
    const t = deleteTarget.value
    if (!t) return
    const idx = assistancePrograms.findIndex((r) => r.id === t.id)
    if (idx !== -1) assistancePrograms.splice(idx, 1)
    deleteTarget.value = null
    showDeleteModal.value = false
}
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Assistance Programs
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Seed, fertilizer, training, and livelihood support
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="showRecordModal = true"
            >
                <UIcon name="i-lucide-hand-heart" class="size-3.5" />
                Record Assistance
            </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-4 gap-4">
            <div v-for="kpi in kpis" :key="kpi.label" class="alps-card relative overflow-hidden p-5">
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${kpi.color}, transparent)`,
                    }"
                />
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

        <div class="alps-card overflow-hidden">
            <div
                class="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4"
            >
                <h3 class="text-sm font-semibold text-gray-700">
                    Assistance Records
                </h3>
                <div class="relative ml-auto w-64">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search recipient, program, item..."
                        class="w-full rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-xs shadow-sm focus:border-[#2d6a2d] focus:outline-none focus:ring-1 focus:ring-green-500"
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
            </div>
            <div
                class="flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-gray-50/60 px-5 py-2.5"
            >
                <span
                    class="mr-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase"
                >
                    Status
                </span>
                <button
                    v-for="s in statusFilterOptions"
                    :key="s"
                    type="button"
                    class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors"
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
                            background: STATUS_DOT[s as AssistanceStatus],
                        }"
                    />
                    {{ s }}
                </button>
                <span class="ml-auto text-[11px] text-gray-400">
                    {{ filtered.length }} of {{ assistancePrograms.length }} shown
                </span>
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
                            Program
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Recipient
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Barangay
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Items
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Value (₱)
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
                        v-for="(a, i) in filtered"
                        :key="a.id"
                        class="border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                        :class="
                            i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                        "
                    >
                        <td class="px-5 py-3 font-mono text-gray-400">
                            {{ a.id }}
                        </td>
                        <td class="px-4 py-3">
                            <span
                                class="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
                                :style="{
                                    background: `${
                                        PROGRAM_COLORS[a.program] ?? '#6b7280'
                                    }1a`,
                                    color:
                                        PROGRAM_COLORS[a.program] ?? '#6b7280',
                                }"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{
                                        background:
                                            PROGRAM_COLORS[a.program] ??
                                            '#6b7280',
                                    }"
                                />
                                {{ a.program }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2.5">
                                <span
                                    class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    :style="{
                                        backgroundColor: avatarColor(
                                            a.recipient
                                        ),
                                    }"
                                >
                                    {{ initials(a.recipient) }}
                                </span>
                                <span class="font-medium text-gray-800">
                                    {{ a.recipient }}
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            {{ a.barangay }}
                        </td>
                        <td
                            class="max-w-xs truncate px-4 py-3 text-gray-600"
                        >
                            {{ a.items }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono font-medium text-green-700"
                        >
                            {{
                                a.value > 0
                                    ? `₱${a.value.toLocaleString()}`
                                    : '—'
                            }}
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-calendar"
                                    class="size-[10px] text-gray-400"
                                />
                                {{ a.date }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span
                                :class="STATUS_STYLE[a.status] || 'status-idle'"
                                class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{
                                        background: STATUS_DOT[a.status],
                                    }"
                                />
                                {{ a.status }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div
                                class="flex items-center justify-end gap-1"
                            >
                                <button
                                    type="button"
                                    class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    @click="openEditModal(a)"
                                >
                                    <UIcon
                                        name="i-lucide-pencil"
                                        class="size-3.5"
                                    />
                                </button>
                                <button
                                    type="button"
                                    class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                    @click="askDelete(a)"
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

    <!-- Record Assistance Modal -->
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
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-hand-heart"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Record Assistance
                            </h3>
                            <p class="text-xs text-gray-500">
                                Log an assistance program for a farmer.
                            </p>
                        </div>
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
                                Program
                            </label>
                            <select
                                v-model="assistanceForm.program"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="" disabled>
                                    Select a program...
                                </option>
                                <option
                                    v-for="p in programOptions"
                                    :key="p"
                                    :value="p"
                                >
                                    {{ p }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Recipient
                            </label>
                            <input
                                v-model="assistanceForm.recipient"
                                type="text"
                                list="assist-recipient-options"
                                placeholder="e.g. Rosa Dizon"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-recipient-options">
                                <option
                                    v-for="r in recipientOptions"
                                    :key="r"
                                    :value="r"
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
                                v-model="assistanceForm.barangay"
                                type="text"
                                list="assist-barangay-options"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-barangay-options">
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
                                Value (₱)
                            </label>
                            <input
                                v-model="assistanceForm.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="assistanceForm.items"
                            rows="2"
                            placeholder="e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date
                            </label>
                            <input
                                v-model="assistanceForm.date"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status
                            </label>
                            <select
                                v-model="assistanceForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in assistStatusOptions"
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
                            @click="showRecordModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            Record Assistance
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Assistance Modal -->
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
                                Edit Assistance
                            </h3>
                            <p class="text-xs text-gray-500">
                                Update the assistance program details.
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
                                Program
                            </label>
                            <select
                                v-model="editForm.program"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="p in programOptions"
                                    :key="p"
                                    :value="p"
                                >
                                    {{ p }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Recipient
                            </label>
                            <input
                                v-model="editForm.recipient"
                                type="text"
                                list="assist-recipient-options-edit"
                                placeholder="e.g. Rosa Dizon"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-recipient-options-edit">
                                <option
                                    v-for="r in recipientOptions"
                                    :key="r"
                                    :value="r"
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
                                list="assist-barangay-options-edit"
                                placeholder="Select barangay"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-barangay-options-edit">
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
                                Value (₱)
                            </label>
                            <input
                                v-model="editForm.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="editForm.items"
                            rows="2"
                            placeholder="e.g. 4 bags certified rice seed (40 kg)"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
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
                                Status
                            </label>
                            <select
                                v-model="editForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in assistStatusOptions"
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

    <!-- Delete Assistance Modal -->
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
                    Delete Assistance
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.id }}
                    </span>
                    ({{ deleteTarget?.program }}) for
                    {{ deleteTarget?.recipient }}? This action cannot be
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
