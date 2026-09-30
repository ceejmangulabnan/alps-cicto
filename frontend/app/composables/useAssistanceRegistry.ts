import type { AssistanceStatus } from '~/composables/useAssistanceApi'
import { getErrorMessage } from '~/utils/apiError'

/**
 * An assistance record as the assistance page needs it. The program belongs to
 * a farmer rather than to a parcel, so the row carries the farmer and the
 * barangay the release was received in — the same flattening the cycle registry
 * does for harvests, but rooted on the farmer instead of on a parcel.
 */
export interface AssistanceRow {
    documentId: string
    /** The generated AST-<year>-<sequence> identifier officers read off. */
    reference_code: string
    program: string
    recipient: string
    farmer_code: string
    farmerDocumentId: string
    barangay: string
    barangayDocumentId: string
    items: string
    /** Normalised to a number, so the totals never add strings. */
    value: number
    date: string | null
    status: AssistanceStatus
}

export interface AssistanceOption {
    value: string
    label: string
}

/**
 * One `load()` serves the table, the KPIs and the form's recipient and barangay
 * selectors: the assistance list carries the farmer and barangay of every row,
 * and the two lookups are the same collections the farmer and farm forms read,
 * so nothing here can drift from them.
 */
export const useAssistanceRegistry = () => {
    const programs = ref<AssistanceRow[]>([])
    const farmers = ref<AssistanceOption[]>([])
    const barangays = ref<AssistanceOption[]>([])
    const loading = ref(false)
    const loadError = ref<string | null>(null)

    const load = async (): Promise<void> => {
        loading.value = true
        loadError.value = null
        try {
            const { getAll } = useAssistanceApi()
            const { getAllForSelect: getAllFarmers } = useFarmersApi()
            const { getAllForSelect: getAllBarangays } = useBarangayApi()

            const [assistance, farmerRows, barangayRows] = await Promise.all([
                // Newest first, so the table reads as a log rather than a backlog.
                getAll({ sort: 'date:desc' }),
                getAllFarmers(),
                getAllBarangays(),
            ])

            programs.value = assistance.data.map((row) => ({
                documentId: row.documentId,
                reference_code: row.reference_code,
                program: row.program,
                recipient: row.farmer?.name ?? '',
                farmer_code: row.farmer?.farmer_code ?? '',
                farmerDocumentId: row.farmer?.documentId ?? '',
                barangay: row.barangay?.name ?? '',
                barangayDocumentId: row.barangay?.documentId ?? '',
                items: row.items ?? '',
                value: Number(row.value) || 0,
                date: row.date ?? null,
                status: row.status ?? 'Pending',
            }))

            farmers.value = farmerRows.map((farmer) => ({
                value: farmer.documentId,
                label: [farmer.farmer_code, farmer.name]
                    .filter(Boolean)
                    .join(' · '),
            }))

            barangays.value = barangayRows.map((barangay) => ({
                value: barangay.documentId,
                label: barangay.name,
            }))
        } catch (cause) {
            loadError.value = getErrorMessage(
                cause,
                'Could not load the assistance records. Please try again.'
            )
        } finally {
            loading.value = false
        }
    }

    /**
     * The program names already in use, offered as suggestions. The field stays
     * free text — a new program name must be typeable on a registry that has
     * never recorded one.
     */
    const programOptions = computed<string[]>(() =>
        [
            ...new Set(
                programs.value.map((row) => row.program).filter(Boolean)
            ),
        ].sort()
    )

    return {
        programs,
        farmers,
        barangays,
        programOptions,
        loading,
        loadError,
        load,
    }
}
