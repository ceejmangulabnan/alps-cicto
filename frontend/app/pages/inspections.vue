<script setup lang="ts">
import type {
    InspectionStatus,
    ParcelInspectionPhoto,
    RiskInspectionLevel,
} from '~/composables/useFarmParcelApi'
import {
    useInspectionRegistry,
    type InspectionRow,
} from '~/composables/useInspectionRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ middleware: 'auth' })

const { inspections, allParcels, loading, loadError, load } =
    useInspectionRegistry()
const { createInspection, updateInspection, deleteInspection, uploadPhotos } =
    useFarmRecordsApi()

const RISK_STYLE: Record<RiskInspectionLevel, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-yellow-100 text-yellow-700',
    None: 'bg-gray-100 text-gray-500',
}

const RISK_DOT: Record<RiskInspectionLevel, string> = {
    High: '#b91c1c',
    Medium: '#c2410c',
    Low: '#a16207',
    None: '#6b7280',
}

/** Reuses the shared land-status pills, one shade per inspection status. */
const STATUS_STYLE: Record<InspectionStatus, string> = {
    Completed: 'status-cultivated',
    Pending: 'status-harvesting',
    'In Progress': 'status-preparation',
}

const STATUS_DOT: Record<InspectionStatus, string> = {
    Completed: '#166534',
    Pending: '#a16207',
    'In Progress': '#0369a1',
}

const shortId = (documentId: string): string =>
    `#${documentId.slice(-6).toUpperCase()}`

function today(): string {
    return new Date().toISOString().slice(0, 10)
}

/** Renders the JSON `gps_point` column; it usually holds a free-text string. */
const gpsLabel = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) return value
    if (value && typeof value === 'object') {
        const point = value as { lat?: unknown; lng?: unknown }
        if (typeof point.lat === 'number' && typeof point.lng === 'number') {
            return `${point.lat}° N, ${point.lng}° E`
        }
        return JSON.stringify(value)
    }
    return ''
}

const kpis = computed(() => {
    const total = inspections.value.length
    const completed = inspections.value.filter(
        (row) => row.status === 'Completed'
    ).length
    const pending = inspections.value.filter(
        (row) => row.status === 'Pending'
    ).length
    const highRisk = inspections.value.filter(
        (row) => row.riskLevel === 'High'
    ).length
    return [
        {
            label: 'Total Inspections',
            val: total,
            icon: 'i-lucide-clipboard-check',
            color: '#2d6a2d',
            bg: '#e8f5e8',
        },
        {
            label: 'Completed',
            val: completed,
            icon: 'i-lucide-check-circle',
            color: '#16a34a',
            bg: '#dcfce7',
        },
        {
            label: 'Pending',
            val: pending,
            icon: 'i-lucide-clock',
            color: '#ca8a04',
            bg: '#fef3c7',
        },
        {
            label: 'High Risk Found',
            val: highRisk,
            icon: 'i-lucide-triangle-alert',
            color: '#dc2626',
            bg: '#fee2e2',
        },
    ]
})

/** Latest year present in the data, so the chart always shows full months. */
const chartYear = computed(() => {
    const years = inspections.value
        .map((row) => (row.date ? Number(row.date.slice(0, 4)) : NaN))
        .filter((year) => Number.isFinite(year))
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear()
})

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

const RISK_COLORS: Record<RiskInspectionLevel, string> = {
    None: '#94a3b8',
    Low: '#ca8a04',
    Medium: '#d97706',
    High: '#dc2626',
}

const RISK_ORDER: RiskInspectionLevel[] = ['None', 'Low', 'Medium', 'High']

const monthlyInspectionData = computed(() => {
    const base = MONTHS.map((month) => ({
        month,
        None: 0,
        Low: 0,
        Medium: 0,
        High: 0,
    }))
    const byMonth = new Map<number, (typeof base)[number]>()
    base.forEach((bucket, index) => byMonth.set(index + 1, bucket))

    for (const row of inspections.value) {
        if (!row.date || !row.date.startsWith(`${chartYear.value}-`)) continue
        const parsed = new Date(`${row.date}T00:00:00`)
        const bucket = byMonth.get(parsed.getMonth() + 1)
        if (!bucket) continue
        bucket[row.riskLevel] += 1
    }
    return base
})

const chartTotals = computed(() => {
    const inYear = inspections.value.filter((row) =>
        row.date?.startsWith(`${chartYear.value}-`)
    )
    return {
        total: inYear.length,
        highRisk: inYear.filter((row) => row.riskLevel === 'High').length,
    }
})

const chartOption = computed(() => ({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
        textStyle: { fontSize: 10, color: '#6b7280' },
    },
    grid: { left: 8, right: 12, top: 32, bottom: 4, containLabel: true },
    xAxis: {
        type: 'category',
        data: MONTHS,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    series: RISK_ORDER.map((risk, index) => ({
        name: risk,
        type: 'bar',
        stack: 'total',
        barWidth: 12,
        data: [...monthlyInspectionData.value.map((d) => d[risk])],
        color: RISK_COLORS[risk],
        // Round only the top segment of the stack.
        itemStyle:
            index === RISK_ORDER.length - 1
                ? { borderRadius: [3, 3, 0, 0] }
                : undefined,
    })),
}))

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

const statusFilterOptions = [
    'All',
    'Completed',
    'Pending',
    'In Progress',
] as const
type StatusFilter = (typeof statusFilterOptions)[number]
const filterStatus = ref<StatusFilter>('All')
const search = ref('')

const filtered = computed(() =>
    inspections.value.filter((row) => {
        const haystack = [
            row.inspection_type,
            row.parcel_code,
            row.barangay,
            row.inspector,
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
/* New inspection                                                       */
/* ------------------------------------------------------------------ */

const inspectionTypeOptions = [
    'Pre-harvest Assessment',
    'Pest & Disease Scouting',
    'Compliance Check',
    'Crop Establishment Visit',
    'Irrigation Audit',
    'Harvest Monitoring',
] as const
const riskLevelOptions: RiskInspectionLevel[] = [
    'None',
    'Low',
    'Medium',
    'High',
]
const statusOptions: InspectionStatus[] = [
    'Pending',
    'In Progress',
    'Completed',
]

const parcelOptions = computed(() =>
    allParcels.value.map((parcel) => {
        const farmers = (parcel.farmers ?? [])
            .map((farmer) => farmer.name)
            .filter(Boolean)
        return {
            value: parcel.documentId,
            label: [
                parcel.parcel_code,
                farmers[0] ?? '',
                parcel.farm?.barangay?.name ?? '',
            ]
                .filter(Boolean)
                .join(' · '),
        }
    })
)

const showNewModal = ref(false)
const submittingNew = ref(false)
const newError = ref<string | null>(null)
const newSaved = ref(false)
let newCloseTimer: ReturnType<typeof setTimeout> | null = null

const newForm = reactive({
    parcelDocumentId: '',
    inspection_type: inspectionTypeOptions[0],
    date: '',
    inspector: '',
    gps: '',
    risk_level: 'None' as RiskInspectionLevel,
    status: 'Pending' as InspectionStatus,
    notes: '',
    savedPhotos: [] as ParcelInspectionPhoto[],
    pendingPhotos: [] as File[],
})

const canSaveNew = computed(
    () =>
        !submittingNew.value &&
        Boolean(newForm.parcelDocumentId) &&
        Boolean(newForm.date) &&
        Boolean(newForm.inspector.trim())
)

function openNew() {
    newForm.parcelDocumentId = allParcels.value[0]?.documentId ?? ''
    newForm.inspection_type = inspectionTypeOptions[0]
    newForm.date = today()
    newForm.inspector = ''
    newForm.gps = ''
    newForm.risk_level = 'None'
    newForm.status = 'Pending'
    newForm.notes = ''
    newForm.savedPhotos = []
    newForm.pendingPhotos = []
    newError.value = null
    newSaved.value = false
    showNewModal.value = true
}

function closeNew() {
    if (submittingNew.value) return
    if (newCloseTimer) {
        clearTimeout(newCloseTimer)
        newCloseTimer = null
    }
    newSaved.value = false
    showNewModal.value = false
}

async function submitNew() {
    newError.value = null
    submittingNew.value = true
    try {
        const photoIds: number[] = []
        if (newForm.pendingPhotos.length > 0) {
            const uploaded = await uploadPhotos(newForm.pendingPhotos)
            photoIds.push(
                ...uploaded
                    .map((file) => file.id)
                    .filter((id): id is number => id != null)
            )
        }
        await createInspection({
            parcel: newForm.parcelDocumentId,
            inspector: newForm.inspector.trim(),
            date: newForm.date,
            inspection_type: newForm.inspection_type,
            risk_level: newForm.risk_level,
            status: newForm.status,
            gps_point: newForm.gps.trim() || null,
            notes: newForm.notes.trim() || null,
            ...(photoIds.length > 0 ? { photos: photoIds } : {}),
        })
        newSaved.value = true
        newCloseTimer = setTimeout(() => {
            newCloseTimer = null
            newSaved.value = false
            showNewModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        newError.value = getErrorMessage(
            cause,
            'Failed to record the inspection. Please try again.'
        )
    } finally {
        submittingNew.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Edit inspection                                                      */
/* ------------------------------------------------------------------ */

const showEditModal = ref(false)
const submittingEdit = ref(false)
const editError = ref<string | null>(null)
const editSaved = ref(false)
let editCloseTimer: ReturnType<typeof setTimeout> | null = null

const editForm = reactive({
    documentId: '',
    contextLabel: '',
    parcelDocumentId: '',
    inspection_type: '',
    date: '',
    inspector: '',
    gps: '',
    risk_level: 'None' as RiskInspectionLevel,
    status: 'Pending' as InspectionStatus,
    notes: '',
    savedPhotos: [] as ParcelInspectionPhoto[],
    pendingPhotos: [] as File[],
})

const canSaveEdit = computed(
    () =>
        !submittingEdit.value &&
        Boolean(editForm.parcelDocumentId) &&
        Boolean(editForm.date) &&
        Boolean(editForm.inspector.trim())
)

function openEdit(row: InspectionRow) {
    editForm.documentId = row.documentId
    editForm.contextLabel = `${row.parcel_code} · ${row.date ?? 'no date'}`
    editForm.parcelDocumentId = row.parcelDocumentId
    editForm.inspection_type = row.inspection_type
    editForm.date = row.date ?? ''
    editForm.inspector = row.inspector
    editForm.gps = gpsLabel(row.gps_point)
    editForm.risk_level = row.riskLevel
    editForm.status = row.status
    editForm.notes = row.notes
    editForm.savedPhotos = [...row.photos]
    editForm.pendingPhotos = []
    editError.value = null
    editSaved.value = false
    showEditModal.value = true
}

function closeEdit() {
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
        // The picker already filtered out any removed photos from
        // `savedPhotos`, so this is the full replacement list.
        const finalPhotoIds = editForm.savedPhotos
            .map((photo) => photo.id)
            .filter((id): id is number => id != null)
        if (editForm.pendingPhotos.length > 0) {
            const uploaded = await uploadPhotos(editForm.pendingPhotos)
            finalPhotoIds.push(
                ...uploaded
                    .map((file) => file.id)
                    .filter((id): id is number => id != null)
            )
        }
        await updateInspection(editForm.documentId, {
            parcel: editForm.parcelDocumentId,
            inspector: editForm.inspector.trim(),
            date: editForm.date,
            inspection_type: editForm.inspection_type,
            risk_level: editForm.risk_level,
            status: editForm.status,
            gps_point: editForm.gps.trim() || null,
            notes: editForm.notes.trim() || null,
            photos: finalPhotoIds,
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
            'Failed to update the inspection. Please try again.'
        )
    } finally {
        submittingEdit.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Delete inspection                                                    */
/* ------------------------------------------------------------------ */

const showDeleteModal = ref(false)
const deleteTarget = ref<InspectionRow | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function askDelete(row: InspectionRow) {
    deleteTarget.value = row
    deleteError.value = null
    showDeleteModal.value = true
}

function closeDelete() {
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
        await deleteInspection(target.documentId)
        deleteTarget.value = null
        showDeleteModal.value = false
        await load()
    } catch (cause) {
        deleteError.value = getErrorMessage(
            cause,
            'Failed to delete the inspection. Please try again.'
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
                    Field Inspections
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    GPS-tagged visits · Photo documentation
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="openNew"
            >
                <UIcon name="i-lucide-plus" class="size-3.5" />
                New Inspection
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
                v-for="card in kpis"
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
                    :style="{ color: card.color }"
                >
                    {{ card.val }}
                </div>
                <div class="text-xs text-gray-500">{{ card.label }}</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="space-y-3">
            <div class="flex items-center gap-3">
                <div class="relative max-w-xs flex-1">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search parcel, type or inspector..."
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
                    {{ filtered.length }} of
                    {{ inspections.length }} inspections
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
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
                            background: STATUS_DOT[s as InspectionStatus],
                        }"
                    />
                    {{ s }}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
            <!-- Inspections by month and risk -->
            <div class="alps-card col-span-5 p-5">
                <div class="mb-3 flex items-center gap-3">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0faf0]"
                    >
                        <UIcon
                            name="i-lucide-bar-chart-3"
                            class="size-4 text-[#2d6a2d]"
                        />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-700">
                            Inspections by Month
                        </h3>
                        <p class="text-[11px] text-gray-400">
                            {{ chartYear }} ·
                            {{ chartTotals.total }} inspections,
                            {{ chartTotals.highRisk }} high-risk
                        </p>
                    </div>
                </div>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '200px' }">
                        <VChart
                            :option="chartOption"
                            :style="{ height: '200px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div
                    class="mt-3 flex items-center justify-between rounded-lg bg-[#f8faf8] px-3 py-2"
                >
                    <span class="text-[11px] text-gray-500"
                        >High-risk findings this year</span
                    >
                    <span class="text-xs font-bold text-[#dc2626]">
                        {{ chartTotals.highRisk }}
                    </span>
                </div>
            </div>

            <!-- Inspection Records -->
            <div class="alps-card col-span-7 overflow-hidden">
                <div class="border-b border-gray-100 px-5 py-4">
                    <h3 class="text-sm font-semibold text-gray-700">
                        Inspection Records
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[960px] text-xs">
                        <thead class="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    ID
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Type
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Parcel
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Barangay
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Date
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Inspector
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Risk
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
                                    <span
                                        class="inline-flex items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-loader-circle"
                                            class="size-4 animate-spin"
                                        />
                                        Loading inspections...
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
                            <tr v-else-if="inspections.length === 0">
                                <td
                                    colspan="9"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    <div
                                        class="flex flex-col items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-clipboard-check"
                                            class="size-6 text-gray-300"
                                        />
                                        <p>
                                            No inspections recorded yet. Log the
                                            first one against a parcel.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-else-if="filtered.length === 0">
                                <td
                                    colspan="9"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    No inspections match this search.
                                </td>
                            </tr>
                            <tr
                                v-for="(row, i) in filtered"
                                :key="row.documentId"
                                class="border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                                :class="
                                    i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                                "
                            >
                                <td class="px-4 py-3 font-mono text-gray-400">
                                    {{ shortId(row.documentId) }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="flex w-fit items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                    >
                                        <UIcon
                                            name="i-lucide-tags"
                                            class="size-2.5"
                                        />
                                        {{ row.inspection_type }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <NuxtLink
                                        :to="`/parcels/${row.parcel_code}`"
                                        class="font-mono text-gray-500 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                    >
                                        {{ row.parcel_code }}
                                    </NuxtLink>
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ row.barangay }}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="text-gray-500">
                                        {{ row.date ?? '—' }}
                                    </div>
                                    <div
                                        v-if="row.photos.length > 0"
                                        class="flex items-center gap-1 text-[10px] text-gray-400"
                                    >
                                        <UIcon
                                            name="i-lucide-camera"
                                            class="size-2.5"
                                        />
                                        {{ row.photos.length }}
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ row.inspector || '—' }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        :class="RISK_STYLE[row.riskLevel]"
                                        class="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background:
                                                    RISK_DOT[row.riskLevel],
                                            }"
                                        />
                                        {{ row.riskLevel }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        :class="STATUS_STYLE[row.status]"
                                        class="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background:
                                                    STATUS_DOT[row.status],
                                            }"
                                        />
                                        {{ row.status }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div
                                        class="flex items-center justify-end gap-1"
                                    >
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                            @click="openEdit(row)"
                                        >
                                            <UIcon
                                                name="i-lucide-pencil"
                                                class="size-3.5"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            @click="askDelete(row)"
                                        >
                                            <UIcon
                                                name="i-lucide-trash"
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

    <!-- New Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showNewModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeNew"
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
                        :disabled="submittingNew"
                        @click="closeNew"
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
                    <p class="text-xs text-gray-500">Inspection recorded.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitNew">
                    <p
                        v-if="allParcels.length === 0"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        No parcels registered yet. Register a parcel first, then
                        log its inspection here.
                    </p>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Parcel <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.parcelDocumentId"
                                :disabled="
                                    submittingNew || allParcels.length === 0
                                "
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            >
                                <option value="" disabled>
                                    Select a parcel
                                </option>
                                <option
                                    v-for="option in parcelOptions"
                                    :key="option.value"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Type
                            </label>
                            <select
                                v-model="newForm.inspection_type"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.date"
                                type="date"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            >
                                <option
                                    v-for="s in statusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Inspector <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.inspector"
                                type="text"
                                :disabled="submittingNew"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="newForm.risk_level"
                                :disabled="submittingNew"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            GPS Coordinates
                        </label>
                        <input
                            v-model="newForm.gps"
                            type="text"
                            :disabled="submittingNew"
                            placeholder="15.03° N, 120.69° E"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="newForm.notes"
                            rows="3"
                            :disabled="submittingNew"
                            placeholder="Observations, potential issues, and recommended follow-ups..."
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        ></textarea>
                    </div>

                    <InspectionsPhotoPicker
                        v-model:saved="newForm.savedPhotos"
                        v-model:pending="newForm.pendingPhotos"
                        :disabled="submittingNew"
                    />

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
                            @click="closeNew"
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
                                    : 'Record Inspection'
                            }}
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEdit"
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
                        :disabled="submittingEdit"
                        @click="closeEdit"
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
                    <p class="text-xs text-gray-500">Inspection updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div
                        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Parcel <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.parcelDocumentId"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            >
                                <option value="" disabled>
                                    Select a parcel
                                </option>
                                <option
                                    v-for="option in parcelOptions"
                                    :key="option.value"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Type
                            </label>
                            <select
                                v-model="editForm.inspection_type"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.date"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            >
                                <option
                                    v-for="s in statusOptions"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Inspector <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.inspector"
                                type="text"
                                :disabled="submittingEdit"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="editForm.risk_level"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            GPS Coordinates
                        </label>
                        <input
                            v-model="editForm.gps"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="15.03° N, 120.69° E"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="editForm.notes"
                            rows="3"
                            :disabled="submittingEdit"
                            placeholder="Observations, potential issues, and recommended follow-ups..."
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        ></textarea>
                    </div>

                    <InspectionsPhotoPicker
                        v-model:saved="editForm.savedPhotos"
                        v-model:pending="editForm.pendingPhotos"
                        :disabled="submittingEdit"
                    />

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
                            @click="closeEdit"
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

    <!-- Delete Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDelete"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon name="i-lucide-trash" class="size-5 text-red-600" />
                </div>
                <h3 class="text-lg font-bold text-gray-900">
                    Delete Inspection
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove the
                    <span class="font-medium text-gray-700">
                        {{ deleteTarget?.inspection_type }}
                    </span>
                    inspection on
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ({{ deleteTarget?.date ?? 'no date' }})? This action cannot
                    be undone.
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
                        @click="closeDelete"
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
