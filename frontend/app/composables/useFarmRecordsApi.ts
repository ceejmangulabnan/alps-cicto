import type {
    ParcelCrop,
    ParcelHarvest,
    ParcelPlantingCycle,
    ParcelRiskReport,
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'

export interface CreatePlantingCycleData {
    crop: string
    variety?: string | null
    planting_date?: string | null
    expected_harvest?: string | null
}

export interface CreateHarvestData {
    planting_cycle: string
    harvest_date: string
    production_kg?: number | null
    yield_per_hectare?: number | null
}

export interface CreateRiskReportData {
    farm_parcel: string
    risk_type: string
    observed_at: string
    severity: RiskSeverity
    parcel_status: RiskParcelStatus
}

/**
 * Write access to the history content types that hang off a parcel
 * (crop / planting-cycle / harvest / risk-report). Kept as one composable
 * because they are only ever written from the parcel hub; the read shapes come
 * from `useFarmParcelApi` so the two cannot drift. There is deliberately no
 * navigation here: POSTing returns the created document, which the hub
 * re-fetches wholesale rather than stitching in place.
 *
 * New documents are created published. Strapi 5 creates drafts by default, and
 * these records have no draft workflow — a draft harvest would simply vanish
 * from the hub's populate the moment it was saved.
 */
export const useFarmRecordsApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api`

    const getCrops = async (): Promise<ParcelCrop[]> => {
        const response = await authFetch<{ data: ParcelCrop[] }>(
            `${baseUrl}/crops?sort=name:asc&pagination[pageSize]=100`
        )
        return response.data
    }

    const createCrop = async (
        name: string,
        category: string
    ): Promise<ParcelCrop> => {
        const response = await authFetch<{ data: ParcelCrop }>(
            `${baseUrl}/crops?status=published`,
            {
                method: 'POST',
                body: {
                    data: {
                        name,
                        category: category || null,
                        publishedAt: new Date().toISOString(),
                    },
                },
            }
        )
        return response.data
    }

    const createPlantingCycle = async (
        data: CreatePlantingCycleData
    ): Promise<ParcelPlantingCycle> => {
        const response = await authFetch<{ data: ParcelPlantingCycle }>(
            `${baseUrl}/planting-cycles?status=published`,
            {
                method: 'POST',
                body: {
                    data: {
                        crop: data.crop,
                        variety: data.variety || null,
                        planting_date: data.planting_date || null,
                        expected_harvest: data.expected_harvest || null,
                        publishedAt: new Date().toISOString(),
                    },
                },
            }
        )
        return response.data
    }

    const createHarvest = async (
        data: CreateHarvestData
    ): Promise<ParcelHarvest> => {
        const response = await authFetch<{ data: ParcelHarvest }>(
            `${baseUrl}/harvests?status=published`,
            {
                method: 'POST',
                body: {
                    data: {
                        planting_cycle: data.planting_cycle,
                        harvest_date: data.harvest_date,
                        production_kg: data.production_kg ?? null,
                        yield_per_hectare: data.yield_per_hectare ?? null,
                        publishedAt: new Date().toISOString(),
                    },
                },
            }
        )
        return response.data
    }

    const createRiskReport = async (
        data: CreateRiskReportData
    ): Promise<ParcelRiskReport> => {
        const response = await authFetch<{ data: ParcelRiskReport }>(
            `${baseUrl}/risk-reports?status=published`,
            {
                method: 'POST',
                body: {
                    data: {
                        farm_parcel: data.farm_parcel,
                        risk_type: data.risk_type,
                        observed_at: data.observed_at,
                        severity: data.severity,
                        parcel_status: data.parcel_status,
                        publishedAt: new Date().toISOString(),
                    },
                },
            }
        )
        return response.data
    }

    return {
        getCrops,
        createCrop,
        createPlantingCycle,
        createHarvest,
        createRiskReport,
    }
}
