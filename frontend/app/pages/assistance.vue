<script setup lang="ts">
import {
    ASSISTANCE_STATUS_OPTIONS,
    useAssistanceApi,
    type AssistanceStatus,
} from '~/composables/useAssistanceApi'
import {
    useAssistanceRegistry,
    type AssistanceRow,
} from '~/composables/useAssistanceRegistry'
import { getErrorMessage } from '~/utils/apiError'
import { avatarColor, initials } from '~/utils/initials'

definePageMeta({ middleware: 'auth' })

const {
    programs,
    farmers,
    barangays,
    programOptions,
    loading,
    loadError,
    load,
} = useAssistanceRegistry()
const { create, update, deleteProgram } = useAssistanceApi()

/** Reuses the shared land-status pills, one shade per assistance status. */
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

/**
 * Program colours, keyed by name. A program recorded outside this list still
 * renders — it falls back to the neutral grey rather than losing its pill.
 */
const PROGRAM_COLORS: Record<string, string> = {
    'Rice Seed Subsidy': '#16a34a',
    'Corn Seed Assistance': '#ca8a04',
    'Veggie Growers Kit': '#7c3aed',
    'Farm Machinery Access': '#1d6fa4',
    'Livelihood Starter Pack': '#0891b2',
    'Training - Rice Production': '#6b7280',
    'Soil Amendment Support': '#d97706',
}

const programColor = (program: string) => PROGRAM_COLORS[program] ?? '#6b7280'

function today(): string {
    return new Date().toISOString().slice(0, 10)
}

const peso = (value: number) => (value > 0 ? `₱${value.toLocaleString()}` : '—')

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

const kpis = computed(() => [
    {
        label: 'Total Programs',
        val: programs.value.length,
        icon: 'i-lucide-hand-heart',
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Released',
        val: programs.value.filter((row) => row.status === 'Released').length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Pending Release',
        val: programs.value.filter((row) => row.status !== 'Released').length,
        icon: 'i-lucide-clock',
        color: '#ca8a04',
        bg: '#fef3c7',
    },
    {
        label: 'Total Value (₱)',
        val: programs.value
            .reduce((acc, row) => acc + row.value, 0)
            .toLocaleString(),
        icon: 'i-lucide-package',
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
])

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', ...ASSISTANCE_STATUS_OPTIONS] as const
type StatusFilter = (typeof statusFilterOptions)[number]
const filterStatus = ref<StatusFilter>('All')
const search = ref('')

const filtered = computed(() =>
    programs.value.filter((row) => {
        const haystack = [
            row.reference_code,
            row.program,
            row.recipient,
            row.farmer_code,
            row.barangay,
            row.items,
        ]
            .join(' ')
            .toLowerCase()
        const match =
            !search.value || haystack.includes(search.value.toLowerCase())
        const status =
            filterStatus.value === 'All' || row.status === filterStatus.value
        return match && status
    })
)

onMounted(() => {
    load()
})

/* ------------------------------------------------------------------ */
/* Record assistance                                                   */
/* ------------------------------------------------------------------ */

const showRecordModal = ref(false)
const submittingNew = ref(false)
const newError = ref<string | null>(null)
const newSaved = ref(false)
let newCloseTimer: ReturnType<typeof setTimeout> | null = null

const newForm = reactive({
    program: '',
    farmerDocumentId: '',
    barangayDocumentId: '',
    items: '',
    /** v-model casts the number input, so this is a string only while blank. */
    value: '' as string | number,
    date: today(),
    status: 'Pending' as AssistanceStatus,
})

const canSaveNew = computed(
    () =>
        !submittingNew.value &&
        Boolean(newForm.program.trim()) &&
        Boolean(newForm.farmerDocumentId) &&
        Boolean(newForm.date)
)

/**
 * The peso amount, or null when the field is left blank.
 *
 * `raw` is typed `string | number` on purpose: v-model casts a `type="number"`
 * input to a real number the moment the typed text parses, so a clean amount
 * like `5000` arrives here as a number and only a blank field arrives as the
 * empty string. Zero is a real peso amount, so only a blank field is nulled.
 */
const parsedValue = (raw: string | number): number | null => {
    const amount = Number(raw)
    return String(raw).trim() !== '' && Number.isFinite(amount) ? amount : null
}

function openRecordModal() {
    newForm.program = ''
    newForm.farmerDocumentId = ''
    newForm.barangayDocumentId = ''
    newForm.items = ''
    newForm.value = ''
    newForm.date = today()
    newForm.status = 'Pending'
    newError.value = null
    newSaved.value = false
    showRecordModal.value = true
}

function closeRecordModal() {
    if (submittingNew.value) return
    if (newCloseTimer) {
        clearTimeout(newCloseTimer)
        newCloseTimer = null
    }
    newSaved.value = false
    showRecordModal.value = false
}

async function submitNew() {
    newError.value = null
    submittingNew.value = true
    try {
        await create({
            program: newForm.program.trim(),
            farmer: newForm.farmerDocumentId,
            barangay: newForm.barangayDocumentId || null,
            items: newForm.items.trim() || null,
            value: parsedValue(newForm.value),
            date: newForm.date,
            status: newForm.status,
        })
        newSaved.value = true
        newCloseTimer = setTimeout(() => {
            newCloseTimer = null
            newSaved.value = false
            showRecordModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        newError.value = getErrorMessage(
            cause,
            'Failed to record the assistance. Please try again.'
        )
    } finally {
        submittingNew.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Edit assistance                                                     */
/* ------------------------------------------------------------------ */

const showEditModal = ref(false)
const submittingEdit = ref(false)
const editError = ref<string | null>(null)
const editSaved = ref(false)
let editCloseTimer: ReturnType<typeof setTimeout> | null = null

const editForm = reactive({
    documentId: '',
    program: '',
    farmerDocumentId: '',
    barangayDocumentId: '',
    items: '',
    /** v-model casts the number input, so this is a string only while blank. */
    value: '' as string | number,
    date: '',
    status: 'Pending' as AssistanceStatus,
})

const canSaveEdit = computed(
    () =>
        !submittingEdit.value &&
        Boolean(editForm.program.trim()) &&
        Boolean(editForm.farmerDocumentId) &&
        Boolean(editForm.date)
)

function openEditModal(row: AssistanceRow) {
    editForm.documentId = row.documentId
    editForm.program = row.program
    editForm.farmerDocumentId = row.farmerDocumentId
    editForm.barangayDocumentId = row.barangayDocumentId
    editForm.items = row.items
    editForm.value = row.value > 0 ? String(row.value) : ''
    editForm.date = row.date ?? ''
    editForm.status = row.status
    editError.value = null
    editSaved.value = false
    showEditModal.value = true
}

function closeEditModal() {
    if (submittingEdit.value) return
    if (editCloseTimer) {
        clearTimeout(editCloseTimer)
        editCloseTimer = null
    }
    editSaved.value = false
    showEditModal.value = false
}

async function submitEdit() {
    editError.value = null
    submittingEdit.value = true
    try {
        await update(editForm.documentId, {
            program: editForm.program.trim(),
            farmer: editForm.farmerDocumentId,
            barangay: editForm.barangayDocumentId || null,
            items: editForm.items.trim() || null,
            value: parsedValue(editForm.value),
            date: editForm.date,
            status: editForm.status,
        })
        editSaved.value = true
        editCloseTimer = setTimeout(() => {
            editCloseTimer = null
            editSaved.value = false
            showEditModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        editError.value = getErrorMessage(
            cause,
            'Failed to update the assistance. Please try again.'
        )
    } finally {
        submittingEdit.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Delete assistance                                                   */
/* ------------------------------------------------------------------ */

const showDeleteModal = ref(false)
const deleteTarget = ref<AssistanceRow | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function askDelete(row: AssistanceRow) {
    deleteTarget.value = row
    deleteError.value = null
    showDeleteModal.value = true
}

function closeDeleteModal() {
    if (deleting.value) return
    deleteTarget.value = null
    showDeleteModal.value = false
}

async function confirmDelete() {
    const target = deleteTarget.value
    if (!target) return
    deleting.value = true
    deleteError.value = null
    try {
        await deleteProgram(target.documentId)
        deleteTarget.value = null
        showDeleteModal.value = false
        await load()
    } catch (cause) {
        deleteError.value = getErrorMessage(
            cause,
            'Failed to delete the assistance. Please try again.'
        )
    } finally {
        deleting.value = false
    }
}
</script>

<template>
    <div class="space-y-6 p-4 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
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
                @click="openRecordModal"
            >
                <UIcon name="i-lucide-hand-heart" class="size-3.5" />
                Record Assistance
            </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
                v-for="kpi in kpis"
                :key="kpi.label"
                class="alps-card relative overflow-hidden p-5"
            >
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
                    {{ filtered.length }} of {{ programs.length }} shown
                </span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-xs">
                    <thead class="border-b border-gray-100 bg-gray-50">
                        <tr>
                            <th
                                class="px-5 py-3 text-left font-semibold text-gray-600"
                            >
                                Ref
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
                        <!-- Loading -->
                        <tr v-if="loading">
                            <td
                                colspan="9"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                <span class="inline-flex items-center gap-2">
                                    <UIcon
                                        name="i-lucide-loader-circle"
                                        class="size-4 animate-spin"
                                    />
                                    Loading assistance records...
                                </span>
                            </td>
                        </tr>
                        <!-- Failed -->
                        <tr v-else-if="loadError">
                            <td colspan="9" class="px-4 py-10 text-center">
                                <p class="text-red-600">{{ loadError }}</p>
                                <button
                                    type="button"
                                    class="mt-2 text-xs font-medium text-green-700 underline"
                                    @click="load"
                                >
                                    Try again
                                </button>
                            </td>
                        </tr>
                        <!-- Loaded but nothing to show -->
                        <tr v-else-if="programs.length === 0">
                            <td
                                colspan="9"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                <div class="flex flex-col items-center gap-2">
                                    <UIcon
                                        name="i-lucide-hand-heart"
                                        class="size-6 text-gray-300"
                                    />
                                    <p>
                                        No assistance recorded yet. Log the
                                        first release against a farmer.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="filtered.length === 0">
                            <td
                                colspan="9"
                                class="px-4 py-10 text-center text-gray-400"
                            >
                                No assistance records match this search.
                            </td>
                        </tr>
                        <tr
                            v-for="(a, i) in filtered"
                            v-else
                            :key="a.documentId"
                            class="border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                            :class="i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'"
                        >
                            <td class="px-5 py-3 font-mono text-gray-400">
                                {{ a.reference_code }}
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
                                    :style="{
                                        background: `${programColor(a.program)}1a`,
                                        color: programColor(a.program),
                                    }"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background: programColor(a.program),
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
                                    <span class="min-w-0">
                                        <span
                                            class="block font-medium text-gray-800"
                                        >
                                            {{ a.recipient }}
                                        </span>
                                        <!--
                                            The farmer, one hop away: their code
                                            links into the farmer registry's
                                            profile, mirroring the `?farm=` deep
                                            link the parcel hub uses for a farm.
                                            Falls back to plain text when the
                                            relation is gone, so the link never
                                            leads nowhere.
                                        -->
                                        <NuxtLink
                                            v-if="a.farmerDocumentId"
                                            :to="{
                                                path: '/farmers',
                                                query: {
                                                    farmer: a.farmerDocumentId,
                                                },
                                            }"
                                            class="block font-mono text-[10px] text-gray-400 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                            :title="`Open ${a.recipient}'s profile`"
                                        >
                                            {{ a.farmer_code }}
                                        </NuxtLink>
                                        <span
                                            v-else
                                            class="block font-mono text-[10px] text-gray-400"
                                        >
                                            {{ a.farmer_code || '—' }}
                                        </span>
                                    </span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-gray-500">
                                {{ a.barangay || '—' }}
                            </td>
                            <td
                                class="max-w-xs truncate px-4 py-3 text-gray-600"
                                :title="a.items"
                            >
                                {{ a.items || '—' }}
                            </td>
                            <td
                                class="px-4 py-3 text-right font-mono font-medium text-green-700"
                            >
                                {{ peso(a.value) }}
                            </td>
                            <td class="px-4 py-3 text-gray-500">
                                <span class="flex items-center gap-1">
                                    <UIcon
                                        name="i-lucide-calendar"
                                        class="size-[10px] text-gray-400"
                                    />
                                    {{ a.date ?? '—' }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    :class="
                                        STATUS_STYLE[a.status] || 'status-idle'
                                    "
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
                                        title="Edit assistance"
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
                                        title="Delete assistance"
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
    </div>

    <!-- Record Assistance Modal -->
    <Teleport to="body">
        <div
            v-if="showRecordModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRecordModal"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl font-sans"
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
                        @click="closeRecordModal"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="newSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Assistance recorded.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitNew">
                    <p
                        v-if="farmers.length === 0"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        No farmers registered yet. Register a farmer first, then
                        log the assistance here.
                    </p>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Program
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.program"
                                type="text"
                                list="assist-program-options"
                                placeholder="e.g. Rice Seed Subsidy"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-program-options">
                                <option
                                    v-for="p in programOptions"
                                    :key="p"
                                    :value="p"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Recipient
                                <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.farmerDocumentId"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="" disabled>
                                    Select a farmer...
                                </option>
                                <option
                                    v-for="f in farmers"
                                    :key="f.value"
                                    :value="f.value"
                                >
                                    {{ f.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="newForm.barangayDocumentId"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="">Not specified</option>
                                <option
                                    v-for="b in barangays"
                                    :key="b.value"
                                    :value="b.value"
                                >
                                    {{ b.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Value (₱)
                            </label>
                            <input
                                v-model="newForm.value"
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
                            v-model="newForm.items"
                            rows="2"
                            placeholder="e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.date"
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
                                v-model="newForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="s in ASSISTANCE_STATUS_OPTIONS"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="newError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ newError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingNew"
                            @click="closeRecordModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveNew"
                        >
                            <UIcon
                                v-if="submittingNew"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{
                                submittingNew
                                    ? 'Saving...'
                                    : 'Record Assistance'
                            }}
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEditModal"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl font-sans"
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
                        @click="closeEditModal"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="editSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Assistance updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Program
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.program"
                                type="text"
                                list="assist-program-options-edit"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <datalist id="assist-program-options-edit">
                                <option
                                    v-for="p in programOptions"
                                    :key="p"
                                    :value="p"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Recipient
                                <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.farmerDocumentId"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="f in farmers"
                                    :key="f.value"
                                    :value="f.value"
                                >
                                    {{ f.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="editForm.barangayDocumentId"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="">Not specified</option>
                                <option
                                    v-for="b in barangays"
                                    :key="b.value"
                                    :value="b.value"
                                >
                                    {{ b.label }}
                                </option>
                            </select>
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

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date
                                <span class="text-red-500">*</span>
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
                                    v-for="s in ASSISTANCE_STATUS_OPTIONS"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="editError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingEdit"
                            @click="closeEditModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveEdit"
                        >
                            <UIcon
                                v-if="submittingEdit"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submittingEdit ? 'Saving...' : 'Save Changes' }}
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDeleteModal"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl font-sans"
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
                        {{ deleteTarget?.reference_code }}
                    </span>
                    ({{ deleteTarget?.program }}) for
                    {{ deleteTarget?.recipient }}? This action cannot be undone.
                </p>
                <p
                    v-if="deleteError"
                    class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                    {{ deleteError }}
                </p>
                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        :disabled="deleting"
                        @click="closeDeleteModal"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="deleting"
                        @click="confirmDelete"
                    >
                        <UIcon
                            v-if="deleting"
                            name="i-lucide-loader-circle"
                            class="size-3.5 animate-spin"
                        />
                        {{ deleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
