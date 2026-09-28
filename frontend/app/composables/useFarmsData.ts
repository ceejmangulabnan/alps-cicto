import type { Farm, FarmerStatus } from '~/composables/useFarmsApi'
import { toLoadError, type LoadError } from '~/utils/loadError'

export type FarmStatusFilter = 'All' | FarmerStatus

const FARM_SUBJECT = { name: 'farms', contentType: 'farm' } as const

/** A farm flattened for the management table. */
export interface FarmRow {
    documentId: string
    farm_code: string
    farmer_status: FarmerStatus
    barangay: string
    farmers: string[]
    parcelCount: number
    totalAreaHectares: number
    /** The untouched record, so the edit form can prefill without a refetch. */
    farm: Farm
}

const UNKNOWN = 'Unknown'

function toFarmRow(farm: Farm): FarmRow {
    const summary = farm.parcel_summary
    const parcels = farm.farm_parcels ?? []

    return {
        documentId: farm.documentId,
        farm_code: farm.farm_code,
        farmer_status: farm.farmer_status ?? 'Inactive',
        barangay: farm.barangay?.name ?? `${UNKNOWN} barangay`,
        farmers: (farm.farmers ?? []).map((farmer) => farmer.name),
        parcelCount: summary?.parcel_count ?? parcels.length,
        totalAreaHectares:
            summary?.total_area_hectares ??
            parcels.reduce(
                (total, parcel) => total + Number(parcel.area_hectares || 0),
                0
            ),
        farm,
    }
}

/**
 * Owns the farm registry list: the fetch, its single error banner, the search
 * and status filters, the summary cards, and the current selection.
 */
export const useFarmsData = () => {
    const { getAllWithSummary, getOneWithSummary } = useFarmsApi()

    const farms = ref<FarmRow[]>([])
    const loading = ref(false)
    const loadError = ref<LoadError | null>(null)

    const selected = ref<FarmRow | null>(null)
    /** The selected farm's parcels by code, fetched on demand. */
    const selectedDetail = ref<Farm | null>(null)
    const detailLoading = ref(false)

    const search = ref('')
    const filterStatus = ref<FarmStatusFilter>('All')

    const filtered = computed(() => {
        const query = search.value.trim().toLowerCase()

        return farms.value.filter((row) => {
            const matchesSearch =
                !query ||
                row.farm_code.toLowerCase().includes(query) ||
                row.barangay.toLowerCase().includes(query) ||
                row.farmers.some((name) => name.toLowerCase().includes(query))

            const matchesStatus =
                filterStatus.value === 'All' ||
                row.farmer_status === filterStatus.value

            return matchesSearch && matchesStatus
        })
    })

    const summaryCards = computed(() => [
        {
            label: 'Total Farms',
            val: farms.value.length,
            color: '#2d6a2d',
            bg: '#e8f5e8',
            icon: 'i-lucide-tractor',
        },
        {
            label: 'Total Area',
            val: `${farms.value
                .reduce((total, row) => total + row.totalAreaHectares, 0)
                .toFixed(1)} ha`,
            color: '#1d6fa4',
            bg: '#e0f0fb',
            icon: 'i-lucide-maximize',
        },
        {
            label: 'Active',
            val: farms.value.filter((row) => row.farmer_status === 'Active')
                .length,
            color: '#16a34a',
            bg: '#dcfce7',
            icon: 'i-lucide-circle-check',
        },
        {
            label: 'Awaiting Parcels',
            val: farms.value.filter((row) => row.parcelCount === 0).length,
            color: '#ca8a04',
            bg: '#fef3c7',
            icon: 'i-lucide-map-pin-off',
        },
    ])

    async function loadFarms() {
        loading.value = true
        loadError.value = null

        try {
            const response = await getAllWithSummary()
            farms.value = response.data.map(toFarmRow)
        } catch (value: unknown) {
            loadError.value = toLoadError(value, FARM_SUBJECT)
        } finally {
            loading.value = false
        }
    }

    /** Puts a created or edited farm back into the list without a refetch. */
    function upsertFarm(farm: Farm) {
        const row = toFarmRow(farm)
        const index = farms.value.findIndex(
            (item) => item.documentId === row.documentId
        )

        if (index === -1) {
            farms.value = [...farms.value, row]
        } else {
            farms.value[index] = row
        }

        if (selected.value?.documentId === row.documentId) {
            selected.value = row
        }
    }

    /**
     * Selects a farm and fetches the parcel list the detail panel shows. A
     * failed fetch only costs the panel its parcel list, so it falls back to
     * whatever the list row already carried rather than raising an error.
     */
    async function selectFarm(row: FarmRow) {
        selected.value = row
        selectedDetail.value = null
        detailLoading.value = true

        try {
            const response = await getOneWithSummary(row.documentId)
            selectedDetail.value = response.data
        } catch {
            selectedDetail.value = null
        } finally {
            detailLoading.value = false
        }
    }

    return {
        farms,
        loading,
        loadError,
        selected,
        selectedDetail,
        detailLoading,
        search,
        filterStatus,
        filtered,
        summaryCards,
        loadFarms,
        upsertFarm,
        selectFarm,
    }
}
