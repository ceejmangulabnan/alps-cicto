import type { ParcelCrop } from '~/composables/useFarmParcelApi'
import { computed, ref } from 'vue'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { getErrorMessage } from '~/utils/apiError'

/**
 * The crop list behind the "select a crop" dropdowns, plus the rule that a
 * typed name creates the crop on save. Both planting-cycle forms need it, so
 * the list, its load state and the create-on-the-fly rule live here rather
 * than inlined twice.
 */
export function useCropOptions() {
    const { getCrops, createCrop } = useFarmRecordsApi()

    const crops = ref<ParcelCrop[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const options = computed(() =>
        crops.value.map((crop) => ({
            label: crop.name,
            value: crop.documentId,
        }))
    )

    async function load() {
        loading.value = true
        error.value = null

        try {
            crops.value = await getCrops()
        } catch (cause) {
            crops.value = []
            error.value = getErrorMessage(
                cause,
                'Could not load the crop list. You can still name a new crop below.'
            )
        } finally {
            loading.value = false
        }
    }

    /** Loads the list on first open; later opens reuse what is cached. */
    function ensureLoaded() {
        if (crops.value.length === 0) load()
    }

    /** A typed name wins over a selection: naming a new crop is the explicit act. */
    async function resolve(
        cropId: string,
        newCropName: string
    ): Promise<string> {
        const name = newCropName.trim()

        if (name) {
            const created = await createCrop(name, '')

            return created.documentId
        }

        return cropId
    }

    return { crops, loading, error, options, load, ensureLoaded, resolve }
}
