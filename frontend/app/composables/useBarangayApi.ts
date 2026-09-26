export interface Barangay {
    documentId: string
    id?: number
    name: string
    code: string
}

export interface BarangayListResponse {
    data: Barangay[]
}

const MAX_PAGE_SIZE = 100

export const useBarangayApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/barangays`

    const getAll = async (): Promise<BarangayListResponse> => {
        return await authFetch<BarangayListResponse>(baseUrl, {
            query: {
                'fields[0]': 'name',
                'fields[1]': 'code',
                sort: 'name:asc',
                'pagination[pageSize]': MAX_PAGE_SIZE,
            },
        })
    }

    const getAllForSelect = async (): Promise<Barangay[]> => {
        const response = await getAll()
        return response.data
    }

    return { getAll, getAllForSelect }
}
