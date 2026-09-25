<template>
    <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @click.self="close"
    >
        <div
            class="w-full max-w-md rounded-xl bg-white p-6 font-sans shadow-xl"
        >
            <div class="mb-5 flex items-start justify-between">
                <div>
                    <h3 class="text-lg font-bold text-gray-900">Create Farm</h3>
                    <p class="text-xs text-gray-500">
                        The farm code is generated from the barangay.
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
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Barangay <span class="text-red-500">*</span>
                    </label>
                    <select
                        v-model="form.barangay"
                        :disabled="submitting || optionsLoading"
                        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                        <option value="" disabled>
                            {{
                                optionsLoading
                                    ? 'Loading barangays...'
                                    : 'Select barangay'
                            }}
                        </option>
                        <option
                            v-for="b in barangays"
                            :key="b.documentId"
                            :value="b.documentId"
                        >
                            {{ b.name }} ({{ b.code }})
                        </option>
                    </select>
                    <p
                        v-if="!optionsLoading && barangays.length === 0"
                        class="mt-1 text-[11px] text-amber-600"
                    >
                        No barangays available yet. A farm cannot be created
                        without one because the farm code is derived from it.
                    </p>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Farmers
                    </label>
                    <USelectMenu
                        v-model="form.farmers"
                        :items="farmerOptions"
                        :disabled="submitting || optionsLoading"
                        multiple
                        value-key="value"
                        placeholder="Optional - assign farmers"
                        class="w-full"
                    />
                    <p
                        v-if="!optionsLoading && farmers.length === 0"
                        class="mt-1 text-[11px] text-gray-400"
                    >
                        No farmers registered yet.
                    </p>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Farmer Status
                    </label>
                    <select
                        v-model="form.farmer_status"
                        :disabled="submitting"
                        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                        <option
                            v-for="s in FARMER_STATUS_OPTIONS"
                            :key="s"
                            :value="s"
                        >
                            {{ s }}
                        </option>
                    </select>
                </div>

                <p
                    v-if="errorMessage"
                    class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                >
                    {{ errorMessage }}
                </p>

                <div
                    class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                >
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
                        :disabled="submitting || optionsLoading"
                    >
                        <UIcon
                            v-if="submitting"
                            name="i-lucide-loader-circle"
                            class="size-3.5 animate-spin"
                        />
                        {{ submitting ? 'Creating...' : 'Create Farm' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    FARMER_STATUS_OPTIONS,
    type FarmerStatus,
} from '~/composables/useFarmsApi'
import type { Barangay } from '~/composables/useBarangayApi'
import type { Farmer } from '~/composables/useFarmersApi'

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    created: [farmCode: string]
}>()

const { create } = useFarmsApi()
const { getAllForSelect: getBarangays } = useBarangayApi()
const { getAllForSelect: getFarmers } = useFarmersApi()

const barangays = ref<Barangay[]>([])
const farmers = ref<Farmer[]>([])
const optionsLoading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const form = reactive<{
    barangay: string
    farmers: string[]
    farmer_status: FarmerStatus
}>({
    barangay: '',
    farmers: [],
    farmer_status: 'Active',
})

const farmerOptions = computed(() =>
    farmers.value.map((f) => ({
        label: `${f.name} (${f.farmer_code})`,
        value: f.documentId,
    }))
)

function resetForm() {
    form.barangay = ''
    form.farmers = []
    form.farmer_status = 'Active'
    errorMessage.value = null
}

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

async function loadOptions() {
    optionsLoading.value = true
    try {
        const [barangayList, farmerList] = await Promise.all([
            getBarangays(),
            getFarmers(),
        ])
        barangays.value = barangayList
        farmers.value = farmerList
    } catch {
        errorMessage.value = 'Unable to load barangays and farmers.'
    } finally {
        optionsLoading.value = false
    }
}

function getErrorMessage(value: unknown, fallback: string) {
    if (value && typeof value === 'object') {
        const apiError = value as {
            data?: { message?: string; error?: { message?: string } }
            message?: string
        }
        return (
            apiError.data?.error?.message ||
            apiError.data?.message ||
            apiError.message ||
            fallback
        )
    }
    return fallback
}

async function submit() {
    if (submitting.value) return

    if (!form.barangay) {
        errorMessage.value = 'Please select a barangay.'
        return
    }

    submitting.value = true
    errorMessage.value = null

    try {
        const response = await create({
            barangay: form.barangay,
            farmers: form.farmers,
            farmer_status: form.farmer_status,
        })

        emit('created', response.data.farm_code)
        emit('update:modelValue', false)
        resetForm()
    } catch (error: unknown) {
        errorMessage.value = getErrorMessage(
            error,
            'Unable to create the farm.'
        )
    } finally {
        submitting.value = false
    }
}

watch(
    () => props.modelValue,
    async (open) => {
        if (!open) {
            resetForm()
            return
        }
        await loadOptions()
    }
)
</script>
