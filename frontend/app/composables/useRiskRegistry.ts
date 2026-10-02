import type {
    FarmParcel,
    LandStatus,
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
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
 * A risk report as the risk page needs it. Reports hang off parcels
 * (manyToOne, several per parcel), so each row carries the parcel context it was
 * filed against — code, barangay, tendee and area — exactly the way the
 * inspection registry does for inspections.
 */
export interface RiskRow {
    documentId: string
    parcelDocumentId: string
    parcel_code: string
    barangay: string
    farmerName: string
    area: number
    landStatus: LandStatus
    riskType: string
    severity: RiskSeverity
    parcelStatus: RiskParcelStatus
    observedAt: string | null
}

/** A parcel carrying at least one report that has not been resolved yet. */
export interface AtRiskParcel {
    parcelDocumentId: string
    parcel_code: string
    farmerName: string
    barangay: string
    area: number
    landStatus: LandStatus
    /** The worst severity among the parcel's open reports. */
    severity: RiskSeverity
    openReports: number
}

/**
 * `risk-report.severity` carries a fourth level, Critical, that this content
 * has no separate colour for. It folds into High for both the priority band and
 * the chart stacks, so the two can never disagree about how bad something is.
 */
export type RiskPriority = 'High' | 'Medium' | 'Low'

export type InsightType = 'risk' | 'warning' | 'opportunity'

export interface AlpsInsight {
    /** Stable group key, also the `risk_type` the reports were filed under. */
    key: string
    type: InsightType
    priority: RiskPriority
    title: string
    description: string
    /** The predicate that grouped these reports, shown verbatim as an audit trail. */
    rule: string
    affectedParcels: number
    affectedArea: number
    potentialScore: string
    recommendation: string
    /** Reports per priority band, so the chart stacks off the same fold. */
    severityCounts: Record<RiskPriority, number>
    /** The open reports behind this insight, so a card can drive the table. */
    rows: RiskRow[]
}

const RISK_POPULATE = ['farm', 'farm.barangay', 'farmers', 'risk_reports']

/** Worst first. Critical and High share a rank because they share a band. */
const SEVERITY_RANK: Record<RiskSeverity, number> = {
    Critical: 3,
    High: 3,
    Medium: 2,
    Low: 1,
}

const SEVERITY_ORDER: RiskSeverity[] = ['Critical', 'High', 'Medium', 'Low']

const UNCLASSIFIED = 'Unclassified'

const round1 = (value: number): number => Math.round(value * 10) / 10

const plural = (count: number, word: string): string =>
    `${count} ${word}${count === 1 ? '' : 's'}`

const worst = (severities: RiskSeverity[]): RiskSeverity =>
    severities.reduce(
        (worstSoFar, severity) =>
            SEVERITY_RANK[severity] > SEVERITY_RANK[worstSoFar]
                ? severity
                : worstSoFar,
        'Low'
    )

const priorityOf = (severity: RiskSeverity): RiskPriority =>
    SEVERITY_RANK[severity] >= 3 ? 'High' : severity === 'Medium' ? 'Medium' : 'Low'

/** Mirrors the three chips the page has always shown for an insight. */
const TYPE_OF_PRIORITY: Record<RiskPriority, InsightType> = {
    High: 'risk',
    Medium: 'warning',
    Low: 'opportunity',
}

const STATUS_COUNTS = (rows: RiskRow[]): Record<RiskParcelStatus, number> => ({
    Active: rows.filter((row) => row.parcelStatus === 'Active').length,
    Monitoring: rows.filter((row) => row.parcelStatus === 'Monitoring').length,
    Resolved: rows.filter((row) => row.parcelStatus === 'Resolved').length,
})

/**
 * Names up to three barangays, then summarises the rest. A group spanning eight
 * barangays should not push the sentence off the card.
 */
const whereSentence = (barangays: string[]): string => {
    const unique = [...new Set(barangays.filter(Boolean))]
    if (unique.length === 0) return 'no barangay recorded'
    if (unique.length <= 3) {
        return unique.length === 1
            ? unique[0]!
            : `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`
    }
    return `${unique.slice(0, 3).join(', ')} and ${unique.length - 3} more`
}

/** "2 critical · 3 high · 1 medium", skipping the levels the group never saw. */
const severityMix = (severities: RiskSeverity[]): string => {
    const present = SEVERITY_ORDER.filter((severity) =>
        severities.includes(severity)
    )
    if (present.length === 0) return 'no severity recorded'
    return present
        .map(
            (severity) =>
                `${plural(severities.filter((s) => s === severity).length, severity.toLowerCase())}`
        )
        .join(' · ')
}

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
    const riskReports = computed<RiskRow[]>(() =>
        parcels.value.flatMap((parcel) =>
            (parcel.risk_reports ?? []).map((report) => ({
                documentId: report.documentId,
                parcelDocumentId: parcel.documentId,
                parcel_code: parcel.parcel_code,
                barangay: parcel.farm?.barangay?.name ?? '',
                farmerName: parcel.farmers?.[0]?.name ?? 'Unassigned',
                area: parcel.area_hectares,
                landStatus: parcel.land_status,
                riskType: report.risk_type?.trim() || UNCLASSIFIED,
                severity: report.severity ?? 'Medium',
                parcelStatus: report.parcel_status ?? 'Active',
                observedAt: report.observed_at ?? null,
            }))
        )
    )

    const openReports = computed<RiskRow[]>(() =>
        riskReports.value.filter((row) => row.parcelStatus !== 'Resolved')
    )

    /**
     * ALPS insights, one per `risk_type` across the open reports.
     *
     * Derived rather than stored: the insight is a rollup of the reports filed
     * under that risk type, so it cannot drift out of sync with the records the
     * same page lets you edit. Resolved reports drop out, which is what makes
     * the count an "active" figure rather than a lifetime tally.
     */
    const insights = computed<AlpsInsight[]>(() => {
        const groups = new Map<string, RiskRow[]>()
        for (const row of openReports.value) {
            const key = row.riskType.toLowerCase()
            const bucket = groups.get(key)
            if (bucket) bucket.push(row)
            else groups.set(key, [row])
        }

        return [...groups.values()].map((rows): AlpsInsight => {
            const label = rows[0]!.riskType
            const severities = rows.map((row) => row.severity)
            const priority = priorityOf(worst(severities))
            const counts = STATUS_COUNTS(rows)

            // A parcel can carry more than one report under the same risk type,
            // so area and parcel count are taken over distinct parcels — summing
            // per report would double-count the hectares.
            const distinctParcels = new Map(rows.map((row) => [row.parcelDocumentId, row]))
            const affectedArea = round1(
                [...distinctParcels.values()].reduce((sum, row) => sum + row.area, 0)
            )

            const description = [
                plural(distinctParcels.size, 'parcel'),
                `across ${whereSentence(rows.map((row) => row.barangay))}`,
                `${plural(counts.Active, 'active')}, ${plural(counts.Monitoring, 'monitoring')} report.`,
            ].join(' · ')

            const recommendation =
                counts.Active > 0
                    ? `${plural(counts.Active, 'parcel')} still Active — dispatch a field team and confirm the mitigations within 7 days.`
                    : `${plural(counts.Monitoring, 'parcel')} under Monitoring — schedule the next validation before the month ends.`

            return {
                key: label.toLowerCase(),
                type: TYPE_OF_PRIORITY[priority],
                priority,
                title: label,
                description,
                rule: `risk_type = "${label}" AND parcel_status IN ("Active", "Monitoring")`,
                affectedParcels: distinctParcels.size,
                affectedArea,
                potentialScore: severityMix(severities),
                recommendation,
                severityCounts: {
                    High: rows.filter(
                        (row) => priorityOf(row.severity) === 'High'
                    ).length,
                    Medium: rows.filter(
                        (row) => priorityOf(row.severity) === 'Medium'
                    ).length,
                    Low: rows.filter((row) => priorityOf(row.severity) === 'Low')
                        .length,
                },
                // Latest first, with an undated report sorted last rather than
                // crashing on the null — the schema allows observed_at to be
                // absent on older rows.
                rows: [...rows].sort(
                    (a, b) =>
                        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
                        (b.observedAt ?? '').localeCompare(a.observedAt ?? '')
                ),
            }
        })
    })

    /**
     * Parcels still carrying an open report, worst first. One entry per parcel
     * however many reports it has, since the card is about the parcel.
     */
    const atRiskParcels = computed<AtRiskParcel[]>(() => {
        const byParcel = new Map<string, RiskRow[]>()
        for (const row of openReports.value) {
            const bucket = byParcel.get(row.parcelDocumentId)
            if (bucket) bucket.push(row)
            else byParcel.set(row.parcelDocumentId, [row])
        }

        return [...byParcel.values()]
            .map((rows): AtRiskParcel => {
                const first = rows[0]!
                return {
                    parcelDocumentId: first.parcelDocumentId,
                    parcel_code: first.parcel_code,
                    farmerName: first.farmerName,
                    barangay: first.barangay,
                    area: first.area,
                    landStatus: first.landStatus,
                    severity: worst(rows.map((row) => row.severity)),
                    openReports: rows.length,
                }
            })
            .sort(
                (a, b) =>
                    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
                    b.area - a.area
            )
    })

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