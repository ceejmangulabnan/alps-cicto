/**
 * Farm Parcel API Composable
 * Handles all farm-parcel related API calls
 */

export interface FarmParcel {
  documentId: string
  id: number
  parcel_code: string
  boundary_geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
  area_hectares: number
  land_status: 'Cultivated' | 'Preparation' | 'Harvesting' | 'Fallow' | 'Idle' | 'At Risk' | 'Converted'
  current_use: string
  farm: {
    documentId: string
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
  }
  planting_cycle?: any
  inspections?: any[]
}

export interface CreateFromMapData {
  farm: string // farm documentId
  boundary_geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
  land_status: FarmParcel['land_status']
  current_use?: string
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

export const useFarmParcelApi = () => {
  const baseUrl = '/api/farm-parcels'

  const createFromMap = async (data: CreateFromMapData): Promise<FarmParcelResponse> => {
    const response = await $fetch<FarmParcelResponse>(`${baseUrl}/from-map`, {
      method: 'POST',
      body: data,
    })
    return response
  }

  const getAll = async (params?: Record<string, any>): Promise<FarmParcelListResponse> => {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        }
      })
    }
    const response = await $fetch<FarmParcelListResponse>(`${baseUrl}?${query.toString()}`)
    return response
  }

  const getById = async (documentId: string): Promise<FarmParcelResponse> => {
    const response = await $fetch<FarmParcelResponse>(`${baseUrl}/${documentId}`, {
      query: {
        populate: ['farm', 'farm.barangay', 'farm.farmers', 'planting_cycle', 'inspections'],
      },
    })
    return response
  }

  return {
    createFromMap,
    getAll,
    getById,
  }
}