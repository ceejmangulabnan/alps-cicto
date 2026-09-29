<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
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

const { createHarvest } = useFarmRecordsApi()

const cycle = computed(() => props.parcel.planting_cycle ?? null)
const areaHectares = computed(() => Number(props.parcel.area_hectares) || 0)

interface HarvestForm {
    harvest_date: string
    production_kg: string
    yield_per_hectare: string
}

const form = reactive<HarvestForm>({
    harvest_date: '',
    production_kg: '',
    yield_per_hectare: '',
})

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

/**
 * Yield is derived from production over area, but only while the user has not
 * typed a yield themselves — a manual figure (e.g. a sample-based estimate)
 * must not be overwritten by later production edits.
 */
const yieldEdited = ref(false)

const canSave = computed(
    () =>
        !submitting.value &&
        Boolean(cycle.value) &&
        Boolean(form.harvest_date) &&
        Number(form.production_kg) > 0
)

const productionNumber = computed(() => Number(form.production_kg))

watch(productionNumber, (value) => {
    if (yieldEdited.value || !Number.isFinite(value) || value <= 0) return
    if (areaHectares.value > 0) {
        form.yield_per_hectare = (value / areaHectares.value).toFixed(2)
    }
})

/** Today's calendar date in local time, as Strapi's `date` fields expect. */
function today(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

onMounted(() => {
    errorMessage.value = null
})

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

// The component stays mounted for the parcel's lifetime; reset on every open so
// a dismissed draft never leaks into the next harvest.
watch(
    () => props.modelValue as boolean,
    (open) => {
        if (!open) return
        form.harvest_date = today()
        form.production_kg = ''
        form.yield_per_hectare = ''
        yieldEdited.value = false
        errorMessage.value = null
    },
    { immediate: true }
)

async function submit() {
    if (!cycle.value) {
        errorMessage.value = 'Log a planting cycle first.'
        return
    }

    errorMessage.value = null
    submitting.value = true
    try {
        await createHarvest({
            planting_cycle: cycle.value.documentId,
            harvest_date: form.harvest_date,
            production_kg: Number(form.production_kg),
            yield_per_hectare: Number(form.yield_per_hectare) || null,
        })
        emit('saved')
        close()
    } catch (value: unknown) {
        errorMessage.value = getErrorMessage(
            value,
            'Failed to record the harvest. Please try again.'
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
                            Record Harvest
                        </h3>
                        <p class="text-xs text-gray-500">
                            Against the parcel's current planting cycle.
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

                <p
                    v-if="!cycle"
                    class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                >
                    No planting cycle is recorded for this parcel yet, so there
                    is nothing to attach a harvest to. Log a planting cycle
                    first.
                </p>

                <form class="space-y-4" @submit.prevent="submit">
                    <div
                        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                        <span class="font-medium text-gray-800">
                            {{ cycle?.crop?.name || 'Current cycle' }}
                            <template v-if="cycle?.variety">
                                · {{ cycle.variety }}
                            </template>
                        </span>
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Harvest date <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.harvest_date"
                            type="date"
                            :disabled="submitting"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Production (kg) <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.production_kg"
                            type="number"
                            step="0.1"
                            min="0"
                            :disabled="submitting || !cycle"
                            placeholder="e.g. 12480.5"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Yield (kg/ha)
                        </label>
                        <input
                            v-model="form.yield_per_hectare"
                            type="number"
                            step="0.01"
                            min="0"
                            :disabled="submitting || !cycle"
                            placeholder="Computed from production and area"
                            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                            @focus="yieldEdited = true"
                        />
                        <p class="mt-1 text-[11px] text-gray-400">
                            Auto-filled from production ÷
                            {{
                                areaHectares
                                    ? `${areaHectares.toFixed(2)} ha`
                                    : 'area'
                            }}. Type to override.
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
                            :disabled="!canSave"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submitting ? 'Saving...' : 'Record Harvest' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
