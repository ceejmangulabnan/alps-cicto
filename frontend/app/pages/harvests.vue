<script setup lang="ts">
import type { HarvestRow } from '~/composables/useCycleRegistry'
import { harvestStatus } from '~/composables/useCycleRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { num, farmerLabel } from '~/utils/format'

definePageMeta({ middleware: 'auth' })

const { cycleParcels, harvests, loading, loadError, load } = useCycleRegistry()

const { deleteHarvest } = useFarmRecordsApi()

/* ------------------------------------------------------------------ */
/* Search + status filter                                               */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', 'Completed', 'Upcoming'] as const

type StatusFilter = (typeof statusFilterOptions)[number]

const { search, filterStatus, filtered } = useTableFilters<
    HarvestRow,
    StatusFilter
>(() => harvests.value, {
    statusOptions: statusFilterOptions,
    haystack: (h) =>
        [
            farmerLabel(h.farmerNames),
            h.crop,
            h.variety,
            h.parcel_code,
            h.barangay,
        ]
            .join(' ')
            .toLowerCase(),
    matchesStatus: (h, status) =>
        status === 'All' || harvestStatus(h) === status,
})

/* ------------------------------------------------------------------ */
/* Summary                                                              */
/* ------------------------------------------------------------------ */

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
            hint: 'All recorded harvest entries',
        },
        {
            label: 'Total Yield (MT)',
            val: (totalKg / 1000).toFixed(1),
            icon: 'i-lucide-trending-up',
            color: '#16a34a',
            bg: '#dcfce7',
            hint: 'Combined completed production',
        },
        {
            label: 'Avg Yield (t/ha)',
            val: (avgYieldKgPerHa / 1000).toFixed(2),
            icon: 'i-lucide-gauge',
            color: '#1d6fa4',
            bg: '#e0f0fb',
            hint: 'Average productivity per hectare',
        },
        {
            label: 'Area Harvested (ha)',
            val: areaHarvested.toFixed(1),
            icon: 'i-lucide-ruler',
            color: '#ca8a04',
            bg: '#fef3c7',
            hint: 'Combined completed harvest area',
        },
    ]
})

/* ------------------------------------------------------------------ */
/* Modal open state                                                     */
/* ------------------------------------------------------------------ */

const showRecordModal = ref(false)
const showEditModal = ref(false)
const editRow = ref<HarvestRow | null>(null)

function openRecord() {
    showRecordModal.value = true
}

function openEdit(row: HarvestRow) {
    editRow.value = row

    showEditModal.value = true
}

const {
    open: showDeleteModal,
    target: deleteTarget,
    deleting,
    error: deleteError,
    ask: askDelete,
    close: closeDelete,
    confirm: confirmDelete,
} = useDeleteModal<HarvestRow>({
    remove: (h) => deleteHarvest(h.documentId),
    onDeleted: () => load(),
    failureMessage: 'Failed to delete the harvest. Please try again.',
})

onMounted(() => {
    load()
})
</script>

<template>
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <PageHero
                icon="i-lucide-wheat"
                badge="Harvest & Production Management"
                :count="`${harvests.length} harvest records`"
                title="Harvests"
                description="Track harvest records, production output, yield performance, and harvested area."
                action-label="Record Harvest"
                action-icon="i-lucide-wheat"
                @action="openRecord"
            />

            <!-- KPI Cards -->
            <StatCards :cards="kpis" />

            <!-- Filters -->
            <FilterBar
                title="Find Harvest Records"
                description="Search the registry or filter by harvest status."
                placeholder="Search farmer, crop, parcel or barangay..."
                count-label="harvests"
                :filtered-count="filtered.length"
                :total-count="harvests.length"
                v-model:search="search"
                v-model:status="filterStatus"
                :options="statusFilterOptions"
            />

            <!-- Analytics + Records -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Monthly Harvest Chart -->
                <HarvestsMonthlyChartCard
                    :harvests="harvests"
                    class="col-span-12 lg:col-span-5"
                />

                <!-- Harvest Records -->
                <HarvestsHarvestRecordsTable
                    :rows="filtered"
                    :total="harvests.length"
                    :loading="loading"
                    :load-error="loadError"
                    class="col-span-12 lg:col-span-7"
                    @edit="openEdit"
                    @delete="askDelete"
                    @retry="load"
                />
            </div>
        </div>

        <!-- Record Harvest Modal -->
        <HarvestsHarvestRecordModal
            :show="showRecordModal"
            :cycle-parcels="cycleParcels"
            @close="showRecordModal = false"
            @saved="load"
        />

        <!-- Edit Harvest Modal -->
        <HarvestsHarvestEditModal
            :show="showEditModal"
            :row="editRow"
            @close="showEditModal = false"
            @saved="load"
        />

        <!-- Delete Harvest Modal -->
        <ConfirmDeleteModal
            :show="showDeleteModal"
            title="Delete Harvest"
            :deleting="deleting"
            :error="deleteError"
            @close="closeDelete"
            @confirm="confirmDelete"
        >
            Remove the {{ num(deleteTarget?.production_kg) }} kg harvest on
            <span class="font-mono font-semibold text-slate-700">
                {{ deleteTarget?.parcel_code ?? '' }}
            </span>
            ? This action cannot be undone.
        </ConfirmDeleteModal>
    </div>
</template>
