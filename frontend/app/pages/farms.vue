<script setup lang="ts">
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'
import type { Farm } from '~/composables/useFarmsApi'
import type { FarmRow } from '~/composables/useFarmsData'
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusDot } from '~/utils/landStatus'

definePageMeta({ middleware: 'auth' })

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
} = useParcelsData()

const { logout } = useAuth()

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
</script>

<template>
    <div class="p-4 sm:p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Farms &amp; Parcels
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Farm registry and the parcels drawn against each farm
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <UButton
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                    @click="openCreateFarm"
                >
                    <UIcon name="i-lucide-plus" />
                    Create Farm
                </UButton>
                <UButton
                    class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                    @click="goAddParcel"
                >
                    <UIcon name="i-lucide-layers" class="size-3.5" />
                    Add Parcel
                </UButton>
            </div>
        </div>

        <div
            v-if="notice"
            class="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
            <span class="flex items-center gap-2">
                <UIcon name="i-lucide-circle-check" class="size-4 shrink-0" />
                {{ notice }}
            </span>
            <button
                type="button"
                class="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-green-800 ring-1 ring-green-200 hover:bg-green-100"
                @click="notice = null"
            >
                Dismiss
            </button>
        </div>

        <div
            class="mb-5 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
        >
            <button
                v-for="option in ['farms', 'parcels'] as const"
                :key="option"
                type="button"
                class="flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-medium transition-colors"
                :class="
                    tab === option
                        ? 'bg-[#2d6a2d] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                "
                @click="tab = option"
            >
                <UIcon
                    :name="
                        option === 'farms'
                            ? 'i-lucide-tractor'
                            : 'i-lucide-layers'
                    "
                    class="size-3.5"
                />
                {{ option === 'farms' ? 'Farms' : 'Parcels' }}
            </button>
        </div>

        <!-- Farms -->
        <template v-if="tab === 'farms'">
            <FarmsSummaryCards :cards="farmSummaryCards" />

            <div
                v-if="farmsLoading"
                class="mb-5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500"
            >
                Loading farms...
            </div>
            <LoadErrorBanner
                v-else-if="farmsError"
                class="mb-5"
                :message="farmsError.message"
                :action="farmsError.action"
                @retry="loadFarms()"
                @sign-in="signInAgain"
            />

            <FarmsFarmFilters
                v-model:search="farmSearch"
                v-model:filter-status="farmStatus"
                :filtered-count="filteredFarms.length"
                :total-count="farms.length"
                :selected="selectedFarm"
            />

            <div v-if="awaitingParcels.length > 0" class="mb-5">
                <div
                    class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                    Farms awaiting their first parcel
                </div>
                <div class="flex flex-wrap gap-1.5">
                    <button
                        v-for="row in awaitingParcels"
                        :key="row.documentId"
                        type="button"
                        class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                        @click="selectFarm(row)"
                    >
                        {{ row.farm_code }}
                    </button>
                </div>
            </div>

            <!--
                The detail panel is a fixed-width sibling on wide screens; below
                `xl` it stacks under the table, where side by side it would
                squeeze the table's columns.
            -->
            <div class="flex flex-col gap-4 xl:flex-row">
                <FarmsFarmTable
                    class="min-w-0 flex-1"
                    :farms="filteredFarms"
                    :selected-document-id="selectedFarm?.documentId ?? null"
                    :loading="farmsLoading"
                    @select="selectFarm"
                />
                <FarmsFarmDetail
                    v-if="selectedFarm"
                    class="w-full shrink-0 xl:w-80"
                    :farm="selectedFarm"
                    :detail="selectedDetail"
                    :detail-loading="detailLoading"
                    @edit="openEditFarm(selectedFarm.farm)"
                    @add-parcel="goAddParcel"
                    @view-on-map="tab = 'parcels'"
                />
            </div>
        </template>

        <!-- Parcels -->
        <template v-else>
            <FarmsSummaryCards :cards="parcelSummaryCards" />

            <div
                v-if="parcelsLoading"
                class="mb-5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500"
            >
                Loading parcels...
            </div>
            <LoadErrorBanner
                v-else-if="parcelsError"
                class="mb-5"
                :message="parcelsError.message"
                :action="parcelsError.action"
                @retry="loadParcels()"
                @sign-in="signInAgain"
            />

            <div class="mb-5 space-y-3">
                <div
                    class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                >
                    <div class="relative w-full max-w-xs sm:flex-1">
                        <UIcon
                            name="i-lucide-search"
                            class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            v-model="parcelSearch"
                            type="text"
                            placeholder="Search farmer or parcel code..."
                            class="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-8 text-xs shadow-sm focus:border-[#2d6a2d] focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <button
                            v-if="parcelSearch"
                            type="button"
                            class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                            @click="parcelSearch = ''"
                        >
                            <UIcon name="i-lucide-x" class="size-3" />
                        </button>
                    </div>
                    <div
                        class="flex items-center gap-1.5 text-xs text-gray-400 sm:ml-auto"
                    >
                        <UIcon name="i-lucide-filter" class="size-3" />
                        {{ filteredParcels.length }} of {{ parcels.length }}
                        parcels
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                    <button
                        v-for="status in parcelStatusFilters"
                        :key="status"
                        type="button"
                        class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                        :class="
                            parcelStatus === status
                                ? 'bg-[#2d6a2d] text-white border-[#2d6a2d] shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

            <div class="flex flex-col gap-4 xl:flex-row">
                <FarmsParcelTable
                    class="min-w-0 flex-1"
                    :parcels="filteredParcels"
                    :selected-document-id="selectedParcel?.documentId ?? null"
                    :loading="parcelsLoading"
                    :has-error="parcelsError !== null"
                    @select="selectedParcel = $event"
                />
                <FarmsParcelDetail
                    v-if="selectedParcel"
                    class="w-full shrink-0 xl:w-80"
                    :parcel="selectedParcel"
                    @edit="goEditParcel(selectedParcel!.documentId)"
                    @view-farm="goViewFarm(selectedParcel!.farmDocumentId)"
                    @view-on-map="goViewParcel(selectedParcel!.documentId)"
                />
            </div>
        </template>

        <FarmForm
            v-model="showFarmForm"
            :farm="editingFarm"
            @saved="handleFarmSaved"
        />
    </div>
</template>
