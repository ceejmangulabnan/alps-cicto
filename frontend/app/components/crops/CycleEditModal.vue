<script setup lang="ts">
import type { CycleRow } from '~/composables/useCycleRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { FIELD_CLASS } from '~/utils/formStyles'

/**
 * Edit an existing planting cycle: the parcel is shown as a label (a cycle
 * cannot move), the crop list and the update call live here. The page flips
 * `show` with the row to edit and reloads on `saved`.
 */
interface Props {
    show: boolean
    row: CycleRow | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { updatePlantingCycle } = useFarmRecordsApi()

const {
    crops,
    loading: cropsLoading,
    options: cropOptions,
    ensureLoaded,
    resolve: resolveCrop,
} = useCropOptions()

const form = reactive({
    crop: '',
    newCropName: '',
    variety: '',
    planting_date: '',
    expected_harvest: '',
})

const parcelLabel = computed(() =>
    props.row ? `${props.row.parcel_code} · ${props.row.barangay}` : ''
)

const harvestCount = computed(() => props.row?.cycle.harvests?.length ?? 0)

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
    failureMessage: 'Failed to update the planting cycle. Please try again.',
})

function reset() {
    const cycle = props.row?.cycle

    form.crop = cycle?.crop?.documentId ?? ''
    form.newCropName = ''
    form.variety = cycle?.variety ?? ''
    form.planting_date = cycle?.planting_date ?? ''
    form.expected_harvest = cycle?.expected_harvest ?? ''

    ensureLoaded()
}

const canSave = computed(
    () =>
        !submitting.value &&
        !cropsLoading.value &&
        (Boolean(form.crop) || Boolean(form.newCropName.trim()))
)

async function save() {
    const cycleDocumentId = props.row?.cycle.documentId

    if (!cycleDocumentId) return

    const crop = await resolveCrop(form.crop, form.newCropName)

    await updatePlantingCycle(cycleDocumentId, {
        crop,
        variety: form.variety.trim() || null,
        planting_date: form.planting_date || null,
        expected_harvest: form.expected_harvest || null,
    })
}
</script>

<template>
    <ModalShell
        :show="props.show"
        icon="i-lucide-pencil"
        icon-class="bg-[#e0f0fb] text-[#1d6fa4]"
        title="Edit Planting Cycle"
        subtitle="Update the crop and planting dates."
        :submitting="submitting"
        :saved="saved"
        saved-text="Planting cycle updated."
        :error="error"
        submit-label="Save Changes"
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <div class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
            <span class="font-semibold text-slate-800">
                {{ parcelLabel }}
            </span>
        </div>

        <p
            v-if="harvestCount > 0"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            This cycle already has {{ harvestCount }} harvest record(s).
            Changing the crop relabels them.
        </p>

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

        <FormField label="…or name a new crop">
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
