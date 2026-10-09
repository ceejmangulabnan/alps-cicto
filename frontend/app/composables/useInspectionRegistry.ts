import type {
    FarmParcel,
    InspectionStatus,
    ParcelInspectionPhoto,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
import { getErrorMessage } from '~/utils/apiError'

/**
 * A field inspection as the inspections page needs it. Inspections hang off
 * parcels (manyToOne, several per parcel), so each row carries the parcel
 * context it happened on — the code and the barangay — exactly like the cycle
 * registry does for cycles and harvests. A farmer is deliberately absent: an
 * inspection is made on a parcel, not on a farmer.
 *
 * The risk the visit observed lives in `findings`, one per linked report, and
 * `riskLevel` is the worst of them. Neither is a stored field on the inspection:
 * the reports are the record, and the level is derived so the two cannot drift.
 */
export interface InspectionFinding {
    /** The linked report's documentId, blank for a finding not yet saved. */
    reportDocumentId: string | null
    riskType: string
    severity: RiskSeverity
}

export interface InspectionRow {
    documentId: string
    parcelDocumentId: string
    parcel_code: string
    barangay: string
    inspector: string
    date: string | null
    inspection_type: string
    /** Worst severity among the linked findings, or `None`. */
    riskLevel: RiskSeverity | 'None'
    findings: InspectionFinding[]
    status: InspectionStatus
    /** Kept verbatim from the JSON column (usually a free-text GPS string). */
    gps_point: unknown
    notes: string
    /** Real media files attached to the inspection, for previews and counts. */
    photos: ParcelInspectionPhoto[]
}

const REGISTRY_POPULATE = [
    'farm',
    'farm.barangay',
    'inspections',
    'inspections.risk_reports',
    'inspections.photos',
]

const SEVERITY_RANK: Record<RiskSeverity, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
}

const worstSeverity = (
    severities: RiskSeverity[]
): RiskSeverity | 'None' =>
    severities.reduce<RiskSeverity | 'None'>(
        (worst, severity) =>
            worst === 'None' ||
            SEVERITY_RANK[severity] > SEVERITY_RANK[worst]
                ? severity
                : worst,
        'None'
    )

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
            (parcel.inspections ?? []).map((inspection) => {
                const findings: InspectionFinding[] = (
                    inspection.risk_reports ?? []
                ).map((report) => ({
                    reportDocumentId: report.documentId,
                    riskType: report.risk_type?.trim() || 'Unclassified',
                    severity: report.severity ?? 'Medium',
                }))

                return {
                    documentId: inspection.documentId,
                    parcelDocumentId: parcel.documentId,
                    parcel_code: parcel.parcel_code,
                    barangay: barangayOf(parcel),
                    inspector: inspection.inspector ?? '',
                    date: inspection.date ?? null,
                    inspection_type:
                        inspection.inspection_type ?? 'Field Inspection',
                    riskLevel: worstSeverity(
                        findings.map((finding) => finding.severity)
                    ),
                    findings,
                    status: inspection.status ?? 'Pending',
                    gps_point: inspection.gps_point,
                    notes: inspection.notes ?? '',
                    photos: inspection.photos ?? [],
                }
            })
        )
    )

    /** Every parcel, for the inspection form's parcel selector. */
    const allParcels = computed<FarmParcel[]>(() => parcels.value)

    return { inspections, allParcels, loading, loadError, load }
}
