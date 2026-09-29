<script setup lang="ts">
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
    <div class="space-y-6 p-4 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Planting & Crops
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Planting cycles · Crop and variety tracking · Season
                    monitoring
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="openRegister"
            >
                <UIcon name="i-lucide-sprout" class="size-3.5" />
                Register Planting Cycle
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
                v-for="card in summaryCards"
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
                        placeholder="Search farmer, barangay or parcel..."
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
                    {{ filtered.length }} of {{ cycles.length }} cycles
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
            <!-- Crop Area Chart -->
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
                            Crop Area
                        </h3>
                        <p class="text-[11px] text-gray-400">
                            {{ cropAreaData.length }} crop types ·
                            {{ cropAreaTotal }} ha planted
                        </p>
                    </div>
                </div>
                <ClientOnly>
                    <div class="w-full" :style="{ height: '200px' }">
                        <VChart
                            :option="cropAreaOption"
                            :style="{ height: '200px', width: '100%' }"
                            autoresize
                        />
                    </div>
                </ClientOnly>
                <div
                    class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3"
                >
                    <span
                        v-for="d in cropAreaData"
                        :key="d.name"
                        class="flex items-center gap-1.5 text-[11px] text-gray-600"
                    >
                        <span
                            class="h-2 w-2 rounded-full"
                            :style="{ background: d.color }"
                        />
                        {{ d.name }} · {{ d.area }} ha
                    </span>
                </div>
                <div
                    class="mt-3 flex items-center justify-between rounded-lg bg-[#f8faf8] px-3 py-2"
                >
                    <span class="text-[11px] text-gray-500"
                        >Planted area total</span
                    >
                    <span class="text-xs font-bold text-[#2d6a2d]">
                        {{ cropAreaTotal }} ha
                    </span>
                </div>
            </div>

            <!-- Planting Records -->
            <div class="alps-card col-span-7 overflow-hidden">
                <div class="border-b border-gray-100 px-5 py-4">
                    <h3 class="text-sm font-semibold text-gray-700">
                        Planting Cycle Records
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[720px] text-xs">
                        <thead class="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Farmer
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Crop / Variety
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Parcel
                                </th>
                                <th
                                    class="px-4 py-3 text-right font-semibold text-gray-600"
                                >
                                    Area
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Planted
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Harvest
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
                                    colspan="8"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    <span
                                        class="inline-flex items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-loader-circle"
                                            class="size-4 animate-spin"
                                        />
                                        Loading planting cycles...
                                    </span>
                                </td>
                            </tr>
                            <!-- Failed -->
                            <tr v-else-if="loadError">
                                <td colspan="8" class="px-4 py-10 text-center">
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
                            <tr v-else-if="cycles.length === 0">
                                <td
                                    colspan="8"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    <div
                                        class="flex flex-col items-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-sprout"
                                            class="size-6 text-gray-300"
                                        />
                                        <p>
                                            No planting cycles yet. Register the
                                            first one to start tracking crops.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-else-if="filtered.length === 0">
                                <td
                                    colspan="8"
                                    class="px-4 py-10 text-center text-gray-400"
                                >
                                    No cycles match this search.
                                </td>
                            </tr>
                            <tr
                                v-for="(p, i) in filtered"
                                :key="p.cycle.documentId"
                                class="border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/30"
                                :class="
                                    i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                                "
                            >
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2.5">
                                        <span
                                            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                            :style="{
                                                backgroundColor: avatarColor(
                                                    p.farmerNames[0] ?? ''
                                                ),
                                            }"
                                        >
                                            {{
                                                initials(p.farmerNames[0] ?? '')
                                            }}
                                        </span>
                                        <div>
                                            <div
                                                class="font-medium text-gray-800"
                                            >
                                                {{ farmerLabel(p.farmerNames) }}
                                            </div>
                                            <div class="text-gray-400">
                                                {{ p.barangay }}
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
                                                    CROP_COLORS[
                                                        p.cycle.crop?.name ?? ''
                                                    ] ?? '#94a3b8',
                                            }"
                                        />
                                        <span class="font-medium text-gray-700">
                                            {{ p.cycle.crop?.name ?? '—' }}
                                        </span>
                                    </div>
                                    <div
                                        v-if="p.cycle.variety"
                                        class="pl-3.5 italic text-gray-400"
                                    >
                                        {{ p.cycle.variety }}
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <NuxtLink
                                        :to="`/parcels/${p.parcel_code}`"
                                        class="font-mono text-gray-500 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                    >
                                        {{ p.parcel_code }}
                                    </NuxtLink>
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono font-semibold text-gray-900"
                                >
                                    {{ p.area_hectares.toFixed(1) }} ha
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ p.cycle.planting_date ?? '—' }}
                                </td>
                                <td class="px-4 py-3">
                                    <div>
                                        <div class="text-gray-500">
                                            {{
                                                p.cycle.expected_harvest ?? '—'
                                            }}
                                        </div>
                                        <div
                                            v-if="
                                                cycleStatus(p) === 'Harvested'
                                            "
                                            class="text-[10px] text-gray-400"
                                        >
                                            completed
                                        </div>
                                        <div
                                            v-else-if="
                                                expectedHint(p).hasExpected
                                            "
                                            :class="
                                                expectedHint(p).urgent
                                                    ? 'text-amber-600'
                                                    : 'text-[#2d6a2d]'
                                            "
                                            class="flex items-center gap-1 text-[10px] font-semibold"
                                        >
                                            <UIcon
                                                name="i-lucide-hourglass"
                                                class="size-2.5"
                                            />
                                            {{ expectedHint(p).text }}
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        :class="
                                            statusClass(
                                                statusBackground(cycleStatus(p))
                                            )
                                        "
                                        class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
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
                                <td class="px-4 py-3">
                                    <div
                                        class="flex items-center justify-end gap-1"
                                    >
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                            @click="openEdit(p)"
                                        >
                                            <UIcon
                                                name="i-lucide-pencil"
                                                class="size-3.5"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            @click="askDelete(p)"
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

    <!-- Register Planting Cycle Modal -->
    <Teleport to="body">
        <div
            v-if="showRegisterModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeRegister"
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
                                name="i-lucide-sprout"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Register Planting Cycle
                            </h3>
                            <p class="text-xs text-gray-500">
                                Log a planting cycle against a parcel.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
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
                        class="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-5" />
                    </span>
                    <p class="text-sm font-semibold text-gray-800">Saved</p>
                    <p class="text-xs text-gray-500">Planting cycle logged.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitRegister">
                    <p
                        v-if="registerReplacesExisting"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        This parcel already has a crop cycle on record. Saving
                        replaces it.
                    </p>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Parcel <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="registerForm.parcel"
                            :disabled="submittingRegister"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            No parcels registered yet.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Crop <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="registerForm.crop"
                            :disabled="submittingRegister || cropsLoading"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            No crops registered — name one below.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            …or name a new crop
                        </label>
                        <input
                            v-model="registerForm.newCropName"
                            type="text"
                            :disabled="submittingRegister"
                            placeholder="e.g. Mung Bean"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                        <p class="mt-1 text-[11px] text-gray-400">
                            Typing a name creates the crop and uses it for this
                            cycle.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Variety
                        </label>
                        <input
                            v-model="registerForm.variety"
                            type="text"
                            :disabled="submittingRegister"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="registerForm.planting_date"
                                type="date"
                                :disabled="submittingRegister"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Expected Harvest
                            </label>
                            <input
                                v-model="registerForm.expected_harvest"
                                type="date"
                                :disabled="submittingRegister"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>

                    <p
                        v-if="registerError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ registerError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                    >
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submittingRegister"
                            @click="closeRegister"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
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
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeEdit"
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
                                Edit Planting Cycle
                            </h3>
                            <p class="text-xs text-gray-500">
                                Update the crop and planting dates.
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
                    <p class="text-xs text-gray-500">Planting cycle updated.</p>
                </div>

                <form v-else class="space-y-4" @submit.prevent="submitEdit">
                    <div
                        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ editForm.parcelLabel }}
                        </span>
                    </div>

                    <p
                        v-if="editForm.harvestCount > 0"
                        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        This cycle already has
                        {{ editForm.harvestCount }}
                        harvest record(s). Changing the crop relabels them.
                    </p>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Crop <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="editForm.crop"
                            :disabled="submittingEdit || cropsLoading"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            No crops registered — name one below.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            …or name a new crop
                        </label>
                        <input
                            v-model="editForm.newCropName"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="e.g. Mung Bean"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Variety
                        </label>
                        <input
                            v-model="editForm.variety"
                            type="text"
                            :disabled="submittingEdit"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Planting Date
                            </label>
                            <input
                                v-model="editForm.planting_date"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Expected Harvest
                            </label>
                            <input
                                v-model="editForm.expected_harvest"
                                type="date"
                                :disabled="submittingEdit"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
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

    <!-- Delete Planting Cycle Modal -->
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
                    Delete Planting Cycle
                </h3>
                <p class="mt-1 text-xs text-gray-500">
                    Remove the
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.cycle.crop?.name ?? 'cycle' }}
                    </span>
                    cycle on
                    <span class="font-mono text-gray-700">
                        {{ deleteTarget?.parcel_code ?? '' }}
                    </span>
                    ? Its harvest records are removed too. This action cannot be
                    undone.
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
