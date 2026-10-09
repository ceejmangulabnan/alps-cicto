import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type {
    AlpsInsight,
    AtRiskParcel,
    RiskPriority,
    RiskRow,
} from '~/utils/riskInsights'
import {
    foldAtRiskParcels,
    foldInsights,
    foldOpportunities,
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

/**
 * The inspection relation has to come along: a report filed from a finding is
 * the same row as any other here, but the table marks its source and the form
 * guards its delete on where it came from.
 */
const RISK_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'planting_cycle',
    'risk_reports',
    'risk_reports.inspection',
]

/** Most urgent first, for the merged insight list. */
const PRIORITY_RANK: Record<RiskPriority, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
}

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
    const openReports = computed<RiskRow[]>(() =>
        openRiskRows(riskReports.value)
    )

    /** One insight per normalised `risk_type` across the open reports. */
    const reportInsights = computed<AlpsInsight[]>(() =>
        foldInsights(openReports.value)
    )

    /** Unworked idle/fallow ground that could be brought back into use. */
    const opportunities = computed<AlpsInsight[]>(() =>
        foldOpportunities(parcels.value)
    )

    /**
     * Everything the insights section shows, most urgent first. Findings and
     * opportunities are folded separately because they answer different
     * questions, then merged so the page has one ranked list.
     */
    const insights = computed<AlpsInsight[]>(() =>
        [...reportInsights.value, ...opportunities.value].sort(
            (a, b) =>
                PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
                b.affectedArea - a.affectedArea
        )
    )

    /** Parcels still carrying an open report, worst first. */
    const atRiskParcels = computed<AtRiskParcel[]>(() =>
        foldAtRiskParcels(openReports.value)
    )

    /** Every parcel, for the report form's parcel selector. */
    const allParcels = computed<FarmParcel[]>(() => parcels.value)

    /** Risk types already in use, so the form can suggest what the LGU files. */
    const knownRiskTypes = computed<string[]>(() =>
        [...new Set(riskReports.value.map((row) => row.riskType))].sort(
            (a, b) => a.localeCompare(b)
        )
    )

    return {
        riskReports,
        openReports,
        reportInsights,
        opportunities,
        insights,
        atRiskParcels,
        allParcels,
        knownRiskTypes,
        loading,
        loadError,
        load,
    }
}
