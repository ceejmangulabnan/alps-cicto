import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type { Farmer } from '~/composables/useFarmersApi'
import {
    BARANGAY_LIMIT,
    HARVEST_WINDOW_MONTHS,
    REPORT_CATEGORIES,
    areaOf,
    buildReportDatasets,
    foldBarangayArea,
    foldLandStatus,
    foldMonthlyProduction,
    type AssistanceLedgerRow,
    type ReportCategory,
} from '~/utils/analytics'
import { trailingMonths } from '~/utils/monthWindow'
import { round1 } from '~/utils/riskInsights'
import {
    toLoadError,
    type LoadError,
    type LoadErrorSubject,
} from '~/utils/loadError'

/**
 * Everything the reports page shows, derived from the registries.
 *
 * As on the dashboard, nothing here is typed in by hand: each figure is summed
 * or counted off a real record, so an export and the chart beside it cannot
 * disagree. One parcel request carries the land, crop, harvest, risk and
 * inspection relations; the farmer roster and the assistance ledger arrive as
 * separate requests because they are separate content types and are not
 * reachable through a parcel.
 */

/**
 * Spelled out per consumer, for the same reason `DASHBOARD_POPULATE` is: the
 * reports page needs every relation the six exports are built from, and none
 * beyond them. Inspections come along without their photos — the export centre
 * carries no images, and fetching the media would multiply the payload for
 * nothing.
 */
const REPORTS_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'planting_cycle',
    'planting_cycle.crop',
    'planting_cycle.harvests',
    'risk_reports',
    'inspections',
]

const REPORTS_SUBJECT: LoadErrorSubject = {
    name: 'report figures',
    contentType: 'farm-parcel',
}

/** Barangays drawn on the comparison chart. */
const BARANGAYS_SHOWN = BARANGAY_LIMIT

/** Trailing months on the production chart. */
const PRODUCTION_WINDOW_MONTHS = HARVEST_WINDOW_MONTHS

export const useReportAnalytics = () => {
    const parcels = ref<FarmParcel[]>([])
    const farmers = ref<Farmer[]>([])
    const assistance = ref<AssistanceLedgerRow[]>([])
    const loading = ref(false)
    const loadError = ref<LoadError | null>(null)

    /**
     * Re-reads all three registries. They are independent content types, so
     * there is nothing to sequence: one failure surfaces as one banner rather
     * than as a partly filled page.
     */
    const load = async (): Promise<void> => {
        loading.value = true
        loadError.value = null
        try {
            const { getAll: getParcels } = useFarmParcelApi()
            const { getAll: getFarmers } = useFarmersApi()
            const { getAll: getAssistance } = useAssistanceApi()

            const [parcelResponse, farmerResponse, assistanceResponse] =
                await Promise.all([
                    getParcels({ populate: REPORTS_POPULATE }),
                    getFarmers(),
                    getAssistance({ sort: 'date:desc' }),
                ])

            parcels.value = parcelResponse.data
            farmers.value = farmerResponse.data
            assistance.value = assistanceResponse.data.map((row) => ({
                reference_code: row.reference_code,
                program: row.program,
                recipient: row.farmer?.name?.trim() ?? '',
                farmer_code: row.farmer?.farmer_code?.trim() ?? '',
                barangay: row.barangay?.name?.trim() ?? '',
                items: row.items?.trim() ?? '',
                value: Number(row.value) || 0,
                date: row.date ?? null,
                status: row.status ?? '',
            }))
        } catch (value: unknown) {
            loadError.value = toLoadError(value, REPORTS_SUBJECT)
        } finally {
            loading.value = false
        }
    }

    /* ------------------------------------------------------------------ */
    /* Land                                                                */
    /* ------------------------------------------------------------------ */

    const totalArea = computed(() =>
        round1(parcels.value.reduce((sum, parcel) => sum + areaOf(parcel), 0))
    )

    const landStatusSlices = computed(() => foldLandStatus(parcels.value))

    /** Classified hectares, and the share of them in active cultivation. */
    const landStatusTotals = computed(() => {
        const classified = round1(
            landStatusSlices.value.reduce((sum, slice) => sum + slice.area, 0)
        )
        const cultivated =
            landStatusSlices.value.find((slice) => slice.name === 'Cultivated')
                ?.area ?? 0

        return {
            classified,
            cultivated,
            cultivatedPct:
                classified > 0 ? Math.round((cultivated / classified) * 100) : 0,
        }
    })

    /* ------------------------------------------------------------------ */
    /* Barangay comparison                                                 */
    /* ------------------------------------------------------------------ */

    const barangayRows = computed(() =>
        foldBarangayArea(parcels.value, BARANGAYS_SHOWN)
    )

    /** Distinct barangays on the registry, including any trimmed off the chart. */
    const barangayCount = computed(
        () => new Set(parcels.value.map((parcel) => parcel.farm?.barangay?.name)).size
    )

    /** The barangay with the most hectares under cultivation. */
    const leadingBarangay = computed(() =>
        [...barangayRows.value].sort(
            (a, b) => b.cultivated - a.cultivated || b.area - a.area
        )[0]
    )

    /* ------------------------------------------------------------------ */
    /* Production                                                          */
    /* ------------------------------------------------------------------ */

    const productionWindow = computed(() =>
        trailingMonths(PRODUCTION_WINDOW_MONTHS, new Date())
    )

    const monthlyProduction = computed(() =>
        foldMonthlyProduction(parcels.value, productionWindow.value)
    )

    /* ------------------------------------------------------------------ */
    /* Export centre                                                       */
    /* ------------------------------------------------------------------ */

    const datasets = computed(() =>
        buildReportDatasets({
            parcels: parcels.value,
            farmers: farmers.value,
            assistance: assistance.value,
        })
    )

    /**
     * The filter chips, taken from the datasets that actually have rows. A
     * category with nothing behind it would offer a filter that can only ever
     * return an empty list.
     */
    const categories = computed<ReportCategory[]>(() => {
        const present = new Set(datasets.value.map((dataset) => dataset.category))
        return REPORT_CATEGORIES.filter((category) => present.has(category))
    })

    const rowTotal = computed(() =>
        datasets.value.reduce((sum, dataset) => sum + dataset.rows.length, 0)
    )

    return {
        load,
        loading,
        loadError,

        /* headline counters */
        parcels,
        parcelCount: computed(() => parcels.value.length),
        totalArea,

        /* charts */
        landStatusSlices,
        landStatusTotals,
        barangayRows,
        barangayCount,
        leadingBarangay,
        monthlyProduction,
        productionWindowMonths: PRODUCTION_WINDOW_MONTHS,

        /* export centre */
        datasets,
        categories,
        rowTotal,
    }
}
