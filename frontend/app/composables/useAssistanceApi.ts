import qs from 'qs'

/** A farmer as an assistance row needs them: identity for the avatar column. */
export interface AssistanceFarmer {
    documentId: string
    farmer_code: string
    name: string
}

export interface AssistanceBarangay {
    documentId: string
    name: string
    code: string
}

export const ASSISTANCE_STATUS_OPTIONS = [
    'Pending',
    'For Release',
    'Released',
    'Scheduled',
] as const

export type AssistanceStatus = (typeof ASSISTANCE_STATUS_OPTIONS)[number]

/**
 * A seed, fertilizer, machinery or training release logged against a farmer.
 * Unlike the parcel-hosted histories this record stands on its own: it belongs
 * to a person, not to a parcel, so it carries its own program name rather than
 * a relation to a cycle or a parcel.
 *
 * `reference_code` is generated server-side on create (AST-<year>-<sequence>),
 * the way `farmer_code` and `parcel_code` are, so it is never sent on a write.
 */
export interface AssistanceProgram {
    documentId: string
    id?: number
    reference_code: string
    program: string
    items?: string | null
    /** Strapi `decimal`; loose so a string response cannot break a render. */
    value?: number | string | null
    date?: string | null
    status?: AssistanceStatus | null
    farmer?: AssistanceFarmer | null
    barangay?: AssistanceBarangay | null
}

export interface AssistanceProgramResponse {
    data: AssistanceProgram
}

export interface AssistanceProgramListResponse {
    data: AssistanceProgram[]
    meta: {
        pagination: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

export type AssistanceProgramQuery = Record<
    string,
    string | number | boolean | string[] | undefined | null
>

export interface CreateAssistanceProgramData {
    program: string
    /** The receiving farmer, as a farmer documentId. */
    farmer: string
    /** The receiving farmer's barangay, as a barangay documentId. */
    barangay?: string | null
    items?: string | null
    value?: number | null
    date: string
    status: AssistanceStatus
}

export interface UpdateAssistanceProgramData {
    program?: string
    farmer?: string
    barangay?: string | null
    items?: string | null
    value?: number | null
    date?: string
    status?: AssistanceStatus
}

/**
 * The relation shape one assistance program needs to be usable on its own: the
 * farmer and the barangay are both rendered in the table and both are read back
 * by the edit form, so a write that returned them unpopulated would leave the
 * next edit of that row unable to prefill.
 */
const ASSISTANCE_POPULATE = {
    farmer: {
        fields: ['farmer_code', 'name'],
    },
    barangay: {
        fields: ['name', 'code'],
    },
} as const

const populateQuery = qs.stringify(
    { populate: ASSISTANCE_POPULATE },
    { encodeValuesOnly: true }
)

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

const createQuery = (
    params: AssistanceProgramQuery = {},
    page?: number
): URLSearchParams => {
    // The populate is fixed by this composable rather than left to the caller:
    // every assistance view needs the farmer and the barangay, and a caller
    // passing its own `populate` would only be able to drop them.
    const query = new URLSearchParams(populateQuery)
    Object.entries(params).forEach(([key, value]) =>
        appendQuery(query, key, value)
    )

    if (!query.has('pagination[pageSize]')) {
        query.set('pagination[pageSize]', String(MAX_PAGE_SIZE))
    }
    if (page !== undefined) query.set('pagination[page]', String(page))

    return query
}

/**
 * Read and write access to the assistance programs.
 *
 * Deletes go through the custom `.../delete/:documentId` route: the stock REST
 * destroy action 403s on API-created documents (they carry no createdBy) even
 * though the destroy permission is granted, while the Document Service behind
 * the custom route deletes them cleanly.
 *
 * The content type is `draftAndPublish: false`, so creates are plain POSTs with
 * no publishedAt — there is no draft to publish and no draft workflow to
 * bypass.
 */
export const useAssistanceApi = () => {
    const config = useRuntimeConfig()
    const { authFetch } = useAuth()
    const baseUrl = `${String(config.public.strapiUrl || '').replace(/\/$/, '')}/api/assistance-programs`

    const fetchPage = async (
        params: AssistanceProgramQuery,
        page: number
    ): Promise<AssistanceProgramListResponse> => {
        const query = createQuery(params, page)
        return await authFetch<AssistanceProgramListResponse>(
            `${baseUrl}?${query.toString()}`
        )
    }

    /** Every assistance program, walking the pages Strapi's limit implies. */
    const getAll = async (
        params: AssistanceProgramQuery = {}
    ): Promise<AssistanceProgramListResponse> => {
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
                pagination: { ...pagination, page: 1, pageCount: 1 },
            },
        }
    }

    const create = async (
        data: CreateAssistanceProgramData
    ): Promise<AssistanceProgram> => {
        const response = await authFetch<AssistanceProgramResponse>(baseUrl, {
            method: 'POST',
            body: {
                data: {
                    program: data.program,
                    farmer: data.farmer,
                    barangay: data.barangay || null,
                    items: data.items || null,
                    value: data.value ?? null,
                    date: data.date,
                    status: data.status,
                },
            },
        })
        return response.data
    }

    const update = async (
        documentId: string,
        data: UpdateAssistanceProgramData
    ): Promise<AssistanceProgram> => {
        const response = await authFetch<AssistanceProgramResponse>(
            `${baseUrl}/${documentId}`,
            {
                method: 'PUT',
                body: {
                    data: {
                        ...(data.program !== undefined
                            ? { program: data.program }
                            : {}),
                        ...(data.farmer ? { farmer: data.farmer } : {}),
                        ...(data.barangay !== undefined
                            ? { barangay: data.barangay }
                            : {}),
                        ...(data.items !== undefined
                            ? { items: data.items }
                            : {}),
                        ...(data.value !== undefined
                            ? { value: data.value }
                            : {}),
                        ...(data.date !== undefined ? { date: data.date } : {}),
                        ...(data.status !== undefined
                            ? { status: data.status }
                            : {}),
                    },
                },
            }
        )
        return response.data
    }

    const deleteProgram = async (documentId: string): Promise<void> => {
        await authFetch(`${baseUrl}/delete/${documentId}`, {
            method: 'DELETE',
        })
    }

    return { getAll, create, update, deleteProgram }
}
