<script setup lang="ts">
import {
    useInspectionRegistry,
    type InspectionRow,
} from '~/composables/useInspectionRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import {
    INSPECTION_STATUS_DOT,
    INSPECTION_STATUS_FILTERS,
} from '~/utils/inspectionStatus'

const { inspections, allParcels, loading, loadError, load } =
    useInspectionRegistry()
const { deleteInspection } = useFarmRecordsApi()

const { canEdit, canDelete } = useAuth()

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
            hint: 'All recorded field inspections',
        },
        {
            label: 'Completed',
            val: completed,
            icon: 'i-lucide-check-circle',
            color: '#16a34a',
            bg: '#dcfce7',
            hint: 'Completed inspection visits',
        },
        {
            label: 'Pending',
            val: pending,
            icon: 'i-lucide-clock',
            color: '#ca8a04',
            bg: '#fef3c7',
            hint: 'Visits awaiting completion',
        },
        {
            label: 'High Risk Found',
            val: highRisk,
            icon: 'i-lucide-triangle-alert',
            color: '#dc2626',
            bg: '#fee2e2',
            hint: 'High-risk findings requiring attention',
        },
    ]
})

const { search, filterStatus, filtered } = useTableFilters(
    () => inspections.value,
    {
        statusOptions: INSPECTION_STATUS_FILTERS,
        haystack: (row) =>
            [
                row.inspection_type,
                row.parcel_code,
                row.barangay,
                row.inspector,
            ].join(' '),
        matchesStatus: (row, status) =>
            status === 'All' || row.status === status,
    }
)

/* ------------------------------------------------------------------ */
/* Record / edit inspection                                            */
/* ------------------------------------------------------------------ */

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editRow = ref<InspectionRow | null>(null)

function openCreate() {
    formMode.value = 'create'
    editRow.value = null
    showForm.value = true
}

function openEdit(row: InspectionRow) {
    formMode.value = 'edit'
    editRow.value = row
    showForm.value = true
}

function closeForm() {
    showForm.value = false
}

/* ------------------------------------------------------------------ */
/* Delete inspection                                                   */
/* ------------------------------------------------------------------ */

const {
    open: showDeleteModal,
    target: deleteTarget,
    deleting,
    error: deleteError,
    ask: askDelete,
    close: closeDelete,
    confirm: confirmDelete,
} = useDeleteModal<InspectionRow>({
    remove: (row) => deleteInspection(row.documentId),
    onDeleted: load,
    failureMessage: 'Failed to delete the inspection. Please try again.',
})

/* ------------------------------------------------------------------ */
/* Inspection details                                                  */
/* ------------------------------------------------------------------ */

const showDetail = ref(false)
const detailRow = ref<InspectionRow | null>(null)

function openDetail(row: InspectionRow) {
    detailRow.value = row
    showDetail.value = true
}

function closeDetail() {
    showDetail.value = false
    detailRow.value = null
}

function editFromDetail() {
    const target = detailRow.value
    if (!target) return
    closeDetail()
    openEdit(target)
}

onMounted(() => {
    load()
})
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <PageHero
                icon="i-lucide-clipboard-check"
                badge="Field Monitoring & Compliance"
                :count="`${inspections.length} inspection records`"
                title="Field Inspections"
                description="Track GPS-tagged field visits, risk findings, compliance status, and photo documentation."
                action-label="New Inspection"
                action-icon="i-lucide-plus"
                :can-edit="canEdit"
                @action="openCreate"
            />

            <StatCards :cards="kpis" />

            <FilterBar
                title="Find Inspections"
                description="Search inspection records or filter by workflow status."
                placeholder="Search parcel, type, barangay or inspector..."
                count-label="inspections"
                :filtered-count="filtered.length"
                :total-count="inspections.length"
                v-model:search="search"
                v-model:status="filterStatus"
                :options="INSPECTION_STATUS_FILTERS"
                :dots="INSPECTION_STATUS_DOT"
            />

            <div class="grid grid-cols-12 gap-4">
                <InspectionsChartCard :inspections="inspections" />

                <InspectionsTable
                    :rows="filtered"
                    :loading="loading"
                    :load-error="loadError"
                    :empty="inspections.length === 0"
                    :no-results="
                        filtered.length === 0 && inspections.length > 0
                    "
                    :can-edit="canEdit"
                    :can-delete="canDelete"
                    @view="openDetail"
                    @edit="openEdit"
                    @delete="askDelete"
                    @retry="load"
                />
            </div>
        </div>
    </div>

    <InspectionsFormModal
        :show="showForm"
        :mode="formMode"
        :row="editRow"
        :parcels="allParcels"
        @close="closeForm"
        @saved="load"
    />

    <ConfirmDeleteModal
        :show="showDeleteModal"
        title="Delete Inspection"
        :deleting="deleting"
        :error="deleteError"
        @close="closeDelete"
        @confirm="confirmDelete"
    >
        Remove the
        <span class="font-medium text-gray-700">
            {{ deleteTarget?.inspection_type }}
        </span>
        inspection on
        <span class="font-mono text-gray-700">
            {{ deleteTarget?.parcel_code ?? '' }}
        </span>
        ({{ deleteTarget?.date ?? 'no date' }})? This action cannot be undone.
    </ConfirmDeleteModal>

    <InspectionsDetailModal
        :show="showDetail"
        :row="detailRow"
        :can-edit="canEdit"
        @close="closeDetail"
        @edit="editFromDetail"
    />
</template>
