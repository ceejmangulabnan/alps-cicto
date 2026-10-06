<script setup lang="ts">
//@ts-nocheck
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { TableMeta } from '@tanstack/vue-table'
import type { Farmer, FarmerStatus } from '~/composables/useFarmersApi'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import {
    ASSISTANCE_STATUS_OPTIONS,
    type AssistanceProgram,
    type AssistanceStatus,
} from '~/composables/useAssistanceApi'
import {
    ASSISTANCE_STATUS_DOT,
    ASSISTANCE_STATUS_STYLE,
    peso,
} from '~/utils/assistanceStatus'
import { useBarangayApi } from '~/composables/useBarangayApi'

definePageMeta({ middleware: 'auth' })
type LandStatus =
    | 'Cultivated'
    | 'Preparation'
    | 'Harvesting'
    | 'Fallow'
    | 'Idle'
    | 'At Risk'
    | 'Converted'

/**
 * A farmer as this page needs them: the API record, plus the parcel tally the
 * table shows. The tally is derived rather than stored, because a farmer has no
 * count of its own any more — they are counted by the parcels they tend.
 */
type FarmerRow = Farmer & { parcelCount: number }

/**
 * A parcel as this page needs it: the farmer's own tendees, flattened. A parcel
 * can have several, so the join is on documentId rather than a single code.
 */
type Parcel = {
    documentId: string
    parcel_code: string
    farm_code: string
    barangay: string
    area_hectares: number
    land_status: LandStatus
    current_use: string | null
    farmerDocumentIds: string[]
}

const parcels = ref<Parcel[]>([])

/** The parcels a farmer tends, matched on documentId. */
const parcelsOf = (f: Farmer) =>
    parcels.value.filter((p) => p.farmerDocumentIds.includes(f.documentId))

/**
 * A farmer has no barangay of its own: they are located by the parcels they tend,
 * and the parcels by the farms those belong to. A farmer with no parcel therefore
 * has no location to show.
 */
const farmerBarangays = (f: Farmer): string[] => [
    ...new Set(parcelsOf(f).map((p) => p.barangay)),
]

const farmerBarangay = (f: Farmer) => {
    const residence = f.residence_barangay?.name
    if (residence) return residence
    const names = farmerBarangays(f)
    return names.length > 0 ? names.join(', ') : 'No parcel assigned'
}

const { getAll, create, update } = useFarmersApi()
const { getAll: getAllParcels } = useFarmParcelApi()
const { getAllForSelect: getAllBarangays } = useBarangayApi()
const { create: createAssistance } = useAssistanceApi()

const route = useRoute()

const farmers = ref<FarmerRow[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)

const UNKNOWN_BARANGAY = 'Unknown barangay'

/**
 * Flattens the parcel records into the shape this page joins against. Only the
 * parcel's own `farmers` counts: `farm.farmers` is the farm-wide rollup, which
 * would credit every farmer on the farm with every parcel in it.
 */
function toFarmerParcel(parcel: FarmParcel): Parcel {
    return {
        documentId: parcel.documentId,
        parcel_code: parcel.parcel_code,
        farm_code: parcel.farm?.farm_code ?? 'Unassigned',
        barangay: parcel.farm?.barangay?.name ?? UNKNOWN_BARANGAY,
        area_hectares: parcel.area_hectares,
        land_status: parcel.land_status,
        current_use: parcel.current_use ?? null,
        farmerDocumentIds: (parcel.farmers ?? []).map(
            (farmer) => farmer.documentId
        ),
    }
}

/**
 * Loads the parcels first: they are what the farmer list's counts, areas and
 * locations are derived from, so counting before they arrive would report every
 * farmer as having no parcels.
 */
async function loadParcels() {
    const response = await getAllParcels({
        populate: ['farm', 'farm.barangay', 'farm.farmers', 'farmers'],
    })
    parcels.value = response.data.map(toFarmerParcel)
}

async function loadFarmers() {
    loading.value = true
    loadError.value = null
    try {
        await Promise.all([loadParcels(), loadBarangays(), loadAssistance()])
        const response = await getAll()
        farmers.value = response.data.map((farmer) => ({
            ...farmer,
            parcelCount: parcelsOf(farmer).length,
        }))
    } catch (error) {
        loadError.value =
            error instanceof Error ? error.message : 'Could not load farmers.'
    } finally {
        loading.value = false
    }
}

const initials = (name: string) =>
    name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

const AVATAR_COLORS = [
    '#2d6a2d',
    '#1d6fa4',
    '#7c3aed',
    '#b45309',
    '#0f766e',
    '#be123c',
]
const avatarColor = (name: string) =>
    AVATAR_COLORS[
        name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) %
            AVATAR_COLORS.length
    ]

const parcelStatusClass = (s: LandStatus) =>
    s === 'At Risk'
        ? 'status-atrisk'
        : s === 'Cultivated'
          ? 'status-cultivated'
          : s === 'Idle'
            ? 'status-idle'
            : s === 'Fallow'
              ? 'status-fallow'
              : s === 'Harvesting'
                ? 'status-harvesting'
                : s === 'Preparation'
                  ? 'status-preparation'
                  : s === 'Converted'
                    ? 'status-converted'
                    : 'status-idle'

/**
 * Total area each farmer tends. A shared parcel counts in full for every farmer
 * on it, matching the parcel count, rather than being split between them.
 */
const areaByFarmer = computed(() => {
    const totals = new Map<string, number>()
    for (const parcel of parcels.value) {
        for (const farmerId of parcel.farmerDocumentIds) {
            totals.set(
                farmerId,
                (totals.get(farmerId) ?? 0) + parcel.area_hectares
            )
        }
    }
    return totals
})

const search = ref('')
const filterBarangay = ref('All')
const selectedFarmer = ref<FarmerRow | null>(null)
const showRegisterModal = ref(false)
// The farmer code is not a field: it is generated by the backend on create.
const registerForm = reactive({
    name: '',
    contact: '',
    status: 'Active' as FarmerStatus,
})
const registering = ref(false)
const registerError = ref<string | null>(null)

function resetRegisterForm() {
    registerForm.name = ''
    registerForm.contact = ''
    registerForm.status = 'Active'
    registerError.value = null
}

async function submitRegister() {
    // The name is the only field the backend requires, so it is the only one
    // worth blocking on; everything else has a sensible empty value.
    if (!registerForm.name.trim()) {
        registerError.value = 'A name is required.'
        return
    }

    registering.value = true
    registerError.value = null
    try {
        await create({
            name: registerForm.name.trim(),
            contact: registerForm.contact.trim(),
            farmer_status: registerForm.status,
        })
        showRegisterModal.value = false
        resetRegisterForm()
        // Re-read rather than pushing the response into the list, so the
        // ordering and the derived parcel tally come from one place.
        await loadFarmers()
    } catch (error) {
        registerError.value =
            error instanceof Error
                ? error.message
                : 'Could not register the farmer.'
    } finally {
        registering.value = false
    }
}

const showEditModal = ref(false)
const editing = ref(false)
const editError = ref<string | null>(null)
const selectedFarmerForEdit = ref<Farmer | null>(null)
const editForm = reactive({
    farmer_code: '',
    name: '',
    contact: '',
    status: 'Active' as FarmerStatus,
    residence_barangay: '' as string,
})

function openEditModal(farmer: Farmer) {
    selectedFarmerForEdit.value = farmer
    editForm.farmer_code = farmer.farmer_code
    editForm.name = farmer.name
    editForm.contact = farmer.contact ?? ''
    editForm.status = farmer.farmer_status
    editForm.residence_barangay = farmer.residence_barangay?.documentId ?? ''
    editError.value = null
    editing.value = false
    showEditModal.value = true
}

async function submitEdit() {
    if (!selectedFarmerForEdit.value?.documentId) return
    if (!editForm.name.trim()) {
        editError.value = 'A name is required.'
        return
    }

    editing.value = true
    editError.value = null
    try {
        showEditModal.value = false
        const updatedFarmer = await update(
            selectedFarmerForEdit.value.documentId,
            {
                name: editForm.name.trim(),
                contact: editForm.contact.trim() || null,
                farmer_status: editForm.status,
                residence_barangay: editForm.residence_barangay || null,
            }
        )
        const updated = updatedFarmer as Farmer
        selectedFarmerForEdit.value = updated
        const farmerInList = farmers.value.find(
            (f) => f.documentId === updated.documentId
        )
        if (farmerInList) {
            Object.assign(farmerInList, updated, {
                parcelCount: parcelsOf(updated).length,
            })
        }
        if (selectedFarmer.value?.documentId === updated.documentId) {
            Object.assign(selectedFarmer.value, updated)
        }
    } catch (error) {
        editError.value =
            error instanceof Error
                ? error.message
                : 'Could not update the farmer.'
    } finally {
        editing.value = false
    }
}

// Closing the modal by any route — cancel, the X, or the backdrop — clears what
// was typed, so reopening it never shows a stale name or a stale error.
watch(showRegisterModal, (open) => {
    if (!open) {
        resetRegisterForm()
    }
})

const filtered = computed(() =>
    farmers.value.filter((f) => {
        const matchSearch =
            !search.value ||
            f.name.toLowerCase().includes(search.value.toLowerCase()) ||
            f.farmer_code.toLowerCase().includes(search.value.toLowerCase())
        // The filter lists the barangays farmers work in, so a farmer with no
        // parcel appears under "All" but under no specific barangay.
        const matchBarangay =
            filterBarangay.value === 'All' ||
            farmerBarangays(f).includes(filterBarangay.value)
        return matchSearch && matchBarangay
    })
)

/**
 * The registry table's columns.
 *
 * Barangay and Area are not fields on a farmer: one is derived from the parcels
 * they tend and the other from a tally over those same parcels, so both use
 * `accessorFn` to give TanStack something to sort on. The remaining columns
 * sort off their own fields, and their numbers need no comparator because
 * TanStack's default `basic` function compares numerically.
 *
 * `sortDescFirst: false` on the two numeric columns is not a style choice. Left
 * unset, TanStack peeks at the first row and sorts columns descending-first
 * whenever the value is not a string, so Area and Parcels would start on
 * descending while Name and Barangay started on ascending — the same click
 * doing opposite things depending on the column.
 */
const columns: TableColumn<FarmerRow>[] = [
    {
        accessorKey: 'farmer_code',
        header: sortHeader('Farmer Code'),
        cell: ({ row }) => row.getValue('farmer_code'),
        meta: { class: { td: 'font-mono text-gray-700' } },
    },
    {
        accessorKey: 'name',
        header: sortHeader('Name'),
    },
    {
        id: 'barangay',
        accessorFn: (row) => farmerBarangay(row),
        header: sortHeader('Barangay'),
        cell: ({ row }) => farmerBarangay(row.original),
        meta: { class: { td: 'text-gray-600' } },
    },
    {
        accessorKey: 'parcelCount',
        header: sortHeader('Parcels', { align: 'right' }),
        sortDescFirst: false,
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono text-gray-900',
            },
        },
    },
    {
        id: 'area',
        accessorFn: (row) => areaByFarmer.value.get(row.documentId) ?? 0,
        header: sortHeader('Area (ha)', { align: 'right' }),
        sortDescFirst: false,
        cell: ({ row }) => Number(row.getValue('area')).toFixed(1),
        meta: {
            class: {
                th: 'text-right',
                td: 'text-right font-mono font-semibold text-gray-900',
            },
        },
    },
    {
        // The chevron that only appears on hover. Not a value, so not sortable.
        id: 'view',
        enableSorting: false,
        enableHiding: false,
        meta: { class: { td: 'text-right' } },
    },
]

/**
 * Row pointer and the `group` the chevron reveals into. The zebra stripe is not
 * here but in the app-wide table theme, because it has to follow the visible
 * row order and rows are reordered by sorting.
 */
const farmerTableMeta: TableMeta<FarmerRow> = {
    class: {
        tr: 'group cursor-pointer transition-colors',
    },
}

function onFarmerSelect(_event: Event, row: TableRow<FarmerRow>) {
    selectedFarmer.value = row.original
}

const barangaysByParcels = computed(() =>
    [...new Set(parcels.value.map((p) => p.barangay))].sort()
)

const barangays = ref<{ value: string; label: string }[]>([])

async function loadBarangays() {
    try {
        const rows = await getAllBarangays()
        barangays.value = rows.map((b) => ({
            value: b.documentId,
            label: b.name,
        }))
    } catch (error) {
        barangays.value = []
    }
}

const summaryCards = computed(() => [
    {
        label: 'Total Farmers',
        val: farmers.value.length,
        hint: 'Registered farmer profiles',
        color: '#2d6a2d',
        bg: '#e8f5e8',
        icon: 'i-lucide-users',
    },
    {
        label: 'Barangays Covered',
        val: barangaysByParcels.value.length,
        hint: 'Based on parcel locations',
        color: '#1d6fa4',
        bg: '#e0f0fb',
        icon: 'i-lucide-map-pin',
    },
    {
        label: 'Registered Parcels',
        val: parcels.value.length,
        hint: 'Linked agricultural parcels',
        color: '#16a34a',
        bg: '#dcfce7',
        icon: 'i-lucide-layers-3',
    },
    {
        label: 'Total Registered Area',
        val: `${parcels.value
            .reduce((a, p) => a + p.area_hectares, 0)
            .toFixed(1)} ha`,
        hint: 'Mapped agricultural coverage',
        color: '#ca8a04',
        bg: '#fef3c7',
        icon: 'i-lucide-wheat',
    },
])

const selectedFarmerParcels = computed(() =>
    selectedFarmer.value ? parcelsOf(selectedFarmer.value) : []
)

const profileFields = computed(() =>
    selectedFarmer.value
        ? [
              {
                  icon: 'i-lucide-map-pin',
                  label: 'Barangay',
                  val: farmerBarangay(selectedFarmer.value),
              },
              {
                  icon: 'i-lucide-wheat',
                  label: 'Registry Code',
                  val: selectedFarmer.value.farmer_code,
              },
              {
                  icon: 'i-lucide-clipboard-check',
                  label: 'Parcels',
                  val: `${selectedFarmerParcels.value.length} parcel(s)`,
              },
          ]
        : []
)

/* ------------------------------------------------------------------ */
/* Record assistance                                                   */
/* ------------------------------------------------------------------ */

/**
 * The same record-assistance form the assistance page uses, opened from a
 * farmer's profile. The recipient is the farmer being viewed, so it is fixed
 * rather than chosen, and the barangay starts at their residence — the release
 * is handed to the person, not to one of their parcels — but stays editable,
 * since a release can still be picked up in another barangay.
 */
const showAssistModal = ref(false)
const recordingAssist = ref(false)
const assistError = ref<string | null>(null)

const assistForm = reactive({
    program: '',
    barangayDocumentId: '',
    items: '',
    /** v-model casts the number input, so this is a string only while blank. */
    value: '' as string | number,
    date: new Date().toISOString().slice(0, 10),
    status: 'Pending' as AssistanceStatus,
})

const parsedValue = (raw: string | number): number | null => {
    const amount = Number(raw)
    return String(raw).trim() !== '' && Number.isFinite(amount) ? amount : null
}

/** Program names already in use, offered as suggestions on the free-text field. */
const assistanceProgramOptions = ref<string[]>([])

/**
 * Every assistance program, kept so a farmer's own records can be listed on
 * their profile without a second request.
 *
 * The profile needs one farmer's history, but this page already loads all of
 * them to build the datalist above, so filtering the list that is in hand costs
 * nothing and saves a round trip per farmer opened. It is refreshed after a
 * record is added, so the new row appears without a reload.
 */
const assistanceRecords = ref<AssistanceProgram[]>([])

async function loadAssistance() {
    try {
        const { getAll } = useAssistanceApi()
        const response = await getAll({ sort: 'date:desc' })
        assistanceRecords.value = response.data
        assistanceProgramOptions.value = [
            ...new Set(response.data.map((row) => row.program).filter(Boolean)),
        ].sort()
    } catch {
        assistanceRecords.value = []
        assistanceProgramOptions.value = []
    }
}

/** The selected farmer's assistance, most recent first as the API returned it. */
const selectedFarmerAssistance = computed(() => {
    const farmerId = selectedFarmer.value?.documentId
    if (!farmerId) return []
    return assistanceRecords.value.filter(
        (row) => row.farmer?.documentId === farmerId
    )
})

/** Headline figures for the assistance card, so the table needs no summary row. */
const selectedFarmerAssistanceTotal = computed(() =>
    selectedFarmerAssistance.value.reduce((sum, row) => {
        const amount = Number(row.value)
        return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
)

const canRecordAssist = computed(
    () =>
        !recordingAssist.value &&
        Boolean(assistForm.program.trim()) &&
        Boolean(assistForm.date)
)

function openAssistModal(farmer: Farmer) {
    assistForm.program = ''
    assistForm.barangayDocumentId = farmer.residence_barangay?.documentId ?? ''
    assistForm.items = ''
    assistForm.value = ''
    assistForm.date = new Date().toISOString().slice(0, 10)
    assistForm.status = 'Pending'
    assistError.value = null
    showAssistModal.value = true
}

function closeAssistModal() {
    if (recordingAssist.value) return
    assistError.value = null
    showAssistModal.value = false
}

async function submitAssist() {
    const farmer = selectedFarmer.value
    if (!farmer) return

    recordingAssist.value = true
    assistError.value = null
    try {
        await createAssistance({
            program: assistForm.program.trim(),
            farmer: farmer.documentId,
            barangay: assistForm.barangayDocumentId || null,
            items: assistForm.items.trim() || null,
            value: parsedValue(assistForm.value),
            date: assistForm.date,
            status: assistForm.status,
        })
        showAssistModal.value = false
        // Re-read so the record appears in the profile's list straight away
        // rather than after a manual reload.
        await loadAssistance()
    } catch (error) {
        assistError.value =
            error instanceof Error
                ? error.message
                : 'Could not record the assistance.'
    } finally {
        recordingAssist.value = false
    }
}

const detailStats = computed(() => {
    const fp = selectedFarmerParcels.value
    return [
        {
            label: 'Total Parcels',
            val: selectedFarmer.value?.parcelCount ?? 0,
            icon: 'i-lucide-layers',
            color: '#2d6a2d',
            bg: '#e8f5e8',
        },
        {
            label: 'Total Area',
            val: `${fp.reduce((a, p) => a + p.area_hectares, 0).toFixed(1)} ha`,
            icon: 'i-lucide-map-pin',
            color: '#1d6fa4',
            bg: '#e0f0fb',
        },
        {
            label: 'Cultivated Parcels',
            val: fp.filter((p) => p.land_status === 'Cultivated').length,
            icon: 'i-lucide-activity',
            color: '#16a34a',
            bg: '#dcfce7',
        },
        {
            label: 'At-Risk Parcels',
            val: fp.filter((p) => p.land_status === 'At Risk').length,
            icon: 'i-lucide-alert-triangle',
            color: '#dc2626',
            bg: '#fee2e2',
        },
    ]
})

/**
 * Leaves the profile, dropping the `?farmer=` deep link on the way out: the
 * registry is the page's resting state, so a refresh there should show the
 * registry rather than reopen the profile that was just dismissed.
 */
async function backToRegistry() {
    selectedFarmer.value = null
    await navigateTo({ path: '/farmers' }, { replace: true })
}

onMounted(async () => {
    await loadFarmers()

    // Deep link from a registry that links a farmer by id (the assistance page's
    // recipient column does): open that farmer's profile straight away, the way
    // `?farm=<documentId>` opens a farm card on /farms.
    const farmerId =
        typeof route.query.farmer === 'string' ? route.query.farmer : undefined
    if (farmerId) {
        const row = farmers.value.find(
            (farmer) => farmer.documentId === farmerId
        )
        if (row) selectedFarmer.value = row
    }
})
</script>

<template>
    <!-- Farmer Detail View -->
    <div v-if="selectedFarmer" class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8">
        <div class="w-full">
            <button
                type="button"
                class="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                @click="backToRegistry"
            >
                <UIcon name="i-lucide-arrow-left" class="size-3.5" />
                Back to Farmers Registry
            </button>

            <!-- Profile Header -->
            <div class="relative mb-6 overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-white to-emerald-50/60 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.07)] ring-1 ring-white/80 sm:p-7">
                <div class="flex flex-col items-start gap-5 sm:flex-row">
                    <div
                        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#5cba5c] via-[#3d9948] to-[#246c31] text-2xl font-extrabold text-white shadow-[0_12px_30px_rgba(45,106,45,0.25)] ring-4 ring-emerald-50"
                    >
                        {{ initials(selectedFarmer.name) }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div>
                                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <h2 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                        {{ selectedFarmer.name }}
                                    </h2>
                                    <span
                                        class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                                        :class="
                                            selectedFarmer.farmer_status ===
                                            'Active'
                                                ? 'bg-green-50 text-green-700 ring-green-100'
                                                : selectedFarmer.farmer_status ===
                                                    'Inactive'
                                                  ? 'bg-gray-50 text-gray-600 ring-gray-200'
                                                  : 'bg-amber-50 text-amber-700 ring-amber-100'
                                        "
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :class="
                                                selectedFarmer.farmer_status ===
                                                'Active'
                                                    ? 'bg-green-500'
                                                    : selectedFarmer.farmer_status ===
                                                        'Inactive'
                                                      ? 'bg-gray-400'
                                                      : 'bg-amber-500'
                                            "
                                        ></span>
                                        {{ selectedFarmer.farmer_status }}
                                    </span>
                                </div>
                                <div class="mt-1 flex items-center gap-3">
                                    <span
                                        class="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-600"
                                    >
                                        {{ selectedFarmer.farmer_code }}
                                    </span>
                                    <span class="text-sm text-slate-500">
                                        {{ farmerBarangay(selectedFarmer) }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                                    @click="openEditModal(selectedFarmer)"
                                >
                                    <UIcon name="i-lucide-pencil" class="size-4" />
                                    Edit Profile
                                </button>
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_8px_20px_rgba(45,106,45,0.28)]"
                                    @click="openAssistModal(selectedFarmer)"
                                >
                                    <UIcon name="i-lucide-hand-heart" class="size-4" />
                                    Add Assistance
                                </button>
                            </div>
                        </div>
                        <div
                            class="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <div
                                v-for="field in profileFields"
                                :key="field.label"
                                class="text-sm"
                            >
                                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                                    {{ field.label }}
                                </div>
                                <div
                                    class="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                                >
                                    <UIcon
                                        :name="field.icon"
                                        class="size-2.75 text-gray-400"
                                    />
                                    {{ field.val }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="stat in detailStats"
                    :key="stat.label"
                    class="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)]"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1 opacity-80"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${stat.color}, transparent)`,
                        }"
                    />
                    <div
                        class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105"
                        :style="{ background: stat.bg }"
                    >
                        <UIcon
                            :name="stat.icon"
                            class="size-4"
                            :style="{ color: stat.color }"
                        />
                    </div>
                    <div class="text-3xl font-bold tracking-tight text-slate-950">
                        {{ stat.val }}
                    </div>
                    <div class="text-sm font-medium text-slate-500">{{ stat.label }}</div>
                </div>
            </div>

            <!-- Parcels -->
            <div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
                <h3 class="border-b border-slate-100 px-6 py-5 text-base font-bold tracking-tight text-slate-800">
                    Registered Parcels
                </h3>
                <div
                    v-if="selectedFarmerParcels.length === 0"
                    class="px-6 py-12 text-center text-sm text-slate-400"
                >
                    No parcels registered for this farmer.
                </div>
                <div v-else class="overflow-x-auto px-2 pb-2">
                    <table class="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                                <th class="pb-2 text-left font-medium">
                                    Parcel Code
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Barangay
                                </th>
                                <th class="pb-2 text-right font-medium">
                                    Area (ha)
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Land Status
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Current Use
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="p in selectedFarmerParcels"
                                :key="p.parcel_code"
                                class="border-b border-slate-100 last:border-0 transition-colors hover:bg-emerald-50/40"
                            >
                                <td class="px-4 py-3.5 font-mono font-semibold text-slate-700">
                                    {{ p.parcel_code }}
                                </td>
                                <td class="px-4 py-3.5 text-slate-600">
                                    {{ p.barangay }}
                                </td>
                                <td class="px-4 py-3.5 text-right font-mono font-semibold text-slate-700">
                                    {{ p.area_hectares }}
                                </td>
                                <td class="px-4 py-3.5">
                                    <span
                                        :class="
                                            parcelStatusClass(p.land_status)
                                        "
                                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                    >
                                        {{ p.land_status }}
                                    </span>
                                </td>
                                <td class="px-4 py-3.5 text-slate-600">
                                    {{ p.current_use ?? '—' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Assistance -->
            <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                    <h3
                        class="flex items-center gap-2 text-base font-bold tracking-tight text-slate-800"
                    >
                        <UIcon
                            name="i-lucide-hand-heart"
                            class="size-3.5 text-gray-400"
                        />
                        Assistance Received
                    </h3>
                    <span
                        v-if="selectedFarmerAssistance.length > 0"
                        class="text-xs text-slate-400"
                    >
                        {{ selectedFarmerAssistance.length }} record(s) ·
                        {{ peso(selectedFarmerAssistanceTotal) }} total
                    </span>
                </div>
                <div
                    v-if="selectedFarmerAssistance.length === 0"
                    class="px-6 py-12 text-center text-sm text-slate-400"
                >
                    No assistance recorded for this farmer yet.
                </div>
                <div v-else class="overflow-x-auto px-2 pb-2">
                    <table class="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                                <th class="pb-2 text-left font-medium">Ref</th>
                                <th class="pb-2 text-left font-medium">
                                    Program
                                </th>
                                <th class="pb-2 text-left font-medium">Date</th>
                                <th class="pb-2 text-right font-medium">
                                    Value
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="a in selectedFarmerAssistance"
                                :key="a.documentId"
                                class="border-b border-slate-100 last:border-0 transition-colors hover:bg-emerald-50/40"
                            >
                                <td class="py-2.5 font-mono text-gray-400">
                                    {{ a.reference_code || '—' }}
                                </td>
                                <td class="px-4 py-3.5">
                                    <div
                                        class="font-medium text-slate-800"
                                        :title="a.program"
                                    >
                                        {{ a.program }}
                                    </div>
                                    <!-- Items are free text and often long, so they
                                         sit under the program rather than taking a
                                         column that would force a scrollbar. -->
                                    <div
                                        v-if="a.items"
                                        class="mt-0.5 max-w-xs truncate text-[10px] text-gray-400"
                                        :title="a.items"
                                    >
                                        {{ a.items }}
                                    </div>
                                </td>
                                <td class="py-2.5 text-gray-500">
                                    <span class="flex items-center gap-1.5">
                                        <UIcon
                                            name="i-lucide-calendar"
                                            class="size-[10px] text-gray-400"
                                        />
                                        {{ a.date ?? '—' }}
                                    </span>
                                </td>
                                <td
                                    class="py-2.5 text-right font-mono font-medium text-green-700"
                                >
                                    {{ peso(a.value) }}
                                </td>
                                <td class="py-2.5 text-gray-500">
                                    <span
                                        :class="
                                            ASSISTANCE_STATUS_STYLE[
                                                a.status ?? 'Scheduled'
                                            ]
                                        "
                                        class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background:
                                                    ASSISTANCE_STATUS_DOT[
                                                        a.status ?? 'Scheduled'
                                                    ],
                                            }"
                                        />
                                        {{ a.status ?? '—' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Farmers Registry List -->
    <div v-else class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8">
        <div
            class="relative mb-7 overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
        >
            <div
                class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
            />
            <div class="relative flex flex-wrap items-center justify-between gap-5">
                <div class="flex min-w-0 items-start gap-4">
                    <div
                        class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                    >
                        <UIcon name="i-lucide-users" class="size-6" />
                    </div>
                    <div>
                        <div class="mb-2 flex flex-wrap items-center gap-2">
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                            >
                                <span class="size-1.5 rounded-full bg-emerald-500" />
                                Farmer Information Management
                            </span>
                            <span
                                class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                            >
                                {{ farmers.length }} registered
                            </span>
                        </div>
                        <h1 class="text-3xl font-bold tracking-tight text-slate-950">
                            Farmers Registry
                        </h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                            Manage farmer profiles, parcel assignments, coverage, and assistance records.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-[#245c2a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                    @click="showRegisterModal = true"
                >
                    <UIcon name="i-lucide-user-plus" class="size-4.5" />
                    Register Farmer
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
                v-for="card in summaryCards"
                :key="card.label"
                class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
            >
                <!-- Accent rail -->
                <div
                    class="absolute inset-x-0 top-0 h-1"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${card.color}, ${card.color}55, transparent)`,
                    }"
                />

                <!-- Decorative accent -->
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
                        <div
                            class="font-sans text-3xl font-bold tracking-tight text-slate-950"
                        >
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
                        <span>{{ card.hint }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div
            class="mb-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
        >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <UIcon name="i-lucide-search-check" class="size-4.5" />
                    </div>
                    <div>
                        <h2 class="text-base font-bold tracking-tight text-slate-800">Find Farmers</h2>
                        <p class="text-xs text-slate-500">Search the registry or filter by barangay.</p>
                    </div>
                </div>
                <div class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
                    <UIcon name="i-lucide-filter" class="size-3.5" />
                    {{ filtered.length }} of {{ farmers.length }} farmers
                </div>
            </div>

            <div class="p-4 sm:p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="relative w-full max-w-md flex-1">
                    <UIcon
                        name="i-lucide-search"
                        class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search farmer name or code..."
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <UButton
                        v-if="search"
                        type="button"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                        @click="search = ''"
                    >
                        <UIcon name="i-lucide-x" class="size-3" />
                    </UButton>
                </div>
                <div
                    class="flex items-center gap-1.5 text-sm font-medium text-slate-500 sm:ml-auto"
                >
                    <UIcon name="i-lucide-filter" class="size-3" />
                    {{ filtered.length }} of {{ farmers.length }} farmers
                </div>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button
                    v-for="b in ['All', ...barangaysByParcels]"
                    :key="b"
                    type="button"
                    class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                    :class="
                        filterBarangay === b
                            ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                    "
                    @click="filterBarangay = b"
                >
                    {{ b }}
                </button>
            </div>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div class="border-b border-slate-100 px-6 py-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold tracking-tight text-slate-800">Farmer Directory</h2>
                        <p class="mt-1 text-xs text-slate-500 sm:text-sm">Select a farmer to view profile, parcels, and assistance history.</p>
                    </div>
                    <div class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block">
                        {{ filtered.length }} records
                    </div>
                </div>
            </div>
            <UTable
                :data="filtered"
                :columns="columns"
                :meta="farmerTableMeta"
                :ui="{
                    th: 'bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                    td: 'px-4 py-3.5 text-sm text-slate-600',
                    tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40'
                }"
                :loading="loading"
                :get-row-id="(row: FarmerRow) => row.documentId"
                @select="onFarmerSelect"
            >
                <template #name-cell="{ row }">
                    <div class="flex items-center gap-2.5">
                        <span
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: avatarColor(row.original.name),
                            }"
                        >
                            {{ initials(row.original.name) }}
                        </span>
                        <span class="font-medium text-slate-800">
                            {{ row.original.name }}
                        </span>
                    </div>
                </template>
                <template #barangay-cell="{ row }">
                    <span class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-map-pin"
                            class="size-2.5 text-gray-400"
                        />
                        {{ row.getValue('barangay') }}
                    </span>
                </template>
                <template #view-cell>
                    <div
                        class="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <span class="text-sm font-semibold text-[#245c2a]">
                            View
                        </span>
                        <UIcon
                            name="i-lucide-chevron-right"
                            class="size-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#2d6a2d]"
                        />
                    </div>
                </template>
                <template #loading>
                    <span class="inline-flex items-center gap-2">
                        <UIcon
                            name="i-lucide-loader-circle"
                            class="size-4 animate-spin"
                        />
                        Loading farmers...
                    </span>
                </template>
                <template #empty>
                    <!-- Failed: UTable has no error state, so it rides here. -->
                    <div v-if="loadError">
                        <p class="text-red-600">{{ loadError }}</p>
                        <button
                            type="button"
                            class="mt-2 text-xs font-medium text-green-700 underline"
                            @click="loadFarmers"
                        >
                            Try again
                        </button>
                    </div>
                    <div v-else class="flex flex-col items-center gap-2">
                        <UIcon
                            name="i-lucide-user"
                            class="size-6 text-gray-300"
                        />
                        <p class="text-sm">
                            {{
                                farmers.length === 0
                                    ? 'No farmers registered yet.'
                                    : 'No farmers match your filters.'
                            }}
                        </p>
                    </div>
                </template>
            </UTable>
        </div>
    </div>

    <!-- Register Farmer Modal -->
    <Teleport to="body">
        <div
            v-if="showRegisterModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="showRegisterModal = false"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight text-slate-950">
                            Register Farmer
                        </h3>
                        <p class="text-sm text-slate-500">
                            The farmer code is generated automatically.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="showRegisterModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="submitRegister">
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Status
                        </label>
                        <select
                            v-model="registerForm.status"
                            :disabled="registering"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Departed">Departed</option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="registerForm.name"
                            type="text"
                            :disabled="registering"
                            placeholder="e.g. Juan Dela Cruz"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Contact Number
                        </label>
                        <input
                            v-model="registerForm.contact"
                            type="text"
                            :disabled="registering"
                            placeholder="09XX XXX XXXX"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        />
                    </div>

                    <p
                        v-if="registerError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700"
                    >
                        {{ registerError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            :disabled="registering"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                            @click="showRegisterModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            :disabled="registering"
                            class="rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:opacity-60"
                        >
                            <span
                                v-if="registering"
                                class="inline-flex items-center gap-1.5"
                            >
                                <UIcon
                                    name="i-lucide-loader-circle"
                                    class="size-3 animate-spin"
                                />
                                Registering...
                            </span>
                            <span v-else>Register Farmer</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Edit Farmer Profile Modal -->
    <Teleport to="body">
        <div
            v-if="showEditModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="showEditModal = false"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight text-slate-950">
                            Edit Profile
                        </h3>
                        <p class="text-sm text-slate-500">
                            Update the farmer's details.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="showEditModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="submitEdit">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Farmer Code
                            </label>
                            <input
                                :value="editForm.farmer_code"
                                type="text"
                                readonly
                                class="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 font-mono text-sm font-semibold text-slate-600"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>
                            <select
                                v-model="editForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Departed">Departed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="editForm.name"
                            type="text"
                            placeholder="e.g. Juan Dela Cruz"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Contact Number
                            </label>
                            <input
                                v-model="editForm.contact"
                                type="text"
                                placeholder="09XX XXX XXXX"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Barangay of Residence
                            </label>
                            <select
                                v-model="editForm.residence_barangay"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="">Not specified</option>
                                <option
                                    v-for="b in barangays"
                                    :key="b.value"
                                    :value="b.value"
                                >
                                    {{ b.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p v-if="editError" class="text-xs text-red-600">
                        {{ editError }}
                    </p>
                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            :disabled="editing"
                            @click="showEditModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:opacity-50"
                            :disabled="editing"
                        >
                            <span v-if="editing">Saving...</span>
                            <span v-else>Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Record Assistance Modal -->
    <Teleport to="body">
        <div
            v-if="showAssistModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeAssistModal"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-hand-heart"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold tracking-tight text-slate-950">
                                Record Assistance
                            </h3>
                            <p class="text-sm text-slate-500">
                                For
                                {{ selectedFarmer?.name }}
                                ({{ selectedFarmer?.farmer_code }})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="closeAssistModal"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="submitAssist">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Program
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="assistForm.program"
                                type="text"
                                list="assist-program-options-farmer"
                                placeholder="e.g. Rice Seed Subsidy"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                            <datalist id="assist-program-options-farmer">
                                <option
                                    v-for="p in assistanceProgramOptions"
                                    :key="p"
                                    :value="p"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="assistForm.barangayDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="">Not specified</option>
                                <option
                                    v-for="b in barangays"
                                    :key="b.value"
                                    :value="b.value"
                                >
                                    {{ b.label }}
                                </option>
                            </select>
                            <p
                                v-if="selectedFarmer?.residence_barangay"
                                class="mt-1 text-[10px] text-gray-400"
                            >
                                Defaults to
                                {{ selectedFarmer.residence_barangay.name }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="assistForm.items"
                            rows="2"
                            placeholder="e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Value (₱)
                            </label>
                            <input
                                v-model="assistForm.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="assistForm.date"
                                type="date"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>
                            <select
                                v-model="assistForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option
                                    v-for="s in ASSISTANCE_STATUS_OPTIONS"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="assistError"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ assistError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            :disabled="recordingAssist"
                            @click="closeAssistModal"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canRecordAssist"
                        >
                            <UIcon
                                v-if="recordingAssist"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{
                                recordingAssist
                                    ? 'Saving...'
                                    : 'Record Assistance'
                            }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
