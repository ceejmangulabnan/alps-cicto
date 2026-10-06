<template>
    <Teleport to="body">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="close"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <!-- Header -->
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e8] text-[#2d6a2d] ring-1 ring-emerald-100"
                        >
                            <UIcon
                                :name="
                                    isEditing
                                        ? 'i-lucide-pencil'
                                        : 'i-lucide-tractor'
                                "
                                class="size-5"
                            />
                        </div>

                        <div class="min-w-0">
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                {{ isEditing ? 'Edit Farm' : 'Create Farm' }}
                            </h3>
                            <p
                                class="mt-0.5 max-w-sm text-sm leading-5 text-slate-500"
                            >
                                {{ subtitle }}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="submitting"
                        aria-label="Close farm form"
                        @click="close"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="submit">
                    <!-- Farm Name -->
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Farm Name <span class="text-red-500">*</span>
                        </label>

                        <div class="relative">
                            <UIcon
                                name="i-lucide-tractor"
                                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                v-model="form.name"
                                type="text"
                                :disabled="submitting"
                                placeholder="e.g. Sto. Niño North Farm"
                                class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                    </div>

                    <!-- Barangay -->
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Barangay <span class="text-red-500">*</span>
                        </label>

                        <div class="relative">
                            <UIcon
                                name="i-lucide-map-pin"
                                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />

                            <select
                                v-model="form.barangay"
                                :disabled="
                                    submitting || optionsLoading || isEditing
                                "
                                class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

                            <UIcon
                                name="i-lucide-chevron-down"
                                class="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        <p
                            v-if="isEditing"
                            class="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-400"
                        >
                            <UIcon
                                name="i-lucide-lock-keyhole"
                                class="mt-0.5 size-3.5 shrink-0"
                            />
                            <span>
                                A farm code is derived from the barangay, so the
                                barangay cannot be changed after the farm is created.
                            </span>
                        </p>

                        <p
                            v-else-if="
                                !optionsLoading && barangays.length === 0
                            "
                            class="mt-2 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800"
                        >
                            <UIcon
                                name="i-lucide-alert-triangle"
                                class="mt-0.5 size-3.5 shrink-0"
                            />
                            <span>
                                No barangays are available yet. A farm cannot be
                                created until at least one barangay is registered.
                            </span>
                        </p>
                    </div>

                    <!-- Information -->
                    <div
                        class="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5"
                    >
                        <div class="flex items-start gap-3">
                            <div
                                class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-info"
                                    class="size-4"
                                />
                            </div>

                            <div>
                                <div
                                    class="text-sm font-semibold text-emerald-900"
                                >
                                    Farmer assignment
                                </div>
                                <p
                                    class="mt-0.5 text-xs leading-5 text-emerald-800/75"
                                >
                                    Farmers are assigned to a farm's parcels. The
                                    farm's farmer list and status are calculated
                                    automatically from those parcel assignments.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Error -->
                    <div
                        v-if="errorMessage"
                        class="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                    >
                        <UIcon
                            name="i-lucide-circle-alert"
                            class="mt-0.5 size-4 shrink-0"
                        />
                        <span>{{ errorMessage }}</span>
                    </div>

                    <!-- Actions -->
                    <div
                        class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="submitting"
                            @click="close"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="submitting || optionsLoading"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-2"
                                class="size-4 animate-spin"
                            />
                            <UIcon
                                v-else
                                :name="
                                    isEditing
                                        ? 'i-lucide-save'
                                        : 'i-lucide-plus'
                                "
                                class="size-4"
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
    </Teleport>
</template>

<script lang="ts" setup>
//@ts-nocheck
import type { Farm } from '~/composables/useFarmsApi'
import type { Barangay } from '~/composables/useBarangayApi'
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

const barangays = ref<Barangay[]>([])
const optionsLoading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const isEditing = computed(() => Boolean(props.farm))

// The farm code is generated by the backend, so it is never a form field. In
// edit mode it is still named in the header, otherwise the modal would not
// identify which farm is being changed.
const subtitle = computed(() =>
    isEditing.value
        ? `Update the details of ${props.farm?.name}.`
        : 'The farm code is generated from the selected barangay.'
)

const form = reactive<{ name: string; barangay: string }>({
    name: '',
    barangay: '',
})

function resetForm() {
    form.name = props.farm?.name ?? ''
    form.barangay = props.farm?.barangay?.documentId ?? ''
    errorMessage.value = null
}

function close() {
    if (submitting.value) return
    emit('update:modelValue', false)
}

async function loadOptions() {
    optionsLoading.value = true
    try {
        barangays.value = await getBarangays()
    } catch {
        errorMessage.value = 'Unable to load barangays.'
    } finally {
        optionsLoading.value = false
    }
}

async function submit() {
    if (submitting.value) return

    if (!form.name.trim()) {
        errorMessage.value = 'Please enter a farm name.'
        return
    }

    if (!form.barangay) {
        errorMessage.value = 'Please select a barangay.'
        return
    }

    submitting.value = true
    errorMessage.value = null

    try {
        const name = form.name.trim()
        const response = props.farm
            ? await update(props.farm.documentId, {
                  name,
                  barangay: form.barangay,
              })
            : await create({ name, barangay: form.barangay })

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
