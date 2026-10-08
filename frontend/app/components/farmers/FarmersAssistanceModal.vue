<script setup lang="ts">
/**
 * Record assistance for the farmer currently being viewed. Presentational:
 * the form state and the submit live in `useFarmersRegistry`, this component
 * only renders them and reports submit / cancel. The form object is the
 * composable's reactive store, so v-model binds straight back into it.
 */
import type { Farmer } from '~/composables/useFarmersApi'
import {
    ASSISTANCE_STATUS_OPTIONS,
    type AssistanceStatus,
} from '~/composables/useAssistanceApi'

interface AssistForm {
    program: string
    barangayDocumentId: string
    items: string
    /** v-model casts the number input, so this is a string only while blank. */
    value: string | number
    date: string
    status: AssistanceStatus
}

interface Props {
    show: boolean
    form: AssistForm
    farmer: Farmer | null
    programOptions: string[]
    barangays: { value: string; label: string }[]
    submitting: boolean
    error: string | null
    canSubmit: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    submit: []
    cancel: []
}>()
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="emit('cancel')"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div
                        class="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-hand-heart"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Record Assistance
                            </h3>
                            <p class="text-sm text-slate-500">
                                For {{ farmer?.name }} ({{
                                    farmer?.farmer_code
                                }})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="emit('cancel')"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="emit('submit')">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Program
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="form.program"
                                type="text"
                                list="assist-program-options-farmer"
                                placeholder="e.g. Rice Seed Subsidy"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                            <datalist id="assist-program-options-farmer">
                                <option
                                    v-for="p in programOptions"
                                    :key="p"
                                    :value="p"
                                />
                            </datalist>
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Barangay
                            </label>
                            <select
                                v-model="form.barangayDocumentId"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="">Not specified</option>
                                <option
                                    v-for="b in barangays"
                                    :key="b.value"
                                    :value="b.value"
                                >
                                    {{ b.label }}
                                </option>
                            </select>
                            <p
                                v-if="farmer?.residence_barangay"
                                class="mt-1 text-[10px] text-gray-400"
                            >
                                Defaults to {{ farmer.residence_barangay.name }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Items
                        </label>
                        <textarea
                            v-model="form.items"
                            rows="2"
                            placeholder="e.g. 4 bags certified rice seed (40 kg), 1 bag fertilizer"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Value (₱)
                            </label>
                            <input
                                v-model="form.value"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0.00"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Date
                                <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="form.date"
                                type="date"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>
                            <select
                                v-model="form.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option
                                    v-for="s in ASSISTANCE_STATUS_OPTIONS"
                                    :key="s"
                                    :value="s"
                                >
                                    {{ s }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <p
                        v-if="error"
                        class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                        {{ error }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            :disabled="submitting"
                            @click="emit('cancel')"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canSubmit"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submitting ? 'Saving...' : 'Record Assistance' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
