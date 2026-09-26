export interface Farm {
    documentId: string
    id?: number
    farm_code: string
    barangay?: {
        documentId: string
        name: string
        code: string
    }
    farmers?: Array<{
        documentId: string
        farmer_code: string
        name: string
    }>
    farm_parcels?: Array<{
        documentId: string
        parcel_code: string
        area_hectares: number
        land_status: string
    }>
}

export const FARMER_STATUS_OPTIONS = [
    'Active',
    'Inactive',
    'Departed',
] as const

export type FarmerStatus = (typeof FARMER_STATUS_OPTIONS)[number]

export interface CreateFarmData {
    barangay: string
    farmers?: string[]
    farmer_status: FarmerStatus
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
            'fields[0]': 'farm_code',
            'populate[barangay][fields][0]': 'name',
            'populate[barangay][fields][1]': 'code',
            'populate[farmers][fields][0]': 'name',
            'populate[farmers][fields][1]': 'farmer_code',
        })
        return response.data
    }

    const create = async (data: CreateFarmData): Promise<FarmResponse> => {
        return await authFetch<FarmResponse>(baseUrl, {
            method: 'POST',
            body: {
                data: {
                    barangay: data.barangay,
                    farmer_status: data.farmer_status,
                    ...(data.farmers?.length ? { farmers: data.farmers } : {}),
                },
            },
        })
    }

    const getById = async (documentId: string): Promise<FarmResponse> => {
        return await authFetch<FarmResponse>(`${baseUrl}/${documentId}`, {
            query: {
                populate: ['barangay', 'farmers', 'farm_parcels'],
            },
        })
    }

    return {
        getAll,
        getAllForSelect,
        create,
        getById,
    }
}
