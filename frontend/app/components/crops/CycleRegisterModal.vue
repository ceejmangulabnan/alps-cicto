<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { useFarmParcelApi } from '~/composables/useFarmParcelApi'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { FIELD_CLASS } from '~/utils/formStyles'

/**
 * Register a planting cycle against a parcel: form state, the crop list and
 * the create/attach calls all live here; the page just flips `show` and
 * reloads on the `saved` event.
 */
interface Props {
    show: boolean
    parcels: FarmParcel[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { update: updateParcel } = useFarmParcelApi()
const { createPlantingCycle } = useFarmRecordsApi()

const {
    crops,
    loading: cropsLoading,
    options: cropOptions,
    ensureLoaded,
    resolve: resolveCrop,
} = useCropOptions()

const form = reactive({
    parcel: '',
    crop: '',
    newCropName: '',
    variety: '',
    planting_date: '',
    expected_harvest: '',
})

const parcelOptions = computed(() =>
    props.parcels.map((parcel) => {
        const parts = [
            parcel.parcel_code,
            parcel.farm?.barangay?.name ?? '',
            `${(Number(parcel.area_hectares) || 0).toFixed(1)} ha`,
        ].filter(Boolean)

        return { value: parcel.documentId, label: parts.join(' · ') }
    })
)

const selectedParcel = computed(
    () => props.parcels.find((p) => p.documentId === form.parcel) ?? null
)

/** A parcel can hold one cycle, so registering again replaces the old one. */

const replacesExisting = computed(() =>
    Boolean(selectedParcel.value?.planting_cycle)
)

const open = computed({
    get: () => props.show,
    set: (value: boolean) => {
        if (!value) emit('close')
    },
})

const { submitting, error, saved, close, submit } = useCrudModal(open, {
    submit: save,
    onSaved: () => emit('saved'),
    onOpen: reset,
    failureMessage: 'Failed to log the planting cycle. Please try again.',
})

function reset() {
    form.parcel = props.parcels[0]?.documentId ?? ''
    form.crop = ''
    form.newCropName = ''
    form.variety = ''
    form.planting_date = ''
    form.expected_harvest = ''

    ensureLoaded()
}

const canSave = computed(
    () =>
        !submitting.value &&
        !cropsLoading.value &&
        Boolean(form.parcel) &&
        (Boolean(form.crop) || Boolean(form.newCropName.trim()))
)

/** A parcel holds one cycle, so a registration attaches it in one update. */

async function save() {
    const parcelDocumentId = form.parcel

    const crop = await resolveCrop(form.crop, form.newCropName)

    const cycle = await createPlantingCycle({
        crop,
        variety: form.variety.trim() || null,
        planting_date: form.planting_date || null,
        expected_harvest: form.expected_harvest || null,
    })

    await updateParcel(parcelDocumentId, { planting_cycle: cycle.documentId })
}
</script>

<template>
    <ModalShell
        :show="props.show"
        icon="i-lucide-sprout"
        icon-class="bg-[#e8f5e8] text-[#2d6a2d]"
        title="Register Planting Cycle"
        subtitle="Log a planting cycle against a parcel."
        :submitting="submitting"
        :saved="saved"
        saved-text="Planting cycle logged."
        :error="error"
        submit-label="Register Planting Cycle"
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <p
            v-if="replacesExisting"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            This parcel already has a crop cycle on record. Saving replaces it.
        </p>

        <FormField
            label="Parcel"
            required
            :hint="
                props.parcels.length === 0
                    ? 'No parcels registered yet.'
                    : undefined
            "
        >
            <select
                v-model="form.parcel"
                :disabled="submitting"
                :class="FIELD_CLASS"
            >
                <option value="" disabled>Select a parcel</option>
                <option
                    v-for="option in parcelOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </FormField>

        <FormField
            label="Crop"
            required
            :hint="
                !cropsLoading && crops.length === 0
                    ? 'No crops registered — name one below.'
                    : undefined
            "
        >
            <select
                v-model="form.crop"
                :disabled="submitting || cropsLoading"
                :class="FIELD_CLASS"
            >
                <option value="" disabled>Select a crop</option>
                <option
                    v-for="option in cropOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </FormField>

        <FormField
            label="…or name a new crop"
            hint="Typing a name creates the crop and uses it for this cycle."
        >
            <input
                v-model="form.newCropName"
                type="text"
                :disabled="submitting"
                placeholder="e.g. Mung Bean"
                :class="`${FIELD_CLASS} placeholder:text-slate-400`"
            />
        </FormField>

        <FormField label="Variety">
            <input
                v-model="form.variety"
                type="text"
                :disabled="submitting"
                placeholder="e.g. NSIC Rc222"
                :class="`${FIELD_CLASS} placeholder:text-slate-400`"
            />
        </FormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Planting Date">
                <input
                    v-model="form.planting_date"
                    type="date"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                />
            </FormField>

            <FormField label="Expected Harvest">
                <input
                    v-model="form.expected_harvest"
                    type="date"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                />
            </FormField>
        </div>
    </ModalShell>
</template>
