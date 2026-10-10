<script setup lang="ts">
import type {
    FarmParcel,
    InspectionStatus,
    ParcelInspectionPhoto,
    RiskInspectionLevel,
} from '~/composables/useFarmParcelApi'
import { useFarmRecordsApi } from '~/composables/useFarmRecordsApi'
import type { InspectionRow } from '~/composables/useInspectionRegistry'
import { FIELD_CLASS } from '~/utils/formStyles'
import { todayUtc } from '~/utils/format'
import {
    INSPECTION_RISK_LEVELS,
    INSPECTION_STATUS_OPTIONS,
    INSPECTION_TYPES,
} from '~/utils/inspectionStatus'

/**
 * The inspection form modal, shared by the "record" and "edit" flows: form
 * state, the parcel options, the photo upload and the create/update calls
 * all live here; the page flips `mode` + `show` and reloads on `saved`.
 */
interface Props {
    show: boolean
    mode: 'create' | 'edit'
    row: InspectionRow | null
    parcels: FarmParcel[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { createInspection, updateInspection, uploadPhotos } = useFarmRecordsApi()

const form = reactive({
    parcelDocumentId: '',
    inspection_type: INSPECTION_TYPES[0] as string,
    date: '',
    inspector: '',
    risk_level: 'None' as RiskInspectionLevel,
    status: 'Pending' as InspectionStatus,
    notes: '',
    savedPhotos: [] as ParcelInspectionPhoto[],
    pendingPhotos: [] as File[],
})

/** "... · parcel · barangay" label for the form's parcel selector. */
const parcelOptions = computed(() =>
    props.parcels.map((parcel) => {
        const farmers = (parcel.farmers ?? [])
            .map((farmer) => farmer.name)
            .filter(Boolean)
        return {
            value: parcel.documentId,
            label: [
                parcel.parcel_code,
                farmers[0] ?? '',
                parcel.farm?.barangay?.name ?? '',
            ]
                .filter(Boolean)
                .join(' · '),
        }
    })
)

const contextLabel = computed(() =>
    props.row ? `${props.row.parcel_code} · ${props.row.date ?? 'no date'}` : ''
)

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.parcelDocumentId) &&
        Boolean(form.date) &&
        Boolean(form.inspector.trim())
)

const icon = computed(() =>
    props.mode === 'edit' ? 'i-lucide-pencil' : 'i-lucide-clipboard-check'
)

const iconClass = computed(() =>
    props.mode === 'edit'
        ? 'bg-[#e0f0fb] text-[#1d6fa4]'
        : 'bg-[#e8f5e8] text-[#2d6a2d]'
)

const title = computed(() =>
    props.mode === 'edit' ? 'Edit Inspection' : 'New Inspection'
)

const subtitle = computed(() =>
    props.mode === 'edit'
        ? 'Update the inspection visit details.'
        : 'Log a field inspection visit with findings.'
)

const savedText = computed(() =>
    props.mode === 'edit' ? 'Inspection updated.' : 'Inspection recorded.'
)

const submitLabel = computed(() =>
    props.mode === 'edit' ? 'Save Changes' : 'Record Inspection'
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
        props.mode === 'edit'
            ? 'Failed to update the inspection. Please try again.'
            : 'Failed to record the inspection. Please try again.',
})

function reset() {
    const row = props.mode === 'edit' ? props.row : null

    form.parcelDocumentId =
        row?.parcelDocumentId ?? props.parcels[0]?.documentId ?? ''
    form.inspection_type = row?.inspection_type ?? INSPECTION_TYPES[0]
    form.date = row?.date ?? todayUtc()
    form.inspector = row?.inspector ?? ''
    form.risk_level = row?.riskLevel ?? 'None'
    form.status = row?.status ?? 'Pending'
    form.notes = row?.notes ?? ''
    form.savedPhotos = row ? [...row.photos] : []
    form.pendingPhotos = []
}

async function save() {
    const photoIds = form.savedPhotos
        .map((photo) => photo.id)
        .filter((id): id is number => id != null)
    if (form.pendingPhotos.length > 0) {
        const uploaded = await uploadPhotos(form.pendingPhotos)
        photoIds.push(
            ...uploaded
                .map((file) => file.id)
                .filter((id): id is number => id != null)
        )
    }

    const base = {
        parcel: form.parcelDocumentId,
        inspector: form.inspector.trim(),
        date: form.date,
        inspection_type: form.inspection_type,
        risk_level: form.risk_level,
        status: form.status,
        notes: form.notes.trim() || null,
    }

    if (props.mode === 'edit' && props.row) {
        await updateInspection(props.row.documentId, {
            ...base,
            photos: photoIds,
        })
    } else {
        await createInspection({
            ...base,
            // The picker starts empty on create, so photos never upload twice.
            ...(photoIds.length > 0 ? { photos: photoIds } : {}),
        })
    }
}
</script>

<template>
    <ModalShell
        :show="show"
        :icon="icon"
        :icon-class="iconClass"
        :title="title"
        :subtitle="subtitle"
        :submitting="submitting"
        :saved="saved"
        :saved-text="savedText"
        :error="error"
        :submit-label="submitLabel"
        :submit-disabled="!canSave"
        @close="close"
        @submit="submit"
    >
        <div
            v-if="mode === 'edit'"
            class="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600"
        >
            <span class="font-medium text-gray-800">
                {{ contextLabel }}
            </span>
        </div>

        <p
            v-if="mode === 'create' && parcels.length === 0"
            class="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
        >
            No parcels registered yet. Register a parcel first, then log its
            inspection here.
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Parcel" required>
                <select
                    v-model="form.parcelDocumentId"
                    :disabled="submitting || parcels.length === 0"
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

            <FormField label="Type">
                <select
                    v-model="form.inspection_type"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                >
                    <option v-for="t in INSPECTION_TYPES" :key="t" :value="t">
                        {{ t }}
                    </option>
                </select>
            </FormField>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Date" required>
                <input
                    v-model="form.date"
                    type="date"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                />
            </FormField>

            <FormField label="Status">
                <select
                    v-model="form.status"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                >
                    <option
                        v-for="s in INSPECTION_STATUS_OPTIONS"
                        :key="s"
                        :value="s"
                    >
                        {{ s }}
                    </option>
                </select>
            </FormField>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Inspector" required>
                <input
                    v-model="form.inspector"
                    type="text"
                    :disabled="submitting"
                    placeholder="e.g. J. Villanueva"
                    :class="`${FIELD_CLASS} placeholder:text-slate-400`"
                />
            </FormField>

            <FormField label="Risk Level">
                <select
                    v-model="form.risk_level"
                    :disabled="submitting"
                    :class="FIELD_CLASS"
                >
                    <option
                        v-for="r in INSPECTION_RISK_LEVELS"
                        :key="r"
                        :value="r"
                    >
                        {{ r }}
                    </option>
                </select>
            </FormField>
        </div>

        <FormField label="Findings">
            <textarea
                v-model="form.notes"
                rows="3"
                :disabled="submitting"
                placeholder="Observations, potential issues, and recommended follow-ups..."
                :class="`${FIELD_CLASS} placeholder:text-slate-400`"
            ></textarea>
        </FormField>

        <InspectionsPhotoPicker
            v-model:saved="form.savedPhotos"
            v-model:pending="form.pendingPhotos"
            :disabled="submitting"
        />
    </ModalShell>
</template>
