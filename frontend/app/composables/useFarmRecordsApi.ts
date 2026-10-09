import type {
    InspectionStatus,
    ParcelCrop,
    ParcelHarvest,
    ParcelInspection,
    ParcelInspectionPhoto,
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

export interface UpdateRiskReportData {
    /** The parcel the risk sits on, as a farm-parcel documentId. */
    farm_parcel?: string
    risk_type?: string
    observed_at?: string
    severity?: RiskSeverity
    parcel_status?: RiskParcelStatus
}

export interface CreateInspectionData {
    /** The parcel documentId the visit was carried out on. */
    parcel: string
    inspector: string
    date: string
    inspection_type: string
    /** The reports to file, one per risk the visit observed. */
    findings?: InspectionFindingInput[]
    status: InspectionStatus
    gps_point?: unknown
    notes?: string | null
    /** Uploaded media file ids to attach, in order. */
    photos?: number[]
}

/**
 * One risk the inspection observed. `reportDocumentId` points at the report the
 * finding already has (blank for a new one); the backend uses it to reconcile
 * the inspection's reports against this list, creating, updating and deleting
 * as needed. It is the only channel through which an inspection's risk reports
 * are written.
 */
export interface InspectionFindingInput {
    reportDocumentId?: string | null
    risk_type: string
    severity: RiskSeverity
}

export interface UpdateInspectionData {
    parcel?: string
    inspector?: string
    date?: string
    inspection_type?: string
    /** The full replacement list of findings (replace semantics). */
    findings?: InspectionFindingInput[]
    status?: InspectionStatus
    gps_point?: unknown
    notes?: string | null
    /**
     * The full replacement list of media file ids (replace semantics, like the
     * parcel farmers relation elsewhere). Empty array clears the photos.
     */
    photos?: number[]
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
     * `risk-report` is draftAndPublish and this page only ever reads the
     * published version, so the write is aimed at it explicitly rather than
     * left to whatever the default status happens to be. Mirrors the publish on
     * create above, which is what keeps an edit from stranding itself on a
     * version the risk page would never show.
     */
    const updateRiskReport = async (
        documentId: string,
        data: UpdateRiskReportData
    ): Promise<ParcelRiskReport> => {
        const response = await authFetch<{ data: ParcelRiskReport }>(
            `${baseUrl}/risk-reports/${documentId}?status=published`,
            {
                method: 'PUT',
                body: {
                    data: {
                        ...data,
                        publishedAt: new Date().toISOString(),
                    },
                },
            }
        )
        return response.data
    }

    const deleteRiskReport = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/risk-reports/delete/${documentId}`, {
            method: 'DELETE',
        })
    }

    /**
     * Inspections are `draftAndPublish: false`, so unlike the histories above
     * they are created directly without a publishedAt or status query. Photos
     * arrive as already-uploaded file ids and are connected on create.
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
                        status: data.status,
                        gps_point: toGpsPoint(data.gps_point),
                        notes: data.notes || null,
                        ...(data.findings !== undefined
                            ? { findings: data.findings }
                            : {}),
                        ...(data.photos?.length ? { photos: data.photos } : {}),
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
                        status: data.status,
                        gps_point: toGpsPoint(data.gps_point),
                        notes: data.notes || null,
                        ...(data.findings !== undefined
                            ? { findings: data.findings }
                            : {}),
                        ...(data.photos !== undefined
                            ? { photos: data.photos }
                            : {}),
                    },
                },
            }
        )
        return response.data
    }

    /**
     * Uploads raw files to Strapi's media library and returns the created
     * media records. The browser hands multipart form data to `authFetch`,
     * which lets ofetch set the boundary itself; no JSON body is involved.
     */
    const uploadPhotos = async (
        files: File[]
    ): Promise<ParcelInspectionPhoto[]> => {
        const formData = new FormData()
        files.forEach((file) => formData.append('files', file))
        return await authFetch<ParcelInspectionPhoto[]>(`${baseUrl}/upload`, {
            method: 'POST',
            body: formData,
        })
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
        updateRiskReport,
        deleteRiskReport,
        createInspection,
        updateInspection,
        deleteInspection,
        uploadPhotos,
    }
}
