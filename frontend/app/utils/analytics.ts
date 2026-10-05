import type {
    FarmParcel,
    LandStatus,
    ParcelHarvest,
} from '~/composables/useFarmParcelApi'
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'
import type { Farmer } from '~/composables/useFarmersApi'
import type { CsvColumn, CsvTable } from '~/utils/csv'
import { STATUS_COLOR, STATUS_COLOR_FALLBACK } from '~/utils/landStatus'
import {
    monthKeyOf,
    parseDateOnly,
    type MonthWindow,
} from '~/utils/monthWindow'
import { round1, toRiskRows } from '~/utils/riskInsights'

/**
 * The rollups behind the dashboard and the reports page.
 *
 * Pure functions over rows, no fetching: the pages own the request and these
 * own the arithmetic. The land-status and barangay folds are here rather than in
 * either composable because both pages draw the same two charts — a second copy
 * of them would be a second thing to keep honest when a status or a relation
 * changes. The production fold and the export datasets exist for the reports
 * page alone.
 */

export const UNASSIGNED_BARANGAY = 'Unassigned'
export const UNSPECIFIED_CROP = 'Unspecified'

/** The tail bucket on a ranked series, and the colour of "no data" cases. */
export const ROLLUP_LABEL = 'Others'
export const NEUTRAL_COLOR = '#94a3b8'

/**
 * Categorical palette for crop series and slices. `current_use` and crop names
 * are free text, so colours cannot be keyed off them the way land-status colours
 * are; these are assigned by rank instead, which keeps a given crop on the same
 * colour as long as it holds its position.
 */
export const CROP_COLORS = [
    '#16a34a',
    '#ca8a04',
    '#d97706',
    '#059669',
    '#0f766e',
    '#1d6fa4',
    '#7c3aed',
    '#b45309',
]

/** Crops drawn as their own line or slice; the rest fold into a single series. */
export const CROP_SERIES_LIMIT = 4

/** Barangays drawn on the comparison chart. */
export const BARANGAY_LIMIT = 9

/** Trailing months on the production chart. */
export const HARVEST_WINDOW_MONTHS = 12

/* ------------------------------------------------------------------ */
/* Reading a parcel                                                    */
/* ------------------------------------------------------------------ */

/** Hectares, tolerating a null or malformed number from the API. */
export const areaOf = (parcel: FarmParcel): number =>
    Number.isFinite(parcel.area_hectares) ? parcel.area_hectares : 0

export const barangayOf = (parcel: FarmParcel): string =>
    parcel.farm?.barangay?.name?.trim() || UNASSIGNED_BARANGAY

/** The farmers tending this parcel, as one cell for an exported table. */
export const tendeeNames = (parcel: FarmParcel): string =>
    (parcel.farmers ?? [])
        .map((farmer) => farmer.name?.trim())
        .filter((name): name is string => Boolean(name))
        .join(', ')

/**
 * The crop a parcel is planting, falling back to the free-text `current_use` so
 * a parcel that is being worked without a crop record still appears in the
 * distribution instead of silently vanishing.
 */
export const cropOf = (parcel: FarmParcel): string =>
    parcel.planting_cycle?.crop?.name?.trim() ||
    parcel.current_use?.trim() ||
    UNSPECIFIED_CROP

const numberOrNull = (value: unknown): number | null => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const averageOf = (values: number[]): number | null =>
    values.length > 0
        ? round1(values.reduce((sum, value) => sum + value, 0) / values.length)
        : null

/* ------------------------------------------------------------------ */
/* Land status                                                         */
/* ------------------------------------------------------------------ */

export interface LandStatusSlice {
    name: LandStatus
    area: number
    parcels: number
    /** Share of the classified area, one decimal. */
    share: number
    color: string
}

/**
 * Hectares per land status, in the order the statuses are declared so the pie
 * and its legend always read the same way. Colours come from the shared
 * land-status map, which the map and the parcel table also use.
 */
export function foldLandStatus(parcels: FarmParcel[]): LandStatusSlice[] {
    const totals = new Map<LandStatus, { area: number; parcels: number }>()
    for (const parcel of parcels) {
        const bucket = totals.get(parcel.land_status) ?? { area: 0, parcels: 0 }
        bucket.area = round1(bucket.area + areaOf(parcel))
        bucket.parcels += 1
        totals.set(parcel.land_status, bucket)
    }

    const total = round1(
        parcels.reduce((sum, parcel) => sum + areaOf(parcel), 0)
    )

    return LAND_STATUS_OPTIONS.flatMap((status) => {
        const bucket = totals.get(status)
        if (!bucket || bucket.parcels === 0) return []

        return [
            {
                name: status,
                area: bucket.area,
                parcels: bucket.parcels,
                share: total > 0 ? round1((bucket.area / total) * 100) : 0,
                color: STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK,
            },
        ]
    })
}

/* ------------------------------------------------------------------ */
/* Barangay comparison                                                 */
/* ------------------------------------------------------------------ */

export interface BarangayAreaRow {
    name: string
    area: number
    /** Of that area, the hectares on parcels marked Cultivated. */
    cultivated: number
    parcels: number
}

/**
 * Agricultural area per barangay, largest first. Capped at `limit` so the chart
 * stays readable; the page reports the covered share when it trims a tail.
 */
export function foldBarangayArea(
    parcels: FarmParcel[],
    limit = BARANGAY_LIMIT
): BarangayAreaRow[] {
    const totals = new Map<
        string,
        { area: number; cultivated: number; parcels: number }
    >()

    for (const parcel of parcels) {
        const name = barangayOf(parcel)
        const bucket = totals.get(name) ?? {
            area: 0,
            cultivated: 0,
            parcels: 0,
        }
        const area = areaOf(parcel)
        bucket.area = round1(bucket.area + area)
        bucket.parcels += 1
        if (parcel.land_status === 'Cultivated') {
            bucket.cultivated = round1(bucket.cultivated + area)
        }
        totals.set(name, bucket)
    }

    return [...totals.entries()]
        .map(([name, bucket]) => ({ name, ...bucket }))
        .sort((a, b) => b.area - a.area || a.name.localeCompare(b.name))
        .slice(0, limit)
}

/* ------------------------------------------------------------------ */
/* Production                                                          */
/* ------------------------------------------------------------------ */

export interface ProductionSeries {
    name: string
    color: string
    /** Kilograms per month, aligned to `MonthlyProduction.months`. */
    data: number[]
}

export interface MonthlyProduction {
    months: string[]
    series: ProductionSeries[]
    /** Kilograms harvested across the window. */
    total: number
    /** Harvest records dated inside the window. */
    records: number
    /**
     * Mean yield per hectare across those records, in kg/ha — the recorded
     * `yield_per_hectare` where the officer typed one, otherwise production
     * over the parcel's area, which is how the registry itself fills that field
     * in. Null when the window holds nothing to average.
     */
    averageYield: number | null
    /** The crop that carried the most kilograms over the window. */
    leadingCrop: string | null
    windowMonths: number
}

/**
 * Kilograms harvested per month, by crop, over the given month window.
 *
 * Only the parcel's *current* planting cycle is reached, so these are the
 * harvests of that one cycle — a parcel whose cycle has been replaced no longer
 * carries its earlier seasons' records. A harvest with no production figure is
 * an expected date rather than a delivery: it counts as a record, and can
 * contribute a yield, but it adds nothing to a month.
 */
export function foldMonthlyProduction(
    parcels: FarmParcel[],
    window: MonthWindow,
    limit = CROP_SERIES_LIMIT
): MonthlyProduction {
    const indexByKey = new Map(window.keys.map((key, index) => [key, index]))

    const byCrop = new Map<string, Map<number, number>>()
    const yields: number[] = []
    let records = 0
    let total = 0

    for (const parcel of parcels) {
        const cycle = parcel.planting_cycle
        if (!cycle) continue

        const crop = cropOf(parcel)
        const area = areaOf(parcel)

        for (const harvest of cycle.harvests ?? []) {
            const date = parseDateOnly(harvest.harvest_date)
            const index = date ? indexByKey.get(monthKeyOf(date)) : undefined
            if (index === undefined) continue

            records += 1

            const perHectare = yieldOf(harvest, area)
            if (perHectare !== null) yields.push(perHectare)

            const kg = numberOrNull(harvest.production_kg)
            if (kg === null) continue

            total = round1(total + kg)
            const months = byCrop.get(crop) ?? new Map<number, number>()
            months.set(index, (months.get(index) ?? 0) + kg)
            byCrop.set(crop, months)
        }
    }

    const ranked = [...byCrop.entries()]
        .map(([name, months]) => ({
            name,
            total: months.values().reduce((sum, value) => sum + value, 0),
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

    const head = ranked.slice(0, limit)
    const tail = ranked.slice(limit)
    const tailNames = new Set(tail.map((crop) => crop.name))

    const series: ProductionSeries[] = head.map((crop, index) => ({
        name: crop.name,
        color: CROP_COLORS[index % CROP_COLORS.length] ?? NEUTRAL_COLOR,
        data: window.keys.map((_, monthIndex) =>
            round1(byCrop.get(crop.name)?.get(monthIndex) ?? 0)
        ),
    }))

    if (tail.length > 0) {
        series.push({
            name: ROLLUP_LABEL,
            color: NEUTRAL_COLOR,
            data: window.keys.map((_, monthIndex) =>
                round1(
                    [...byCrop.entries()]
                        .filter(([name]) => tailNames.has(name))
                        .reduce(
                            (sum, [, months]) =>
                                sum + (months.get(monthIndex) ?? 0),
                            0
                        )
                )
            ),
        })
    }

    return {
        months: window.labels,
        series,
        total: round1(total),
        records,
        averageYield: averageOf(yields),
        leadingCrop: head[0]?.name ?? null,
        windowMonths: window.labels.length,
    }
}

/** kg/ha for one harvest, preferring what was recorded. */
const yieldOf = (harvest: ParcelHarvest, area: number): number | null => {
    const recorded = numberOrNull(harvest.yield_per_hectare)
    if (recorded !== null && recorded > 0) return recorded

    const kg = numberOrNull(harvest.production_kg)
    return kg !== null && area > 0 ? round1(kg / area) : null
}

/* ------------------------------------------------------------------ */
/* Export centre                                                       */
/* ------------------------------------------------------------------ */

export type ReportCategory =
    'Land Use' | 'Registry' | 'Production' | 'Risk' | 'Assistance'

/** Filter order on the export centre, so the chips never depend on row order. */
export const REPORT_CATEGORIES: ReportCategory[] = [
    'Land Use',
    'Registry',
    'Production',
    'Risk',
    'Assistance',
]

/**
 * One exportable report: its columns and its rows, ready for `toCsv`. A dataset
 * is built from the registry every time the page loads, which is what makes the
 * figures in the file agree with the charts on screen.
 */
export interface ReportDataset extends CsvTable {
    key: string
    title: string
    category: ReportCategory
    /** Shown beside the title, so the officer knows what the file holds. */
    description: string
    /** The most recent date any row carries; null when the rows are undated. */
    latest: string | null
}

/** An assistance release, flattened far enough to export it. */
export interface AssistanceLedgerRow {
    reference_code: string
    program: string
    recipient: string
    farmer_code: string
    barangay: string
    items: string
    value: number
    date: string | null
    status: string
}

export interface ReportSource {
    parcels: FarmParcel[]
    farmers: Farmer[]
    assistance: AssistanceLedgerRow[]
}

const LAND_STATUS_COLUMNS: CsvColumn[] = [
    { key: 'parcel_code', label: 'Parcel Code' },
    { key: 'land_status', label: 'Land Status' },
    { key: 'current_use', label: 'Current Use' },
    { key: 'area_hectares', label: 'Area (ha)' },
    { key: 'farm', label: 'Farm' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'farmers', label: 'Farmers' },
]

const FARMER_COLUMNS: CsvColumn[] = [
    { key: 'farmer_code', label: 'Farmer Code' },
    { key: 'name', label: 'Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'farmer_status', label: 'Status' },
]

const HARVEST_COLUMNS: CsvColumn[] = [
    { key: 'parcel_code', label: 'Parcel Code' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'farmers', label: 'Farmers' },
    { key: 'crop', label: 'Crop' },
    { key: 'variety', label: 'Variety' },
    { key: 'harvest_date', label: 'Harvest Date' },
    { key: 'area_hectares', label: 'Area (ha)' },
    { key: 'production_kg', label: 'Production (kg)' },
    { key: 'yield_kg_per_hectare', label: 'Yield (kg/ha)' },
]

const RISK_COLUMNS: CsvColumn[] = [
    { key: 'parcel_code', label: 'Parcel Code' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'farmers', label: 'Farmers' },
    { key: 'risk_type', label: 'Risk Type' },
    { key: 'severity', label: 'Severity' },
    { key: 'parcel_status', label: 'Parcel Status' },
    { key: 'observed_at', label: 'Observed At' },
    { key: 'area_hectares', label: 'Area (ha)' },
]

const INSPECTION_COLUMNS: CsvColumn[] = [
    { key: 'parcel_code', label: 'Parcel Code' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'inspection_type', label: 'Inspection Type' },
    { key: 'inspector', label: 'Inspector' },
    { key: 'date', label: 'Date' },
    { key: 'risk_level', label: 'Risk Level' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
]

const ASSISTANCE_COLUMNS: CsvColumn[] = [
    { key: 'reference_code', label: 'Reference' },
    { key: 'date', label: 'Date' },
    { key: 'program', label: 'Program' },
    { key: 'recipient', label: 'Recipient' },
    { key: 'farmer_code', label: 'Farmer Code' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'items', label: 'Items' },
    { key: 'value', label: 'Value' },
    { key: 'status', label: 'Status' },
]

/**
 * The most recent of a set of date-only strings, or null when none is dated.
 * ISO dates sort as text, so no Date objects are needed and an undated row
 * simply drops out.
 */
const latestOf = (dates: (string | null | undefined)[]): string | null => {
    const present = dates.filter((date): date is string => Boolean(date))
    return present.length > 0 ? (present.sort().at(-1) ?? null) : null
}

/**
 * The export centre: one dataset per registry, each a straight copy of the rows
 * the corresponding page shows. Nothing is filtered by date or status — a
 * report of a registry is the whole registry — and the row count on each entry
 * is therefore the number of lines the file will contain.
 *
 * Note the limit of the harvest and risk rows: both hang off a parcel's current
 * relations, so a parcel that has been re-cycled or re-filed no longer carries
 * its earlier history here. The harvests page and the risk page show the same
 * set, so the export cannot disagree with the registry it came from.
 */
export function buildReportDatasets({
    parcels,
    farmers,
    assistance,
}: ReportSource): ReportDataset[] {
    const harvestRows = parcels.flatMap((parcel) => {
        const cycle = parcel.planting_cycle
        if (!cycle) return []
        const area = round1(areaOf(parcel))

        return (cycle.harvests ?? []).map((harvest) => ({
            parcel_code: parcel.parcel_code,
            barangay: parcel.farm?.barangay?.name?.trim() || '',
            farmers: tendeeNames(parcel),
            crop: cycle.crop?.name?.trim() || UNSPECIFIED_CROP,
            variety: cycle.variety?.trim() || '',
            harvest_date: harvest.harvest_date ?? '',
            area_hectares: area,
            production_kg: numberOrNull(harvest.production_kg),
            yield_kg_per_hectare: yieldOf(harvest, area),
        }))
    })

    const riskRows = toRiskRows(parcels).map((row) => ({
        parcel_code: row.parcel_code,
        barangay: row.barangay,
        farmers: row.farmerName,
        risk_type: row.riskType,
        severity: row.severity,
        parcel_status: row.parcelStatus,
        observed_at: row.observedAt ?? '',
        area_hectares: round1(row.area),
    }))

    const inspectionRows = parcels.flatMap((parcel) =>
        (parcel.inspections ?? []).map((inspection) => ({
            parcel_code: parcel.parcel_code,
            barangay: parcel.farm?.barangay?.name?.trim() || '',
            inspection_type: inspection.inspection_type?.trim() || '',
            inspector: inspection.inspector?.trim() || '',
            date: inspection.date ?? '',
            risk_level: inspection.risk_level ?? '',
            status: inspection.status ?? '',
            notes: inspection.notes ?? '',
        }))
    )

    return [
        {
            key: 'land-status',
            title: 'Land Status Register',
            category: 'Land Use',
            description: 'Every parcel with its current status, use and area',
            latest: null,
            columns: LAND_STATUS_COLUMNS,
            rows: parcels.map((parcel) => ({
                parcel_code: parcel.parcel_code,
                land_status: parcel.land_status,
                current_use: parcel.current_use?.trim() || '',
                area_hectares: round1(areaOf(parcel)),
                farm: parcel.farm?.name?.trim() || '',
                barangay: parcel.farm?.barangay?.name?.trim() || '',
                farmers: tendeeNames(parcel),
            })),
        },
        {
            key: 'farmer-registry',
            title: 'Farmer Registry',
            category: 'Registry',
            description: 'The registered roster, with contact and standing',
            latest: null,
            columns: FARMER_COLUMNS,
            rows: farmers.map((farmer) => ({
                farmer_code: farmer.farmer_code,
                name: farmer.name,
                contact: farmer.contact ?? '',
                farmer_status: farmer.farmer_status,
            })),
        },
        {
            key: 'harvest-summary',
            title: 'Harvest Production Summary',
            category: 'Production',
            description: 'Recorded harvests by parcel, crop and yield',
            latest: latestOf(harvestRows.map((row) => row.harvest_date)),
            columns: HARVEST_COLUMNS,
            rows: harvestRows,
        },
        {
            key: 'risk-report',
            title: 'Risk Monitoring Report',
            category: 'Risk',
            description:
                'Risk reports filed against parcels, open and resolved',
            latest: latestOf(riskRows.map((row) => row.observed_at)),
            columns: RISK_COLUMNS,
            rows: riskRows,
        },
        {
            key: 'inspection-log',
            title: 'Field Inspection Log',
            category: 'Risk',
            description: 'Field inspections with their risk level and outcome',
            latest: latestOf(inspectionRows.map((row) => row.date)),
            columns: INSPECTION_COLUMNS,
            rows: inspectionRows,
        },
        {
            key: 'assistance-ledger',
            title: 'Assistance Disbursement Ledger',
            category: 'Assistance',
            description:
                'Assistance released to farmers, with value and status',
            latest: latestOf(assistance.map((row) => row.date)),
            columns: ASSISTANCE_COLUMNS,
            // Spread so the row is a plain object, which is what the CSV writer
            // indexes by column key.
            rows: assistance.map((row) => ({ ...row })),
        },
    ]
}
