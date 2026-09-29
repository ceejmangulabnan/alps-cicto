<script setup lang="ts">
import type { Farmer } from '~/composables/useFarmersApi'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
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
const { getAllForSelect: getFarmers } = useFarmersApi()

const farmers = ref<Farmer[]>([])
const farmersLoading = ref(false)
const selected = ref<string[]>([])
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const farmerOptions = computed(() =>
    farmers.value.map((farmer) => ({
        label: farmer.name,
        value: farmer.documentId,
    }))
)

const canSave = computed(() => !submitting.value && !farmersLoading.value)

async function loadFarmers() {
    farmersLoading.value = true
    try {
        farmers.value = await getFarmers()
    } catch {
        errorMessage.value =
            'Could not load the farmer registry. Please try again.'
    } finally {
        farmersLoading.value = false
    }
}

function seedForm() {
    selected.value = (props.parcel.farmers ?? []).map(
        (farmer) => farmer.documentId
    )
    errorMessage.value = null
}

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

// The component stays mounted for the parcel's lifetime; seed and load the
// registry on every open so selections and the farmer list stay current.
watch(
    () => props.modelValue as boolean,
    async (open) => {
        if (!open) return
        seedForm()
        await loadFarmers()
    },
    { immediate: true }
)

async function submit() {
    errorMessage.value = null
    submitting.value = true
    try {
        await updateParcel(props.parcel.documentId, {
            farmers: selected.value,
        })
        emit('saved')
        close()
    } catch (value: unknown) {
        errorMessage.value = getErrorMessage(
            value,
            'Failed to update the farmers. Please try again.'
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
                            Update Tending Farmers
                        </h3>
                        <p class="text-xs text-gray-500">
                            Assign the farmers working this parcel. Replaces the
                            current list.
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
                            Tending farmers
                        </label>
                        <!--
                            `loading` matters: without it the menu briefly shows
                            the raw documentIds the form holds before the farmer
                            list arrives and can resolve them to names.
                        -->
                        <USelectMenu
                            v-model="selected"
                            :items="farmerOptions"
                            :disabled="submitting || farmersLoading"
                            :loading="farmersLoading"
                            multiple
                            value-key="value"
                            placeholder="Select farmers"
                            class="w-full"
                        />
                        <p
                            v-if="!farmersLoading && farmers.length === 0"
                            class="mt-1 text-[11px] text-gray-400"
                        >
                            No farmers registered yet.
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
                            {{ submitting ? 'Saving...' : 'Save Farmers' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
