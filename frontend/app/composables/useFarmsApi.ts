import qs from 'qs'

export interface FarmParcelSummary {
    documentId: string
    parcel_code: string
    area_hectares: number
    land_status: string
    /** The farmers tending this parcel specifically, not the farm's rollup. */
    farmers?: Array<{
        documentId: string
        farmer_code: string
        name: string
        farmer_status?: string
    }>
}

export interface Farm {
    documentId: string
    id?: number
    /** What the farm is called. Unlike the code, this is entered by hand. */
    name: string
    farm_code: string
    barangay?: {
        documentId: string
        name: string
        code: string
    }
    /**
     * Rollup of the farmers tending this farm's parcels. `farmer_status` is
     * present on the with-summary responses and is what `deriveFarmStatus`
     * reads; the lighter select queries do not request it.
     */
    farmers?: Array<{
        documentId: string
        farmer_code: string
        name: string
        farmer_status?: string
    }>
    farm_parcels?: FarmParcelSummary[]
    /** Attached by GET /farms/with-summary, absent on the core routes. */
    parcel_summary?: FarmParcelAggregate
    createdAt?: string
    updatedAt?: string
}

export interface FarmParcelAggregate {
    total_area_hectares: number
    parcel_count: number
    status_breakdown: Record<string, number>
}

/**
 * The relation shape a single farm needs to be usable on its own: named for the
 * table and the detail panel, and needed to re-populate the edit form. Shared by
 * create, update and the single read so they cannot drift — a write that returns a
 * narrower farm would leave the row it updates missing `barangay`, and the next
 * edit of that row would then prefill nothing and refuse to save.
 */
const FARM_POPULATE = {
    barangay: true,
    farmers: {
        fields: ['name', 'farmer_code', 'farmer_status'],
    },
    farm_parcels: {
        fields: ['parcel_code', 'land_status', 'area_hectares'],
        populate: {
            farmers: {
                fields: ['name', 'farmer_code', 'farmer_status'],
            },
        },
    },
} as const

// Formats the nested object into a Strapi-compatible query string
const populateQuery = qs.stringify(
    { populate: FARM_POPULATE },
    { encodeValuesOnly: true }
)

/**
 * A farm has no status of its own. It is read off the farmers tending its
 * parcels: a farm with at least one Active farmer is being worked, and one with
 * nobody (or only Inactive/Departed farmers) is not. `Departed` describes a
 * person, so it only surfaces in the farmer views.
 */
export const FARM_STATUS_OPTIONS = ['Active', 'Inactive'] as const

export type FarmStatus = (typeof FARM_STATUS_OPTIONS)[number]

/**
 * Derives a farm's status from its rollup of parcel-tending farmers. Callers pass
 * `farm.farmers`, which the with-summary endpoints populate alongside
 * `farmer_status` so no extra request is needed.
 */
export const deriveFarmStatus = (
    farmers: Array<{ farmer_status?: string }> | undefined | null
): FarmStatus => {
    const list = farmers ?? []
    return list.some((farmer) => farmer.farmer_status === 'Active')
        ? 'Active'
        : 'Inactive'
}

export interface CreateFarmData {
    name: string
    barangay: string
}

export interface UpdateFarmData {
    name?: string
}

/** `/farms/with-summary` returns a bare list, without Strapi's meta. */
export interface FarmSummaryListResponse {
    data: Farm[]
}

export type FarmQuery = Record<
    string,
    string | number | boolean | string[] | undefined | null
>

export interface FarmListResponse {
    data: Farm[]
    meta: {
        pagination: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

export interface FarmResponse {
    data: Farm
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
    params: FarmQuery = {},
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

export const useFarmsApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farms`

    const fetchPage = async (
        params: FarmQuery,
        page: number
    ): Promise<FarmListResponse> => {
        const query = createQuery(params, page)
        return await authFetch<FarmListResponse>(
            `${baseUrl}?${query.toString()}`
        )
    }

    const getAll = async (
        params: FarmQuery = {}
    ): Promise<FarmListResponse> => {
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

    const getAllForSelect = async (): Promise<Farm[]> => {
        const response = await getAll({
            'fields[0]': 'name',
            'fields[1]': 'farm_code',
            'populate[barangay][fields][0]': 'name',
            'populate[barangay][fields][1]': 'code',
        })
        return response.data
    }

    const create = async (data: CreateFarmData): Promise<FarmResponse> => {
        // No farm_code, farmers or status: the code is derived from the barangay,
        // the farmer list is a rollup over the parcels' farmers, and the status
        // is derived from that list. The relations are still asked for, because
        // the response is dropped straight into the table and the edit form reads
        // `barangay` back off it.
        return await authFetch<FarmResponse>(`${baseUrl}?${populateQuery}`, {
            method: 'POST',
            body: {
                data: { name: data.name, barangay: data.barangay },
            },
        })
    }

    const getById = async (documentId: string): Promise<FarmResponse> => {
        return await authFetch<FarmResponse>(
            `${baseUrl}/${documentId}?${populateQuery}`
        )
    }

    const update = async (
        documentId: string,
        data: UpdateFarmData
    ): Promise<FarmResponse> => {
        return await authFetch<FarmResponse>(
            `${baseUrl}/${documentId}?${populateQuery}`,
            {
                method: 'PUT',
                body: { data },
            }
        )
    }

    /**
     * Farms with their parcel totals already aggregated server-side. Skips
     * `boundary_geojson`, which a management list has no use for.
     */
    const getAllWithSummary = async (): Promise<FarmSummaryListResponse> => {
        return await authFetch<FarmSummaryListResponse>(
            `${baseUrl}/with-summary`,
            { query: { sort: 'farm_code:asc' } }
        )
    }

    /**
     * One farm with its parcels listed by code, for the detail panel. The list
     * route above only returns each parcel's area and status.
     */
    const getOneWithSummary = async (
        documentId: string
    ): Promise<FarmResponse> => {
        return await authFetch<FarmResponse>(
            `${baseUrl}/${documentId}/with-summary`
        )
    }

    return {
        getAll,
        getAllForSelect,
        create,
        getById,
        update,
        getAllWithSummary,
        getOneWithSummary,
    }
}
