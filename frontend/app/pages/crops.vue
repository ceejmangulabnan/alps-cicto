<script setup lang="ts">
import type { CycleRow } from '~/composables/useCycleRegistry'
import { cycleStatus } from '~/composables/useCycleRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { cropColor } from '~/utils/cropColors'
import { farmerLabel } from '~/utils/format'


const { parcels, cycles, loading, loadError, load } = useCycleRegistry()

const { deletePlantingCycle } = useFarmRecordsApi()

/* ------------------------------------------------------------------ */
/* Search + status filter                                               */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', 'Growing', 'Harvested'] as const

type StatusFilter = (typeof statusFilterOptions)[number]

const { search, filterStatus, filtered } = useTableFilters<
    CycleRow,
    StatusFilter
>(() => cycles.value, {
    statusOptions: statusFilterOptions,
    haystack: (row) =>
        [
            farmerLabel(row.farmerNames),
            row.barangay,
            row.parcel_code,
            row.cycle.crop?.name ?? '',
            row.cycle.variety ?? '',
        ].join(' '),
    matchesStatus: (row, status) =>
        status === 'All' || cycleStatus(row) === status,
})

/* ------------------------------------------------------------------ */
/* Summary + chart data                                                 */
/* ------------------------------------------------------------------ */

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
        color: cropColor(name),
    }))
})

const cropAreaTotal = computed(
    () =>
        Math.round(
            cropAreaData.value.reduce((sum, d) => sum + d.area, 0) * 10
        ) / 10
)

const summaryCards = computed(() => [
    {
        label: 'Active Plantings',
        val: cycles.value.filter((c) => cycleStatus(c) === 'Growing').length,
        color: '#16a34a',
        bg: '#dcfce7',
        icon: 'i-lucide-sprout',
        hint: 'Currently growing crop cycles',
    },
    {
        label: 'Crop Types',
        val: new Set(
            cycles.value.map((c) => c.cycle.crop?.name).filter(Boolean)
        ).size,
        color: '#2d6a2d',
        bg: '#e8f5e8',
        icon: 'i-lucide-wheat',
        hint: 'Crop varieties in the registry',
    },
    {
        label: 'Total Planted Area',
        val: `${cycles.value
            .reduce((sum, c) => sum + c.area_hectares, 0)
            .toFixed(1)} ha`,
        color: '#1d6fa4',
        bg: '#e0f0fb',
        icon: 'i-lucide-ruler',
        hint: 'Combined planted coverage',
    },
    {
        label: 'Harvested Cycles',
        val: cycles.value.filter((c) => cycleStatus(c) === 'Harvested').length,
        color: '#ca8a04',
        bg: '#fef3c7',
        icon: 'i-lucide-calendar-check',
        hint: 'Completed planting cycles',
    },
])

/* ------------------------------------------------------------------ */
/* Modal open state                                                     */
/* ------------------------------------------------------------------ */

const showRegisterModal = ref(false)
const showEditModal = ref(false)
const editRow = ref<CycleRow | null>(null)

function openRegister() {
    showRegisterModal.value = true
}

function openEdit(row: CycleRow) {
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
} = useDeleteModal<CycleRow>({
    remove: (row) => deletePlantingCycle(row.cycle.documentId),
    onDeleted: () => load(),
    failureMessage: 'Failed to delete the planting cycle. Please try again.',
})

onMounted(() => {
    load()
})
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <PageHero
                icon="i-lucide-sprout"
                badge="Crop & Planting Management"
                :count="`${cycles.length} planting cycles`"
                title="Planting & Crops"
                description="Track crop cycles, planted areas, varieties, and expected harvest schedules."
                action-label="Register Planting Cycle"
                action-icon="i-lucide-sprout"
                @action="openRegister"
            />

            <!-- Summary Cards -->
            <StatCards :cards="summaryCards" />

            <!-- Filters -->
            <FilterBar
                title="Find Planting Cycles"
                description="Search the registry or filter by planting status."
                placeholder="Search farmer, barangay, parcel, crop or variety..."
                count-label="cycles"
                :filtered-count="filtered.length"
                :total-count="cycles.length"
                v-model:search="search"
                v-model:status="filterStatus"
                :options="statusFilterOptions"
            />

            <!-- Main Content -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Crop Area Chart -->
                <CropsCropAreaChartCard
                    :data="cropAreaData"
                    :total="cropAreaTotal"
                    class="col-span-12 lg:col-span-5"
                />

                <!-- Planting Records -->
                <CropsCycleRecordsTable
                    :rows="filtered"
                    :total="cycles.length"
                    :loading="loading"
                    :load-error="loadError"
                    class="col-span-12 lg:col-span-7"
                    @edit="openEdit"
                    @delete="askDelete"
                    @retry="load"
                />
            </div>
        </div>

        <!-- Register Planting Cycle Modal -->
        <CropsCycleRegisterModal
            :show="showRegisterModal"
            :parcels="parcels"
            @close="showRegisterModal = false"
            @saved="load"
        />

        <!-- Edit Planting Cycle Modal -->
        <CropsCycleEditModal
            :show="showEditModal"
            :row="editRow"
            @close="showEditModal = false"
            @saved="load"
        />

        <!-- Delete Planting Cycle Modal -->
        <ConfirmDeleteModal
            :show="showDeleteModal"
            title="Delete Planting Cycle"
            :deleting="deleting"
            :error="deleteError"
            @close="closeDelete"
            @confirm="confirmDelete"
        >
            Remove the
            <span class="font-mono font-semibold text-slate-700">
                {{ deleteTarget?.cycle.crop?.name ?? 'cycle' }}
            </span>
            cycle on
            <span class="font-mono font-semibold text-slate-700">
                {{ deleteTarget?.parcel_code ?? '' }}
            </span>
            ? Its harvest records are removed too. This action cannot be undone.
        </ConfirmDeleteModal>
    </div>
</template>
