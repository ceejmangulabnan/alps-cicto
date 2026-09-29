<script setup lang="ts">
import type { FarmParcel, LandStatus } from '~/composables/useFarmParcelApi'
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{
    modelValue: boolean
    parcel: FarmParcel
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    saved: []
}>()

const { update: updateParcel } = useFarmParcelApi()

interface EditForm {
    land_status: LandStatus
    current_use: string
    area_hectares: string
}

const form = reactive<EditForm>({
    land_status: 'Cultivated',
    current_use: '',
    area_hectares: '',
})

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const subtitle = computed(
    () => `${props.parcel.parcel_code} · status, current use and area.`
)

function seedForm() {
    form.land_status = props.parcel.land_status
    form.current_use = props.parcel.current_use ?? ''
    form.area_hectares = Number(props.parcel.area_hectares).toFixed(2)
    errorMessage.value = null
}

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

// The component stays mounted for the parcel's lifetime; seed on every open so
// edits elsewhere (or a save echoing the parcel back) are always reflected.
watch(
    () => props.modelValue as boolean,
    (open) => {
        if (open) seedForm()
    },
    { immediate: true }
)

async function submit() {
    errorMessage.value = null

    const area = Number(form.area_hectares)
    if (!Number.isFinite(area) || area <= 0) {
        errorMessage.value = 'Area must be a positive number.'
        return
    }

    submitting.value = true
    try {
        await updateParcel(props.parcel.documentId, {
            land_status: form.land_status,
            current_use: form.current_use.trim() || null,
            area_hectares: area,
        })
        emit('saved')
        close()
    } catch (value: unknown) {
        errorMessage.value = getErrorMessage(
            value,
            'Failed to update the parcel. Please try again.'
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
                            Edit Parcel Details
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
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Land status
                        </label>
                        <select
                            v-model="form.land_status"
                            :disabled="submitting"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                        >
                            <option
                                v-for="option in LAND_STATUS_OPTIONS"
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
                            Current use
                        </label>
                        <input
                            v-model="form.current_use"
                            type="text"
                            :disabled="submitting"
                            placeholder="e.g. paddy rice, vegetable rotation"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Area (ha)
                        </label>
                        <input
                            v-model="form.area_hectares"
                            type="number"
                            step="0.0001"
                            min="0"
                            :disabled="submitting"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                        <p class="mt-1 text-[11px] text-gray-400">
                            The boundary stays unchanged — this only edits the
                            stored measurement.
                        </p>
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
                            :disabled="submitting"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submitting ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
