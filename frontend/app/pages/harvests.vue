<script setup lang="ts">
//@ts-nocheck
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
    <div class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8">
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div class="relative flex flex-wrap items-center justify-between gap-5">
                    <div class="flex min-w-0 items-start gap-4">
                        <div
                            class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                        >
                            <UIcon name="i-lucide-wheat" class="size-6" />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <span class="size-1.5 rounded-full bg-emerald-500" />
                                    Harvest & Production Management
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ harvests.length }} harvest records
                                </span>
                            </div>

                            <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                Harvests
                            </h1>

                            <p class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                                Track harvest records, production output, yield performance, and harvested area.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                        @click="openRecord"
                    >
                        <UIcon name="i-lucide-wheat" class="size-4.5" />
                        Record Harvest
                    </button>
                </div>
            </div>

            <!-- KPI Cards -->
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
                            <div class="text-3xl font-bold tracking-tight text-slate-950">
                                {{ card.val }}
                            </div>
                            <div class="mt-1 text-sm font-semibold text-slate-700">
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
                                    card.label === 'Total Harvests'
                                        ? 'All recorded harvest entries'
                                        : card.label === 'Total Yield (MT)'
                                          ? 'Combined completed production'
                                          : card.label === 'Avg Yield (t/ha)'
                                            ? 'Average productivity per hectare'
                                            : 'Combined completed harvest area'
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
                            <UIcon name="i-lucide-search-check" class="size-4.5" />
                        </div>

                        <div>
                            <h2 class="text-base font-bold tracking-tight text-slate-800">
                                Find Harvest Records
                            </h2>
                            <p class="text-xs text-slate-500">
                                Search the registry or filter by harvest status.
                            </p>
                        </div>
                    </div>

                    <div class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
                        <UIcon name="i-lucide-filter" class="size-3.5" />
                        {{ filtered.length }} of {{ harvests.length }} harvests
                    </div>
                </div>

                <div class="space-y-4 p-4 sm:p-5">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="relative w-full max-w-md flex-1">
                            <UIcon
                                name="i-lucide-search"
                                class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                v-model="search"
                                type="text"
                                placeholder="Search farmer, crop, parcel or barangay..."
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

                        <div class="flex items-center gap-1.5 text-sm text-slate-500 sm:hidden">
                            <UIcon name="i-lucide-filter" class="size-3.5" />
                            {{ filtered.length }} of {{ harvests.length }} harvests
                        </div>
                    </div>

                    <div
                        class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
                    >
                        <button
                            v-for="s in statusFilterOptions"
                            :key="s"
                            type="button"
                            class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                            :class="
                                filterStatus === s
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                            "
                            @click="filterStatus = s"
                        >
                            {{ s }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Analytics + Records -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Monthly Harvest Chart -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] lg:col-span-5"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-chart-no-axes-column-increasing"
                                    class="size-4.5"
                                />
                            </div>

                            <div>
                                <h3 class="text-base font-bold tracking-tight text-slate-800">
                                    Harvested Area by Crop
                                </h3>
                                <p class="text-xs text-slate-500">
                                    {{ chartYear }} · {{ chartTotals.area }} ha ·
                                    {{ chartTotals.completed }} completed of
                                    {{ chartTotals.total }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="p-5 sm:p-6">
                        <ClientOnly>
                            <div class="w-full" :style="{ height: '240px' }">
                                <VChart
                                    :option="harvestOption"
                                    :style="{ height: '240px', width: '100%' }"
                                    autoresize
                                />
                            </div>
                        </ClientOnly>

                        <div
                            class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                        >
                            <span class="text-sm text-slate-500">
                                Area harvested this year
                            </span>
                            <span class="text-sm font-bold text-[#2d6a2d]">
                                {{ chartTotals.area }} ha
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Harvest Records -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-7"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h3 class="text-base font-bold tracking-tight text-slate-800">
                                    Harvest Records
                                </h3>
                                <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Review production, yield, harvested area, and record status.
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
                        <table class="w-full min-w-[1100px] text-sm">
                            <thead class="border-b border-slate-100 bg-slate-50/70">
                                <tr class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    <th class="px-5 py-3.5 text-left">ID</th>
                                    <th class="px-5 py-3.5 text-left">Farmer</th>
                                    <th class="px-5 py-3.5 text-left">Crop</th>
                                    <th class="px-5 py-3.5 text-left">Parcel</th>
                                    <th class="px-5 py-3.5 text-left">Barangay</th>
                                    <th class="px-5 py-3.5 text-right">Area (ha)</th>
                                    <th class="px-5 py-3.5 text-right">Production (kg)</th>
                                    <th class="px-5 py-3.5 text-left">Date</th>
                                    <th class="px-5 py-3.5 text-left">Status</th>
                                    <th class="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-if="loading">
                                    <td colspan="10" class="px-5 py-12 text-center text-sm text-slate-400">
                                        <span class="inline-flex items-center gap-2">
                                            <UIcon
                                                name="i-lucide-loader-circle"
                                                class="size-4 animate-spin"
                                            />
                                            Loading harvests...
                                        </span>
                                    </td>
                                </tr>

                                <tr v-else-if="loadError">
                                    <td colspan="10" class="px-5 py-12 text-center">
                                        <p class="text-sm text-red-600">{{ loadError }}</p>
                                        <button
                                            type="button"
                                            class="mt-2 text-sm font-semibold text-green-700 underline"
                                            @click="load"
                                        >
                                            Try again
                                        </button>
                                    </td>
                                </tr>

                                <tr v-else-if="harvests.length === 0">
                                    <td colspan="10" class="px-5 py-14 text-center">
                                        <div class="flex flex-col items-center gap-2">
                                            <div
                                                class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                            >
                                                <UIcon name="i-lucide-wheat" class="size-6" />
                                            </div>
                                            <p class="text-base font-semibold text-slate-700">
                                                No harvests recorded yet
                                            </p>
                                            <p class="max-w-sm text-sm text-slate-400">
                                                Record the first harvest against a planted parcel to begin production tracking.
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-else-if="filtered.length === 0">
                                    <td colspan="10" class="px-5 py-12 text-center text-sm text-slate-400">
                                        No harvests match the current search or status filter.
                                    </td>
                                </tr>

                                <tr
                                    v-for="h in filtered"
                                    v-else
                                    :key="h.documentId"
                                    class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                                >
                                    <td class="px-5 py-4">
                                        <span
                                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                                        >
                                            {{ shortId(h.documentId) }}
                                        </span>
                                    </td>

                                    <td class="px-5 py-4">
                                        <div class="flex items-center gap-3">
                                            <span
                                                class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                                :style="{
                                                    backgroundColor: avatarColor(
                                                        h.farmerNames[0] ?? ''
                                                    ),
                                                }"
                                            >
                                                {{ initials(h.farmerNames[0] ?? '') }}
                                            </span>

                                            <div class="min-w-0">
                                                <div class="truncate font-medium text-slate-800">
                                                    {{ farmerLabel(h.farmerNames) }}
                                                </div>
                                                <div
                                                    v-if="h.variety"
                                                    class="mt-0.5 text-xs text-slate-400"
                                                >
                                                    Variety: {{ h.variety }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-5 py-4">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="h-2.5 w-2.5 shrink-0 rounded-full"
                                                :style="{
                                                    background:
                                                        CROP_COLORS[h.crop] ??
                                                        '#94a3b8',
                                                }"
                                            />
                                            <span class="font-semibold text-slate-700">
                                                {{ h.crop || '—' }}
                                            </span>
                                        </div>
                                    </td>

                                    <td class="px-5 py-4">
                                        <NuxtLink
                                            :to="`/parcels/${h.parcel_code}`"
                                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            {{ h.parcel_code }}
                                        </NuxtLink>
                                    </td>

                                    <td class="px-5 py-4 text-slate-600">
                                        <span class="flex items-center gap-1.5">
                                            <UIcon
                                                name="i-lucide-map-pin"
                                                class="size-3.5 text-slate-400"
                                            />
                                            {{ h.barangay }}
                                        </span>
                                    </td>

                                    <td class="px-5 py-4 text-right font-mono font-semibold text-slate-700">
                                        {{ h.area_hectares.toFixed(1) }}
                                    </td>

                                    <td class="px-5 py-4 text-right">
                                        <div class="font-mono font-semibold text-slate-900">
                                            {{ num(h.production_kg) }}
                                        </div>
                                        <div
                                            v-if="h.yield_per_hectare != null"
                                            class="mt-0.5 text-xs text-slate-400"
                                        >
                                            {{ num(h.yield_per_hectare) }} kg/ha
                                        </div>
                                    </td>

                                    <td class="px-5 py-4 text-slate-600">
                                        {{ h.harvest_date ?? '—' }}
                                    </td>

                                    <td class="px-5 py-4">
                                        <span
                                            :class="
                                                statusClass(
                                                    statusBackground(
                                                        harvestStatus(h)
                                                    )
                                                )
                                            "
                                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
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

                                    <td class="px-5 py-4">
                                        <div class="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                title="Edit harvest"
                                                @click="openEdit(h)"
                                            >
                                                <UIcon name="i-lucide-pencil" class="size-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                title="Delete harvest"
                                                @click="askDelete(h)"
                                            >
                                                <UIcon name="i-lucide-trash-2" class="size-3.5" />
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
    </div>

    <!-- Record Harvest Modal -->
    <Teleport to="body">
        <div
            v-if="showRecordModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRecord"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-11 items-center justify-center rounded-2xl bg-[#e8f5e8]"
                        >
                            <UIcon name="i-lucide-wheat" class="size-5 text-[#2d6a2d]" />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Record Harvest
                            </h3>
                            <p class="text-sm text-slate-500">
                                Log a harvest against an active planting cycle.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Harvest recorded.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitRecord">
                    <p
                        v-if="cycleParcels.length === 0"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        No parcels have a planting cycle yet. Register a cycle first,
                        then record its harvest here.
                    </p>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Parcel
                            <span v-if="cycleParcels.length > 0">(planting cycle)</span>
                            <span
                                v-if="cycleParcels.length > 0"
                                class="text-red-500"
                            >*</span>
                        </label>

                        <select
                            v-model="recordForm.parcelDocumentId"
                            :disabled="
                                submittingRecord || cycleParcels.length === 0
                            "
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
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
                            class="mt-1.5 text-xs text-slate-400"
                        >
                            {{ recordArea.toFixed(2) }} ha · yield is derived from
                            production per hectare.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Harvest Date <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="recordForm.harvest_date"
                            type="date"
                            :disabled="submittingRecord"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
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
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
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
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                                @focus="yieldEdited = true"
                            />
                        </div>
                    </div>

                    <p
                        v-if="recordError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ recordError }}
                    </p>

                    <div class="flex justify-end gap-2 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            :disabled="submittingRecord"
                            @click="closeRecord"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveRecord"
                        >
                            <UIcon
                                v-if="submittingRecord"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submittingRecord ? 'Saving...' : 'Record Harvest' }}
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEdit"
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
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Edit Harvest
                            </h3>
                            <p class="text-sm text-slate-500">
                                Correct the production and harvest date.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Harvest updated.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitEdit">
                    <div class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                        <span class="font-semibold text-slate-800">
                            {{ editForm.contextLabel }}
                        </span>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Harvest Date <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="editForm.harvest_date"
                            type="date"
                            :disabled="submittingEdit"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
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
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
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
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                                @focus="yieldEditedEdit = true"
                            />
                        </div>
                    </div>

                    <p
                        v-if="editError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ editError }}
                    </p>

                    <div class="flex justify-end gap-2 border-t border-slate-100 pt-5">
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

    <!-- Delete Harvest Modal -->
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
                    class="mb-4 flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                >
                    <UIcon name="i-lucide-trash-2" class="size-5" />
                </div>

                <h3 class="text-xl font-bold tracking-tight text-slate-950">
                    Delete Harvest
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                    Remove the {{ num(deleteTarget?.production_kg) }} kg harvest on
                    <span class="font-mono font-semibold text-slate-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
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
</template>
