<script setup lang="ts">
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'
import type { Farm } from '~/composables/useFarmsApi'
import type { FarmRow } from '~/composables/useFarmsData'
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusDot } from '~/utils/landStatus'

useHead({ title: 'Farms & Parcels' })

type RegistryTab = 'farms' | 'parcels'
type StatusFilter = 'All' | (typeof LAND_STATUS_OPTIONS)[number]

const {
    farms,
    loading: farmsLoading,
    loadError: farmsError,
    selected: selectedFarm,
    selectedDetail,
    detailLoading,
    search: farmSearch,
    filterStatus: farmStatus,
    filtered: filteredFarms,
    summaryCards: farmSummaryCards,
    loadFarms,
    upsertFarm,
    selectFarm,
    deleteFarm,
} = useFarmsData()

const {
    parcels,
    loading: parcelsLoading,
    loadError: parcelsError,
    search: parcelSearch,
    filterStatus: parcelStatus,
    filtered: filteredParcels,
    summaryCards: parcelSummaryCards,
    loadParcels,
    deleteParcel,
} = useParcelsData()

const { logout, canEdit, canDelete } = useAuth()
const route = useRoute()

const tab = ref<RegistryTab>('farms')
const selectedParcel = ref<ParcelRow | null>(null)
const showFarmForm = ref(false)
const editingFarm = ref<Farm | null>(null)
const notice = ref<string | null>(null)

let noticeTimer: ReturnType<typeof setTimeout> | undefined

const parcelStatusFilters = ['All', ...LAND_STATUS_OPTIONS] as StatusFilter[]

const awaitingParcels = computed(() =>
    farms.value.filter((row) => row.parcelCount === 0)
)

onMounted(async () => {
    await Promise.all([loadFarms(), loadParcels()])

    // Deep link from the parcel hub (`?farm=<documentId>`): open that farm's
    // card even if the current search or status filter would hide it.
    const farmId =
        typeof route.query.farm === 'string' ? route.query.farm : undefined

    if (farmId) {
        const row = farms.value.find((farm) => farm.documentId === farmId)

        if (row) selectFarm(row)
    }
})

onBeforeUnmount(() => {
    if (noticeTimer) clearTimeout(noticeTimer)
})

async function signInAgain() {
    await logout()
    await navigateTo('/login')
}

function showNotice(message: string) {
    notice.value = message

    if (noticeTimer) clearTimeout(noticeTimer)

    noticeTimer = setTimeout(() => {
        notice.value = null
    }, 6000)
}

function openCreateFarm() {
    editingFarm.value = null
    showFarmForm.value = true
}

function openEditFarm(farm: Farm) {
    editingFarm.value = farm
    showFarmForm.value = true
}

function handleFarmSaved(farm: Farm) {
    upsertFarm(farm)
    showNotice(`Farm ${farm.farm_code} saved.`)
}

function goAddParcel() {
    navigateTo('/map?add-parcel=1')
}

function goEditParcel(documentId: string) {
    navigateTo({ path: '/map', query: { 'edit-parcel': documentId } })
}

function goViewParcel(documentId: string) {
    navigateTo({ path: '/map', query: { 'focus-parcel': documentId } })
}

/**
 * Jumps from a parcel to the farm that owns it. The farm may be hidden by the
 * current search or status filter, so this selects it directly rather than
 * relying on it being in the filtered list.
 */

function goViewFarm(documentId: string) {
    const row = farms.value.find((farm) => farm.documentId === documentId)

    tab.value = 'farms'

    if (row) {
        selectFarm(row)
    } else {
        showNotice(
            'That parcel has no farm yet. Create or fix the parcel first.'
        )
    }
}

/**
 * Confirm-to-delete flow for both registries. Deleting a farm is only allowed
 * once it has no parcels; deleting a parcel only once nothing (planting cycle,
 * inspection, risk report) still references it. The server enforces both and
 * answers 409 with the reason when they are not met.
 */
const {
    open: showFarmDeleteModal,
    target: farmDeleteTarget,
    deleting: deletingFarm,
    error: farmDeleteError,
    ask: askDeleteFarm,
    close: closeFarmDelete,
    confirm: confirmFarmDelete,
} = useDeleteModal<FarmRow>({
    remove: (row) => deleteFarm(row.documentId),
    failureMessage: 'Failed to delete the farm. Please try again.',
})

const {
    open: showParcelDeleteModal,
    target: parcelDeleteTarget,
    deleting: deletingParcel,
    error: parcelDeleteError,
    ask: askDeleteParcel,
    close: closeParcelDelete,
    confirm: confirmParcelDelete,
} = useDeleteModal<ParcelRow>({
    remove: (row) => {
        if (selectedParcel.value?.documentId === row.documentId) {
            selectedParcel.value = null
        }
        return deleteParcel(row.documentId)
    },
    failureMessage: 'Failed to delete the parcel. Please try again.',
})
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Page Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-linear-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
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
                            <UIcon name="i-lucide-tractor" class="size-6" />
                        </div>

                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                    <UIcon
                                        name="i-lucide-map-pinned"
                                        class="size-3.5"
                                    />
                                    Farm & Parcel Management
                                </span>
                                <span
                                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                                >
                                    {{ farms.length }} farms ·
                                    {{ parcels.length }} parcels
                                </span>
                            </div>

                            <h1
                                class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                Farms &amp; Parcels
                            </h1>

                            <p
                                class="mt-1.5 max-w-2xl text-sm text-gray-500 sm:text-base"
                            >
                                Manage farm records, parcel assignments, mapped
                                coverage, and land status information.
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-if="canEdit"
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            @click="openCreateFarm"
                        >
                            <UIcon name="i-lucide-plus" class="size-4" />
                            Create Farm
                        </UButton>

                        <UButton
                            v-if="canEdit"
                            class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_8px_20px_rgba(45,106,45,0.28)]"
                            @click="goAddParcel"
                        >
                            <UIcon name="i-lucide-layers-3" class="size-4" />
                            Add Parcel
                        </UButton>
                    </div>
                </div>
            </div>

            <!-- Success Notice -->
            <Transition
                enter-active-class="transition duration-200"
                leave-active-class="transition duration-150"
                enter-from-class="-translate-y-1 opacity-0"
                leave-to-class="-translate-y-1 opacity-0"
            >
                <div
                    v-if="notice"
                    class="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm"
                >
                    <span class="flex items-center gap-2.5 font-medium">
                        <span
                            class="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="size-4"
                            />
                        </span>
                        {{ notice }}
                    </span>

                    <button
                        type="button"
                        class="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                        @click="notice = null"
                    >
                        Dismiss
                    </button>
                </div>
            </Transition>

            <!-- Registry Switcher -->
            <div
                class="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.055)] sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="inline-flex rounded-2xl bg-slate-100/80 p-1">
                    <button
                        v-for="option in ['farms', 'parcels'] as const"
                        :key="option"
                        type="button"
                        class="flex min-w-32.5 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
                        :class="
                            tab === option
                                ? 'bg-white text-[#245c2a] shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-800'
                        "
                        @click="tab = option"
                    >
                        <UIcon
                            :name="
                                option === 'farms'
                                    ? 'i-lucide-tractor'
                                    : 'i-lucide-layers-3'
                            "
                            class="size-4"
                        />
                        {{ option === 'farms' ? 'Farms' : 'Parcels' }}
                    </button>
                </div>

                <div class="px-2 text-sm text-gray-500">
                    <span v-if="tab === 'farms'">
                        {{ filteredFarms.length }} of {{ farms.length }} farms
                    </span>
                    <span v-else>
                        {{ filteredParcels.length }} of
                        {{ parcels.length }} parcels
                    </span>
                </div>
            </div>

            <!-- Farms -->
            <template v-if="tab === 'farms'">
                <div>
                    <FarmsSummaryCards :cards="farmSummaryCards" />
                </div>

                <div
                    v-if="farmsLoading"
                    class="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-4 text-sm text-gray-500 shadow-sm"
                >
                    <UIcon
                        name="i-lucide-loader-circle"
                        class="size-4 animate-spin"
                    />
                    Loading farms...
                </div>

                <LoadErrorBanner
                    v-else-if="farmsError"
                    :message="farmsError.message"
                    :action="farmsError.action"
                    @retry="loadFarms()"
                    @sign-in="signInAgain"
                />

                <!-- Farm filters -->
                <div
                    class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
                >
                    <div
                        class="flex items-center gap-3 border-b border-gray-100 px-5 py-4"
                    >
                        <span
                            class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#245c2a] ring-1 ring-emerald-100"
                        >
                            <UIcon
                                name="i-lucide-search-check"
                                class="size-4"
                            />
                        </span>
                        <div>
                            <h2
                                class="text-base font-bold tracking-tight text-slate-800"
                            >
                                Find Farms
                            </h2>
                            <p class="text-xs text-slate-500">
                                Search and filter the farm registry.
                            </p>
                        </div>
                    </div>

                    <div class="p-4 sm:p-5">
                        <FarmsFarmFilters
                            v-model:search="farmSearch"
                            v-model:filter-status="farmStatus"
                            :filtered-count="filteredFarms.length"
                            :total-count="farms.length"
                            :selected="selectedFarm"
                        />
                    </div>
                </div>

                <!-- Farms awaiting first parcel -->
                <div
                    v-if="awaitingParcels.length > 0"
                    class="rounded-3xl border border-amber-200/80 bg-linear-to-r from-amber-50 via-white to-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                >
                    <div class="mb-3 flex items-center gap-2">
                        <span
                            class="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                        >
                            <UIcon
                                name="i-lucide-triangle-alert"
                                class="size-4"
                            />
                        </span>
                        <div>
                            <div class="text-sm font-semibold text-amber-900">
                                Farms awaiting their first parcel
                            </div>
                            <div class="text-xs text-amber-700/70">
                                These farm records do not yet have mapped land.
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="row in awaitingParcels"
                            :key="row.documentId"
                            type="button"
                            class="rounded-full border border-amber-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                            @click="selectFarm(row)"
                        >
                            {{ row.farm_code }}
                        </button>
                    </div>
                </div>

                <!-- Farm registry + detail -->
                <div class="min-w-0 flex-1">
                    <div class="border-b border-slate-100 px-6 py-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h2
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Farm Directory
                                </h2>
                                <p
                                    class="mt-1 text-xs text-slate-500 sm:text-sm"
                                >
                                    Select a farm to review its profile,
                                    assigned parcels, and registry details.
                                </p>
                            </div>
                            <div
                                class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"
                            >
                                {{ filteredFarms.length }} records
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4 p-0 xl:flex-row">
                        <div class="min-w-0 flex-1">
                            <FarmsFarmTable
                                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
                                :farms="filteredFarms"
                                :selected-document-id="
                                    selectedFarm?.documentId ?? null
                                "
                                :loading="farmsLoading"
                                :can-delete="canDelete"
                                @select="selectFarm"
                                @delete="askDeleteFarm"
                            />
                        </div>

                        <FarmsFarmDetail
                            v-if="selectedFarm"
                            class="w-full shrink-0 overflow-hidden border-l border-slate-100 bg-white xl:w-90"
                            :farm="selectedFarm"
                            :detail="selectedDetail"
                            :detail-loading="detailLoading"
                            :can-edit="canEdit"
                            :can-delete="canDelete"
                            @edit="openEditFarm(selectedFarm.farm)"
                            @add-parcel="goAddParcel"
                            @view-on-map="tab = 'parcels'"
                            @delete="askDeleteFarm(selectedFarm)"
                        />
                    </div>
                </div>
            </template>

            <!-- Parcels -->
            <template v-else>
                <div>
                    <FarmsSummaryCards :cards="parcelSummaryCards" />
                </div>

                <div
                    v-if="parcelsLoading"
                    class="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-4 text-sm text-gray-500 shadow-sm"
                >
                    <UIcon
                        name="i-lucide-loader-circle"
                        class="size-4 animate-spin"
                    />
                    Loading parcels...
                </div>

                <LoadErrorBanner
                    v-else-if="parcelsError"
                    :message="parcelsError.message"
                    :action="parcelsError.action"
                    @retry="loadParcels()"
                    @sign-in="signInAgain"
                />

                <!-- Parcel filters -->
                <div
                    class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"
                    >
                        <div class="flex items-center gap-3">
                            <span
                                class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#245c2a] ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-search-check"
                                    class="size-4"
                                />
                            </span>
                            <div>
                                <h2
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Find Parcels
                                </h2>
                                <p class="text-xs text-slate-500">
                                    Search by farmer or parcel code and filter
                                    by land status.
                                </p>
                            </div>
                        </div>

                        <div
                            class="flex items-center gap-1.5 text-sm text-gray-500"
                        >
                            <UIcon name="i-lucide-filter" class="size-3.5" />
                            {{ filteredParcels.length }} of
                            {{ parcels.length }} parcels
                        </div>
                    </div>

                    <div class="space-y-4 p-4 sm:p-5">
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-center"
                        >
                            <div class="relative w-full max-w-md flex-1">
                                <UIcon
                                    name="i-lucide-search"
                                    class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    v-model="parcelSearch"
                                    type="text"
                                    placeholder="Search farmer or parcel code..."
                                    class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />
                                <button
                                    v-if="parcelSearch"
                                    type="button"
                                    class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                    @click="parcelSearch = ''"
                                >
                                    <UIcon name="i-lucide-x" class="size-3.5" />
                                </button>
                            </div>
                        </div>

                        <div
                            class="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4"
                        >
                            <button
                                v-for="status in parcelStatusFilters"
                                :key="status"
                                type="button"
                                class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                                :class="
                                    parcelStatus === status
                                        ? 'border-[#245c2a] bg-[#245c2a] text-white shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                                "
                                @click="parcelStatus = status"
                            >
                                <span
                                    v-if="status !== 'All'"
                                    class="h-1.5 w-1.5 rounded-full"
                                    :style="{ background: statusDot(status) }"
                                />
                                {{ status }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Parcel registry + detail -->
                <div class="min-w-0 flex-1">
                    <div class="border-b border-slate-100 px-6 py-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h2
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Parcel Directory
                                </h2>
                                <p
                                    class="mt-1 text-xs text-slate-500 sm:text-sm"
                                >
                                    Select a parcel to review land status, farm
                                    assignment, and GIS actions.
                                </p>
                            </div>
                            <div
                                class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"
                            >
                                {{ filteredParcels.length }} records
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4 p-0 xl:flex-row">
                        <div class="min-w-0 flex-1">
                            <FarmsParcelTable
                                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
                                :parcels="filteredParcels"
                                :selected-document-id="
                                    selectedParcel?.documentId ?? null
                                "
                                :loading="parcelsLoading"
                                :has-error="parcelsError !== null"
                                :can-delete="canDelete"
                                @select="selectedParcel = $event"
                                @delete="askDeleteParcel"
                            />
                        </div>

                        <FarmsParcelDetail
                            v-if="selectedParcel"
                            class="w-full shrink-0 overflow-hidden border-l border-slate-100 bg-white xl:w-90"
                            :parcel="selectedParcel"
                            :can-edit="canEdit"
                            :can-delete="canDelete"
                            @edit="goEditParcel(selectedParcel.documentId)"
                            @view-farm="
                                goViewFarm(selectedParcel.farmDocumentId)
                            "
                            @view-on-map="
                                goViewParcel(selectedParcel.documentId)
                            "
                            @delete="askDeleteParcel(selectedParcel)"
                        />
                    </div>
                </div>
            </template>

            <FarmForm
                v-model="showFarmForm"
                :farm="editingFarm"
                @saved="handleFarmSaved"
            />

            <!-- Delete Farm Modal -->
            <ConfirmDeleteModal
                :show="showFarmDeleteModal"
                title="Delete Farm"
                :deleting="deletingFarm"
                :error="farmDeleteError"
                @close="closeFarmDelete"
                @confirm="confirmFarmDelete"
            >
                Remove
                <span class="font-semibold text-slate-700">
                    {{ farmDeleteTarget?.name ?? 'this farm' }}
                </span>
                (<span class="font-mono">
                    {{ farmDeleteTarget?.farm_code ?? '' }} </span
                >) from the registry? A farm that still has parcels cannot be
                deleted; remove its parcels first. This action cannot be undone.
            </ConfirmDeleteModal>

            <!-- Delete Parcel Modal -->
            <ConfirmDeleteModal
                :show="showParcelDeleteModal"
                title="Delete Parcel"
                :deleting="deletingParcel"
                :error="parcelDeleteError"
                @close="closeParcelDelete"
                @confirm="confirmParcelDelete"
            >
                Remove parcel
                <span class="font-mono font-semibold text-slate-700">
                    {{ parcelDeleteTarget?.parcel_code ?? '' }}
                </span>
                from the registry? A parcel with a planting cycle, inspections
                or risk reports cannot be deleted; clear those first. This
                action cannot be undone.
            </ConfirmDeleteModal>
        </div>
    </div>
</template>
