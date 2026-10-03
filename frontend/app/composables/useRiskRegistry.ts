import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type {
    AlpsInsight,
    AtRiskParcel,
    RiskRow,
} from '~/utils/riskInsights'
import {
    foldAtRiskParcels,
    foldInsights,
    openRiskRows,
    toRiskRows,
} from '~/utils/riskInsights'
import {
    toLoadError,
    type LoadError,
    type LoadErrorSubject,
} from '~/utils/loadError'

const RISK_SUBJECT: LoadErrorSubject = {
    name: 'risk reports',
    contentType: 'risk-report',
}

const RISK_POPULATE = ['farm', 'farm.barangay', 'farmers', 'risk_reports']

/**
 * Reads risk reports through the parcel hub and folds them into the rollups the
 * risk page and the dashboard both show. The folding itself lives in
 * `~/utils/riskInsights` so the two pages cannot drift apart on what "high
 * priority" or "at risk" means.
 */
export const useRiskRegistry = () => {
    const parcels = ref<FarmParcel[]>([])
    const loading = ref(false)
    const loadError = ref<LoadError | null>(null)

    /** Re-reads the parcel list wholesale; cheap at dev data sizes. */
    const load = async (): Promise<void> => {
        loading.value = true
        loadError.value = null
        try {
            const { getAll } = useFarmParcelApi()
            const response = await getAll({ populate: RISK_POPULATE })
            parcels.value = response.data
        } catch (value: unknown) {
            loadError.value = toLoadError(value, RISK_SUBJECT)
        } finally {
            loading.value = false
        }
    }

    /** Every report across every parcel, flattened out of the parcel hub. */
    const riskReports = computed<RiskRow[]>(() => toRiskRows(parcels.value))

    /** Reports still in play; Resolved ones drop out. */
    const openReports = computed<RiskRow[]>(() => openRiskRows(riskReports.value))

    /** One insight per `risk_type` across the open reports. */
    const insights = computed<AlpsInsight[]>(() => foldInsights(openReports.value))

    /** Parcels still carrying an open report, worst first. */
    const atRiskParcels = computed<AtRiskParcel[]>(() =>
        foldAtRiskParcels(openReports.value)
    )

    /** Every parcel, for the report form's parcel selector. */
    const allParcels = computed<FarmParcel[]>(() => parcels.value)

    /** Risk types already in use, so the form can suggest what the LGU files. */
    const knownRiskTypes = computed<string[]>(() =>
        [...new Set(riskReports.value.map((row) => row.riskType))].sort((a, b) =>
            a.localeCompare(b)
        )
    )

    return {
        riskReports,
        openReports,
        insights,
        atRiskParcels,
        allParcels,
        knownRiskTypes,
        loading,
        loadError,
        load,
    }
}
