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
}

export interface ParcelFarm {
    documentId: string
    farm_code: string
    barangay?: {
        documentId: string
        name: string
        code: string
    }
    farmers?: ParcelFarmer[]
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
    planting_cycle?: unknown
    inspections?: unknown[]
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
}

export interface UpdateParcelData {
    farm?: string
    boundary_geojson?: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
    land_status?: LandStatus
    current_use?: string | null
    area_hectares?: number
}

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
    Object.entries(params).forEach(([key, value]) => appendQuery(query, key, value))

    if (!query.has('pagination[pageSize]')) {
        query.set('pagination[pageSize]', String(MAX_PAGE_SIZE))
    }
    if (page !== undefined) query.set('pagination[page]', String(page))

    return query
}

export const useFarmParcelApi = () => {
    const config = useRuntimeConfig()
    const { jwt } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farm-parcels`
    const authHeaders = () =>
        jwt.value ? { Authorization: `Bearer ${jwt.value}` } : undefined

    const fetchPage = async (
        params: FarmParcelQuery,
        page: number
    ): Promise<FarmParcelListResponse> => {
        const query = createQuery(params, page)
        return await $fetch<FarmParcelListResponse>(
            `${baseUrl}?${query.toString()}`,
            {
                credentials: 'include',
                headers: authHeaders(),
            }
        )
    }

    const createFromMap = async (
        data: CreateFromMapData
    ): Promise<FarmParcelResponse> => {
        return await $fetch<FarmParcelResponse>(`${baseUrl}/from-map`, {
            method: 'POST',
            body: data,
            credentials: 'include',
            headers: authHeaders(),
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
        return await $fetch<FarmParcelResponse>(`${baseUrl}/${documentId}`, {
            query: {
                populate: [
                    'farm',
                    'farm.barangay',
                    'farm.farmers',
                    'planting_cycle',
                    'inspections',
                ],
            },
            credentials: 'include',
            headers: authHeaders(),
        })
    }

    const update = async (
        documentId: string,
        data: UpdateParcelData
    ): Promise<FarmParcelResponse> => {
        return await $fetch<FarmParcelResponse>(`${baseUrl}/${documentId}`, {
            method: 'PUT',
            body: { data },
            query: {
                populate: [
                    'farm',
                    'farm.barangay',
                    'farm.farmers',
                    'planting_cycle',
                    'inspections',
                ],
            },
            credentials: 'include',
            headers: authHeaders(),
        })
    }

    return {
        createFromMap,
        getAll,
        getById,
        update,
    }
}
