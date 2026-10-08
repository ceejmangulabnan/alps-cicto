<script setup lang="ts">
import {
    ASSISTANCE_STATUS_OPTIONS,
    useAssistanceApi,
} from '~/composables/useAssistanceApi'
import {
    useAssistanceRegistry,
    type AssistanceRow,
} from '~/composables/useAssistanceRegistry'
import { ASSISTANCE_STATUS_DOT as STATUS_DOT } from '~/utils/assistanceStatus'


const {
    programs,
    farmers,
    barangays,
    programOptions,
    loading,
    loadError,
    load,
} = useAssistanceRegistry()

const { deleteProgram } = useAssistanceApi()

/* ------------------------------------------------------------------ */
/* Summary                                                              */
/* ------------------------------------------------------------------ */

const kpis = computed(() => [
    {
        label: 'Total Programs',
        val: programs.value.length,
        icon: 'i-lucide-hand-heart',
        color: '#2d6a2d',
        bg: '#e8f5e8',
        hint: 'All recorded assistance entries',
    },
    {
        label: 'Released',
        val: programs.value.filter((row) => row.status === 'Released').length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
        hint: 'Programs already released',
    },
    {
        label: 'Pending Release',
        val: programs.value.filter((row) => row.status !== 'Released').length,
        icon: 'i-lucide-clock',
        color: '#ca8a04',
        bg: '#fef3c7',
        hint: 'Programs awaiting release',
    },
    {
        label: 'Total Value (₱)',
        val: programs.value
            .reduce((acc, row) => acc + row.value, 0)
            .toLocaleString(),
        icon: 'i-lucide-package',
        color: '#1d6fa4',
        bg: '#e0f0fb',
        hint: 'Combined recorded assistance value',
    },
])

/* ------------------------------------------------------------------ */
/* Search + status filter                                               */
/* ------------------------------------------------------------------ */

const statusFilterOptions = ['All', ...ASSISTANCE_STATUS_OPTIONS] as const

type StatusFilter = (typeof statusFilterOptions)[number]

const { search, filterStatus, filtered } = useTableFilters<
    AssistanceRow,
    StatusFilter
>(() => programs.value, {
    statusOptions: statusFilterOptions,
    haystack: (row) =>
        [
            row.reference_code,
            row.program,
            row.recipient,
            row.farmer_code,
            row.barangay,
            row.items,
        ]
            .join(' ')
            .toLowerCase(),
    matchesStatus: (row, status) => status === 'All' || row.status === status,
})

/* ------------------------------------------------------------------ */
/* Modal open state                                                     */
/* ------------------------------------------------------------------ */

const showRecordModal = ref(false)
const showEditModal = ref(false)
const editRow = ref<AssistanceRow | null>(null)

function openRecord() {
    showRecordModal.value = true
}

function openEdit(row: AssistanceRow) {
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
} = useDeleteModal<AssistanceRow>({
    remove: (row) => deleteProgram(row.documentId),
    onDeleted: () => load(),
    failureMessage: 'Failed to delete the assistance. Please try again.',
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
                icon="i-lucide-hand-heart"
                badge="Farmer Support & Distribution"
                :count="`${programs.length} assistance records`"
                title="Assistance Programs"
                description="Track seed, fertilizer, equipment, training, and livelihood support released to farmers."
                action-label="Record Assistance"
                action-icon="i-lucide-hand-heart"
                @action="openRecord"
            />

            <!-- KPIs -->
            <StatCards :cards="kpis" />

            <!-- Assistance Records -->
            <AssistanceTable
                :rows="filtered"
                :total="programs.length"
                :loading="loading"
                :load-error="loadError"
                @edit="openEdit"
                @delete="askDelete"
                @retry="load"
            >
                <template #header-right>
                    <SearchInput
                        v-model:search="search"
                        placeholder="Search recipient, program, item..."
                        class="sm:w-80"
                    />
                </template>

                <template #toolbar>
                    <div
                        class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
                    >
                        <FilterPills
                            v-model:status="filterStatus"
                            :options="statusFilterOptions"
                            :dots="STATUS_DOT"
                            label="Status"
                        />

                        <span
                            class="ml-auto text-sm font-medium text-slate-500"
                        >
                            {{ filtered.length }} of {{ programs.length }} shown
                        </span>
                    </div>
                </template>
            </AssistanceTable>
        </div>

        <!-- Record Assistance Modal -->
        <AssistanceFormModal
            :show="showRecordModal"
            mode="create"
            :farmers="farmers"
            :barangays="barangays"
            :program-options="programOptions"
            @close="showRecordModal = false"
            @saved="load"
        />

        <!-- Edit Assistance Modal -->
        <AssistanceFormModal
            :show="showEditModal"
            mode="edit"
            :row="editRow"
            :farmers="farmers"
            :barangays="barangays"
            :program-options="programOptions"
            @close="showEditModal = false"
            @saved="load"
        />

        <!-- Delete Assistance Modal -->
        <ConfirmDeleteModal
            :show="showDeleteModal"
            title="Delete Assistance"
            :deleting="deleting"
            :error="deleteError"
            @close="closeDelete"
            @confirm="confirmDelete"
        >
            Remove
            <span class="font-mono font-semibold text-slate-700">
                {{ deleteTarget?.reference_code }}
            </span>
            ({{ deleteTarget?.program }}) for
            <span class="font-semibold text-slate-700">
                {{ deleteTarget?.recipient }}
            </span>
            ? This action cannot be undone.
        </ConfirmDeleteModal>
    </div>
</template>
