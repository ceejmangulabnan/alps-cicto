import qs from 'qs'

export const LAND_STATUS_OPTIONS = [
    'Cultivated',
    'Preparation',
    'Harvesting',
    'Fallow',
    'Idle',
    'At Risk',
    'Converted',
] as const

export type LandStatus = (typeof LAND_STATUS_OPTIONS)[number]

export interface ParcelFarmer {
    documentId: string
    farmer_code: string
    name: string
    farmer_status?: string
}

export interface ParcelFarm {
    documentId: string
    farm_code: string
    name?: string | null
    barangay?: {
        documentId: string
        name: string
        code: string
    } | null
    farmers?: ParcelFarmer[]
}

export interface ParcelCrop {
    documentId: string
    name: string
    category?: string | null
}

export interface ParcelHarvest {
    documentId: string
    harvest_date?: string | null
    /** Strapi `decimal`; loose so a string response cannot break a render. */
    production_kg?: number | string | null
    yield_per_hectare?: number | string | null
}

export interface ParcelPlantingCycle {
    documentId: string
    variety?: string | null
    planting_date?: string | null
    expected_harvest?: string | null
    crop?: ParcelCrop | null
    harvests?: ParcelHarvest[]
}

export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type RiskParcelStatus = 'Active' | 'Monitoring' | 'Resolved'

/** The inspection a report was filed from, when it has one. */
export interface ParcelRiskReportInspection {
    documentId: string
    date?: string | null
    inspection_type?: string | null
}

export interface ParcelRiskReport {
    documentId: string
    risk_type?: string | null
    observed_at?: string | null
    severity?: RiskSeverity | null
    parcel_status?: RiskParcelStatus | null
    /** Present when the report came from a finding; absent for manual reports. */
    inspection?: ParcelRiskReportInspection | null
}

/**
 * The derived risk level shown for an inspection. It is not a stored field:
 * it is the worst severity among the inspection's linked reports, or `None`
 * when the visit observed no risk.
 */
export type RiskInspectionLevel = RiskSeverity | 'None'

export type InspectionStatus = 'Pending' | 'In Progress' | 'Completed'

/** A Strapi media file as returned on a populated inspection. */
export interface ParcelInspectionPhoto {
    id?: number
    url?: string
    formats?: { thumbnail?: { url?: string } }
}

export interface ParcelInspection {
    documentId: string
    inspector?: string | null
    date?: string | null
    /** Free text in the schema, not an enumeration. */
    condition?: string | null
    notes?: string | null
    inspection_type?: string | null
    status?: InspectionStatus | null
    /** Free text entered by the officer; kept verbatim in the JSON column. */
    gps_point?: unknown
    /** The reports this visit produced, one per finding. */
    risk_reports?: ParcelRiskReport[]
    photos?: ParcelInspectionPhoto[]
}

export interface FarmParcel {
    documentId: string
    id?: number
    parcel_code: string
    boundary_geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
    area_hectares: number
    land_status: LandStatus
    current_use?: string | null
    farm?: ParcelFarm | null
    /** The farmers tending this parcel. The owning farm's list is a rollup. */
    farmers?: ParcelFarmer[]
    /**
     * ManyToOne, so a parcel has at most one cycle. Harvests hang off that cycle
     * rather than the parcel, which is why there is no `harvests` here: the hub
     * reads them via `planting_cycle.harvests`.
     */
    planting_cycle?: ParcelPlantingCycle | null
    inspections?: ParcelInspection[]
    risk_reports?: ParcelRiskReport[]
}

export type FarmParcelQuery = Record<
    string,
    string | number | boolean | string[] | undefined | null
>

export interface CreateFromMapData {
    farm: string
    boundary_geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
    land_status: LandStatus
    current_use?: string
    area_hectares?: number
    /** The farmers tending this parcel, as farmer documentIds. */
    farmers?: string[]
}

export interface UpdateParcelData {
    farm?: string
    boundary_geojson?: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
    land_status?: LandStatus
    current_use?: string | null
    area_hectares?: number
    /** The farmers tending this parcel, as farmer documentIds. */
    farmers?: string[]
    /** The parcel's current planting cycle, as a planting-cycle documentId. */
    planting_cycle?: string | null
}

/**
 * `farm.farmers` is the farm-wide rollup; `farmers` is who tends this parcel
 * specifically. Both are populated so the map and sidebar can show the parcel's
 * own tendees without a second request.
 */
const PARCEL_POPULATE = [
    'farm',
    'farm.barangay',
    'farm.farmers',
    'farmers',
    'planting_cycle',
    'inspections',
]

const populateQuery = qs.stringify(
    { populate: PARCEL_POPULATE },
    { encodeValuesOnly: true }
)

/**
 * Everything the parcel hub renders in one request. Spelled out rather than
 * built from `PARCEL_POPULATE`, for two reasons: that list also serves the map's
 * edit path via `useParcelData.ensureParcel`, which needs only farm and farmers,
 * so widening it would make the map fetch histories it never reads. And it
 * populates `farm.farmers`, the farm-wide rollup, which this page must never
 * read — the tending farmers come from the parcel's own `farmers`.
 *
 * `harvests` is reached through the planting cycle: it is two hops from the
 * parcel, and since the cycle relation is manyToOne, these are the harvests of
 * the parcel's single current cycle, not a multi-season record.
 */
const HUB_POPULATE = [
    'farm',
    'farm.barangay',
    'farmers',
    'planting_cycle',
    'planting_cycle.crop',
    'planting_cycle.harvests',
    'inspections',
    'inspections.risk_reports',
    'risk_reports',
    'risk_reports.inspection',
]

const hubPopulateQuery = qs.stringify(
    { populate: HUB_POPULATE },
    { encodeValuesOnly: true }
)

export interface FarmParcelResponse {
    data: FarmParcel
}

export interface FarmParcelListResponse {
    data: FarmParcel[]
    meta: {
        pagination: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

const MAX_PAGE_SIZE = 100

const appendQuery = (
    query: URLSearchParams,
    key: string,
    value: string | number | boolean | string[] | undefined | null
) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
        value.forEach((item) => query.append(`${key}[]`, item))
        return
    }

    query.set(key, String(value))
}

const createQuery = (
    params: FarmParcelQuery = {},
    page?: number
): URLSearchParams => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) =>
        appendQuery(query, key, value)
    )

    if (!query.has('pagination[pageSize]')) {
        query.set('pagination[pageSize]', String(MAX_PAGE_SIZE))
    }
    if (page !== undefined) query.set('pagination[page]', String(page))

    return query
}

export const useFarmParcelApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farm-parcels`

    const fetchPage = async (
        params: FarmParcelQuery,
        page: number
    ): Promise<FarmParcelListResponse> => {
        const query = createQuery(params, page)
        return await authFetch<FarmParcelListResponse>(
            `${baseUrl}?${query.toString()}`
        )
    }

    const createFromMap = async (
        data: CreateFromMapData
    ): Promise<FarmParcelResponse> => {
        return await authFetch<FarmParcelResponse>(`${baseUrl}/from-map`, {
            method: 'POST',
            body: data,
        })
    }

    const getAll = async (
        params: FarmParcelQuery = {}
    ): Promise<FarmParcelListResponse> => {
        const firstPage = await fetchPage(params, 1)
        const pagination = firstPage.meta?.pagination
        const pageCount = pagination?.pageCount ?? 1

        if (pageCount <= 1 || params['pagination[page]'] !== undefined) {
            return firstPage
        }

        const remainingPages = await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
                fetchPage(params, index + 2)
            )
        )
        const data = [
            ...firstPage.data,
            ...remainingPages.flatMap((response) => response.data),
        ]

        return {
            data,
            meta: {
                pagination: {
                    ...pagination,
                    page: 1,
                    pageCount: 1,
                },
            },
        }
    }

    const getById = async (documentId: string): Promise<FarmParcelResponse> => {
        return await authFetch<FarmParcelResponse>(
            `${baseUrl}/${documentId}?${populateQuery}`
        )
    }

    /** One parcel with every relation the hub shows, in a single request. */
    const getHubById = async (
        documentId: string
    ): Promise<FarmParcelResponse> => {
        return await authFetch<FarmParcelResponse>(
            `${baseUrl}/${documentId}?${hubPopulateQuery}`
        )
    }

    /**
     * The hub variant of a code lookup. `parcel_code` is the human readable
     * identifier, so the route is `/parcels/<code>`; this resolves it to its
     * document and returns null when no published parcel carries that code.
     * Unknown codes answer a 200 with an empty list rather than a 404, so
     * "no such parcel" is signalled by the `null` rather than an exception.
     */
    const getHubByCode = async (
        parcelCode: string
    ): Promise<FarmParcelResponse | null> => {
        const query = new URLSearchParams(hubPopulateQuery)
        query.set('filters[parcel_code][$eq]', parcelCode)
        const response = await authFetch<FarmParcelListResponse>(
            `${baseUrl}?${query.toString()}`
        )
        const parcel = response.data[0]
        return parcel ? { data: parcel } : null
    }

    const update = async (
        documentId: string,
        data: UpdateParcelData
    ): Promise<FarmParcelResponse> => {
        return await authFetch<FarmParcelResponse>(
            `${baseUrl}/${documentId}?${populateQuery}`,
            {
                method: 'PUT',
                body: { data },
            }
        )
    }

    /**
     * Deletes a parcel through the custom route. Stock REST destroy 403s on
     * API-created records, and the server refuses (409) while a planting cycle,
     * inspection or risk report still references the parcel.
     */
    const deleteParcel = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/delete/${documentId}`, {
            method: 'DELETE',
        })
    }

    return {
        createFromMap,
        getAll,
        getById,
        getHubById,
        getHubByCode,
        update,
        deleteParcel,
    }
}
