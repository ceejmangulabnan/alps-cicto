<script setup lang="ts">
/**
 * Register a new farmer. Presentational: the form state and the submit live in
 * `useFarmersRegistry`, this component only renders them and reports submit /
 * cancel. The form object is the composable's reactive store, so v-model binds
 * straight back into it.
 */
import type { FarmerStatus } from '~/composables/useFarmersApi'

interface RegisterForm {
    name: string
    contact: string
    status: FarmerStatus
}

interface Props {
    show: boolean
    form: RegisterForm
    submitting: boolean
    error: string | null
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
                    <div>
                        <h3
                            class="text-xl font-bold tracking-tight text-slate-950"
                        >
                            Register Farmer
                        </h3>
                        <p class="text-sm text-slate-500">
                            The farmer code is generated automatically.
                        </p>
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
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Status
                        </label>
                        <select
                            v-model="form.status"
                            :disabled="submitting"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Departed">Departed</option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            :disabled="submitting"
                            placeholder="e.g. Juan Dela Cruz"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Contact Number
                        </label>
                        <input
                            v-model="form.contact"
                            type="text"
                            :disabled="submitting"
                            placeholder="09XX XXX XXXX"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        />
                    </div>

                    <p
                        v-if="error"
                        class="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700"
                    >
                        {{ error }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            :disabled="submitting"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                            @click="emit('cancel')"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            :disabled="submitting"
                            class="rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:opacity-60"
                        >
                            <span
                                v-if="submitting"
                                class="inline-flex items-center gap-1.5"
                            >
                                <UIcon
                                    name="i-lucide-loader-circle"
                                    class="size-3 animate-spin"
                                />
                                Registering...
                            </span>
                            <span v-else>Register Farmer</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
