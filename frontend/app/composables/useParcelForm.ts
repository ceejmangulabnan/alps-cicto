import type { Farm } from '~/composables/useFarmsApi'
import type { Farmer } from '~/composables/useFarmersApi'
import type { FarmParcel, LandStatus } from '~/composables/useFarmParcelApi'
import type { ParcelDrawing } from '~/composables/useParcelDrawing'
import { getErrorMessage } from '~/utils/apiError'
import { calculateAreaHectares } from '~/utils/parcelGeometry'

/** How long the success confirmation stays up before the sidebar closes. */
const CLOSE_AFTER_SUCCESS_MS = 1200

export interface ParcelFormProps {
    /** The parcel being edited, or null while adding a new one. */
    parcel: FarmParcel | null
    farms: Farm[]
    drawing: ParcelDrawing
    isEditing: boolean
}

export interface ParcelFormState {
    farm: string
    parcel_code: string
    land_status: LandStatus
    current_use: string
    /** Farmer documentIds tending this parcel. */
    farmers: string[]
}

/** Events the sidebar form raises. Declared here, emitted from the component. */
export interface ParcelFormEmit {
    (event: 'close'): void
    (event: 'saved', parcel: FarmParcel): void
}

/**
 * Owns the sidebar's form state and its submit. Area is derived from the
 * polygon currently on the map rather than stored, so it stays in step with
 * vertex edits without any explicit syncing.
 */
export const useParcelForm = (props: ParcelFormProps, emit: ParcelFormEmit) => {
    const { createFromMap, update: updateParcel } = useFarmParcelApi()
    const { getAllForSelect: getFarmers } = useFarmersApi()
    const { drawing } = props

    const form = reactive<ParcelFormState>({
        farm: '',
        parcel_code: '',
        land_status: 'Cultivated',
        current_use: '',
        farmers: [],
    })

    const farmers = ref<Farmer[]>([])
    const farmersLoading = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const success = ref<string | null>(null)

    // The farmer registry code is backend-generated, so the option is the name.
    const farmerOptions = computed(() =>
        farmers.value.map((farmer) => ({
            label: farmer.name,
            value: farmer.documentId,
        }))
    )

    /**
     * Last area we knew for the active polygon. Committing a draft hands the
     * geometry over to a feature with a real id, so the derived value goes
     * away while the success confirmation is still on screen.
     */
    const frozenAreaHectares = ref('')

    const hasGeometry = computed(() => drawing.activePolygon.value !== null)

    const areaHectares = computed(() =>
        drawing.activePolygon.value
            ? calculateAreaHectares(drawing.activePolygon.value).toFixed(4)
            : frozenAreaHectares.value
    )

    const title = computed(() =>
        props.isEditing ? 'Edit Parcel' : 'New Parcel'
    )

    const subtitle = computed(() =>
        props.isEditing
            ? 'Update the parcel details for this farmland.'
            : 'Fill in the parcel details, then plot it on the map.'
    )

    const canSave = computed(
        () =>
            !loading.value &&
            !farmersLoading.value &&
            Boolean(form.farm) &&
            Boolean(form.land_status) &&
            hasGeometry.value
    )

    const hint = computed(() =>
        props.isEditing
            ? 'Changes are saved to the parcel record.'
            : 'Click the map to drop points — click the first point again to close the parcel.'
    )

    const submitLabel = computed(() =>
        loading.value
            ? 'Saving...'
            : props.isEditing
              ? 'Save Changes'
              : 'Save Parcel'
    )

    function clearMessages() {
        error.value = null
        success.value = null
    }

    // Loaded once for the sidebar's lifetime rather than per save, since the
    // farmer registry changes independently of the parcel being edited.
    async function loadFarmers() {
        farmersLoading.value = true
        try {
            farmers.value = await getFarmers()
        } catch {
            // A parcel can still be saved without tendees, so this only costs the
            // ability to assign them here.
            farmers.value = []
        } finally {
            farmersLoading.value = false
        }
    }

    function resetForm() {
        form.farm = ''
        form.parcel_code = ''
        form.land_status = 'Cultivated'
        form.current_use = ''
        form.farmers = []
        frozenAreaHectares.value = ''
    }

    function loadParcelIntoForm(parcel: FarmParcel) {
        form.farm = parcel.farm?.documentId ?? ''
        form.parcel_code = parcel.parcel_code
        form.land_status = parcel.land_status
        form.current_use = parcel.current_use ?? ''
        form.farmers = (parcel.farmers ?? []).map((farmer) => farmer.documentId)
    }

    /**
     * Which parcel the form is currently loaded with, or null for the add flow.
     * `undefined` means "not loaded yet", so the first watcher run always fires.
     */
    const loadedDocumentId = ref<string | null | undefined>(undefined)

    // Covers first open, switching between parcels while the sidebar is up, and
    // returning to the add flow from an edit.
    watch(
        () => [props.parcel, props.isEditing] as const,
        ([parcel, isEditing]) => {
            const documentId = isEditing ? (parcel?.documentId ?? null) : null
            const isNewSubject = documentId !== loadedDocumentId.value
            loadedDocumentId.value = documentId

            if (parcel) {
                // Always reload, so a save's server echo refreshes the fields.
                loadParcelIntoForm(parcel)
            } else if (isNewSubject) {
                resetForm()
            }

            // A save echoes the same parcel back; clearing then would wipe the
            // success message the save just set.
            if (isNewSubject) clearMessages()
        },
        { immediate: true }
    )

    async function handleSave() {
        clearMessages()

        if (!form.farm) {
            error.value = 'Please select a farm'
            return
        }
        if (!form.land_status) {
            error.value = 'Please select a land status'
            return
        }

        const editingId = props.isEditing
            ? drawing.selectedParcelId.value
            : null
        const targetId = editingId ?? drawing.draftFeatureId.value
        const boundary =
            targetId === null ? null : drawing.getFeatureGeometry(targetId)

        if (!boundary) {
            error.value = props.isEditing
                ? 'No parcel boundary is available.'
                : 'No parcel drawn on the map. Please draw a parcel first.'
            return
        }

        const areaHectares = calculateAreaHectares(boundary)
        loading.value = true

        try {
            if (editingId) {
                const response = await updateParcel(editingId, {
                    farm: form.farm,
                    boundary_geojson: boundary,
                    land_status: form.land_status,
                    current_use: form.current_use,
                    area_hectares: areaHectares,
                    farmers: form.farmers,
                })
                const updated = response.data

                drawing.syncParcel(updated)
                frozenAreaHectares.value = areaHectares.toFixed(4)
                success.value = `Parcel ${updated.parcel_code} updated successfully!`
                emit('saved', updated)
                return
            }

            const response = await createFromMap({
                farm: form.farm,
                boundary_geojson: boundary,
                land_status: form.land_status,
                current_use: form.current_use,
                area_hectares: areaHectares,
                farmers: form.farmers,
            })
            const created = response.data

            drawing.commitDraft(created)
            frozenAreaHectares.value = areaHectares.toFixed(4)
            success.value = `Parcel ${created.parcel_code} created successfully!`
            emit('saved', created)
            setTimeout(() => emit('close'), CLOSE_AFTER_SUCCESS_MS)
        } catch (value: unknown) {
            error.value = getErrorMessage(
                value,
                props.isEditing
                    ? 'Failed to update parcel. Please try again.'
                    : 'Failed to create parcel. Please try again.'
            )
        } finally {
            loading.value = false
        }
    }

    void loadFarmers()

    return {
        form,
        loading,
        farmers,
        farmerOptions,
        farmersLoading,
        error,
        success,
        areaHectares,
        canSave,
        title,
        subtitle,
        hint,
        submitLabel,
        handleSave,
    }
}
