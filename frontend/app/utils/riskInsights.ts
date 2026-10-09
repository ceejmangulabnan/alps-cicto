import type {
    FarmParcel,
    LandStatus,
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
import {
    DEFAULT_RECOMMENDATION,
    RISK_PLAYBOOK,
    UNCLASSIFIED_RISK,
    normalizeRiskType,
} from '~/utils/riskTypes'

/**
 * The ALPS risk engine: folds risk reports — and the under-used land they do
 * not cover — into the insights the risk page and the dashboard both show.
 *
 * Pure on purpose. Both callers need the same rollups and a second copy of the
 * rules is a second thing to keep honest when the schema changes. Everything
 * here takes rows and returns rows, so neither caller has to own the fetch.
 *
 * The engine is declarative: which reports group together, how urgent a group
 * is and what to do about it are all data (`RISK_TYPE_RULES`, the scoring
 * signals, `RISK_PLAYBOOK`), not branches buried in a fold. The rule string on
 * each insight is assembled from the signals the scoring actually used, so the
 * card is an audit trail rather than a decoration.
 */

/** A risk report with the parcel and inspection context it was filed against. */
export interface RiskRow {
    documentId: string
    parcelDocumentId: string
    parcel_code: string
    barangay: string
    farmerName: string
    area: number
    landStatus: LandStatus
    /** The canonical (normalised) type, used for grouping. */
    riskType: string
    /** The officer's original wording, shown on the record. */
    rawRiskType: string
    severity: RiskSeverity
    parcelStatus: RiskParcelStatus
    observedAt: string | null
    /** The inspection this report was filed from, when there was one. */
    inspectionDocumentId: string | null
    inspectionDate: string | null
    inspectionType: string | null
    /** True when the report came from a field inspection rather than the form. */
    fromInspection: boolean
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

export type RiskPriority = 'High' | 'Medium' | 'Low'

export type InsightType = 'risk' | 'warning' | 'opportunity'

export interface AlpsInsight {
    /** Stable group key. */
    key: string
    type: InsightType
    priority: RiskPriority
    title: string
    description: string
    /** The predicate that grouped these records, shown verbatim. */
    rule: string
    affectedParcels: number
    affectedArea: number
    /** The 0–100 priority score, so the card can show the number behind the band. */
    potentialScore: string
    /** The signals the score was built from, worst first. */
    signals: string[]
    recommendation: string
    /** Reports per priority band, so the chart stacks off the same fold. */
    severityCounts: Record<RiskPriority, number>
    /** The open reports behind this insight, empty for an opportunity. */
    rows: RiskRow[]
    /** First affected parcel, so an opportunity card still has a View link. */
    parcelDocumentId: string | null
}

/** Worst first. */
export const SEVERITY_RANK: Record<RiskSeverity, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
}

const SEVERITY_ORDER: RiskSeverity[] = ['Critical', 'High', 'Medium', 'Low']

export const UNCLASSIFIED_RISK_TYPE = UNCLASSIFIED_RISK

export const NO_TENDEE = 'Unassigned'

export const round1 = (value: number): number => Math.round(value * 10) / 10

const plural = (count: number, word: string): string =>
    `${count} ${word}${count === 1 ? '' : 's'}`

export const worstSeverity = (severities: RiskSeverity[]): RiskSeverity =>
    severities.reduce(
        (worstSoFar, severity) =>
            SEVERITY_RANK[severity] > SEVERITY_RANK[worstSoFar]
                ? severity
                : worstSoFar,
        'Low'
    )

/** The priority band a report's own severity would earn, absent other signals. */
export const priorityOf = (severity: RiskSeverity): RiskPriority =>
    SEVERITY_RANK[severity] >= 4
        ? 'High'
        : severity === 'High'
          ? 'High'
          : severity === 'Medium'
            ? 'Medium'
            : 'Low'

/**
 * A report's type is grouped through the shared synonyms, so "flood" and
 * "waterlogging" become one insight while an unanticipated type keeps its own
 * wording.
 */
export function toRiskRows(parcels: FarmParcel[]): RiskRow[] {
    return parcels.flatMap((parcel) =>
        (parcel.risk_reports ?? []).map((report) => {
            const inspection = report.inspection ?? null
            const rawRiskType = report.risk_type?.trim() || UNCLASSIFIED_RISK

            return {
                documentId: report.documentId,
                parcelDocumentId: parcel.documentId,
                parcel_code: parcel.parcel_code,
                barangay: parcel.farm?.barangay?.name ?? '',
                farmerName: parcel.farmers?.[0]?.name ?? NO_TENDEE,
                area: parcel.area_hectares,
                landStatus: parcel.land_status,
                riskType: normalizeRiskType(rawRiskType),
                rawRiskType,
                severity: report.severity ?? 'Medium',
                parcelStatus: report.parcel_status ?? 'Active',
                observedAt: report.observed_at ?? null,
                inspectionDocumentId: inspection?.documentId ?? null,
                inspectionDate: inspection?.date ?? null,
                inspectionType: inspection?.inspection_type ?? null,
                fromInspection: Boolean(inspection),
            }
        })
    )
}

/**
 * Reports still in play. Resolved ones drop out, which is what makes a count of
 * these an "active" figure rather than a lifetime tally.
 */
export const openRiskRows = (rows: RiskRow[]): RiskRow[] =>
    rows.filter((row) => row.parcelStatus !== 'Resolved')

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/**
 * The multi-signal priority score. Every term is additive and visible in the
 * `signals` list, so two officers looking at the same card can see why it
 * outranks its neighbour. Severity sets the floor; how many parcels share the
 * problem, whether any are still Active, and how recently it was seen move it
 * from there.
 */
interface ScoreInput {
    severities: RiskSeverity[]
    parcelCount: number
    activeCount: number
    monitoringCount: number
    latestObservedAt: string | null
}

interface ScoreResult {
    score: number
    priority: RiskPriority
    signals: string[]
}

const SEVERITY_BASE: Record<RiskSeverity, number> = {
    Critical: 45,
    High: 34,
    Medium: 20,
    Low: 10,
}

const DAY_MS = 86_400_000

const daysSince = (date: string | null): number | null => {
    if (!date) return null
    const then = Date.parse(`${date}T00:00:00`)
    if (!Number.isFinite(then)) return null
    return Math.max(0, Math.round((Date.now() - then) / DAY_MS))
}

const bandOf = (score: number): RiskPriority =>
    score >= 55 ? 'High' : score >= 30 ? 'Medium' : 'Low'

const scoreRisk = ({
    severities,
    parcelCount,
    activeCount,
    monitoringCount,
    latestObservedAt,
}: ScoreInput): ScoreResult => {
    const worst = worstSeverity(severities)
    const signals = [`worst severity ${worst}`]
    let score = SEVERITY_BASE[worst]

    const spread = Math.min(20, parcelCount * 4)
    if (spread > 0) {
        score += spread
        signals.push(plural(parcelCount, 'parcel'))
    }

    if (activeCount > 0) {
        score += 10
        signals.push(`${plural(activeCount, 'active report')}`)
    }
    if (monitoringCount > 0) {
        signals.push(`${plural(monitoringCount, 'monitoring report')}`)
    }

    const age = daysSince(latestObservedAt)
    if (age !== null && age <= 30) {
        score += 8
        signals.push(`seen ${age === 0 ? 'today' : `${age}d ago`}`)
    } else if (age !== null && age <= 90) {
        score += 4
        signals.push(`seen ${age}d ago`)
    }

    const capped = Math.min(100, score)
    return { score: capped, priority: bandOf(capped), signals }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

/** The distinct parcels behind a set of rows, so area is never double-counted. */
const distinctParcels = (rows: RiskRow[]) =>
    new Map(rows.map((row) => [row.parcelDocumentId, row]))

/** A declarative predicate assembled from the signals the rule actually used. */
const ruleFor = (label: string, severities: RiskSeverity[]): string => {
    const present = SEVERITY_ORDER.filter((severity) =>
        severities.includes(severity)
    )
    const severityList = present.map((severity) => `"${severity}"`).join(', ')
    return `risk_type ~ "${label}" AND severity IN (${severityList}) AND parcel_status IN ("Active", "Monitoring")`
}

/* ------------------------------------------------------------------ */
/* Risk insights                                                       */
/* ------------------------------------------------------------------ */

/**
 * ALPS risk insights, one per normalised `risk_type` across the open reports.
 * Derived rather than stored: the insight is a rollup of the reports filed
 * under that type, so it cannot drift out of sync with the records.
 */
export function foldInsights(rows: RiskRow[]): AlpsInsight[] {
    const groups = new Map<string, RiskRow[]>()
    for (const row of rows) {
        const key = row.riskType.toLowerCase()
        const bucket = groups.get(key)
        if (bucket) bucket.push(row)
        else groups.set(key, [row])
    }

    return [...groups.values()].map((group): AlpsInsight => {
        const label = group[0]!.riskType
        const severities = group.map((row) => row.severity)
        const counts = STATUS_COUNTS(group)
        const parcels = distinctParcels(group)

        const { score, priority, signals } = scoreRisk({
            severities,
            parcelCount: parcels.size,
            activeCount: counts.Active,
            monitoringCount: counts.Monitoring,
            latestObservedAt: [...group]
                .map((row) => row.observedAt ?? '')
                .sort()
                .at(-1) || null,
        })

        const affectedArea = round1(
            [...parcels.values()].reduce((sum, row) => sum + row.area, 0)
        )

        const description = [
            plural(parcels.size, 'parcel'),
            `across ${whereSentence(group.map((row) => row.barangay))}`,
            `${plural(counts.Active, 'active')}, ${plural(counts.Monitoring, 'monitoring')} report.`,
        ].join(' · ')

        const advice = RISK_PLAYBOOK[label] ?? DEFAULT_RECOMMENDATION
        const recommendation =
            counts.Active > 0
                ? `${advice} ${plural(counts.Active, 'parcel')} still Active — act within 7 days.`
                : `${advice} ${plural(counts.Monitoring, 'parcel')} under Monitoring — schedule the next validation this month.`

        return {
            key: label.toLowerCase(),
            // The opportunity arm is the only source of `opportunity`, so a
            // low-severity risk group stays a warning rather than pretending to
            // be an opening.
            type: priority === 'High' ? 'risk' : 'warning',
            priority,
            title: label,
            description,
            rule: ruleFor(label, severities),
            affectedParcels: parcels.size,
            affectedArea,
            potentialScore: `${score}/100`,
            signals,
            recommendation,
            severityCounts: {
                High: group.filter((row) => priorityOf(row.severity) === 'High')
                    .length,
                Medium: group.filter(
                    (row) => priorityOf(row.severity) === 'Medium'
                ).length,
                Low: group.filter((row) => priorityOf(row.severity) === 'Low')
                    .length,
            },
            // Worst first, then most recent; an undated report sorts last rather
            // than crashing on the null.
            rows: [...group].sort(
                (a, b) =>
                    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
                    (b.observedAt ?? '').localeCompare(a.observedAt ?? '')
            ),
            parcelDocumentId: group[0]!.parcelDocumentId,
        }
    })
}

/* ------------------------------------------------------------------ */
/* Opportunity arm                                                     */
/* ------------------------------------------------------------------ */

/** The land statuses the opportunity arm looks at; `At Risk` is a risk, not one. */
const OPPORTUNITY_STATUSES: LandStatus[] = ['Idle', 'Fallow']

const OPPORTUNITY_MIN_AREA = 0.5

interface OpportunityDef {
    status: LandStatus
    title: string
    recommendation: string
}

const OPPORTUNITIES: OpportunityDef[] = [
    {
        status: 'Idle',
        title: 'Idle Land Reactivation',
        recommendation:
            'Prioritise the largest idle parcels for soil testing, then draw up a reactivation plan before the planting window.',
    },
    {
        status: 'Fallow',
        title: 'Fallow Land Rotation',
        recommendation:
            'Return fallow parcels to rotation with a legume or cover crop to rebuild nitrogen and break pest cycles.',
    },
]

/**
 * The opportunity arm: unworked ground that could be brought back into use.
 *
 * Scope is deliberately narrow — idle or fallow, no current cycle, above a
 * minimum area, and carrying no open report. An `At Risk` parcel is already a
 * risk insight, so folding it in here would double-count it and blur the line
 * between a problem and an opening.
 */
export function foldOpportunities(parcels: FarmParcel[]): AlpsInsight[] {
    const eligible = parcels.filter((parcel) => {
        if (!OPPORTUNITY_STATUSES.includes(parcel.land_status)) return false
        if (parcel.planting_cycle) return false
        if (Number(parcel.area_hectares) <= OPPORTUNITY_MIN_AREA) return false

        const hasOpenReport = (parcel.risk_reports ?? []).some(
            (report) => (report.parcel_status ?? 'Active') !== 'Resolved'
        )
        return !hasOpenReport
    })

    return OPPORTUNITIES.flatMap((definition) => {
        const matches = eligible.filter(
            (parcel) => parcel.land_status === definition.status
        )
        if (matches.length === 0) return []

        const area = round1(
            matches.reduce(
                (sum, parcel) => sum + Number(parcel.area_hectares || 0),
                0
            )
        )
        const score = Math.min(
            100,
            Math.round(area * 6 + matches.length * 4)
        )
        const priority = bandOf(score)

        const barangays = matches.map(
            (parcel) => parcel.farm?.barangay?.name ?? ''
        )

        return [
            {
                key: `opportunity:${definition.status.toLowerCase()}`,
                type: 'opportunity' as InsightType,
                priority,
                title: definition.title,
                description: [
                    plural(matches.length, 'parcel'),
                    `across ${whereSentence(barangays)}`,
                    `${area} ha available`,
                ].join(' · '),
                rule: `land_status = "${definition.status}" AND planting_cycle IS NULL AND area_hectares > ${OPPORTUNITY_MIN_AREA}`,
                affectedParcels: matches.length,
                affectedArea: area,
                potentialScore: `${score}/100`,
                signals: [`${area} ha available`, plural(matches.length, 'parcel')],
                recommendation: definition.recommendation,
                severityCounts: { High: 0, Medium: 0, Low: 0 },
                rows: [],
                parcelDocumentId: matches[0]!.documentId,
            },
        ]
    })
}

/* ------------------------------------------------------------------ */
/* At-risk parcels                                                     */
/* ------------------------------------------------------------------ */

/**
 * Parcels still carrying an open report, worst first. One entry per parcel
 * however many reports it has, since the card is about the parcel.
 */
export function foldAtRiskParcels(rows: RiskRow[]): AtRiskParcel[] {
    const byParcel = new Map<string, RiskRow[]>()
    for (const row of rows) {
        const bucket = byParcel.get(row.parcelDocumentId)
        if (bucket) bucket.push(row)
        else byParcel.set(row.parcelDocumentId, [row])
    }

    return [...byParcel.values()]
        .map((group): AtRiskParcel => {
            const first = group[0]!
            return {
                parcelDocumentId: first.parcelDocumentId,
                parcel_code: first.parcel_code,
                farmerName: first.farmerName,
                barangay: first.barangay,
                area: first.area,
                landStatus: first.landStatus,
                severity: worstSeverity(group.map((row) => row.severity)),
                openReports: group.length,
            }
        })
        .sort(
            (a, b) =>
                SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
                b.area - a.area
        )
}
