<script setup lang="ts">
//@ts-nocheck
import type { CycleRow } from '~/composables/useCycleRegistry'

import type { ParcelCrop } from '~/composables/useFarmParcelApi'

import { useFarmParcelApi } from '~/composables/useFarmParcelApi'

import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'

import { getErrorMessage } from '~/utils/apiError'

import { avatarColor, initials } from '~/utils/initials'

import { statusClass, statusDot } from '~/utils/landStatus'



definePageMeta({ middleware: 'auth' })



type PlantingStatus = 'Harvested' | 'Growing'



const { update: updateParcel } = useFarmParcelApi()

const { parcels, cycles, loading, loadError, load } = useCycleRegistry()

const {

    getCrops,

    createCrop,

    createPlantingCycle,

    updatePlantingCycle,

    deletePlantingCycle,

} = useFarmRecordsApi()



/** A cycle is Harvested once it holds at least one harvest record. */

const cycleStatus = (row: CycleRow): PlantingStatus =>

    (row.cycle.harvests?.length ?? 0) > 0 ? 'Harvested' : 'Growing'



/** Page status -> land-status palette, so the shared badges can be reused. */

const statusBackground = (status: PlantingStatus) =>

    status === 'Harvested' ? 'Cultivated' : 'Preparation'



const CROP_COLORS: Record<string, string> = {

    Rice: '#16a34a',

    Corn: '#ca8a04',

    Sugarcane: '#d97706',

    Vegetables: '#059669',

    Eggplant: '#7c3aed',

    Tomato: '#dc2626',

}



const farmerLabel = (names: string[]): string => {

    if (names.length === 0) return '—'

    const visible = names.slice(0, 2).join(', ')

    return names.length > 2 ? `${visible} +${names.length - 2}` : visible

}



const cropAreaData = computed(() => {

    const areas = new Map<string, number>()

    for (const row of cycles.value) {

        const name = row.cycle.crop?.name

        if (!name) continue

        areas.set(name, (areas.get(name) ?? 0) + row.area_hectares)

    }

    return [...areas.entries()].map(([name, area]) => ({

        name,

        area: Math.round(area * 10) / 10,

        color: CROP_COLORS[name] ?? '#94a3b8',

    }))

})



const summaryCards = computed(() => [

    {

        label: 'Active Plantings',

        val: cycles.value.filter((c) => cycleStatus(c) === 'Growing').length,

        color: '#16a34a',

        bg: '#dcfce7',

        icon: 'i-lucide-sprout',

    },

    {

        label: 'Crop Types',

        val: new Set(

            cycles.value.map((c) => c.cycle.crop?.name).filter(Boolean)

        ).size,

        color: '#2d6a2d',

        bg: '#e8f5e8',

        icon: 'i-lucide-wheat',

    },

    {

        label: 'Total Planted Area',

        val: `${cycles.value

            .reduce((sum, c) => sum + c.area_hectares, 0)

            .toFixed(1)} ha`,

        color: '#1d6fa4',

        bg: '#e0f0fb',

        icon: 'i-lucide-ruler',

    },

    {

        label: 'Harvested Cycles',

        val: cycles.value.filter((c) => cycleStatus(c) === 'Harvested').length,

        color: '#ca8a04',

        bg: '#fef3c7',

        icon: 'i-lucide-calendar-check',

    },

])



const cropAreaTotal = computed(

    () =>

        Math.round(

            cropAreaData.value.reduce((sum, d) => sum + d.area, 0) * 10

        ) / 10

)



const statusFilterOptions = ['All', 'Growing', 'Harvested'] as const

type StatusFilter = (typeof statusFilterOptions)[number]

const filterStatus = ref<StatusFilter>('All')

const search = ref('')



const filtered = computed(() =>

    cycles.value.filter((row) => {

        const haystack = [

            farmerLabel(row.farmerNames),

            row.barangay,

            row.parcel_code,

            row.cycle.crop?.name ?? '',

            row.cycle.variety ?? '',

        ]

            .join(' ')

            .toLowerCase()

        const match =

            !search.value || haystack.includes(search.value.toLowerCase())

        const status =

            filterStatus.value === 'All' ||

            cycleStatus(row) === filterStatus.value

        return match && status

    })

)



const cropAreaOption = computed(() => ({

    animation: false,

    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },

    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },

    xAxis: {

        type: 'value',

        splitLine: { show: false },

        axisLabel: { fontSize: 10, color: '#9ca3af' },

    },

    yAxis: {

        type: 'category',

        data: [...cropAreaData.value].reverse().map((d) => d.name),

        axisLine: { show: false },

        axisTick: { show: false },

        axisLabel: { fontSize: 10, color: '#374151' },

    },

    series: [

        {

            type: 'bar',

            barWidth: 14,

            itemStyle: { borderRadius: [0, 3, 3, 0] },

            data: [...cropAreaData.value]

                .reverse()

                .map((d) => ({ value: d.area, itemStyle: { color: d.color } })),

        },

    ],

}))



/** Days from today until a date; negative when the date has passed. */

function daysUntil(dateStr: string): number {

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const target = new Date(`${dateStr}T00:00:00`)

    return Math.round((target.getTime() - today.getTime()) / 86_400_000)

}



const expectedHint = (row: CycleRow) => {

    const date = row.cycle.expected_harvest

    if (!date) return { text: '', urgent: false, hasExpected: false }

    const days = daysUntil(date)

    if (days >= 0) {

        return {

            text: `in ${days} days`,

            urgent: days <= 10,

            hasExpected: true,

        }

    }

    return {

        text: `${Math.abs(days)} days ago`,

        urgent: true,

        hasExpected: true,

    }

}



onMounted(() => {

    load()

})



/* ------------------------------------------------------------------ */

/* Crop options (shared by the register and edit forms)                 */

/* ------------------------------------------------------------------ */



const crops = ref<ParcelCrop[]>([])

const cropsLoading = ref(false)

const cropsError = ref<string | null>(null)



const cropOptions = computed(() =>

    crops.value.map((crop) => ({

        label: crop.name,

        value: crop.documentId,

    }))

)



async function loadCrops() {

    cropsLoading.value = true

    cropsError.value = null

    try {

        crops.value = await getCrops()

    } catch (cause) {

        crops.value = []

        cropsError.value = getErrorMessage(

            cause,

            'Could not load the crop list. You can still name a new crop below.'

        )

    } finally {

        cropsLoading.value = false

    }

}



/** A typed name wins over a selection: naming a new crop is the explicit act. */

async function resolveCrop(

    cropId: string,

    newCropName: string

): Promise<string> {

    const name = newCropName.trim()

    if (name) {

        const created = await createCrop(name, '')

        return created.documentId

    }

    return cropId

}



const parcelOptions = computed(() =>

    parcels.value.map((parcel) => {

        const parts = [

            parcel.parcel_code,

            parcel.farm?.barangay?.name ?? '',

            `${(Number(parcel.area_hectares) || 0).toFixed(1)} ha`,

        ].filter(Boolean)

        return { value: parcel.documentId, label: parts.join(' · ') }

    })

)



/* ------------------------------------------------------------------ */

/* Register planting cycle                                              */

/* ------------------------------------------------------------------ */



const showRegisterModal = ref(false)

const submittingRegister = ref(false)

const registerError = ref<string | null>(null)

const registerSaved = ref(false)

let registerCloseTimer: ReturnType<typeof setTimeout> | null = null



const registerForm = reactive({

    parcel: '',

    crop: '',

    newCropName: '',

    variety: '',

    planting_date: '',

    expected_harvest: '',

})



const selectedParcel = computed(

    () =>

        parcels.value.find((p) => p.documentId === registerForm.parcel) ?? null

)



/** A parcel can hold one cycle, so registering again replaces the old one. */

const registerReplacesExisting = computed(() =>

    Boolean(selectedParcel.value?.planting_cycle)

)



function openRegister() {

    registerForm.parcel = parcels.value[0]?.documentId ?? ''

    registerForm.crop = ''

    registerForm.newCropName = ''

    registerForm.variety = ''

    registerForm.planting_date = ''

    registerForm.expected_harvest = ''

    registerError.value = null

    registerSaved.value = false

    if (crops.value.length === 0) loadCrops()

    showRegisterModal.value = true

}



const canSaveRegister = computed(

    () =>

        !submittingRegister.value &&

        !cropsLoading.value &&

        Boolean(registerForm.parcel) &&

        (Boolean(registerForm.crop) || Boolean(registerForm.newCropName.trim()))

)



function closeRegister() {

    if (submittingRegister.value) return

    if (registerCloseTimer) {

        clearTimeout(registerCloseTimer)

        registerCloseTimer = null

    }

    registerSaved.value = false

    showRegisterModal.value = false

}



/** A parcel holds one cycle, so a registration attaches it in one update. */

async function attachCycleToParcel(

    parcelDocumentId: string,

    cycleDocumentId: string

): Promise<void> {

    await updateParcel(parcelDocumentId, { planting_cycle: cycleDocumentId })

}



async function submitRegister() {

    const parcelDocumentId = registerForm.parcel

    registerError.value = null

    submittingRegister.value = true

    try {

        const crop = await resolveCrop(

            registerForm.crop,

            registerForm.newCropName

        )

        const cycle = await createPlantingCycle({

            crop,

            variety: registerForm.variety.trim() || null,

            planting_date: registerForm.planting_date || null,

            expected_harvest: registerForm.expected_harvest || null,

        })

        await attachCycleToParcel(parcelDocumentId, cycle.documentId)

        registerSaved.value = true

        registerCloseTimer = setTimeout(() => {

            registerCloseTimer = null

            registerSaved.value = false

            showRegisterModal.value = false

        }, 900)

        await load()

    } catch (cause) {

        registerError.value = getErrorMessage(

            cause,

            'Failed to log the planting cycle. Please try again.'

        )

    } finally {

        submittingRegister.value = false

    }

}



/* ------------------------------------------------------------------ */

/* Edit planting cycle                                                  */

/* ------------------------------------------------------------------ */



const showEditModal = ref(false)

const submittingEdit = ref(false)

const editError = ref<string | null>(null)

const editSaved = ref(false)

let editCloseTimer: ReturnType<typeof setTimeout> | null = null



const editForm = reactive({

    cycleDocumentId: '',

    parcelLabel: '',

    crop: '',

    newCropName: '',

    variety: '',

    planting_date: '',

    expected_harvest: '',

    harvestCount: 0,

})



function openEdit(row: CycleRow) {

    const cycle = row.cycle

    editForm.cycleDocumentId = cycle.documentId

    editForm.parcelLabel = `${row.parcel_code} · ${row.barangay}`

    editForm.crop = cycle.crop?.documentId ?? ''

    editForm.newCropName = ''

    editForm.variety = cycle.variety ?? ''

    editForm.planting_date = cycle.planting_date ?? ''

    editForm.expected_harvest = cycle.expected_harvest ?? ''

    editForm.harvestCount = cycle.harvests?.length ?? 0

    editError.value = null

    editSaved.value = false

    if (crops.value.length === 0) loadCrops()

    showEditModal.value = true

}



const canSaveEdit = computed(

    () =>

        !submittingEdit.value &&

        !cropsLoading.value &&

        (Boolean(editForm.crop) || Boolean(editForm.newCropName.trim()))

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

        const crop = await resolveCrop(editForm.crop, editForm.newCropName)

        await updatePlantingCycle(editForm.cycleDocumentId, {

            crop,

            variety: editForm.variety.trim() || null,

            planting_date: editForm.planting_date || null,

            expected_harvest: editForm.expected_harvest || null,

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

            'Failed to update the planting cycle. Please try again.'

        )

    } finally {

        submittingEdit.value = false

    }

}



/* ------------------------------------------------------------------ */

/* Delete planting cycle                                                */

/* ------------------------------------------------------------------ */



const showDeleteModal = ref(false)

const deleteTarget = ref<CycleRow | null>(null)

const deleting = ref(false)

const deleteError = ref<string | null>(null)



function askDelete(row: CycleRow) {

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

        await deletePlantingCycle(target.cycle.documentId)

        deleteTarget.value = null

        showDeleteModal.value = false

        await load()

    } catch (cause) {

        deleteError.value = getErrorMessage(

            cause,

            'Failed to delete the planting cycle. Please try again.'

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
                            <UIcon name="i-lucide-sprout" class="size-6" />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <span class="size-1.5 rounded-full bg-emerald-500" />
                                    Crop & Planting Management
                                </span>

                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ cycles.length }} planting cycles
                                </span>
                            </div>

                            <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                Planting &amp; Crops
                            </h1>

                            <p class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                                Track crop cycles, planted areas, varieties, and expected harvest schedules.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                        @click="openRegister"
                    >
                        <UIcon name="i-lucide-sprout" class="size-4.5" />
                        Register Planting Cycle
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="card in summaryCards"
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
                                    card.label === 'Active Plantings'
                                        ? 'Currently growing crop cycles'
                                        : card.label === 'Crop Types'
                                          ? 'Crop varieties in the registry'
                                          : card.label === 'Total Planted Area'
                                            ? 'Combined planted coverage'
                                            : 'Completed planting cycles'
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
                                Find Planting Cycles
                            </h2>
                            <p class="text-xs text-slate-500">
                                Search the registry or filter by planting status.
                            </p>
                        </div>
                    </div>

                    <div class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
                        <UIcon name="i-lucide-filter" class="size-3.5" />
                        {{ filtered.length }} of {{ cycles.length }} cycles
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
                                placeholder="Search farmer, barangay, parcel, crop or variety..."
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
                            {{ filtered.length }} of {{ cycles.length }} cycles
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

            <!-- Main Content -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Crop Area Chart -->
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
                                    Crop Area
                                </h3>
                                <p class="text-xs text-slate-500">
                                    {{ cropAreaData.length }} crop types ·
                                    {{ cropAreaTotal }} ha planted
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="p-5 sm:p-6">
                        <ClientOnly>
                            <div class="w-full" :style="{ height: '240px' }">
                                <VChart
                                    :option="cropAreaOption"
                                    :style="{ height: '240px', width: '100%' }"
                                    autoresize
                                />
                            </div>
                        </ClientOnly>

                        <div
                            class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4"
                        >
                            <span
                                v-for="d in cropAreaData"
                                :key="d.name"
                                class="flex items-center gap-1.5 text-sm text-slate-600"
                            >
                                <span
                                    class="h-2.5 w-2.5 rounded-full"
                                    :style="{ background: d.color }"
                                />
                                {{ d.name }} · {{ d.area }} ha
                            </span>
                        </div>

                        <div
                            class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                        >
                            <span class="text-sm text-slate-500">
                                Planted area total
                            </span>
                            <span class="text-sm font-bold text-[#2d6a2d]">
                                {{ cropAreaTotal }} ha
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Planting Records -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-7"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h3 class="text-base font-bold tracking-tight text-slate-800">
                                    Planting Cycle Records
                                </h3>
                                <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Review crop assignments, planting dates, harvest schedules, and cycle status.
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
                        <table class="w-full min-w-[900px] text-sm">
                            <thead class="border-b border-slate-100 bg-slate-50/70">
                                <tr class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    <th class="px-5 py-3.5 text-left">Farmer</th>
                                    <th class="px-5 py-3.5 text-left">Crop / Variety</th>
                                    <th class="px-5 py-3.5 text-left">Parcel</th>
                                    <th class="px-5 py-3.5 text-right">Area</th>
                                    <th class="px-5 py-3.5 text-left">Planted</th>
                                    <th class="px-5 py-3.5 text-left">Harvest</th>
                                    <th class="px-5 py-3.5 text-left">Status</th>
                                    <th class="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-if="loading">
                                    <td colspan="8" class="px-5 py-12 text-center text-sm text-slate-400">
                                        <span class="inline-flex items-center gap-2">
                                            <UIcon
                                                name="i-lucide-loader-circle"
                                                class="size-4 animate-spin"
                                            />
                                            Loading planting cycles...
                                        </span>
                                    </td>
                                </tr>

                                <tr v-else-if="loadError">
                                    <td colspan="8" class="px-5 py-12 text-center">
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

                                <tr v-else-if="cycles.length === 0">
                                    <td colspan="8" class="px-5 py-14 text-center">
                                        <div class="flex flex-col items-center gap-2">
                                            <div
                                                class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                            >
                                                <UIcon name="i-lucide-sprout" class="size-6" />
                                            </div>
                                            <p class="text-base font-semibold text-slate-700">
                                                No planting cycles yet
                                            </p>
                                            <p class="max-w-sm text-sm text-slate-400">
                                                Register the first planting cycle to begin tracking crops.
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-else-if="filtered.length === 0">
                                    <td colspan="8" class="px-5 py-12 text-center text-sm text-slate-400">
                                        No cycles match the current search or status filter.
                                    </td>
                                </tr>

                                <tr
                                    v-for="p in filtered"
                                    v-else
                                    :key="p.cycle.documentId"
                                    class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                                >
                                    <td class="px-5 py-4">
                                        <div class="flex items-center gap-3">
                                            <span
                                                class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                                :style="{
                                                    backgroundColor: avatarColor(
                                                        p.farmerNames[0] ?? ''
                                                    ),
                                                }"
                                            >
                                                {{ initials(p.farmerNames[0] ?? '') }}
                                            </span>
                                            <div class="min-w-0">
                                                <div class="truncate font-medium text-slate-800">
                                                    {{ farmerLabel(p.farmerNames) }}
                                                </div>
                                                <div class="mt-0.5 text-xs text-slate-400">
                                                    {{ p.barangay }}
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
                                                        CROP_COLORS[
                                                            p.cycle.crop?.name ?? ''
                                                        ] ?? '#94a3b8',
                                                }"
                                            />
                                            <span class="font-semibold text-slate-700">
                                                {{ p.cycle.crop?.name ?? '—' }}
                                            </span>
                                        </div>
                                        <div
                                            v-if="p.cycle.variety"
                                            class="mt-1 pl-4.5 text-xs italic text-slate-400"
                                        >
                                            {{ p.cycle.variety }}
                                        </div>
                                    </td>

                                    <td class="px-5 py-4">
                                        <NuxtLink
                                            :to="`/parcels/${p.parcel_code}`"
                                            class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            {{ p.parcel_code }}
                                        </NuxtLink>
                                    </td>

                                    <td class="px-5 py-4 text-right font-mono font-semibold text-slate-800">
                                        {{ p.area_hectares.toFixed(1) }} ha
                                    </td>

                                    <td class="px-5 py-4 text-slate-600">
                                        {{ p.cycle.planting_date ?? '—' }}
                                    </td>

                                    <td class="px-5 py-4">
                                        <div class="text-slate-600">
                                            {{ p.cycle.expected_harvest ?? '—' }}
                                        </div>

                                        <div
                                            v-if="cycleStatus(p) === 'Harvested'"
                                            class="mt-1 text-xs text-slate-400"
                                        >
                                            completed
                                        </div>

                                        <div
                                            v-else-if="expectedHint(p).hasExpected"
                                            :class="
                                                expectedHint(p).urgent
                                                    ? 'text-amber-600'
                                                    : 'text-[#2d6a2d]'
                                            "
                                            class="mt-1 flex items-center gap-1 text-xs font-semibold"
                                        >
                                            <UIcon
                                                name="i-lucide-hourglass"
                                                class="size-3"
                                            />
                                            {{ expectedHint(p).text }}
                                        </div>
                                    </td>

                                    <td class="px-5 py-4">
                                        <span
                                            :class="
                                                statusClass(
                                                    statusBackground(cycleStatus(p))
                                                )
                                            "
                                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                        >
                                            <span
                                                class="h-1.5 w-1.5 rounded-full"
                                                :style="{
                                                    backgroundColor: statusDot(
                                                        statusBackground(
                                                            cycleStatus(p)
                                                        )
                                                    ),
                                                }"
                                            />
                                            {{ cycleStatus(p) }}
                                        </span>
                                    </td>

                                    <td class="px-5 py-4">
                                        <div class="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                title="Edit planting cycle"
                                                @click="openEdit(p)"
                                            >
                                                <UIcon
                                                    name="i-lucide-pencil"
                                                    class="size-3.5"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                title="Delete planting cycle"
                                                @click="askDelete(p)"
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
        </div>
    </div>

    <!-- Register Planting Cycle Modal -->
    <Teleport to="body">
        <div
            v-if="showRegisterModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRegister"
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
                                name="i-lucide-sprout"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Register Planting Cycle
                            </h3>
                            <p class="text-sm text-slate-500">
                                Log a planting cycle against a parcel.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        :disabled="submittingRegister"
                        @click="closeRegister"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="registerSaved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">Planting cycle logged.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitRegister">
                    <p
                        v-if="registerReplacesExisting"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        This parcel already has a crop cycle on record. Saving replaces it.
                    </p>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="registerForm.parcel"
                            :disabled="submittingRegister"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        >
                            <option value="" disabled>Select a parcel</option>
                            <option
                                v-for="option in parcelOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                        <p
                            v-if="parcels.length === 0"
                            class="mt-1.5 text-xs text-slate-400"
                        >
                            No parcels registered yet.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Crop <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="registerForm.crop"
                            :disabled="submittingRegister || cropsLoading"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        >
                            <option value="" disabled>Select a crop</option>
                            <option
                                v-for="option in cropOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                        <p
                            v-if="!cropsLoading && crops.length === 0"
                            class="mt-1.5 text-xs text-slate-400"
                        >
                            No crops registered — name one below.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            …or name a new crop
                        </label>
                        <input
                            v-model="registerForm.newCropName"
                            type="text"
                            :disabled="submittingRegister"
                            placeholder="e.g. Mung Bean"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                        <p class="mt-1.5 text-xs text-slate-400">
                            Typing a name creates the crop and uses it for this cycle.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Variety
                        </label>
                        <input
                            v-model="registerForm.variety"
                            type="text"
                            :disabled="submittingRegister"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="registerForm.planting_date"
                                type="date"
                                :disabled="submittingRegister"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Expected Harvest
                            </label>
                            <input
                                v-model="registerForm.expected_harvest"
                                type="date"
                                :disabled="submittingRegister"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <p
                        v-if="registerError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ registerError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                            :disabled="submittingRegister"
                            @click="closeRegister"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSaveRegister"
                        >
                            <UIcon
                                v-if="submittingRegister"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{
                                submittingRegister
                                    ? 'Saving...'
                                    : 'Register Planting Cycle'
                            }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Planting Cycle Modal -->
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
                                Edit Planting Cycle
                            </h3>
                            <p class="text-sm text-slate-500">
                                Update the crop and planting dates.
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
                    <p class="text-sm text-slate-500">Planting cycle updated.</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="submitEdit">
                    <div
                        class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600"
                    >
                        <span class="font-semibold text-slate-800">
                            {{ editForm.parcelLabel }}
                        </span>
                    </div>

                    <p
                        v-if="editForm.harvestCount > 0"
                        class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
                    >
                        This cycle already has {{ editForm.harvestCount }}
                        harvest record(s). Changing the crop relabels them.
                    </p>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Crop <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="editForm.crop"
                            :disabled="submittingEdit || cropsLoading"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        >
                            <option value="" disabled>Select a crop</option>
                            <option
                                v-for="option in cropOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                        <p
                            v-if="!cropsLoading && crops.length === 0"
                            class="mt-1.5 text-xs text-slate-400"
                        >
                            No crops registered — name one below.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            …or name a new crop
                        </label>
                        <input
                            v-model="editForm.newCropName"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="e.g. Mung Bean"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Variety
                        </label>
                        <input
                            v-model="editForm.variety"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="editForm.planting_date"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Expected Harvest
                            </label>
                            <input
                                v-model="editForm.expected_harvest"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60"
                            />
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
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
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

    <!-- Delete Planting Cycle Modal -->
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
                    Delete Planting Cycle
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                    Remove the
                    <span class="font-mono font-semibold text-slate-700">
                        {{ deleteTarget?.cycle.crop?.name ?? 'cycle' }}
                    </span>
                    cycle on
                    <span class="font-mono font-semibold text-slate-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ? Its harvest records are removed too. This action cannot be
                    undone.
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
