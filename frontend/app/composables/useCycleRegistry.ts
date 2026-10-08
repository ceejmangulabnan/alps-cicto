import type {
    FarmParcel,
    ParcelPlantingCycle,
} from '~/composables/useFarmParcelApi'
import { getErrorMessage } from '~/utils/apiError'

/**
 * A planting cycle as the registry pages need it. The parcel is the natural
 * carrier for a cycle's context — the code, the farmers tending it, the
 * barangay and the area — so each row binds one parcel to its single cycle
 * (the relation is manyToOne). The populated `cycle` keeps crop, variety,
 * dates and harvests together for both display and the edit form.
 */
export interface CycleRow {
    parcelDocumentId: string
    parcel_code: string
    farmerNames: string[]
    barangay: string
    area_hectares: number
    cycle: ParcelPlantingCycle
}

/**
 * A harvest as the harvest page needs it. Harvests hang off cycles, not
 * parcels, and carry no farmer/area of their own, so the enclosing parcel is
 * flattened in for display. The crop attribution comes from the cycle ('crop'
 * is a convenience string; the truth is `cycle.crop`).
 */
export interface HarvestRow {
    documentId: string
    cycleDocumentId: string
    parcelDocumentId: string
    parcel_code: string
    farmerNames: string[]
    barangay: string
    crop: string
    variety: string
    area_hectares: number
    harvest_date: string | null
    /** Strapi `decimal`; loose so a string response cannot break a render. */
    production_kg: number | string | null
    yield_per_hectare: number | string | null
}

/**
 * Everything the crops and harvests registries render, in one request per
 * page. The `planting_cycle.harvests` hop is two levels down, but since a
 * parcel has at most one cycle these are the harvests of that single cycle.
 */
const REGISTRY_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'planting_cycle',
    'planting_cycle.crop',
    'planting_cycle.harvests',
]

const farmerNamesOf = (parcel: FarmParcel): string[] =>
    (parcel.farmers ?? [])
        .map((farmer) => farmer.name)
        .filter((name): name is string => Boolean(name))

const barangayOf = (parcel: FarmParcel): string =>
    parcel.farm?.barangay?.name ?? ''

/** A cycle is Harvested once it holds at least one harvest record. */
export type PlantingStatus = 'Harvested' | 'Growing'

export const cycleStatus = (row: CycleRow): PlantingStatus =>
    (row.cycle.harvests?.length ?? 0) > 0 ? 'Harvested' : 'Growing'

/** A harvest is Completed once it carries a production figure. */
export type HarvestStatus = 'Completed' | 'Upcoming'

export const harvestStatus = (h: HarvestRow): HarvestStatus =>
    h.production_kg != null ? 'Completed' : 'Upcoming'

export const useCycleRegistry = () => {
    const parcels = ref<FarmParcel[]>([])
    const loading = ref(false)
    const loadError = ref<string | null>(null)

    /** Re-reads the parcel list wholesale; cheap at dev data sizes. */
    const load = async (): Promise<void> => {
        loading.value = true
        loadError.value = null
        try {
            const { getAll } = useFarmParcelApi()
            const response = await getAll({ populate: REGISTRY_POPULATE })
            parcels.value = response.data
        } catch (cause) {
            loadError.value = getErrorMessage(
                cause,
                'Could not load the planting records. Please try again.'
            )
        } finally {
            loading.value = false
        }
    }

    /** One row per parcel that has a planting cycle, in parcel order. */
    const cycles = computed<CycleRow[]>(() =>
        parcels.value
            .filter((parcel) => parcel.planting_cycle)
            .map((parcel) => ({
                parcelDocumentId: parcel.documentId,
                parcel_code: parcel.parcel_code,
                farmerNames: farmerNamesOf(parcel),
                barangay: barangayOf(parcel),
                area_hectares: Number(parcel.area_hectares) || 0,
                cycle: parcel.planting_cycle as ParcelPlantingCycle,
            }))
    )

    /** One row per harvest across every parcel's current cycle. */
    const harvests = computed<HarvestRow[]>(() =>
        parcels.value.flatMap((parcel) => {
            const cycle = parcel.planting_cycle
            if (!cycle) return []
            const crop = cycle.crop?.name ?? ''
            const variety = cycle.variety ?? ''
            const areaHectares = Number(parcel.area_hectares) || 0
            return (cycle.harvests ?? []).map((harvest) => ({
                documentId: harvest.documentId,
                cycleDocumentId: cycle.documentId,
                parcelDocumentId: parcel.documentId,
                parcel_code: parcel.parcel_code,
                farmerNames: farmerNamesOf(parcel),
                barangay: barangayOf(parcel),
                crop,
                variety,
                area_hectares: areaHectares,
                harvest_date: harvest.harvest_date ?? null,
                production_kg: harvest.production_kg ?? null,
                yield_per_hectare: harvest.yield_per_hectare ?? null,
            }))
        })
    )

    /** Parcels that have a cycle, i.e. the ones a harvest can be attached to. */
    const cycleParcels = computed<FarmParcel[]>(() =>
        parcels.value.filter((parcel) => parcel.planting_cycle)
    )

    return { parcels, cycles, harvests, cycleParcels, loading, loadError, load }
}
