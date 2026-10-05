export type FarmerStatus = 'Active' | 'Inactive' | 'Departed'

export interface Farmer {
    documentId: string
    id?: number
    farmer_code: string
    name: string
    /** Free text, so a number may be written any way the farmer prefers. */
    contact: string | null
    farmer_status: FarmerStatus
}

export interface FarmerListResponse {
    data: Farmer[]
    meta?: {
        pagination: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

export interface FarmerResponse {
    data: Farmer
}

/** `farmer_code` is omitted deliberately: the backend generates it. */
export interface CreateFarmerData {
    name: string
    contact?: string
    farmer_status: FarmerStatus
}

export interface UpdateFarmerData {
    name?: string
    contact?: string | null
    farmer_status?: FarmerStatus
}

const MAX_PAGE_SIZE = 100

const FARMER_FIELDS = [
    'farmer_code',
    'name',
    'contact',
    'farmer_status',
] as const

export const useFarmersApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farmers`

    /**
     * Walks every page so callers never silently cap the roster at the first
     * 100 names. Strapi caps `pagination[pageSize]` at 100, so one request can
     * only ever return a page — the dashboard's "active farmers" figure counts
     * the whole registry and would otherwise understate it.
     */
    const getAll = async (): Promise<FarmerListResponse> => {
        const fetchPage = async (page: number): Promise<FarmerListResponse> =>
            await authFetch<FarmerListResponse>(baseUrl, {
                query: {
                    'fields[0]': FARMER_FIELDS[0],
                    'fields[1]': FARMER_FIELDS[1],
                    'fields[2]': FARMER_FIELDS[2],
                    'fields[3]': FARMER_FIELDS[3],
                    sort: 'name:asc',
                    'pagination[pageSize]': MAX_PAGE_SIZE,
                    'pagination[page]': page,
                },
            })

        const firstPage = await fetchPage(1)
        const pagination = firstPage.meta?.pagination

        // Narrowed explicitly rather than via `pageCount ?? 1`, so the spread
        // below keeps its full pagination shape.
        if (!pagination || pagination.pageCount <= 1) return firstPage

        const pageCount = pagination.pageCount
        const remainingPages = await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
                fetchPage(index + 2)
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

    const getAllForSelect = async (): Promise<Farmer[]> => {
        const response = await getAll()
        return response.data
    }

    const create = async (data: CreateFarmerData): Promise<Farmer> => {
        const response = await authFetch<FarmerResponse>(baseUrl, {
            method: 'POST',
            body: {
                data: {
                    name: data.name,
                    contact: data.contact || null,
                    farmer_status: data.farmer_status,
                },
            },
        })
        return response.data
    }

    const update = async (
        documentId: string,
        data: UpdateFarmerData
    ): Promise<Farmer> => {
        const response = await authFetch<FarmerResponse>(
            `${baseUrl}/${documentId}`,
            {
                method: 'PUT',
                body: {
                    data: {
                        ...(data.name !== undefined ? { name: data.name } : {}),
                        ...(data.contact !== undefined
                            ? { contact: data.contact }
                            : {}),
                        ...(data.farmer_status !== undefined
                            ? { farmer_status: data.farmer_status }
                            : {}),
                    },
                },
            }
        )
        return response.data
    }

    return { getAll, getAllForSelect, create, update }
}
