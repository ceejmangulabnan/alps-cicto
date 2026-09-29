<script setup lang="ts">
import type { FarmParcel, ParcelCrop } from '~/composables/useFarmParcelApi'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{
    modelValue: boolean
    parcel: FarmParcel
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    saved: []
}>()

const { update: updateParcel } = useFarmParcelApi()
const { getCrops, createCrop, createPlantingCycle } = useFarmRecordsApi()

interface CycleForm {
    crop: string
    newCropName: string
    variety: string
    planting_date: string
    expected_harvest: string
}

const form = reactive<CycleForm>({
    crop: '',
    newCropName: '',
    variety: '',
    planting_date: '',
    expected_harvest: '',
})

const crops = ref<ParcelCrop[]>([])
const cropsLoading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const cropOptions = computed(() =>
    crops.value.map((crop) => ({
        label: crop.name,
        value: crop.documentId,
    }))
)

/** Only one cycle can hang off a parcel, so logging again replaces the old one. */
const replacesExisting = computed(() => Boolean(props.parcel.planting_cycle))

const canSave = computed(
    () =>
        !submitting.value &&
        !cropsLoading.value &&
        (Boolean(form.crop) || Boolean(form.newCropName.trim()))
)

async function loadCrops() {
    cropsLoading.value = true
    try {
        crops.value = await getCrops()
    } catch {
        crops.value = []
        errorMessage.value =
            'Could not load the crop list. You can still name a new crop below.'
    } finally {
        cropsLoading.value = false
    }
}

function seedForm() {
    const cycle = props.parcel.planting_cycle
    form.crop = cycle?.crop?.documentId ?? ''
    form.newCropName = ''
    form.variety = cycle?.variety ?? ''
    form.planting_date = cycle?.planting_date ?? ''
    form.expected_harvest = cycle?.expected_harvest ?? ''
    errorMessage.value = null
}

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

// The component stays mounted for the parcel's lifetime; seed and reload the
// crop list on every open so fields and options stay current.
watch(
    () => props.modelValue as boolean,
    async (open) => {
        if (!open) return
        seedForm()
        await loadCrops()
    },
    { immediate: true }
)

/**
 * A typed name wins over a selection: naming a new crop is the explicit act,
 * while a leftover selection is just a default. This keeps "type a crop that
 * isn't listed" usable when the list is a stub.
 */
async function resolveCrop(): Promise<string> {
    const newName = form.newCropName.trim()
    if (newName) {
        const created = await createCrop(newName, '')
        return created.documentId
    }
    return form.crop
}

async function submit() {
    errorMessage.value = null
    submitting.value = true
    try {
        const crop = await resolveCrop()
        const cycle = await createPlantingCycle({
            crop,
            variety: form.variety.trim() || null,
            planting_date: form.planting_date || null,
            expected_harvest: form.expected_harvest || null,
        })

        await updateParcel(props.parcel.documentId, {
            planting_cycle: cycle.documentId,
        })

        emit('saved')
        close()
    } catch (value: unknown) {
        errorMessage.value = getErrorMessage(
            value,
            'Failed to log the planting cycle. Please try again.'
        )
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            @click.self="close"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 font-sans shadow-xl"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">
                            Log Planting Cycle
                        </h3>
                        <p class="text-xs text-gray-500">
                            Crop, variety and planting dates.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        :disabled="submitting"
                        @click="close"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <p
                    v-if="replacesExisting"
                    class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                >
                    This parcel already has a crop cycle on record. Saving
                    replaces it.
                </p>

                <form class="space-y-4" @submit.prevent="submit">
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Crop
                        </label>
                        <USelectMenu
                            v-model="form.crop"
                            :items="cropOptions"
                            :loading="cropsLoading"
                            :disabled="submitting || cropsLoading"
                            value-key="value"
                            placeholder="Select a crop"
                            class="w-full"
                        />
                        <p
                            v-if="!cropsLoading && crops.length === 0"
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            No crops registered — name one below.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            …or name a new crop
                        </label>
                        <input
                            v-model="form.newCropName"
                            type="text"
                            :disabled="submitting"
                            placeholder="e.g. Mung Bean"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                        <p class="mt-1 text-[11px] text-gray-400">
                            Typing a name creates the crop and uses it for this
                            cycle.
                        </p>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Variety
                        </label>
                        <input
                            v-model="form.variety"
                            type="text"
                            :disabled="submitting"
                            placeholder="e.g. NSIC Rc222"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Planting date
                            </label>
                            <input
                                v-model="form.planting_date"
                                type="date"
                                :disabled="submitting"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Expected harvest
                            </label>
                            <input
                                v-model="form.expected_harvest"
                                type="date"
                                :disabled="submitting"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            />
                        </div>
                    </div>

                    <p
                        v-if="errorMessage"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ errorMessage }}
                    </p>

                    <div class="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            :disabled="submitting"
                            @click="close"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSave"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submitting ? 'Saving...' : 'Save Cycle' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
