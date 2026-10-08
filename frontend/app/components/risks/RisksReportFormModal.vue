<script setup lang="ts">
import type {
    FarmParcel,
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import type { RiskRow } from '~/utils/riskInsights'
import { RISK_STATUS_OPTIONS } from '~/utils/riskStatus'
import { todayLocal } from '~/utils/format'
import { FIELD_CLASS, FIELD_CLASS_RED } from '~/utils/formStyles'

/**
 * The single create/edit form for risk reports: `mode` picks the title, icon,
 * accent, field focus colour and submit copy, and whether the row seeds the
 * fields. Form state, the parcel options and the save call live here; the page
 * flips `show` (with `preset` carrying an insight's pre-filled risk type) and
 * reloads on `saved`.
 */
interface Props {
    show: boolean
    mode: 'create' | 'edit'
    /** Edit target; unused in create mode. */
    row?: RiskRow | null
    parcels: FarmParcel[]
    knownRiskTypes: string[]
    /** Risk type an insight card's "Create Action" pre-fills. */
    preset?: string
}

const props = withDefaults(defineProps<Props>(), {
    row: null,
    preset: '',
})

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { createRiskReport, updateRiskReport } = useFarmRecordsApi()

const severityOptions: RiskSeverity[] = ['Critical', 'High', 'Medium', 'Low']

/** Offered alongside whatever the registry has already seen. */
const SUGGESTED_RISK_TYPES = [
    'Flood Risk',
    'Soil Erosion',
    'Pest Infestation',
    'Drought',
    'Waterlogging',
    'Disease Outbreak',
]

const riskTypeSuggestions = computed<string[]>(() => [
    ...new Set([...props.knownRiskTypes, ...SUGGESTED_RISK_TYPES]),
])

const parcelOptions = computed(() =>
    props.parcels.map((parcel) => {
        const farmer = parcel.farmers?.[0]?.name
        return {
            value: parcel.documentId,
            label: [parcel.parcel_code, farmer, parcel.farm?.barangay?.name]
                .filter(Boolean)
                .join(' · '),
        }
    })
)

const contextLabel = computed(() =>
    props.row
        ? `${props.row.parcel_code} · ${props.row.barangay || 'no barangay'}`
        : ''
)

const form = reactive({
    parcelDocumentId: '',
    risk_type: '',
    observed_at: '',
    severity: 'Medium' as RiskSeverity,
    parcel_status: 'Active' as RiskParcelStatus,
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
    failureMessage:
        props.mode === 'create'
            ? 'Failed to file the risk report. Please try again.'
            : 'Failed to update the risk report. Please try again.',
})

function reset() {
    const row = props.mode === 'edit' ? props.row : null

    form.parcelDocumentId = row
        ? row.parcelDocumentId
        : (props.parcels[0]?.documentId ?? '')
    form.risk_type = row ? row.riskType : props.preset
    // Creates date from the local calendar; an edit keeps the filed date.
    form.observed_at = row ? (row.observedAt ?? '') : todayLocal()
    form.severity = row?.severity ?? 'Medium'
    form.parcel_status = row?.parcelStatus ?? 'Active'
}

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.parcelDocumentId) &&
        Boolean(form.risk_type.trim()) &&
        Boolean(form.observed_at)
)

/** The create form focuses red, the edit form has always focused emerald. */
const fieldClass = computed(() =>
    props.mode === 'create' ? FIELD_CLASS_RED : FIELD_CLASS
)

async function save() {
    const payload = {
        farm_parcel: form.parcelDocumentId,
        risk_type: form.risk_type.trim(),
        observed_at: form.observed_at,
        severity: form.severity,
        parcel_status: form.parcel_status,
    }

    if (props.mode === 'create') {
        await createRiskReport(payload)

        return
    }

    const documentId = props.row?.documentId

    if (!documentId) return

    await updateRiskReport(documentId, payload)
}
</script>

<template>
    <ModalShell
        :show="props.show"
        :icon="
            props.mode === 'create'
                ? 'i-lucide-alert-triangle'
                : 'i-lucide-pencil'
        "
        :icon-class="
            props.mode === 'create'
                ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
                : 'bg-[#e0f0fb] text-[#1d6ab3] ring-1 ring-blue-100'
        "
        :title="
            props.mode === 'create'
                ? 'Generate Risk Report'
                : 'Edit Risk Report'
        "
        :subtitle="
            props.mode === 'create'
                ? 'File a risk against a parcel. ALPS groups it into an insight automatically.'
                : `Update the report's scope, severity and status.`
        "
        :submitting="submitting"
        :saved="saved"
        :saved-text="
            props.mode === 'create'
                ? 'Risk report filed.'
                : 'Risk report updated.'
        "
        :error="error"
        :submit-label="props.mode === 'create' ? 'File Report' : 'Save Changes'"
        :saving-label="props.mode === 'create' ? 'Filing...' : 'Saving...'"
        :submit-disabled="!canSave"
        :accent="props.mode === 'create' ? 'red' : 'emerald'"
        @close="close"
        @submit="submit"
    >
        <p
            v-if="props.mode === 'create' && props.parcels.length === 0"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            No parcels registered yet. Register a parcel first, then file its
            risk report here.
        </p>

        <div
            v-if="props.mode === 'edit'"
            class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600"
        >
            <span class="font-semibold text-slate-800">
                {{ contextLabel }}
            </span>
        </div>

        <FormField label="Parcel" required>
            <select
                v-model="form.parcelDocumentId"
                :disabled="
                    submitting ||
                    (props.mode === 'create' && props.parcels.length === 0)
                "
                :class="fieldClass"
            >
                <option v-if="props.mode === 'create'" value="" disabled>
                    Select a parcel
                </option>
                <option
                    v-for="option in parcelOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </FormField>

        <FormField label="Risk Type" required>
            <input
                v-model="form.risk_type"
                type="text"
                list="risk-type-options"
                :disabled="submitting"
                :placeholder="
                    props.mode === 'create'
                        ? 'e.g. Flood Risk, Soil Erosion'
                        : undefined
                "
                :class="
                    props.mode === 'create'
                        ? `${FIELD_CLASS_RED} placeholder:text-slate-400`
                        : FIELD_CLASS
                "
            />
            <datalist v-if="props.mode === 'create'" id="risk-type-options">
                <option
                    v-for="type in riskTypeSuggestions"
                    :key="type"
                    :value="type"
                />
            </datalist>
        </FormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Observed" required>
                <input
                    v-model="form.observed_at"
                    type="date"
                    :disabled="submitting"
                    :class="fieldClass"
                />
            </FormField>

            <FormField label="Severity" required>
                <select
                    v-model="form.severity"
                    :disabled="submitting"
                    :class="fieldClass"
                >
                    <option v-for="s in severityOptions" :key="s" :value="s">
                        {{ s }}
                    </option>
                </select>
            </FormField>

            <FormField label="Status" required>
                <select
                    v-model="form.parcel_status"
                    :disabled="submitting"
                    :class="fieldClass"
                >
                    <option
                        v-for="s in RISK_STATUS_OPTIONS"
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
