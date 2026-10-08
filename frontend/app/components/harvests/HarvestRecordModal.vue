<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import { todayUtc } from '~/utils/format'
import { FIELD_CLASS } from '~/utils/formStyles'

/**
 * Record a harvest against an active planting cycle: form state, the parcel
 * options and the create call live here; the page flips `show` and reloads on
 * the `saved` event.
 */
interface Props {
    show: boolean
    cycleParcels: FarmParcel[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { createHarvest } = useFarmRecordsApi()

const form = reactive({
    parcelDocumentId: '',
    harvest_date: '',
    production_kg: '',
    yield_per_hectare: '',
})

/** Yield is derived from production over area until the user types one. */

const yieldEdited = ref(false)

const parcelOptions = computed(() =>
    props.cycleParcels.map((parcel) => {
        const parts = [
            parcel.parcel_code,
            parcel.planting_cycle?.crop?.name ?? '',
            parcel.planting_cycle?.variety ?? '',
        ].filter(Boolean)

        return { value: parcel.documentId, label: parts.join(' · ') }
    })
)

const selectedParcel = computed(
    () =>
        props.cycleParcels.find(
            (p) => p.documentId === form.parcelDocumentId
        ) ?? null
)

const recordArea = computed(
    () => Number(selectedParcel.value?.area_hectares) || 0
)

const recordCycle = computed(() => selectedParcel.value?.planting_cycle ?? null)

const productionNumber = computed(() => Number(form.production_kg))

watch(productionNumber, (value) => {
    if (yieldEdited.value || !Number.isFinite(value) || value <= 0) return

    if (recordArea.value > 0) {
        form.yield_per_hectare = (value / recordArea.value).toFixed(2)
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
    failureMessage: 'Failed to record the harvest. Please try again.',
})

function reset() {
    form.parcelDocumentId = props.cycleParcels[0]?.documentId ?? ''
    form.harvest_date = todayUtc()
    form.production_kg = ''
    form.yield_per_hectare = ''

    yieldEdited.value = false
}

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.parcelDocumentId) &&
        Boolean(form.harvest_date) &&
        Number(form.production_kg) > 0
)

async function save() {
    const cycle = recordCycle.value

    if (!cycle) return

    await createHarvest({
        planting_cycle: cycle.documentId,
        harvest_date: form.harvest_date,
        production_kg: Number(form.production_kg),
        yield_per_hectare: Number(form.yield_per_hectare) || null,
    })
}
</script>

<template>
    <ModalShell
        :show="props.show"
        icon="i-lucide-wheat"
        icon-class="bg-[#e8f5e8] text-[#2d6a2d]"
        title="Record Harvest"
        subtitle="Log a harvest against an active planting cycle."
        :submitting="submitting"
        :saved="saved"
        saved-text="Harvest recorded."
        :error="error"
        submit-label="Record Harvest"
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <p
            v-if="cycleParcels.length === 0"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            No parcels have a planting cycle yet. Register a cycle first, then
            record its harvest here.
        </p>

        <FormField
            :label="
                cycleParcels.length > 0 ? 'Parcel (planting cycle)' : 'Parcel'
            "
            :required="cycleParcels.length > 0"
            :hint="
                recordArea > 0
                    ? `${recordArea.toFixed(2)} ha · yield is derived from production per hectare.`
                    : undefined
            "
        >
            <select
                v-model="form.parcelDocumentId"
                :disabled="submitting || cycleParcels.length === 0"
                :class="FIELD_CLASS"
            >
                <option value="" disabled>Select a parcel with a cycle</option>
                <option
                    v-for="option in parcelOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </FormField>

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
