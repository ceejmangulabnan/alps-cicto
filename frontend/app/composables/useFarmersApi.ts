export interface Farmer {
    documentId: string
    id?: number
    farmer_code: string
    name: string
}

export interface FarmerListResponse {
    data: Farmer[]
}

const MAX_PAGE_SIZE = 100

export const useFarmersApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/farmers`

    const getAll = async (): Promise<FarmerListResponse> => {
        return await authFetch<FarmerListResponse>(baseUrl, {
            query: {
                'fields[0]': 'farmer_code',
                'fields[1]': 'name',
                sort: 'name:asc',
                'pagination[pageSize]': MAX_PAGE_SIZE,
            },
        })
    }

    const getAllForSelect = async (): Promise<Farmer[]> => {
        const response = await getAll()
        return response.data
    }

    return { getAll, getAllForSelect }
}
