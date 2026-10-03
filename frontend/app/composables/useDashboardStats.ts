import type { FarmParcel, LandStatus } from '~/composables/useFarmParcelApi'
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'
import { useFarmersApi } from '~/composables/useFarmersApi'
import type { Farmer } from '~/composables/useFarmersApi'
import {
    NO_TENDEE,
    foldAtRiskParcels,
    foldInsights,
    openRiskRows,
    round1,
    toRiskRows,
    type RiskPriority,
} from '~/utils/riskInsights'
import { STATUS_COLOR, STATUS_COLOR_FALLBACK } from '~/utils/landStatus'
import {
    toLoadError,
    type LoadError,
    type LoadErrorSubject,
} from '~/utils/loadError'

/**
 * Every figure the dashboard shows, derived from the parcel registry.
 *
 * The point of this composable is that nothing on the home page is typed in by
 * hand. Each number is either summed from parcels and their relations, or counted
 * off a real record, so a KPI cannot quietly disagree with the registry page.
 * Where a figure is a ratio, both sides of it are reported.
 *
 * One parcel request covers land, crop, harvest and risk figures; the farmer
 * roster arrives separately because it is a different content type and is not
 * reachable through the parcel relation.
 */

/**
 * Spelled out per consumer, following the reasoning already documented on
 * `HUB_POPULATE` in `useFarmParcelApi`: the dashboard needs crop, harvest and
 * risk relations but not inspections, and widening that shared list would make
 * every other caller fetch histories they never read.
 */
const DASHBOARD_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'planting_cycle',
    'planting_cycle.crop',
    'planting_cycle.harvests',
    'risk_reports',
]

const DASHBOARD_SUBJECT: LoadErrorSubject = {
    name: 'dashboard figures',
    contentType: 'farm-parcel',
}

/** How far ahead "upcoming" reaches. A rolling window, so the page ages on its own. */
const UPCOMING_WINDOW_DAYS = 30

/** Trailing months on the harvest chart. */
const HARVEST_WINDOW_MONTHS = 12

/** Crops drawn as their own line; the rest fold into a single "Others" series. */
const CROP_SERIES_LIMIT = 4

/** Slices on the crop donut, tail rolled up so the ring stays readable. */
const CROP_SLICE_LIMIT = 5

const BARANGAY_LIMIT = 9

const ROLLUP_LABEL = 'Others'
const UNASSIGNED_BARANGAY = 'Unassigned'
const UNSPECIFIED_CROP = 'Unspecified'

/**
 * Categorical palette for crop series and slices. `current_use` and crop names
 * are free text, so colours cannot be keyed off them the way land status
 * colours are; these are assigned by rank instead, which keeps a given crop on
 * the same colour as long as it holds its position.
 */
const CROP_COLORS = [
    '#16a34a',
    '#ca8a04',
    '#d97706',
    '#059669',
    '#0f766e',
    '#1d6fa4',
    '#7c3aed',
    '#b45309',
]

/** The rollup bucket and the "no data" cases, so neither implies a real crop. */
const NEUTRAL_COLOR = '#94a3b8'

const DAY_MS = 86_400_000

const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

/**
 * Strapi date fields are date-only strings. Parsed as local midnight rather than
 * handed to `new Date()` — that would read them as UTC and land on the previous
 * day for anyone west of Greenwich, turning "harvests tomorrow" into "today".
 */
const parseDateOnly = (value: string | null | undefined): Date | null => {
    if (!value) return null

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const startOfToday = (): Date => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const monthKeyOf = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabelOf = (date: Date): string => MONTH_LABELS[date.getMonth()] ?? ''

/** Hectares, tolerating a null or malformed number from the API. */
const areaOf = (parcel: FarmParcel): number =>
    Number.isFinite(parcel.area_hectares) ? parcel.area_hectares : 0

const farmerOf = (parcel: FarmParcel): string =>
    parcel.farmers?.[0]?.name?.trim() || NO_TENDEE

const barangayOf = (parcel: FarmParcel): string =>
    parcel.farm?.barangay?.name?.trim() || UNASSIGNED_BARANGAY

/**
 * The crop a parcel is currently planting, falling back to the free-text
 * `current_use` so a parcel that is being worked without a crop record still
 * appears in the distribution instead of silently vanishing.
 */
const cropOf = (parcel: FarmParcel): string =>
    parcel.planting_cycle?.crop?.name?.trim() ||
    parcel.current_use?.trim() ||
    UNSPECIFIED_CROP

const fmtCount = (value: number): string => value.toLocaleString()

const fmtArea = (value: number): string =>
    value.toLocaleString(undefined, { maximumFractionDigits: 1 })

/** One decimal, or an em dash when there is no total to share out. */
const fmtPercent = (value: number, total: number): string =>
    total > 0 ? `${round1((value / total) * 100)}%` : '—'

const plural = (count: number, word: string): string =>
    `${fmtCount(count)} ${word}${count === 1 ? '' : 's'}`

export interface DashboardKpi {
    key: string
    label: string
    value: string
    sub: string
    icon: string
    /** Drives the tile's top accent bar. */
    accent: string
    /** Icon tile tint, paired with the accent. */
    iconClass: string
    to: string
    /** A share-of-total chip. Only present where the ratio is meaningful. */
    badge?: { label: string; class: string }
}

export interface LandStatusSlice {
    name: LandStatus
    area: number
    parcels: number
    share: number
    color: string
}

export interface CropSlice {
    name: string
    area: number
    share: number
    color: string
}

export interface BarangaySlice {
    name: string
    area: number
    cultivated: number
}

export interface HarvestSeries {
    name: string
    color: string
    data: number[]
}

export interface MonthlyHarvest {
    months: string[]
    series: HarvestSeries[]
    /** The crop with the most harvested area over the window. */
    leadingCrop: string | null
    /** Hectares harvested across every month in the window. */
    total: number
    windowMonths: number
}

export interface RiskSummaryRow {
    type: string
    parcels: number
    area: number
    priority: RiskPriority
}

export interface UpcomingHarvest {
    parcelDocumentId: string
    parcel_code: string
    farmer: string
    crop: string
    barangay: string
    area: number
    expectedDate: string
    daysUntil: number
    atRisk: boolean
}

export const useDashboardStats = () => {
    const parcels = ref<FarmParcel[]>([])
    const farmers = ref<Farmer[]>([])
    const loading = ref(false)
    const loadError = ref<LoadError | null>(null)

    const load = async (): Promise<void> => {
        loading.value = true
        loadError.value = null
        try {
            const { getAll: getParcels } = useFarmParcelApi()
            const { getAll: getFarmers } = useFarmersApi()

            // Independent content types, so there is nothing to sequence here.
            const [parcelResponse, farmerResponse] = await Promise.all([
                getParcels({ populate: DASHBOARD_POPULATE }),
                getFarmers(),
            ])

            parcels.value = parcelResponse.data
            farmers.value = farmerResponse.data
        } catch (value: unknown) {
            loadError.value = toLoadError(value, DASHBOARD_SUBJECT)
        } finally {
            loading.value = false
        }
    }

    /* ------------------------------------------------------------------ */
    /* Risk, folded by the same rules the risk page uses                   */
    /* ------------------------------------------------------------------ */

    const openReports = computed(() => openRiskRows(toRiskRows(parcels.value)))

    const insights = computed(() => foldInsights(openReports.value))

    const atRiskParcels = computed(() => foldAtRiskParcels(openReports.value))

    /** Distinct parcels and hectares, so a parcel with two reports counts once. */
    const atRiskTotals = computed(() => ({
        parcels: atRiskParcels.value.length,
        area: round1(atRiskParcels.value.reduce((sum, parcel) => sum + parcel.area, 0)),
    }))

    const riskSummary = computed<RiskSummaryRow[]>(() =>
        insights.value
            .map((insight) => ({
                type: insight.title,
                parcels: insight.affectedParcels,
                area: insight.affectedArea,
                priority: insight.priority,
            }))
            .sort((a, b) => b.parcels - a.parcels || b.area - a.area)
    )

    /** The three chips on the ALPS banner, counting insights by priority band. */
    const insightCounts = computed(() => ({
        total: insights.value.length,
        high: insights.value.filter((i) => i.priority === 'High').length,
        medium: insights.value.filter((i) => i.priority === 'Medium').length,
        low: insights.value.filter((i) => i.priority === 'Low').length,
    }))

    /* ------------------------------------------------------------------ */
    /* Land figures                                                        */
    /* ------------------------------------------------------------------ */

    const totalArea = computed(() =>
        round1(parcels.value.reduce((sum, parcel) => sum + areaOf(parcel), 0))
    )

    const farmCount = computed(
        () =>
            new Set(
                parcels.value
                    .map((parcel) => parcel.farm?.documentId)
                    .filter((id): id is string => Boolean(id))
            ).size
    )

    const areaByStatus = computed(() => {
        const totals = new Map<LandStatus, { area: number; parcels: number }>()
        for (const parcel of parcels.value) {
            const bucket = totals.get(parcel.land_status) ?? { area: 0, parcels: 0 }
            bucket.area = round1(bucket.area + areaOf(parcel))
            bucket.parcels += 1
            totals.set(parcel.land_status, bucket)
        }
        return totals
    })

    const areaForStatus = (status: LandStatus): number =>
        areaByStatus.value.get(status)?.area ?? 0

    const cultivatedArea = computed(() => areaForStatus('Cultivated'))
    const idleArea = computed(() => areaForStatus('Idle'))
    const fallowArea = computed(() => areaForStatus('Fallow'))

    /** Unworked ground: idle and fallow are the two statuses that yield nothing. */
    const idleFallowArea = computed(() => round1(idleArea.value + fallowArea.value))

    /** Colours come from the shared land-status map, so pie and legend agree. */
    const landStatusDistribution = computed<LandStatusSlice[]>(() =>
        LAND_STATUS_OPTIONS.filter((status) => {
            const bucket = areaByStatus.value.get(status)
            return bucket !== undefined && bucket.parcels > 0
        }).map((status) => {
            const bucket = areaByStatus.value.get(status)
            const area = bucket?.area ?? 0
            return {
                name: status,
                area,
                parcels: bucket?.parcels ?? 0,
                share: totalArea.value > 0 ? round1((area / totalArea.value) * 100) : 0,
                color: STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK,
            }
        })
    )

    const classifiedArea = computed(() =>
        round1(
            landStatusDistribution.value.reduce((sum, slice) => sum + slice.area, 0)
        )
    )

    /* ------------------------------------------------------------------ */
    /* Farmer figures                                                      */
    /* ------------------------------------------------------------------ */

    const farmerTotal = computed(() => farmers.value.length)

    const activeFarmers = computed(
        () => farmers.value.filter((farmer) => farmer.farmer_status === 'Active').length
    )

    /* ------------------------------------------------------------------ */
    /* Crop and barangay breakdowns                                        */
    /* ------------------------------------------------------------------ */

    /** Share of planted area, so a parcel with no cycle is simply not counted. */
    const cropDistribution = computed<CropSlice[]>(() => {
        const totals = new Map<string, number>()
        for (const parcel of parcels.value) {
            if (!parcel.planting_cycle) continue
            const crop = cropOf(parcel)
            totals.set(crop, (totals.get(crop) ?? 0) + areaOf(parcel))
        }

        const plantedArea = round1([...totals.values()].reduce((s, v) => s + v, 0))
        if (plantedArea <= 0) return []

        const ranked = [...totals.entries()]
            .map(([name, area]) => ({ name, area: round1(area) }))
            .sort((a, b) => b.area - a.area || a.name.localeCompare(b.name))

        const head = ranked.slice(0, CROP_SLICE_LIMIT)
        const tail = ranked.slice(CROP_SLICE_LIMIT)

        const slices = head.map((crop, index) => ({
            ...crop,
            share: round1((crop.area / plantedArea) * 100),
            color: CROP_COLORS[index % CROP_COLORS.length] ?? NEUTRAL_COLOR,
        }))

        if (tail.length > 0) {
            const tailArea = round1(tail.reduce((sum, crop) => sum + crop.area, 0))
            slices.push({
                name: ROLLUP_LABEL,
                area: tailArea,
                share: round1((tailArea / plantedArea) * 100),
                color: NEUTRAL_COLOR,
            })
        }

        return slices
    })

    const plantedArea = computed(() =>
        round1(cropDistribution.value.reduce((sum, slice) => sum + slice.area, 0))
    )

    const leadingCrop = computed(() => cropDistribution.value[0]?.name ?? null)

    const barangayArea = computed<BarangaySlice[]>(() => {
        const totals = new Map<string, { area: number; cultivated: number }>()
        for (const parcel of parcels.value) {
            const name = barangayOf(parcel)
            const bucket = totals.get(name) ?? { area: 0, cultivated: 0 }
            const area = areaOf(parcel)
            bucket.area = round1(bucket.area + area)
            if (parcel.land_status === 'Cultivated') {
                bucket.cultivated = round1(bucket.cultivated + area)
            }
            totals.set(name, bucket)
        }

        return [...totals.entries()]
            .map(([name, bucket]) => ({ name, ...bucket }))
            .sort((a, b) => b.area - a.area || a.name.localeCompare(b.name))
            .slice(0, BARANGAY_LIMIT)
    })

    /* ------------------------------------------------------------------ */
    /* Harvest figures                                                     */
    /* ------------------------------------------------------------------ */

    /**
     * Area harvested per month, by crop, over a trailing 12 months.
     *
     * The unit is hectares rather than the recorded `production_kg`, because
     * that is what the chart has always been labelled. One harvest record
     * contributes the parcel's area, so a parcel harvested twice in a window
     * counts its area in both months — which is the area-worked reading the
     * label describes.
     *
     * Note the limit of the data: `harvests` hang off the parcel's *current*
     * planting cycle, and that relation is manyToOne. A parcel whose cycle has
     * been replaced no longer carries its earlier seasons' harvests here.
     */
    const monthlyHarvest = computed<MonthlyHarvest>(() => {
        const today = startOfToday()
        const months: Date[] = []
        for (let offset = HARVEST_WINDOW_MONTHS - 1; offset >= 0; offset -= 1) {
            months.push(new Date(today.getFullYear(), today.getMonth() - offset, 1))
        }

        const keys = months.map(monthKeyOf)
        const indexByKey = new Map(keys.map((key, index) => [key, index]))

        // Accumulate per crop so the series set is decided by rank, not by
        // whatever crop happened to be first in the parcel list.
        const byCrop = new Map<string, Map<number, number>>()
        for (const parcel of parcels.value) {
            const cycle = parcel.planting_cycle
            if (!cycle) continue

            const crop = cropOf(parcel)
            const area = areaOf(parcel)
            for (const harvest of cycle.harvests ?? []) {
                const date = parseDateOnly(harvest.harvest_date)
                if (!date) continue
                const index = indexByKey.get(monthKeyOf(date))
                if (index === undefined) continue

                const monthsForCrop = byCrop.get(crop) ?? new Map<number, number>()
                monthsForCrop.set(index, (monthsForCrop.get(index) ?? 0) + area)
                byCrop.set(crop, monthsForCrop)
            }
        }

        if (byCrop.size === 0) {
            return {
                months: months.map(monthLabelOf),
                series: [],
                leadingCrop: null,
                total: 0,
                windowMonths: HARVEST_WINDOW_MONTHS,
            }
        }

        const ranked = [...byCrop.entries()]
            .map(([name, values]) => ({
                name,
                total: round1([...values.values()].reduce((sum, v) => sum + v, 0)),
            }))
            .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

        const head = ranked.slice(0, CROP_SERIES_LIMIT)
        const tail = ranked.slice(CROP_SERIES_LIMIT)
        const tailNames = new Set(tail.map((crop) => crop.name))

        const series: HarvestSeries[] = head.map((crop, index) => ({
            name: crop.name,
            color: CROP_COLORS[index % CROP_COLORS.length] ?? NEUTRAL_COLOR,
            data: keys.map((_, monthIndex) =>
                round1(byCrop.get(crop.name)?.get(monthIndex) ?? 0)
            ),
        }))

        if (tail.length > 0) {
            series.push({
                name: ROLLUP_LABEL,
                color: NEUTRAL_COLOR,
                data: keys.map((_, monthIndex) =>
                    round1(
                        [...byCrop.entries()]
                            .filter(([name]) => tailNames.has(name))
                            .reduce(
                                (sum, [, values]) => sum + (values.get(monthIndex) ?? 0),
                                0
                            )
                    )
                ),
            })
        }

        return {
            months: months.map(monthLabelOf),
            series,
            leadingCrop: head[0]?.name ?? null,
            total: round1(
                series.reduce(
                    (sum, crop) =>
                        sum + crop.data.reduce((monthSum, v) => monthSum + v, 0),
                    0
                )
            ),
            windowMonths: HARVEST_WINDOW_MONTHS,
        }
    })

    /* ------------------------------------------------------------------ */
    /* Upcoming harvests                                                   */
    /* ------------------------------------------------------------------ */

    const upcomingHarvests = computed<UpcomingHarvest[]>(() => {
        const today = startOfToday()
        const horizon = new Date(today.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS)
        const flagged = new Set(atRiskParcels.value.map((parcel) => parcel.parcelDocumentId))

        return parcels.value
            .flatMap((parcel): UpcomingHarvest[] => {
                const expected = parseDateOnly(parcel.planting_cycle?.expected_harvest)
                if (!expected || expected < today || expected > horizon) return []

                return [
                    {
                        parcelDocumentId: parcel.documentId,
                        parcel_code: parcel.parcel_code,
                        farmer: farmerOf(parcel),
                        crop: cropOf(parcel),
                        barangay: barangayOf(parcel),
                        area: round1(areaOf(parcel)),
                        expectedDate: expected.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                        daysUntil: Math.round((expected.getTime() - today.getTime()) / DAY_MS),
                        atRisk: flagged.has(parcel.documentId),
                    },
                ]
            })
            .sort((a, b) => a.daysUntil - b.daysUntil || b.area - a.area)
    })

    const upcomingArea = computed(() =>
        round1(upcomingHarvests.value.reduce((sum, row) => sum + row.area, 0))
    )

    /* ------------------------------------------------------------------ */
    /* KPI tiles                                                           */
    /* ------------------------------------------------------------------ */

    const kpis = computed<DashboardKpi[]>(() => [
        {
            key: 'total-area',
            label: 'Total Agricultural Land',
            value: `${fmtArea(totalArea.value)} ha`,
            sub: `Registered parcels: ${plural(parcels.value.length, 'parcel')}`,
            icon: 'i-lucide-mountain',
            accent: '#2d6a2d',
            iconClass: 'kpi-icon-green',
            to: '/map',
        },
        {
            key: 'farmers',
            label: 'Active Farmers',
            value: fmtCount(activeFarmers.value),
            sub: `of ${plural(farmerTotal.value, 'farmer')} registered`,
            icon: 'i-lucide-users',
            accent: '#1d6fa4',
            iconClass: 'kpi-icon-blue',
            to: '/farmers',
        },
        {
            key: 'cultivated',
            label: 'Cultivated Land',
            value: `${fmtArea(cultivatedArea.value)} ha`,
            sub: `in ${plural(
                areaByStatus.value.get('Cultivated')?.parcels ?? 0,
                'parcel'
            )}`,
            badge: {
                label: fmtPercent(cultivatedArea.value, totalArea.value),
                class: 'kpi-badge-green',
            },
            icon: 'i-lucide-sprout',
            accent: '#16a34a',
            iconClass: 'kpi-icon-green',
            to: '/map',
        },
        {
            key: 'idle',
            label: 'Idle / Fallow Land',
            value: `${fmtArea(idleFallowArea.value)} ha`,
            sub: `${fmtArea(idleArea.value)} idle · ${fmtArea(fallowArea.value)} fallow`,
            badge: {
                label: fmtPercent(idleFallowArea.value, totalArea.value),
                class: 'kpi-badge-amber',
            },
            icon: 'i-lucide-archive',
            accent: '#6b7280',
            iconClass: 'kpi-icon-slate',
            to: '/map',
        },
        {
            key: 'at-risk',
            label: 'At-Risk Land',
            value: `${fmtArea(atRiskTotals.value.area)} ha`,
            sub: `${plural(atRiskTotals.value.parcels, 'parcel')} flagged`,
            badge: {
                label: fmtPercent(atRiskTotals.value.area, totalArea.value),
                class: 'kpi-badge-red',
            },
            icon: 'i-lucide-alert-triangle',
            accent: '#dc2626',
            iconClass: 'kpi-icon-red',
            to: '/risks',
        },
        {
            key: 'upcoming',
            label: 'Upcoming Harvests',
            value: plural(upcomingHarvests.value.length, 'parcel'),
            sub: `Next ${UPCOMING_WINDOW_DAYS} days · ${fmtArea(upcomingArea.value)} ha`,
            icon: 'i-lucide-wheat',
            accent: '#d97706',
            iconClass: 'kpi-icon-amber',
            to: '/harvests',
        },
    ])

    return {
        load,
        loading,
        loadError,

        /* headline counters */
        parcels,
        totalArea,
        parcelCount: computed(() => parcels.value.length),
        farmCount,
        farmerTotal,
        activeFarmers,

        /* breakdowns */
        landStatusDistribution,
        classifiedArea,
        cultivatedArea,
        idleFallowArea,
        cropDistribution,
        plantedArea,
        leadingCrop,
        barangayArea,
        monthlyHarvest,
        upcomingHarvests,
        upcomingArea,

        /* risk */
        insights,
        insightCounts,
        riskSummary,
        atRiskTotals,

        kpis,

        /* window lengths, so the copy on the page cannot drift from the maths */
        upcomingWindowDays: UPCOMING_WINDOW_DAYS,
    }
}
