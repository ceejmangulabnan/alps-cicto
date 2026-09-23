/**
 * Farms API Composable
 * Handles farm-related API calls for dropdowns and selections
 */

export interface Farm {
  documentId: string
  id: number
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

export const useFarmsApi = () => {
  const baseUrl = '/api/farms'

  const getAll = async (params?: Record<string, any>): Promise<FarmListResponse> => {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        }
      })
    }
    const response = await $fetch<FarmListResponse>(`${baseUrl}?${query.toString()}`)
    return response
  }

  const getAllForSelect = async (): Promise<Farm[]> => {
    // Fetch with minimal fields for dropdown
    const response = await $fetch<FarmListResponse>(`${baseUrl}`, {
      query: {
        'fields[0]': 'farm_code',
        'populate[barangay][fields][0]': 'name',
        'populate[barangay][fields][1]': 'code',
        'populate[farmers][fields][0]': 'name',
        'populate[farmers][fields][1]': 'farmer_code',
        'pagination[pageSize]': 100,
      },
    })
    return response.data
  }

  const getById = async (documentId: string): Promise<FarmResponse> => {
    const response = await $fetch<FarmResponse>(`${baseUrl}/${documentId}`, {
      query: {
        populate: ['barangay', 'farmers', 'farm_parcels'],
      },
    })
    return response
  }

  return {
    getAll,
    getAllForSelect,
    getById,
  }
}