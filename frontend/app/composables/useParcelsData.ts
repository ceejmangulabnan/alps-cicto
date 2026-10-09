import type { FarmParcel, LandStatus } from '~/composables/useFarmParcelApi'
import { toLoadError, type LoadError } from '~/utils/loadError'

export type ParcelStatusFilter = 'All' | LandStatus

/**
 * `farmers` is the parcel's own tendees. `farm.farmers` is the farm-wide rollup,
 * which is every farmer on any of the farm's parcels, so reading a name off it
 * would put the same farmer on all of them.
 */
const PARCEL_POPULATE = ['farm', 'farm.barangay', 'farm.farmers', 'farmers']

const PARCEL_SUBJECT = { name: 'parcels', contentType: 'farm-parcel' } as const

const UNKNOWN = 'Unknown'
const NO_FARMER = `${UNKNOWN} farmer`

/** A parcel denormalised with the farm and farmer fields the table shows. */
export interface ParcelRow {
    documentId: string
    parcel_code: string
    farmDocumentId: string
    farm_code: string
    /** The farmers tending this parcel specifically, by name. */
    farmerNames: string[]
    /** A display string for the table: every tendee, comma separated. */
    farmerName: string
    barangay: string
    area_hectares: number
    land_status: LandStatus
    current_use: string | null
}

function toParcelRow(parcel: FarmParcel): ParcelRow {
    const farm = parcel.farm
    const farmerNames = (parcel.farmers ?? []).map((farmer) => farmer.name)

    return {
        documentId: parcel.documentId,
        parcel_code: parcel.parcel_code,
        farmDocumentId: farm?.documentId ?? '',
        farm_code: farm?.farm_code ?? 'Unassigned',
        farmerNames,
        farmerName: farmerNames.length > 0 ? farmerNames.join(', ') : NO_FARMER,
        barangay: farm?.barangay?.name ?? `${UNKNOWN} barangay`,
        area_hectares: parcel.area_hectares,
        land_status: parcel.land_status,
        current_use: parcel.current_use ?? null,
    }
}

/**
 * Owns the parcel registry list: the fetch, its single error banner, the search
 * and status filters, and the summary cards.
 */
export const useParcelsData = () => {
    const { getAll: getAllParcels, deleteParcel: removeParcel } =
        useFarmParcelApi()

    const parcels = ref<ParcelRow[]>([])
    const loading = ref(false)
    const loadError = ref<LoadError | null>(null)

    const search = ref('')
    const filterStatus = ref<ParcelStatusFilter>('All')

    const filtered = computed(() => {
        const query = search.value.trim().toLowerCase()

        return parcels.value.filter((row) => {
            const matchesSearch =
                !query ||
                // Every tendee, not just the first, so searching a name finds
                // the parcel regardless of which slot they occupy.
                row.farmerNames.some((name) =>
                    name.toLowerCase().includes(query)
                ) ||
                row.parcel_code.toLowerCase().includes(query) ||
                row.farm_code.toLowerCase().includes(query)

            const matchesStatus =
                filterStatus.value === 'All' ||
                row.land_status === filterStatus.value

            return matchesSearch && matchesStatus
        })
    })

    const summaryCards = computed(() => [
        {
            label: 'Total Parcels',
            val: parcels.value.length,
            color: '#2d6a2d',
            bg: '#e8f5e8',
            icon: 'i-lucide-layers',
        },
        {
            label: 'Cultivated',
            val: parcels.value.filter((p) => p.land_status === 'Cultivated')
                .length,
            color: '#16a34a',
            bg: '#dcfce7',
            icon: 'i-lucide-sprout',
        },
        {
            label: 'Idle / Fallow',
            val: parcels.value.filter(
                (p) => p.land_status === 'Idle' || p.land_status === 'Fallow'
            ).length,
            color: '#9ca3af',
            bg: '#f3f4f6',
            icon: 'i-lucide-pause',
        },
        {
            label: 'At Risk',
            val: parcels.value.filter((p) => p.land_status === 'At Risk')
                .length,
            color: '#dc2626',
            bg: '#fee2e2',
            icon: 'i-lucide-triangle-alert',
        },
    ])

    async function loadParcels() {
        loading.value = true
        loadError.value = null

        try {
            const response = await getAllParcels({
                populate: PARCEL_POPULATE,
            })
            parcels.value = response.data.map(toParcelRow)
        } catch (value: unknown) {
            loadError.value = toLoadError(value, PARCEL_SUBJECT)
        } finally {
            loading.value = false
        }
    }

    /**
     * Deletes a parcel and drops it from the registry. The server refuses
     * (409) while a planting cycle, inspection or risk report still references
     * the parcel, so a successful call here means it was clear.
     */
    async function deleteParcel(documentId: string) {
        await removeParcel(documentId)

        parcels.value = parcels.value.filter(
            (item) => item.documentId !== documentId
        )
    }

    return {
        parcels,
        loading,
        loadError,
        search,
        filterStatus,
        filtered,
        summaryCards,
        loadParcels,
        deleteParcel,
    }
}
