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

        <div class="alps-card overflow-hidden">
            <div class="border-b border-gray-100 px-5 py-4">
                <h3 class="text-sm font-semibold text-gray-700">
                    Assistance Records
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
                        v-for="a in assistancePrograms"
                        :key="a.id"
                        class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                        <td class="px-5 py-3 font-mono text-gray-400">
                            {{ a.id }}
                        </td>
                        <td class="px-4 py-3 font-medium text-gray-800">
                            {{ a.program }}
                        </td>
                        <td class="px-4 py-3 text-gray-700">
                            {{ a.recipient }}
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            {{ a.barangay }}
                        </td>
                        <td class="max-w-xs truncate px-4 py-3 text-gray-600">
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
                                class="rounded px-2 py-0.5 text-[10px] font-medium"
                            >
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
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Record Assistance
                        </h3>
                        <p class="text-xs text-gray-500">
                            Log an assistance program for a farmer.
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
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Edit Assistance
                        </h3>
                        <p class="text-xs text-gray-500">
                            Update the assistance program details.
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
