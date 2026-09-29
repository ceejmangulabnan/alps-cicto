import type {
    InspectionStatus,
    ParcelCrop,
    ParcelHarvest,
    ParcelInspection,
    ParcelPlantingCycle,
    ParcelRiskReport,
    RiskInspectionLevel,
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

export interface CreateInspectionData {
    /** The parcel documentId the visit was carried out on. */
    parcel: string
    inspector: string
    date: string
    inspection_type: string
    risk_level: RiskInspectionLevel
    status: InspectionStatus
    gps_point?: unknown
    notes?: string | null
}

export interface UpdateInspectionData {
    parcel?: string
    inspector?: string
    date?: string
    inspection_type?: string
    risk_level?: RiskInspectionLevel
    status?: InspectionStatus
    gps_point?: unknown
    notes?: string | null
}

/**
 * The `gps_point` attribute is a JSON column that usually holds the free-text
 * coordinates an officer typed. A bare string is not valid JSON, so it has to
 * be JSON-encoded before it reaches the database; reading it back yields the
 * plain string again. Structured {lat, lng} objects pass through untouched.
 */
const toGpsPoint = (value: unknown): unknown => {
    if (value === null || value === undefined) return null
    return typeof value === 'string' ? JSON.stringify(value) : value
}

export interface UpdatePlantingCycleData {
    /** The new crop relation, as a crop documentId. */
    crop?: string
    variety?: string | null
    planting_date?: string | null
    expected_harvest?: string | null
}

export interface UpdateHarvestData {
    harvest_date?: string
    production_kg?: number | null
    yield_per_hectare?: number | null
}

/**
 * Write access to the history content types that hang off a parcel
 * (crop / planting-cycle / harvest / risk-report). Read shapes come from
 * `useFarmParcelApi` so the two cannot drift. There is deliberately no
 * navigation here: POSTing returns the created document, which the caller
 * re-fetches wholesale rather than stitching in place.
 *
 * Deletes go through the custom `.../delete/:documentId` routes: the stock
 * REST destroy action 403s on API-created documents (they carry no createdBy)
 * even though the destroy permission is granted, while the Document Service
 * behind the custom routes deletes them cleanly.
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

    const updatePlantingCycle = async (
        documentId: string,
        data: UpdatePlantingCycleData
    ): Promise<ParcelPlantingCycle> => {
        const response = await authFetch<{ data: ParcelPlantingCycle }>(
            `${baseUrl}/planting-cycles/${documentId}`,
            {
                method: 'PUT',
                body: {
                    data: {
                        ...(data.crop ? { crop: data.crop } : {}),
                        variety: data.variety || null,
                        planting_date: data.planting_date || null,
                        expected_harvest: data.expected_harvest || null,
                    },
                },
            }
        )
        return response.data
    }

    const deletePlantingCycle = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/planting-cycles/delete/${documentId}`, {
            method: 'DELETE',
        })
    }

    const updateHarvest = async (
        documentId: string,
        data: UpdateHarvestData
    ): Promise<ParcelHarvest> => {
        const response = await authFetch<{ data: ParcelHarvest }>(
            `${baseUrl}/harvests/${documentId}`,
            {
                method: 'PUT',
                body: { data },
            }
        )
        return response.data
    }

    const deleteHarvest = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/harvests/delete/${documentId}`, {
            method: 'DELETE',
        })
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

    /**
     * Inspections are `draftAndPublish: false`, so unlike the histories above
     * they are created directly without a publishedAt or status query.
     */
    const createInspection = async (
        data: CreateInspectionData
    ): Promise<ParcelInspection> => {
        const response = await authFetch<{ data: ParcelInspection }>(
            `${baseUrl}/inspections`,
            {
                method: 'POST',
                body: {
                    data: {
                        parcel: data.parcel,
                        inspector: data.inspector,
                        date: data.date,
                        inspection_type: data.inspection_type,
                        risk_level: data.risk_level,
                        status: data.status,
                        gps_point: toGpsPoint(data.gps_point),
                        notes: data.notes || null,
                    },
                },
            }
        )
        return response.data
    }

    const updateInspection = async (
        documentId: string,
        data: UpdateInspectionData
    ): Promise<ParcelInspection> => {
        const response = await authFetch<{ data: ParcelInspection }>(
            `${baseUrl}/inspections/${documentId}`,
            {
                method: 'PUT',
                body: {
                    data: {
                        ...(data.parcel ? { parcel: data.parcel } : {}),
                        inspector: data.inspector,
                        date: data.date,
                        inspection_type: data.inspection_type,
                        risk_level: data.risk_level,
                        status: data.status,
                        gps_point: toGpsPoint(data.gps_point),
                        notes: data.notes || null,
                    },
                },
            }
        )
        return response.data
    }

    const deleteInspection = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/inspections/delete/${documentId}`, {
            method: 'DELETE',
        })
    }

    return {
        getCrops,
        createCrop,
        createPlantingCycle,
        updatePlantingCycle,
        deletePlantingCycle,
        createHarvest,
        updateHarvest,
        deleteHarvest,
        createRiskReport,
        createInspection,
        updateInspection,
        deleteInspection,
    }
}
