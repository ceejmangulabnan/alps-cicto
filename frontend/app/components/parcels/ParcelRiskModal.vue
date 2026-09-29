<script setup lang="ts">
import type {
    FarmParcel,
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
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

const { createRiskReport } = useFarmRecordsApi()

const SEVERITY_OPTIONS: RiskSeverity[] = ['Low', 'Medium', 'High', 'Critical']
const RISK_STATUS_OPTIONS: RiskParcelStatus[] = [
    'Active',
    'Monitoring',
    'Resolved',
]

interface RiskForm {
    risk_type: string
    observed_at: string
    severity: RiskSeverity
    parcel_status: RiskParcelStatus
}

const form = reactive<RiskForm>({
    risk_type: '',
    observed_at: '',
    severity: 'Medium',
    parcel_status: 'Active',
})

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

/** Today's calendar date in local time, as Strapi's `date` fields expect. */
function today(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(form.risk_type.trim()) &&
        Boolean(form.observed_at)
)

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

// The component stays mounted for the parcel's lifetime; reset on every open so
// a dismissed draft never leaks into the next report.
watch(
    () => props.modelValue as boolean,
    (open) => {
        if (!open) return
        form.risk_type = ''
        form.observed_at = today()
        form.severity = 'Medium'
        form.parcel_status = 'Active'
        errorMessage.value = null
    },
    { immediate: true }
)

async function submit() {
    errorMessage.value = null
    submitting.value = true
    try {
        await createRiskReport({
            farm_parcel: props.parcel.documentId,
            risk_type: form.risk_type.trim(),
            observed_at: form.observed_at,
            severity: form.severity,
            parcel_status: form.parcel_status,
        })
        emit('saved')
        close()
    } catch (value: unknown) {
        errorMessage.value = getErrorMessage(
            value,
            'Failed to file the risk report. Please try again.'
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
                            Report Risk
                        </h3>
                        <p class="text-xs text-gray-500">
                            Risk type, severity and current parcel status.
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

                <form class="space-y-4" @submit.prevent="submit">
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Risk type <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.risk_type"
                            type="text"
                            :disabled="submitting"
                            placeholder="e.g. Soil Erosion, Flooding, Pest Infestation"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Observed on <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.observed_at"
                            type="date"
                            :disabled="submitting"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Severity <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.severity"
                                :disabled="submitting"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                            >
                                <option
                                    v-for="option in SEVERITY_OPTIONS"
                                    :key="option"
                                    :value="option"
                                >
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Parcel status
                                <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.parcel_status"
                                :disabled="submitting"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                            >
                                <option
                                    v-for="option in RISK_STATUS_OPTIONS"
                                    :key="option"
                                    :value="option"
                                >
                                    {{ option }}
                                </option>
                            </select>
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
                            {{ submitting ? 'Filing...' : 'File Report' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
