<script setup lang="ts">
//@ts-nocheck
import type { TableColumn } from '@nuxt/ui'
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


/**
 * The inspection table's columns.
 *
 * All the sortable values live flat on the row except the date, which sorts on
 * its raw `string | null` via accessorFn. Risk and Status sort on the label
 * strings, which is the order officers actually expect to scan in. The last
 * column holds the action buttons, not data, so it opts out of sorting.
 */
const columns: TableColumn<InspectionRow>[] = [
    { accessorKey: 'documentId', header: sortHeader('ID') },
    { accessorKey: 'inspection_type', header: sortHeader('Type') },
    { accessorKey: 'parcel_code', header: sortHeader('Parcel') },
    {
        accessorKey: 'barangay',
        header: sortHeader('Barangay'),
        meta: { class: { td: 'text-slate-600' } },
    },
    {
        id: 'date',
        accessorFn: (row) => row.date ?? '',
        header: sortHeader('Date'),
    },
    {
        accessorKey: 'inspector',
        header: sortHeader('Inspector'),
        meta: { class: { td: 'text-slate-600' } },
    },
    { accessorKey: 'riskLevel', header: sortHeader('Risk') },
    { accessorKey: 'status', header: sortHeader('Status') },
    {
        // Buttons, not data: nothing to sort on, and the header stays empty.
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { th: 'text-right' } },
    },
]

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

/* ------------------------------------------------------------------ */
/* Inspection details                                                   */
/* ------------------------------------------------------------------ */

const showDetailModal = ref(false)
const detailTarget = ref<InspectionRow | null>(null)

const config = useRuntimeConfig()
const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')

/** Small preview URL, preferring Strapi's generated thumbnail when present. */
const thumbnailUrl = (photo: ParcelInspectionPhoto | null): string => {
    const url = photo?.formats?.thumbnail?.url ?? photo?.url
    return url ? `${strapiUrl}${url}` : ''
}

/** Full-size URL for the lightbox. */
const photoUrl = (photo: ParcelInspectionPhoto | null): string =>
    photo?.url ? `${strapiUrl}${photo.url}` : ''

const detailPhotos = computed(() => detailTarget.value?.photos ?? [])

/** Index of the photo shown in the lightbox; null while closed. */
const lightboxIndex = ref<number | null>(null)
const lightboxPhoto = computed(() =>
    lightboxIndex.value === null
        ? null
        : (detailPhotos.value[lightboxIndex.value] ?? null)
)

function openDetail(row: InspectionRow) {
    detailTarget.value = row
    lightboxIndex.value = null
    showDetailModal.value = true
}

function closeDetail() {
    showDetailModal.value = false
    lightboxIndex.value = null
    detailTarget.value = null
}

function stepLightbox(direction: 1 | -1) {
    const count = detailPhotos.value.length
    if (count === 0) return
    const current = lightboxIndex.value ?? 0
    lightboxIndex.value = (current + direction + count) % count
}

function editFromDetail() {
    const target = detailTarget.value
    if (!target) return
    closeDetail()
    openEdit(target)
}

function onDetailKeydown(event: KeyboardEvent) {
    if (!showDetailModal.value) return
    if (event.key === 'Escape') {
        if (lightboxIndex.value !== null) {
            lightboxIndex.value = null
        } else {
            closeDetail()
        }
    } else if (lightboxIndex.value !== null && event.key === 'ArrowLeft') {
        event.preventDefault()
        stepLightbox(-1)
    } else if (lightboxIndex.value !== null && event.key === 'ArrowRight') {
        event.preventDefault()
        stepLightbox(1)
    }
}

onMounted(() => window.addEventListener('keydown', onDetailKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onDetailKeydown))
</script>

<template>
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
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
                            <UIcon
                                name="i-lucide-clipboard-check"
                                class="size-6"
                            />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-emerald-500"
                                    />
                                    Field Monitoring & Compliance
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ inspections.length }} inspection records
                                </span>
                            </div>

                            <h1
                                class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                Field Inspections
                            </h1>

                            <p
                                class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                            >
                                Track GPS-tagged field visits, risk findings,
                                compliance status, and photo documentation.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                        @click="openNew"
                    >
                        <UIcon name="i-lucide-plus" class="size-4.5" />
                        New Inspection
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="card in kpis"
                    :key="card.label"
                    class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${card.color}, ${card.color}55, transparent)`,
                        }"
                    />

                    <div
                        class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                        :style="{ backgroundColor: card.color }"
                    />

                    <div class="relative flex h-full flex-col">
                        <div class="flex items-start justify-between gap-3">
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
                                :style="{ background: card.bg }"
                            >
                                <UIcon
                                    :name="card.icon"
                                    class="size-5"
                                    :style="{ color: card.color }"
                                />
                            </div>

                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{ backgroundColor: card.color }"
                                />
                                Live
                            </span>
                        </div>

                        <div class="mt-5">
                            <div
                                class="text-3xl font-bold tracking-tight text-slate-950"
                            >
                                {{ card.val }}
                            </div>
                            <div
                                class="mt-1 text-sm font-semibold text-slate-700"
                            >
                                {{ card.label }}
                            </div>
                        </div>

                        <div
                            class="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="size-3.5"
                                :style="{ color: card.color }"
                            />
                            <span>
                                {{
                                    card.label === 'Total Inspections'
                                        ? 'All recorded field inspections'
                                        : card.label === 'Completed'
                                          ? 'Completed inspection visits'
                                          : card.label === 'Pending'
                                            ? 'Visits awaiting completion'
                                            : 'High-risk findings requiring attention'
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                        >
                            <UIcon
                                name="i-lucide-search-check"
                                class="size-4.5"
                            />
                        </div>
                        <div>
                            <h2
                                class="text-base font-bold tracking-tight text-slate-800"
                            >
                                Find Inspections
                            </h2>
                            <p class="text-xs text-slate-500">
                                Search inspection records or filter by workflow
                                status.
                            </p>
                        </div>
                    </div>

                    <div
                        class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex"
                    >
                        <UIcon name="i-lucide-filter" class="size-3.5" />
                        {{ filtered.length }} of
                        {{ inspections.length }} inspections
                    </div>
                </div>

                <div class="space-y-4 p-4 sm:p-5">
                    <div
                        class="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <div class="relative w-full max-w-md flex-1">
                            <UIcon
                                name="i-lucide-search"
                                class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                v-model="search"
                                type="text"
                                placeholder="Search parcel, type, barangay or inspector..."
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

                        <div
                            class="flex items-center gap-1.5 text-sm text-slate-500 sm:hidden"
                        >
                            <UIcon name="i-lucide-filter" class="size-3.5" />
                            {{ filtered.length }} of
                            {{ inspections.length }} inspections
                        </div>
                    </div>

                    <div
                        class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
                    >
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
                                    background:
                                        STATUS_DOT[s as InspectionStatus],
                                }"
                            />
                            {{ s }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <!-- Inspections by month and risk -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] lg:col-span-5"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0faf0]"
                            >
                                <UIcon
                                    name="i-lucide-chart-no-axes-column-increasing"
                                    class="size-4.5"
                                />
                            </div>
                            <div>
                                <h3
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Inspections by Month
                                </h3>
                                <p class="text-xs text-slate-500">
                                    {{ chartYear }} ·
                                    {{ chartTotals.total }} inspections,
                                    {{ chartTotals.highRisk }} high-risk
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="p-5 sm:p-6">
                        <ClientOnly>
                            <div class="w-full" :style="{ height: '240px' }">
                                <VChart
                                    :option="chartOption"
                                    :style="{ height: '240px', width: '100%' }"
                                    autoresize
                                />
                            </div>
                        </ClientOnly>
                        <div
                            class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                        >
                            <span class="text-sm text-slate-500"
                                >High-risk findings this year</span
                            >
                            <span class="text-sm font-bold text-red-600">
                                {{ chartTotals.highRisk }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Inspection Records -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-7"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h3
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Inspection Records
                                </h3>
                                <p
                                    class="mt-1 text-xs text-slate-500 sm:text-sm"
                                >
                                    Review inspection type, parcel, risk level,
                                    status, and supporting documentation.
                                </p>
                            </div>
                            <div
                                class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"
                            >
                                {{ filtered.length }} records
                            </div>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <UTable
                            :data="filtered"
                            :columns="columns"
                            :loading="loading"
                            :get-row-id="(row: InspectionRow) => row.documentId"
                            :ui="{
                                th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                                td: 'px-5 py-4 text-sm',
                                tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
                            }"
                        >
                            <template #documentId-cell="{ row }">
                                <span
                                    class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                                    >{{ shortId(row.original.documentId) }}</span
                                >
                            </template>

                            <template #inspection_type-cell="{ row }">
                                <span
                                    class="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                                >
                                    <UIcon
                                        name="i-lucide-tags"
                                        class="size-3.5"
                                    />
                                    {{ row.original.inspection_type }}
                                </span>
                            </template>

                            <template #parcel_code-cell="{ row }">
                                <NuxtLink
                                    :to="`/parcels/${row.original.parcel_code}`"
                                    class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                    {{ row.original.parcel_code }}
                                </NuxtLink>
                            </template>

                            <template #barangay-cell="{ row }">
                                {{ row.original.barangay }}
                            </template>

                            <template #date-cell="{ row }">
                                <div class="text-gray-500">
                                    {{ row.original.date ?? '—' }}
                                </div>
                                <div
                                    v-if="row.original.photos.length > 0"
                                    class="mt-1 flex items-center gap-1 text-xs text-slate-400"
                                >
                                    <UIcon
                                        name="i-lucide-camera"
                                        class="size-3.5"
                                    />
                                    {{ row.original.photos.length }}
                                </div>
                            </template>

                            <template #inspector-cell="{ row }">
                                {{ row.original.inspector || '—' }}
                            </template>

                            <template #riskLevel-cell="{ row }">
                                <span
                                    :class="RISK_STYLE[row.original.riskLevel]"
                                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                RISK_DOT[
                                                    row.original.riskLevel
                                                ],
                                        }"
                                    />
                                    {{ row.original.riskLevel }}
                                </span>
                            </template>

                            <template #status-cell="{ row }">
                                <span
                                    :class="STATUS_STYLE[row.original.status]"
                                    class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                >
                                    <span
                                        class="h-1.5 w-1.5 rounded-full"
                                        :style="{
                                            background:
                                                STATUS_DOT[
                                                    row.original.status
                                                ],
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
                                        title="View details"
                                        class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                        @click="openDetail(row.original)"
                                    >
                                        <UIcon
                                            name="i-lucide-eye"
                                            class="size-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                        @click="openEdit(row.original)"
                                    >
                                        <UIcon
                                            name="i-lucide-pencil"
                                            class="size-3.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        @click="askDelete(row.original)"
                                    >
                                        <UIcon
                                            name="i-lucide-trash"
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
                                    Loading inspections...
                                </span>
                            </template>

                            <template #empty>
                                <div v-if="loadError" class="px-5 py-12 text-center">
                                    <p class="text-red-600">
                                        {{ loadError }}
                                    </p>
                                    <button
                                        type="button"
                                        class="mt-2 text-xs font-medium text-green-700 underline"
                                        @click="load"
                                    >
                                        Try again
                                    </button>
                                </div>

                                <div
                                    v-else-if="inspections.length === 0"
                                    class="px-5 py-12 text-center text-sm text-slate-400"
                                >
                                    <div
                                        class="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                        >
                                            <UIcon
                                                name="i-lucide-clipboard-check"
                                                class="size-6"
                                            />
                                        </div>
                                        <p
                                            class="text-base font-semibold text-slate-700"
                                        >
                                            No inspections recorded yet
                                        </p>
                                        <p
                                            class="max-w-sm text-sm text-slate-400"
                                        >
                                            Log the first inspection against a
                                            parcel to begin field monitoring.
                                        </p>
                                    </div>
                                </div>

                                <div
                                    v-else
                                    class="px-5 py-12 text-center text-sm text-slate-400"
                                >
                                    No inspections match this search.
                                </div>
                            </template>
                        </UTable>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showNewModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeNew"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
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
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                New Inspection
                            </h3>
                            <p class="text-sm text-slate-500">
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
                    <p class="text-sm text-slate-500">Inspection recorded.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitNew">
                    <p
                        v-if="allParcels.length === 0"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        No parcels registered yet. Register a parcel first, then
                        log its inspection here.
                    </p>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Parcel <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="newForm.parcelDocumentId"
                                :disabled="
                                    submittingNew || allParcels.length === 0
                                "
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Type
                            </label>
                            <select
                                v-model="newForm.inspection_type"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.date"
                                type="date"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Inspector <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="newForm.inspector"
                                type="text"
                                :disabled="submittingNew"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="newForm.risk_level"
                                :disabled="submittingNew"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            GPS Coordinates
                        </label>
                        <input
                            v-model="newForm.gps"
                            type="text"
                            :disabled="submittingNew"
                            placeholder="15.03° N, 120.69° E"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="newForm.notes"
                            rows="3"
                            :disabled="submittingNew"
                            placeholder="Observations, potential issues, and recommended follow-ups..."
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        ></textarea>
                    </div>

                    <InspectionsPhotoPicker
                        v-model:saved="newForm.savedPhotos"
                        v-model:pending="newForm.pendingPhotos"
                        :disabled="submittingNew"
                    />

                    <p
                        v-if="newError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ newError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingNew"
                            @click="closeNew"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEdit"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
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
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Edit Inspection
                            </h3>
                            <p class="text-sm text-slate-500">
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
                    <p class="text-sm text-slate-500">Inspection updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div
                        class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Parcel <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="editForm.parcelDocumentId"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Type
                            </label>
                            <select
                                v-model="editForm.inspection_type"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.date"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Inspector <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.inspector"
                                type="text"
                                :disabled="submittingEdit"
                                placeholder="e.g. J. Villanueva"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Risk Level
                            </label>
                            <select
                                v-model="editForm.risk_level"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            GPS Coordinates
                        </label>
                        <input
                            v-model="editForm.gps"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="15.03° N, 120.69° E"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Findings
                        </label>
                        <textarea
                            v-model="editForm.notes"
                            rows="3"
                            :disabled="submittingEdit"
                            placeholder="Observations, potential issues, and recommended follow-ups..."
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        ></textarea>
                    </div>

                    <InspectionsPhotoPicker
                        v-model:saved="editForm.savedPhotos"
                        v-model:pending="editForm.pendingPhotos"
                        :disabled="submittingEdit"
                    />

                    <p
                        v-if="editError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingEdit"
                            @click="closeEdit"
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

    <!-- Delete Inspection Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDelete"
        >
            <div
                class="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon name="i-lucide-trash" class="size-5 text-red-600" />
                </div>
                <h3 class="text-xl font-bold tracking-tight text-slate-950">
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
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        :disabled="deleting"
                        @click="closeDelete"
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

    <!-- Inspection Detail Modal -->
    <Teleport to="body">
        <div
            v-if="showDetailModal && detailTarget"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDetail"
        >
            <div
                class="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0faf0]"
                        >
                            <UIcon
                                name="i-lucide-clipboard-check"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Inspection Details
                            </h3>
                            <p class="text-sm text-slate-500">
                                {{ detailTarget?.inspection_type }} ·
                                {{ shortId(detailTarget?.documentId ?? '') }}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="closeDetail"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <!-- Status + risk badges -->
                <div class="mb-5 flex flex-wrap items-center gap-2">
                    <span
                        :class="STATUS_STYLE[detailTarget?.status ?? 'Pending']"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background:
                                    STATUS_DOT[
                                        detailTarget?.status ?? 'Pending'
                                    ],
                            }"
                        />
                        {{ detailTarget?.status }}
                    </span>
                    <span
                        :class="RISK_STYLE[detailTarget?.riskLevel ?? 'None']"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background:
                                    RISK_DOT[detailTarget?.riskLevel ?? 'None'],
                            }"
                        />
                        {{ detailTarget?.riskLevel }} risk
                    </span>
                    <span
                        class="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    >
                        <UIcon name="i-lucide-tags" class="size-3" />
                        {{ detailTarget?.inspection_type }}
                    </span>
                </div>

                <!-- Key facts -->
                <div
                    class="mb-5 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-3"
                >
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Parcel
                        </p>
                        <NuxtLink
                            :to="`/parcels/${detailTarget?.parcel_code}`"
                            class="font-mono text-sm font-semibold text-slate-800 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                        >
                            {{ detailTarget?.parcel_code }}
                        </NuxtLink>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Barangay
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ detailTarget?.barangay || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Date
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ detailTarget?.date ?? '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Inspector
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ detailTarget?.inspector || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            GPS Coordinates
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ gpsLabel(detailTarget?.gps_point) || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Photos
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ detailPhotos.length }}
                            {{ detailPhotos.length === 1 ? 'photo' : 'photos' }}
                        </p>
                    </div>
                </div>

                <!-- Findings -->
                <div class="mb-5">
                    <p class="mb-2 text-sm font-semibold text-slate-700">
                        Findings
                    </p>
                    <div
                        class="rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-sm leading-6 text-slate-600"
                    >
                        <p
                            v-if="detailTarget?.notes?.trim()"
                            class="whitespace-pre-wrap"
                        >
                            {{ detailTarget.notes }}
                        </p>
                        <p v-else class="italic text-gray-400">
                            No findings recorded.
                        </p>
                    </div>
                </div>

                <!-- Field photos -->
                <div v-if="detailPhotos.length > 0" class="mb-5">
                    <p class="mb-2 text-sm font-semibold text-slate-700">
                        Field Photos
                    </p>
                    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        <button
                            v-for="(photo, index) in detailPhotos"
                            :key="photo.id ?? index"
                            type="button"
                            class="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            @click="lightboxIndex = index"
                        >
                            <img
                                v-if="thumbnailUrl(photo)"
                                :src="thumbnailUrl(photo)"
                                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                                :alt="`Field photo ${index + 1}`"
                            />
                            <div
                                v-else
                                class="flex h-full w-full items-center justify-center text-gray-300"
                            >
                                <UIcon name="i-lucide-image" class="size-5" />
                            </div>
                        </button>
                    </div>
                    <p class="mt-2 text-xs text-slate-400">
                        Click a photo to view it full-size.
                    </p>
                </div>

                <div
                    class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                >
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        @click="closeDetail"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125]"
                        @click="editFromDetail"
                    >
                        <UIcon name="i-lucide-pencil" class="size-3.5" />
                        Edit Inspection
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Photo Lightbox -->
    <Teleport to="body">
        <div
            v-if="lightboxIndex !== null && lightboxPhoto"
            class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            @click.self="lightboxIndex = null"
        >
            <button
                v-if="detailPhotos.length > 1"
                type="button"
                class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Previous photo"
                @click="stepLightbox(-1)"
            >
                <UIcon name="i-lucide-chevron-left" class="size-5" />
            </button>
            <button
                v-if="detailPhotos.length > 1"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Next photo"
                @click="stepLightbox(1)"
            >
                <UIcon name="i-lucide-chevron-right" class="size-5" />
            </button>
            <button
                type="button"
                class="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Close photo"
                @click="lightboxIndex = null"
            >
                <UIcon name="i-lucide-x" class="size-5" />
            </button>
            <figure class="max-h-full max-w-full">
                <img
                    v-if="photoUrl(lightboxPhoto)"
                    :src="photoUrl(lightboxPhoto)"
                    class="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
                    :alt="`Field photo ${(lightboxIndex ?? 0) + 1}`"
                />
                <figcaption class="mt-2 text-center text-xs text-gray-300">
                    Photo {{ (lightboxIndex ?? 0) + 1 }} of
                    {{ detailPhotos.length }}
                </figcaption>
            </figure>
        </div>
    </Teleport>
</template>
