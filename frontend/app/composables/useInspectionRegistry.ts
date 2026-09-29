import type {
    FarmParcel,
    InspectionStatus,
    RiskInspectionLevel,
} from '~/composables/useFarmParcelApi'
import { getErrorMessage } from '~/utils/apiError'

/**
 * A field inspection as the inspections page needs it. Inspections hang off
 * parcels (manyToOne, several per parcel), so each row flattens the enclosing
 * parcel in for display — the code, the farmers tending it and the barangay —
 * exactly like the cycle registry does for cycles and harvests.
 */
export interface InspectionRow {
    documentId: string
    parcelDocumentId: string
    parcel_code: string
    farmerNames: string[]
    barangay: string
    inspector: string
    date: string | null
    inspection_type: string
    riskLevel: RiskInspectionLevel
    status: InspectionStatus
    /** Kept verbatim from the JSON column (usually a free-text GPS string). */
    gps_point: unknown
    notes: string
    photoCount: number
}

const REGISTRY_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'inspections',
    'inspections.photos',
]

const farmerNamesOf = (parcel: FarmParcel): string[] =>
    (parcel.farmers ?? [])
        .map((farmer) => farmer.name)
        .filter((name): name is string => Boolean(name))

const barangayOf = (parcel: FarmParcel): string =>
    parcel.farm?.barangay?.name ?? ''

export const useInspectionRegistry = () => {
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
                'Could not load the inspection records. Please try again.'
            )
        } finally {
            loading.value = false
        }
    }

    /** One row per inspection across every parcel, grouped by parcel. */
    const inspections = computed<InspectionRow[]>(() =>
        parcels.value.flatMap((parcel) =>
            (parcel.inspections ?? []).map((inspection) => ({
                documentId: inspection.documentId,
                parcelDocumentId: parcel.documentId,
                parcel_code: parcel.parcel_code,
                farmerNames: farmerNamesOf(parcel),
                barangay: barangayOf(parcel),
                inspector: inspection.inspector ?? '',
                date: inspection.date ?? null,
                inspection_type:
                    inspection.inspection_type ?? 'Field Inspection',
                riskLevel: inspection.risk_level ?? 'None',
                status: inspection.status ?? 'Pending',
                gps_point: inspection.gps_point,
                notes: inspection.notes ?? '',
                photoCount: inspection.photos?.length ?? 0,
            }))
        )
    )

    /** Every parcel, for the inspection form's parcel selector. */
    const allParcels = computed<FarmParcel[]>(() => parcels.value)

    return { parcels, inspections, allParcels, loading, loadError, load }
}
