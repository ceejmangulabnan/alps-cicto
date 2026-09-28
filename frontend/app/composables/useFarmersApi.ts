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

    const getAll = async (): Promise<FarmerListResponse> => {
        return await authFetch<FarmerListResponse>(baseUrl, {
            query: {
                'fields[0]': FARMER_FIELDS[0],
                'fields[1]': FARMER_FIELDS[1],
                'fields[2]': FARMER_FIELDS[2],
                'fields[3]': FARMER_FIELDS[3],
                sort: 'name:asc',
                'pagination[pageSize]': MAX_PAGE_SIZE,
            },
        })
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

    return { getAll, getAllForSelect, create }
}
