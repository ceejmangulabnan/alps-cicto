<script setup lang="ts">
import type { HarvestRow } from '~/composables/useCycleRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { getErrorMessage } from '~/utils/apiError'
import { avatarColor, initials } from '~/utils/initials'
import { statusClass, statusDot } from '~/utils/landStatus'

definePageMeta({ middleware: 'auth' })

type HarvestStatus = 'Completed' | 'Upcoming'

const { cycleParcels, harvests, loading, loadError, load } = useCycleRegistry()
const { createHarvest, updateHarvest, deleteHarvest } = useFarmRecordsApi()

/** A harvest is Completed once it carries a production figure. */
const harvestStatus = (h: HarvestRow): HarvestStatus =>
    h.production_kg != null ? 'Completed' : 'Upcoming'

/** Page status -> land-status palette, so the shared badges can be reused. */
const statusBackground = (status: HarvestStatus) =>
    status === 'Completed' ? 'Cultivated' : 'Harvesting'

const CROP_COLORS: Record<string, string> = {
    Rice: '#16a34a',
    Corn: '#ca8a04',
    Sugarcane: '#d97706',
    Vegetables: '#059669',
    Eggplant: '#7c3aed',
    Tomato: '#dc2626',
}

const num = (value: number | string | null | undefined): string => {
    const n = Number(value)
    return Number.isFinite(n) ? n.toLocaleString() : '—'
}

const shortId = (documentId: string): string =>
    `#${documentId.slice(-6).toUpperCase()}`

const farmerLabel = (names: string[]): string => {
    if (names.length === 0) return '—'
    const visible = names.slice(0, 2).join(', ')
    return names.length > 2 ? `${visible} +${names.length - 2}` : visible
}

function today(): string {
    return new Date().toISOString().slice(0, 10)
}

const kpis = computed(() => {
    const completed = harvests.value.filter((h) => h.production_kg != null)
    const totalKg = completed.reduce(
        (sum, h) => sum + (Number(h.production_kg) || 0),
        0
    )
    const yields = completed
        .map((h) => Number(h.yield_per_hectare))
        .filter((value) => Number.isFinite(value) && value > 0)
    const avgYieldKgPerHa =
        yields.length > 0
            ? yields.reduce((sum, value) => sum + value, 0) / yields.length
            : 0
    const areaHarvested = completed.reduce((sum, h) => sum + h.area_hectares, 0)
    return [
        {
            label: 'Total Harvests',
            val: harvests.value.length,
            icon: 'i-lucide-wheat',
            color: '#2d6a2d',
            bg: '#e8f5e8',
        },
        {
            label: 'Total Yield (MT)',
            val: (totalKg / 1000).toFixed(1),
            icon: 'i-lucide-trending-up',
            color: '#16a34a',
            bg: '#dcfce7',
        },
        {
            label: 'Avg Yield (t/ha)',
            val: (avgYieldKgPerHa / 1000).toFixed(2),
            icon: 'i-lucide-gauge',
            color: '#1d6fa4',
            bg: '#e0f0fb',
        },
        {
            label: 'Area Harvested (ha)',
            val: areaHarvested.toFixed(1),
            icon: 'i-lucide-ruler',
            color: '#ca8a04',
            bg: '#fef3c7',
        },
    ]
})

/** Latest year present in the data, so the chart always shows full months. */
const chartYear = computed(() => {
    const years = harvests.value
        .map((h) => (h.harvest_date ? Number(h.harvest_date.slice(0, 4)) : NaN))
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

const monthlyHarvestData = computed(() => {
    const base = MONTHS.map((month) => ({
        month,
        rice: 0,
        corn: 0,
        sugarcane: 0,
        vegetables: 0,
    }))
    const byMonth = new Map<number, (typeof base)[number]>()
    base.forEach((bucket, index) => byMonth.set(index + 1, bucket))

    for (const h of harvests.value) {
        const date = h.harvest_date
        if (!date || !date.startsWith(`${chartYear.value}-`)) continue
        const parsed = new Date(`${date}T00:00:00`)
        const bucket = byMonth.get(parsed.getMonth() + 1)
        if (!bucket) continue
        if (h.crop === 'Rice') bucket.rice += h.area_hectares
        else if (h.crop === 'Corn') bucket.corn += h.area_hectares
        else if (h.crop === 'Sugarcane') bucket.sugarcane += h.area_hectares
        else bucket.vegetables += h.area_hectares
    }
    return base
})

const chartTotals = computed(() => {
    const inYear = harvests.value.filter((h) =>
        h.harvest_date?.startsWith(`${chartYear.value}-`)
    )
    return {
        area:
            Math.round(
                inYear.reduce((sum, h) => sum + h.area_hectares, 0) * 10
            ) / 10,
        completed: inYear.filter((h) => h.production_kg != null).length,
        total: inYear.length,
    }
})

const harvestOption = computed(() => ({
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
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { fontSize: 9, color: '#9ca3af' },
    },
    series: [
        {
            name: 'Rice',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            itemStyle: { borderRadius: [0, 0, 0, 0] },
            data: [...monthlyHarvestData.value.map((d) => d.rice)],
            color: '#16a34a',
        },
        {
            name: 'Corn',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            data: [...monthlyHarvestData.value.map((d) => d.corn)],
            color: '#ca8a04',
        },
        {
            name: 'Sugarcane',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            data: [...monthlyHarvestData.value.map((d) => d.sugarcane)],
            color: '#d97706',
        },
        {
            name: 'Vegetables',
            type: 'bar',
            stack: 'total',
            barWidth: 12,
            itemStyle: { borderRadius: [3, 3, 0, 0] },
            data: [...monthlyHarvestData.value.map((d) => d.vegetables)],
            color: '#059669',
        },
    ],
}))

const statusFilterOptions = ['All', 'Completed', 'Upcoming'] as const
type StatusFilter = (typeof statusFilterOptions)[number]
const filterStatus = ref<StatusFilter>('All')
const search = ref('')

const filtered = computed(() =>
    harvests.value.filter((h) => {
        const haystack = [
            farmerLabel(h.farmerNames),
            h.crop,
            h.variety,
            h.parcel_code,
            h.barangay,
        ]
            .join(' ')
            .toLowerCase()
        const match =
            !search.value || haystack.includes(search.value.toLowerCase())
        const status =
            filterStatus.value === 'All' ||
            harvestStatus(h) === filterStatus.value
        return match && status
    })
)

onMounted(() => {
    load()
})

/* ------------------------------------------------------------------ */
/* Record harvest                                                       */
/* ------------------------------------------------------------------ */

const showRecordModal = ref(false)
const submittingRecord = ref(false)
const recordError = ref<string | null>(null)
const recordSaved = ref(false)
let recordCloseTimer: ReturnType<typeof setTimeout> | null = null

const recordForm = reactive({
    parcelDocumentId: '',
    harvest_date: '',
    production_kg: '',
    yield_per_hectare: '',
})

/** Yield is derived from production over area until the user types one. */
const yieldEdited = ref(false)

const recordParcelOptions = computed(() =>
    cycleParcels.value.map((parcel) => {
        const parts = [
            parcel.parcel_code,
            parcel.planting_cycle?.crop?.name ?? '',
            parcel.planting_cycle?.variety ?? '',
        ].filter(Boolean)
        return { value: parcel.documentId, label: parts.join(' · ') }
    })
)

const recordParcel = computed(
    () =>
        cycleParcels.value.find(
            (p) => p.documentId === recordForm.parcelDocumentId
        ) ?? null
)
const recordArea = computed(
    () => Number(recordParcel.value?.area_hectares) || 0
)
const recordCycle = computed(() => recordParcel.value?.planting_cycle ?? null)

const productionNumber = computed(() => Number(recordForm.production_kg))

watch(productionNumber, (value) => {
    if (yieldEdited.value || !Number.isFinite(value) || value <= 0) return
    if (recordArea.value > 0) {
        recordForm.yield_per_hectare = (value / recordArea.value).toFixed(2)
    }
})

const canSaveRecord = computed(
    () =>
        !submittingRecord.value &&
        Boolean(recordForm.parcelDocumentId) &&
        Boolean(recordForm.harvest_date) &&
        Number(recordForm.production_kg) > 0
)

function openRecord() {
    recordForm.parcelDocumentId = cycleParcels.value[0]?.documentId ?? ''
    recordForm.harvest_date = today()
    recordForm.production_kg = ''
    recordForm.yield_per_hectare = ''
    yieldEdited.value = false
    recordError.value = null
    recordSaved.value = false
    showRecordModal.value = true
}

function closeRecord() {
    if (submittingRecord.value) return
    if (recordCloseTimer) {
        clearTimeout(recordCloseTimer)
        recordCloseTimer = null
    }
    recordSaved.value = false
    showRecordModal.value = false
}

async function submitRecord() {
    const cycle = recordCycle.value
    if (!cycle) return
    recordError.value = null
    submittingRecord.value = true
    try {
        await createHarvest({
            planting_cycle: cycle.documentId,
            harvest_date: recordForm.harvest_date,
            production_kg: Number(recordForm.production_kg),
            yield_per_hectare: Number(recordForm.yield_per_hectare) || null,
        })
        recordSaved.value = true
        recordCloseTimer = setTimeout(() => {
            recordCloseTimer = null
            recordSaved.value = false
            showRecordModal.value = false
        }, 900)
        await load()
    } catch (cause) {
        recordError.value = getErrorMessage(
            cause,
            'Failed to record the harvest. Please try again.'
        )
    } finally {
        submittingRecord.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Edit harvest                                                         */
/* ------------------------------------------------------------------ */

const showEditModal = ref(false)
const submittingEdit = ref(false)
const editError = ref<string | null>(null)
const editSaved = ref(false)
let editCloseTimer: ReturnType<typeof setTimeout> | null = null

const editForm = reactive({
    documentId: '',
    contextLabel: '',
    harvest_date: '',
    production_kg: '',
    yield_per_hectare: '',
})
const editArea = ref(0)
const yieldEditedEdit = ref(false)

const editProductionNumber = computed(() => Number(editForm.production_kg))

watch(editProductionNumber, (value) => {
    if (yieldEditedEdit.value || !Number.isFinite(value) || value <= 0) return
    if (editArea.value > 0) {
        editForm.yield_per_hectare = (value / editArea.value).toFixed(2)
    }
})

function openEdit(h: HarvestRow) {
    editForm.documentId = h.documentId
    editForm.contextLabel = [h.parcel_code, h.crop, h.variety]
        .filter(Boolean)
        .join(' · ')
    editArea.value = h.area_hectares
    editForm.harvest_date = h.harvest_date ?? ''
    editForm.production_kg =
        h.production_kg != null ? String(Number(h.production_kg)) : ''
    editForm.yield_per_hectare =
        h.yield_per_hectare != null ? String(Number(h.yield_per_hectare)) : ''
    yieldEditedEdit.value = false
    editError.value = null
    editSaved.value = false
    showEditModal.value = true
}

const canSaveEdit = computed(
    () =>
        !submittingEdit.value &&
        Boolean(editForm.harvest_date) &&
        Number(editForm.production_kg) > 0
)

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
        await updateHarvest(editForm.documentId, {
            harvest_date: editForm.harvest_date,
            production_kg: Number(editForm.production_kg) || null,
            yield_per_hectare: Number(editForm.yield_per_hectare) || null,
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
            'Failed to update the harvest. Please try again.'
        )
    } finally {
        submittingEdit.value = false
    }
}

/* ------------------------------------------------------------------ */
/* Delete harvest                                                       */
/* ------------------------------------------------------------------ */

const showDeleteModal = ref(false)
const deleteTarget = ref<HarvestRow | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function askDelete(h: HarvestRow) {
    deleteTarget.value = h
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
        await deleteHarvest(target.documentId)
        deleteTarget.value = null
        showDeleteModal.value = false
        await load()
    } catch (cause) {
        deleteError.value = getErrorMessage(
            cause,
            'Failed to delete the harvest. Please try again.'
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
                <h1 class="text-2xl font-bold text-gray-900">Harvests</h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Harvest records · Yield tracking · Production analytics
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="openRecord"
            >
                <UIcon name="i-lucide-wheat" class="size-3.5" />
                Record Harvest
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
                        placeholder="Search farmer, crop or parcel..."
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
                    {{ filtered.length }} of {{ harvests.length }} harvests
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <button
                    v-for="s in statusFilterOptions"
                    :key="s"
                    type="button"
                    class="rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                    :class="
                        filterStatus === s
                            ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    "
                    @click="filterStatus = s"
                >
                    {{ s }}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
            <!-- Monthly Harvest Chart -->
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
                            Harvested Area by Crop
                        </h3>
                        <p class="text-[11px] text-gray-400">
                            {{ chartYear }} · {{ chartTotals.area }} ha in
                            {{ chartTotals.completed }} of
                            {{ chartTotals.total }} harvests
                        </p>
                    </div>
                </div>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '200px' }">
                        <VChart
                            :option="harvestOption"
                            :style="{ height: '200px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div
                    class="mt-3 flex items-center justify-between rounded-lg bg-[#f8faf8] px-3 py-2"
                >
                    <span class="text-[11px] text-gray-500"
                        >Area harvested this year</span
                    >
                    <span class="text-xs font-bold text-[#2d6a2d]">
                        {{ chartTotals.area }} ha
                    </span>
                </div>
            </div>

            <!-- Harvest Records -->
            <div class="alps-card col-span-7 overflow-hidden">
                <div class="border-b border-gray-100 px-5 py-4">
                    <h3 class="text-sm font-semibold text-gray-700">
                        Harvest Records
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[900px] text-xs">
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
                                    Farmer
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Crop
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
                                    class="px-4 py-3 text-right font-semibold text-gray-600"
                                >
                                    Area (ha)
                                </th>
                                <th
                                    class="px-4 py-3 text-right font-semibold text-gray-600"
                                >
                                    Production (kg)
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
                                    colspan="10"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    <span
                                        class="inline-flex items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-loader-circle"
                                            class="size-4 animate-spin"
                                        />
                                        Loading harvests...
                                    </span>
                                </td>
                            </tr>
                            <!-- Failed -->
                            <tr v-else-if="loadError">
                                <td colspan="10" class="px-4 py-10 text-center">
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
                            <tr v-else-if="harvests.length === 0">
                                <td
                                    colspan="10"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    <div
                                        class="flex flex-col items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-wheat"
                                            class="size-6 text-gray-300"
                                        />
                                        <p>
                                            No harvests recorded yet. Record the
                                            first one against a planted parcel.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-else-if="filtered.length === 0">
                                <td
                                    colspan="10"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    No harvests match this search.
                                </td>
                            </tr>
                            <tr
                                v-for="(h, i) in filtered"
                                :key="h.documentId"
                                class="border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                                :class="
                                    i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                                "
                            >
                                <td class="px-4 py-3 font-mono text-gray-400">
                                    {{ shortId(h.documentId) }}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2.5">
                                        <span
                                            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                            :style="{
                                                backgroundColor: avatarColor(
                                                    h.farmerNames[0] ?? ''
                                                ),
                                            }"
                                        >
                                            {{
                                                initials(h.farmerNames[0] ?? '')
                                            }}
                                        </span>
                                        <div>
                                            <div
                                                class="font-medium text-gray-800"
                                            >
                                                {{ farmerLabel(h.farmerNames) }}
                                            </div>
                                            <div
                                                v-if="h.variety"
                                                class="text-gray-400"
                                            >
                                                Variety:
                                                {{ h.variety }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-1.5">
                                        <span
                                            class="h-2 w-2 flex-shrink-0 rounded-full"
                                            :style="{
                                                background:
                                                    CROP_COLORS[h.crop] ??
                                                    '#94a3b8',
                                            }"
                                        />
                                        <span class="font-medium text-gray-700">
                                            {{ h.crop || '—' }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <NuxtLink
                                        :to="`/parcels/${h.parcel_code}`"
                                        class="font-mono text-gray-500 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                    >
                                        {{ h.parcel_code }}
                                    </NuxtLink>
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ h.barangay }}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-gray-700"
                                >
                                    {{ h.area_hectares.toFixed(1) }}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <span
                                        class="font-mono font-semibold text-gray-900"
                                    >
                                        {{ num(h.production_kg) }}
                                    </span>
                                    <div
                                        v-if="h.yield_per_hectare != null"
                                        class="text-[10px] text-gray-400"
                                    >
                                        {{ num(h.yield_per_hectare) }} kg/ha
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ h.harvest_date ?? '—' }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        :class="
                                            statusClass(
                                                statusBackground(
                                                    harvestStatus(h)
                                                )
                                            )
                                        "
                                        class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                backgroundColor: statusDot(
                                                    statusBackground(
                                                        harvestStatus(h)
                                                    )
                                                ),
                                            }"
                                        />
                                        {{ harvestStatus(h) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div
                                        class="flex items-center justify-end gap-1"
                                    >
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                            @click="openEdit(h)"
                                        >
                                            <UIcon
                                                name="i-lucide-pencil"
                                                class="size-3.5"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            @click="askDelete(h)"
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

    <!-- Record Harvest Modal -->
    <Teleport to="body">
        <div
            v-if="showRecordModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRecord"
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
                                name="i-lucide-wheat"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Record Harvest
                            </h3>
                            <p class="text-xs text-gray-500">
                                Log a harvest against an active planting cycle.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        :disabled="submittingRecord"
                        @click="closeRecord"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="recordSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Harvest recorded.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitRecord">
                    <p
                        v-if="cycleParcels.length === 0"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        No parcels have a planting cycle yet. Register a cycle
                        first, then record its harvest here.
                    </p>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel<span v-if="cycleParcels.length > 0">
                                (planting cycle)</span
                            >
                            <span
                                v-if="cycleParcels.length > 0"
                                class="text-red-500"
                                >*</span
                            >
                        </label>
                        <select
                            v-model="recordForm.parcelDocumentId"
                            :disabled="
                                submittingRecord || cycleParcels.length === 0
                            "
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        >
                            <option value="" disabled>
                                Select a parcel with a cycle
                            </option>
                            <option
                                v-for="option in recordParcelOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                        <p
                            v-if="recordArea > 0"
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            {{ recordArea.toFixed(2) }} ha · yield is derived
                            from production per hectare.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Harvest Date <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="recordForm.harvest_date"
                            type="date"
                            :disabled="submittingRecord"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Production (kg)
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="recordForm.production_kg"
                                type="number"
                                min="0"
                                step="any"
                                :disabled="submittingRecord"
                                placeholder="e.g. 7400"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Yield (kg/ha)
                            </label>
                            <input
                                v-model="recordForm.yield_per_hectare"
                                type="number"
                                min="0"
                                step="any"
                                :disabled="submittingRecord"
                                placeholder="auto"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                                @focus="yieldEdited = true"
                            />
                        </div>
                    </div>

                    <p
                        v-if="recordError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ recordError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingRecord"
                            @click="closeRecord"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveRecord"
                        >
                            <UIcon
                                v-if="submittingRecord"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{
                                submittingRecord
                                    ? 'Saving...'
                                    : 'Record Harvest'
                            }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Harvest Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEdit"
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
                                Edit Harvest
                            </h3>
                            <p class="text-xs text-gray-500">
                                Correct the production and date.
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
                    <p class="text-xs text-gray-500">Harvest updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div
                        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Harvest Date <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="editForm.harvest_date"
                            type="date"
                            :disabled="submittingEdit"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Production (kg)
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="editForm.production_kg"
                                type="number"
                                min="0"
                                step="any"
                                :disabled="submittingEdit"
                                placeholder="e.g. 7400"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Yield (kg/ha)
                            </label>
                            <input
                                v-model="editForm.yield_per_hectare"
                                type="number"
                                min="0"
                                step="any"
                                :disabled="submittingEdit"
                                placeholder="auto"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                                @focus="yieldEditedEdit = true"
                            />
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

    <!-- Delete Harvest Modal -->
    <Teleport to="body">
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeDelete"
        >
            <div
                class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl font-sans"
            >
                <div
                    class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                >
                    <UIcon name="i-lucide-trash" class="size-5 text-red-600" />
                </div>
                <h3 class="text-lg font-bold text-gray-900">Delete Harvest</h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove the
                    {{ num(deleteTarget?.production_kg) }} kg harvest on
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ? This action cannot be undone.
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
