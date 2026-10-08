<script setup lang="ts">
import type { HarvestRow } from '~/composables/useCycleRegistry'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { FIELD_CLASS } from '~/utils/formStyles'

/**
 * Correct a harvest's date, production and yield: the context label and the
 * update call live here; the page flips `show` with the row and reloads on
 * the `saved` event.
 */
interface Props {
    show: boolean
    row: HarvestRow | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { updateHarvest } = useFarmRecordsApi()

const form = reactive({
    harvest_date: '',
    production_kg: '',
    yield_per_hectare: '',
})

/** Yield is derived from production over area until the user types one. */

const yieldEdited = ref(false)

const contextLabel = computed(() =>
    props.row
        ? [props.row.parcel_code, props.row.crop, props.row.variety]
              .filter(Boolean)
              .join(' · ')
        : ''
)

const editArea = computed(() => props.row?.area_hectares ?? 0)

const productionNumber = computed(() => Number(form.production_kg))

watch(productionNumber, (value) => {
    if (yieldEdited.value || !Number.isFinite(value) || value <= 0) return

    if (editArea.value > 0) {
        form.yield_per_hectare = (value / editArea.value).toFixed(2)
    }
})

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
    failureMessage: 'Failed to update the harvest. Please try again.',
})

function reset() {
    const row = props.row

    form.harvest_date = row?.harvest_date ?? ''
    form.production_kg =
        row?.production_kg != null ? String(Number(row.production_kg)) : ''
    form.yield_per_hectare =
        row?.yield_per_hectare != null
            ? String(Number(row.yield_per_hectare))
            : ''

    yieldEdited.value = false
}

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.harvest_date) &&
        Number(form.production_kg) > 0
)

async function save() {
    const documentId = props.row?.documentId

    if (!documentId) return

    await updateHarvest(documentId, {
        harvest_date: form.harvest_date,
        production_kg: Number(form.production_kg) || null,
        yield_per_hectare: Number(form.yield_per_hectare) || null,
    })
}
</script>

<template>
    <ModalShell
        :show="props.show"
        icon="i-lucide-pencil"
        icon-class="bg-[#e0f0fb] text-[#1d6fa4]"
        title="Edit Harvest"
        subtitle="Correct the production and harvest date."
        :submitting="submitting"
        :saved="saved"
        saved-text="Harvest updated."
        :error="error"
        submit-label="Save Changes"
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <div class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
            <span class="font-semibold text-slate-800">
                {{ contextLabel }}
            </span>
        </div>

        <FormField label="Harvest Date" required>
            <input
                v-model="form.harvest_date"
                type="date"
                :disabled="submitting"
                :class="FIELD_CLASS"
            />
        </FormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Production (kg)" required>
                <input
                    v-model="form.production_kg"
                    type="number"
                    min="0"
                    step="any"
                    :disabled="submitting"
                    placeholder="e.g. 7400"
                    :class="`${FIELD_CLASS} placeholder:text-slate-400`"
                />
            </FormField>

            <FormField label="Yield (kg/ha)">
                <input
                    v-model="form.yield_per_hectare"
                    type="number"
                    min="0"
                    step="any"
                    :disabled="submitting"
                    placeholder="auto"
                    :class="`${FIELD_CLASS} placeholder:text-slate-400`"
                    @focus="yieldEdited = true"
                />
            </FormField>
        </div>
    </ModalShell>
</template>
