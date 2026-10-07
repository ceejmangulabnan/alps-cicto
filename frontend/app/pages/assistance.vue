<script setup lang="ts">
//@ts-nocheck
import type { TableColumn } from '@nuxt/ui'
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

import {
    ASSISTANCE_STATUS_DOT,
    ASSISTANCE_STATUS_STYLE,
} from '~/utils/assistanceStatus'

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

const STATUS_STYLE = ASSISTANCE_STATUS_STYLE

const STATUS_DOT = ASSISTANCE_STATUS_DOT

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

const columns: TableColumn<AssistanceRow>[] = [
    { accessorKey: 'reference_code', header: sortHeader('Ref') },
    { accessorKey: 'program', header: sortHeader('Program') },
    { accessorKey: 'recipient', header: sortHeader('Recipient') },
    {
        accessorKey: 'barangay',
        header: sortHeader('Barangay'),
        meta: { class: { td: 'text-slate-600' } },
    },
    {
        accessorKey: 'items',
        header: sortHeader('Items'),
        meta: { class: { td: 'max-w-xs truncate text-slate-600' } },
    },
    {
        // The one numeric field: without sortDescFirst TanStack would peek at
        // the first row and start it descending-first while the string columns
        // start on ascending.
        accessorKey: 'value',
        header: sortHeader('Value (₱)', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold text-emerald-700',
            },
        },
    },
    {
        accessorKey: 'date',
        header: sortHeader('Date'),
        meta: { class: { td: 'text-slate-600' } },
    },
    { accessorKey: 'status', header: sortHeader('Status') },
    {
        // Buttons, not data: nothing to sort on.
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { th: 'text-right' } },
    },
]

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
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div
                    class="relative flex flex-wrap items-center justify-between gap-5"
                >
                    <div class="flex min-w-0 items-start gap-4">
                        <div
                            class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                        >
                            <UIcon name="i-lucide-hand-heart" class="size-6" />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-emerald-500"
                                    />
                                    Farmer Support & Distribution
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ programs.length }} assistance records
                                </span>
                            </div>

                            <h1
                                class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                Assistance Programs
                            </h1>

                            <p
                                class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                            >
                                Track seed, fertilizer, equipment, training, and
                                livelihood support released to farmers.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                        @click="openRecordModal"
                    >
                        <UIcon name="i-lucide-hand-heart" class="size-4.5" />
                        Record Assistance
                    </button>
                </div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="kpi in kpis"
                    :key="kpi.label"
                    class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}55, transparent)`,
                        }"
                    />

                    <div
                        class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                        :style="{ backgroundColor: kpi.color }"
                    />

                    <div class="relative flex h-full flex-col">
                        <div class="flex items-start justify-between gap-3">
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
                                :style="{ background: kpi.bg }"
                            >
                                <UIcon
                                    :name="kpi.icon"
                                    class="size-5"
                                    :style="{ color: kpi.color }"
                                />
                            </div>

                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{ backgroundColor: kpi.color }"
                                />
                                Live
                            </span>
                        </div>

                        <div class="mt-5">
                            <div
                                class="text-3xl font-bold tracking-tight text-slate-950"
                            >
                                {{ kpi.val }}
                            </div>
                            <div
                                class="mt-1 text-sm font-semibold text-slate-700"
                            >
                                {{ kpi.label }}
                            </div>
                        </div>

                        <div
                            class="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="size-3.5"
                                :style="{ color: kpi.color }"
                            />
                            <span>
                                {{
                                    kpi.label === 'Total Programs'
                                        ? 'All recorded assistance entries'
                                        : kpi.label === 'Released'
                                          ? 'Programs already released'
                                          : kpi.label === 'Pending Release'
                                            ? 'Programs awaiting release'
                                            : 'Combined recorded assistance value'
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Assistance Records -->
            <div
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
                >
                    <div>
                        <h2
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            Assistance Records
                        </h2>
                        <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                            Review farmer recipients, assistance programs,
                            released items, values, and status.
                        </p>
                    </div>

                    <div class="relative w-full sm:w-80">
                        <UIcon
                            name="i-lucide-search"
                            class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            v-model="search"
                            type="text"
                            placeholder="Search recipient, program, item..."
                            class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        />
                        <button
                            v-if="search"
                            type="button"
                            class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            @click="search = ''"
                        >
                            <UIcon name="i-lucide-x" class="size-3.5" />
                        </button>
                    </div>
                </div>

                <div
                    class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
                >
                    <span
                        class="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
                    >
                        Status
                    </span>

                    <button
                        v-for="s in statusFilterOptions"
                        :key="s"
                        type="button"
                        class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        :class="
                            filterStatus === s
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
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

                    <span class="ml-auto text-sm font-medium text-slate-500">
                        {{ filtered.length }} of {{ programs.length }} shown
                    </span>
                </div>

                <div class="overflow-x-auto">
                    <UTable
                        :data="filtered"
                        :columns="columns"
                        :loading="loading"
                        :get-row-id="(a: AssistanceRow) => a.documentId"
                        :ui="{
                            th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                            td: 'px-5 py-4 text-sm',
                            tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
                        }"
                    >
                        <template #reference_code-cell="{ row }">
                            <span
                                class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                            >
                                {{ row.original.reference_code }}
                            </span>
                        </template>

                        <template #program-cell="{ row }">
                            <span
                                class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                :style="{
                                    background: `${programColor(row.original.program)}1a`,
                                    color: programColor(row.original.program),
                                }"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{
                                        background: programColor(
                                            row.original.program
                                        ),
                                    }"
                                />
                                {{ row.original.program }}
                            </span>
                        </template>

                        <template #recipient-cell="{ row }">
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                    :style="{
                                        backgroundColor: avatarColor(
                                            row.original.recipient
                                        ),
                                    }"
                                >
                                    {{ initials(row.original.recipient) }}
                                </span>

                                <span class="min-w-0">
                                    <span
                                        class="block truncate font-medium text-slate-800"
                                    >
                                        {{ row.original.recipient }}
                                    </span>

                                    <NuxtLink
                                        v-if="row.original.farmerDocumentId"
                                        :to="{
                                            path: '/farmers',
                                            query: {
                                                farmer:
                                                    row.original
                                                        .farmerDocumentId,
                                            },
                                        }"
                                        class="mt-0.5 block font-mono text-xs text-slate-400 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                        :title="`Open ${row.original.recipient}'s profile`"
                                    >
                                        {{ row.original.farmer_code }}
                                    </NuxtLink>

                                    <span
                                        v-else
                                        class="mt-0.5 block font-mono text-xs text-slate-400"
                                    >
                                        {{ row.original.farmer_code || '—' }}
                                    </span>
                                </span>
                            </div>
                        </template>

                        <template #barangay-cell="{ row }">
                            <span class="flex items-center gap-1.5">
                                <UIcon
                                    name="i-lucide-map-pin"
                                    class="size-3.5 text-slate-400"
                                />
                                {{ row.original.barangay || '—' }}
                            </span>
                        </template>

                        <template #items-cell="{ row }">
                            <span :title="row.original.items">
                                {{ row.original.items || '—' }}
                            </span>
                        </template>

                        <template #value-cell="{ row }">
                            {{ peso(row.original.value) }}
                        </template>

                        <template #date-cell="{ row }">
                            <span class="flex items-center gap-1.5">
                                <UIcon
                                    name="i-lucide-calendar"
                                    class="size-3.5 text-slate-400"
                                />
                                {{ row.original.date ?? '—' }}
                            </span>
                        </template>

                        <template #status-cell="{ row }">
                            <span
                                :class="
                                    STATUS_STYLE[row.original.status] ||
                                    'status-idle'
                                "
                                class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{
                                        background:
                                            STATUS_DOT[row.original.status],
                                    }"
                                />
                                {{ row.original.status }}
                            </span>
                        </template>

                        <template #actions-cell="{ row }">
                            <div
                                class="flex items-center justify-end gap-2"
                            >
                                <button
                                    type="button"
                                    title="Edit assistance"
                                    class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                    @click="openEditModal(row.original)"
                                >
                                    <UIcon
                                        name="i-lucide-pencil"
                                        class="size-3.5"
                                    />
                                </button>

                                <button
                                    type="button"
                                    title="Delete assistance"
                                    class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                    @click="askDelete(row.original)"
                                >
                                    <UIcon
                                        name="i-lucide-trash-2"
                                        class="size-3.5"
                                    />
                                </button>
                            </div>
                        </template>

                        <template #loading>
                            <span class="inline-flex items-center gap-2">
                                <UIcon
                                    name="i-lucide-loader-circle"
                                    class="size-4 animate-spin"
                                />
                                Loading assistance records...
                            </span>
                        </template>

                        <template #empty>
                            <div
                                v-if="loadError"
                                class="px-5 py-12 text-center"
                            >
                                <p class="text-sm text-red-600">
                                    {{ loadError }}
                                </p>
                                <button
                                    type="button"
                                    class="mt-2 text-sm font-semibold text-green-700 underline"
                                    @click="load"
                                >
                                    Try again
                                </button>
                            </div>

                            <div
                                v-else-if="programs.length === 0"
                                class="px-5 py-14 text-center"
                            >
                                <div
                                    class="flex flex-col items-center gap-2"
                                >
                                    <div
                                        class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                    >
                                        <UIcon
                                            name="i-lucide-hand-heart"
                                            class="size-6"
                                        />
                                    </div>
                                    <p
                                        class="text-base font-semibold text-slate-700"
                                    >
                                        No assistance recorded yet
                                    </p>
                                    <p
                                        class="max-w-sm text-sm text-slate-400"
                                    >
                                        Record the first assistance entry for a
                                        registered farmer.
                                    </p>
                                </div>
                            </div>

                            <div
                                v-else
                                class="px-5 py-12 text-center text-sm text-slate-400"
                            >
                                No assistance records match the current search
                                or status filter.
                            </div>
                        </template>
                    </UTable>
                </div>
            </div>
        </div>
    </div>

    <!-- Record Assistance Modal -->
    <Teleport to="body">
        <div
            v-if="showRecordModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRecordModal"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-11 items-center justify-center rounded-2xl bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-hand-heart"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Record Assistance
                            </h3>
                            <p class="text-sm text-slate-500">
                                Log an assistance program for a farmer.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Assistance recorded.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitNew">
                    <p
                        v-if="farmers.length === 0"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        No farmers registered yet. Register a farmer first, then
                        log the assistance here.
                    </p>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Program <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.program"
                                type="text"
                                list="assist-program-options"
                                placeholder="e.g. Rice Seed Subsidy"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Recipient <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.farmerDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="newForm.barangayDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Value (₱)
                            </label>
                            <input
                                v-model="newForm.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="newForm.items"
                            rows="3"
                            placeholder="e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.date"
                                type="date"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>
                            <select
                                v-model="newForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ newError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingNew"
                            @click="closeRecordModal"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEditModal"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-11 items-center justify-center rounded-2xl bg-[#e0f0fb]"
                        >
                            <UIcon
                                name="i-lucide-pencil"
                                class="size-5 text-[#1d6fa4]"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Edit Assistance
                            </h3>
                            <p class="text-sm text-slate-500">
                                Update the assistance program details.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Assistance updated.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitEdit">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Program <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.program"
                                type="text"
                                list="assist-program-options-edit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Recipient <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.farmerDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="editForm.barangayDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Value (₱)
                            </label>
                            <input
                                v-model="editForm.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="editForm.items"
                            rows="3"
                            placeholder="e.g. 4 bags certified rice seed (40 kg)"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.date"
                                type="date"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>
                            <select
                                v-model="editForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingEdit"
                            @click="closeEditModal"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDeleteModal"
        >
            <div
                class="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            >
                <div
                    class="mb-4 flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                >
                    <UIcon name="i-lucide-trash-2" class="size-5" />
                </div>

                <h3 class="text-xl font-bold tracking-tight text-slate-950">
                    Delete Assistance
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                    Remove
                    <span class="font-mono font-semibold text-slate-700">
                        {{ deleteTarget?.reference_code }}
                    </span>
                    ({{ deleteTarget?.program }}) for
                    <span class="font-semibold text-slate-700">
                        {{ deleteTarget?.recipient }}
                    </span>
                    ? This action cannot be undone.
                </p>

                <p
                    v-if="deleteError"
                    class="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                    {{ deleteError }}
                </p>

                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        :disabled="deleting"
                        @click="closeDeleteModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
