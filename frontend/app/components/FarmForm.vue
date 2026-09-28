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
                    <h3 class="text-lg font-bold text-gray-900">
                        {{ isEditing ? 'Edit Farm' : 'Create Farm' }}
                    </h3>
                    <p class="text-xs text-gray-500">{{ subtitle }}</p>
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
                        Farm Code
                    </label>
                    <input
                        :value="farm?.farm_code ?? 'Generated on save'"
                        type="text"
                        readonly
                        class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900"
                    />
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Barangay <span class="text-red-500">*</span>
                    </label>
                    <select
                        v-model="form.barangay"
                        :disabled="submitting || optionsLoading || isEditing"
                        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                    <p v-if="isEditing" class="mt-1 text-[11px] text-gray-400">
                        A farm code is derived from the barangay, so it cannot
                        be changed after the farm is created.
                    </p>
                    <p
                        v-else-if="!optionsLoading && barangays.length === 0"
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
                    <!--
                        `loading` matters: without it the menu briefly shows the
                        raw documentIds held by the form before the farmer list
                        arrives and can resolve them to names.
                    -->
                    <USelectMenu
                        v-model="form.farmers"
                        :items="farmerOptions"
                        :disabled="submitting || optionsLoading"
                        :loading="optionsLoading"
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
                        {{
                            submitting
                                ? 'Saving...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Farm'
                        }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    FARMER_STATUS_OPTIONS,
    type Farm,
    type FarmerStatus,
} from '~/composables/useFarmsApi'
import type { Barangay } from '~/composables/useBarangayApi'
import type { Farmer } from '~/composables/useFarmersApi'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{
    modelValue: boolean
    /** The farm being edited, or null when creating a new one. */
    farm?: Farm | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    saved: [farm: Farm]
}>()

const { create, update } = useFarmsApi()
const { getAllForSelect: getBarangays } = useBarangayApi()
const { getAllForSelect: getFarmers } = useFarmersApi()

const barangays = ref<Barangay[]>([])
const farmers = ref<Farmer[]>([])
const optionsLoading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const isEditing = computed(() => Boolean(props.farm))

const subtitle = computed(() =>
    isEditing.value
        ? 'Update the farmers and status for this farm.'
        : 'The farm code is generated from the barangay.'
)

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
    form.barangay = props.farm?.barangay?.documentId ?? ''
    form.farmers = (props.farm?.farmers ?? []).map(
        (farmer) => farmer.documentId
    )
    form.farmer_status = props.farm?.farmer_status ?? 'Active'
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

async function submit() {
    if (submitting.value) return

    if (!form.barangay) {
        errorMessage.value = 'Please select a barangay.'
        return
    }

    submitting.value = true
    errorMessage.value = null

    try {
        const response = props.farm
            ? await update(props.farm.documentId, {
                  farmers: form.farmers,
                  farmer_status: form.farmer_status,
              })
            : await create({
                  barangay: form.barangay,
                  farmers: form.farmers,
                  farmer_status: form.farmer_status,
              })

        emit('saved', response.data)
        emit('update:modelValue', false)
    } catch (error: unknown) {
        errorMessage.value = getErrorMessage(
            error,
            props.farm
                ? 'Unable to update the farm.'
                : 'Unable to create the farm.'
        )
    } finally {
        submitting.value = false
    }
}

// Prefill and fetch the option lists on every open, so the form is correct
// whether it was just toggled open or arrived already open on mount.
watch(
    () => [props.modelValue, props.farm?.documentId] as const,
    async ([open]) => {
        if (!open) return

        resetForm()
        await loadOptions()
    },
    { immediate: true }
)
</script>
