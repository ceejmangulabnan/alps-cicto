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

const createQuery = (params: FarmQuery = {}, page?: number): URLSearchParams => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => appendQuery(query, key, value))

    if (!query.has('pagination[pageSize]')) {
        query.set('pagination[pageSize]', String(MAX_PAGE_SIZE))
    }
    if (page !== undefined) query.set('pagination[page]', String(page))

    return query
}

export const useFarmsApi = () => {
    const config = useRuntimeConfig()
    const { jwt } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farms`
    const authHeaders = () =>
        jwt.value ? { Authorization: `Bearer ${jwt.value}` } : undefined

    const fetchPage = async (params: FarmQuery, page: number): Promise<FarmListResponse> => {
        const query = createQuery(params, page)
        return await $fetch<FarmListResponse>(`${baseUrl}?${query.toString()}`, {
            credentials: 'include',
            headers: authHeaders(),
        })
    }

    const getAll = async (params: FarmQuery = {}): Promise<FarmListResponse> => {
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

    const getById = async (documentId: string): Promise<FarmResponse> => {
        return await $fetch<FarmResponse>(`${baseUrl}/${documentId}`, {
            query: {
                populate: ['barangay', 'farmers', 'farm_parcels'],
            },
            credentials: 'include',
            headers: authHeaders(),
        })
    }

    return {
        getAll,
        getAllForSelect,
        getById,
    }
}
