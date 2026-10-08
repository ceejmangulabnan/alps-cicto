<script setup lang="ts">
import type {
    AssistanceRow,
    AssistanceOption,
} from '~/composables/useAssistanceRegistry'
import {
    ASSISTANCE_STATUS_OPTIONS,
    useAssistanceApi,
    type AssistanceStatus,
} from '~/composables/useAssistanceApi'
import { todayUtc } from '~/utils/format'
import { FIELD_CLASS } from '~/utils/formStyles'

/**
 * The single create/edit form for assistance records: `mode` picks the title,
 * submit copy and whether the row seeds the fields. Form state, the recipient
 * and barangay selectors and the save call live here; the page flips `show`
 * and reloads on `saved`.
 */
interface Props {
    show: boolean
    mode: 'create' | 'edit'
    /** Edit target; unused in create mode. */
    row?: AssistanceRow | null
    farmers: AssistanceOption[]
    barangays: AssistanceOption[]
    programOptions: string[]
}

const props = withDefaults(defineProps<Props>(), {
    row: null,
})

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { create, update } = useAssistanceApi()

const form = reactive({
    program: '',
    farmerDocumentId: '',
    barangayDocumentId: '',
    items: '',
    /** v-model casts the number input, so this is a string only while blank. */
    value: '' as string | number,
    date: todayUtc(),
    status: 'Pending' as AssistanceStatus,
})

const datalistId = computed(() =>
    props.mode === 'create'
        ? 'assist-program-options'
        : 'assist-program-options-edit'
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
    failureMessage:
        props.mode === 'create'
            ? 'Failed to record the assistance. Please try again.'
            : 'Failed to update the assistance. Please try again.',
})

function reset() {
    const row = props.mode === 'edit' ? props.row : null

    form.program = row?.program ?? ''
    form.farmerDocumentId = row?.farmerDocumentId ?? ''
    form.barangayDocumentId = row?.barangayDocumentId ?? ''
    form.items = row?.items ?? ''
    form.value = row && row.value > 0 ? String(row.value) : ''
    form.date = row ? (row.date ?? '') : todayUtc()
    form.status = row?.status ?? 'Pending'
}

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.program.trim()) &&
        Boolean(form.farmerDocumentId) &&
        Boolean(form.date)
)

/**
 * The peso amount, or null when the field is left blank.
 *
 * `raw` is typed `string | number` on purpose: v-model casts a `type="number"`
 * input to a real number the moment the typed text parses, so a clean amount
 * like `5000` arrives here as a number and only a blank field arrives as the
 * empty string. Zero is a real peso amount, so only a blank field is nulled.
 */
const parsedValue = (raw: string | number): number | null => {
    const amount = Number(raw)

    return String(raw).trim() !== '' && Number.isFinite(amount) ? amount : null
}

async function save() {
    const payload = {
        program: form.program.trim(),
        farmer: form.farmerDocumentId,
        barangay: form.barangayDocumentId || null,
        items: form.items.trim() || null,
        value: parsedValue(form.value),
        date: form.date,
        status: form.status,
    }

    if (props.mode === 'create') {
        await create(payload)

        return
    }

    const documentId = props.row?.documentId

    if (!documentId) return

    await update(documentId, payload)
}
</script>

<template>
    <ModalShell
        :show="props.show"
        :icon="
            props.mode === 'create' ? 'i-lucide-hand-heart' : 'i-lucide-pencil'
        "
        :icon-class="
            props.mode === 'create'
                ? 'bg-[#e8f5e8] text-[#2d6a2d]'
                : 'bg-[#e0f0fb] text-[#1d6fa4]'
        "
        :title="
            props.mode === 'create' ? 'Record Assistance' : 'Edit Assistance'
        "
        :subtitle="
            props.mode === 'create'
                ? 'Log an assistance program for a farmer.'
                : 'Update the assistance program details.'
        "
        :submitting="submitting"
        :saved="saved"
        :saved-text="
            props.mode === 'create'
                ? 'Assistance recorded.'
                : 'Assistance updated.'
        "
        :error="error"
        :submit-label="
            props.mode === 'create' ? 'Record Assistance' : 'Save Changes'
        "
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <p
            v-if="props.mode === 'create' && farmers.length === 0"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            No farmers registered yet. Register a farmer first, then log the
            assistance here.
        </p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Program" required>
                <input
                    v-model="form.program"
                    type="text"
                    :list="datalistId"
                    :placeholder="
                        props.mode === 'create'
                            ? 'e.g. Rice Seed Subsidy'
                            : undefined
                    "
                    :class="`${FIELD_CLASS} placeholder:text-slate-400`"
                />
                <datalist :id="datalistId">
                    <option v-for="p in programOptions" :key="p" :value="p" />
                </datalist>
            </FormField>

            <FormField label="Recipient" required>
                <select v-model="form.farmerDocumentId" :class="FIELD_CLASS">
                    <option v-if="props.mode === 'create'" value="" disabled>
                        Select a farmer...
                    </option>
                    <option
                        v-for="f in farmers"
                        :key="f.value"
                        :value="f.value"
                    >
                        {{ f.label }}
                    </option>
                </select>
            </FormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Barangay">
                <select v-model="form.barangayDocumentId" :class="FIELD_CLASS">
                    <option value="">Not specified</option>
                    <option
                        v-for="b in barangays"
                        :key="b.value"
                        :value="b.value"
                    >
                        {{ b.label }}
                    </option>
                </select>
            </FormField>

            <FormField label="Value (₱)">
                <input
                    v-model="form.value"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0.00"
                    :class="`${FIELD_CLASS} placeholder:text-slate-400`"
                />
            </FormField>
        </div>

        <FormField label="Items">
            <textarea
                v-model="form.items"
                rows="3"
                :placeholder="
                    props.mode === 'create'
                        ? 'e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer'
                        : 'e.g. 4 bags certified rice seed (40 kg)'
                "
                :class="`${FIELD_CLASS} placeholder:text-slate-400`"
            ></textarea>
        </FormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Date" required>
                <input v-model="form.date" type="date" :class="FIELD_CLASS" />
            </FormField>

            <FormField label="Status">
                <select v-model="form.status" :class="FIELD_CLASS">
                    <option
                        v-for="s in ASSISTANCE_STATUS_OPTIONS"
                        :key="s"
                        :value="s"
                    >
                        {{ s }}
                    </option>
                </select>
            </FormField>
        </div>
    </ModalShell>
</template>
