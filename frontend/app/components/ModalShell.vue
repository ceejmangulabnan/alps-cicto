<script setup lang="ts">
/**
 * The shell every create/edit form modal shares: Teleport + overlay, header
 * with an icon tile, the saved tick that shows for 900ms, and the form footer
 * (error line, Cancel, submit). Callers fill the slot with the fields.
 */
interface Props {
    show: boolean
    /** Iconify name for the header tile. */
    icon: string
    /** Background/colour classes for the header tile. */
    iconClass?: string
    title: string
    subtitle: string
    submitting?: boolean
    saved?: boolean
    /** Line under the checkmark while the saved confirmation shows. */
    savedText?: string
    error?: string | null
    /** Label on the submit button while idle. */
    submitLabel: string
    /** Label on the submit button while a save is in flight. */
    savingLabel?: string
    /** Gate on the submit button; the caller owns the form validity rule. */
    submitDisabled?: boolean
    /** Submit-button accent; risk reports use red, the rest emerald. */
    accent?: 'emerald' | 'red'
}

const props = withDefaults(defineProps<Props>(), {
    iconClass: 'bg-emerald-50 text-emerald-600',
    submitting: false,
    saved: false,
    savedText: '',
    error: null,
    savingLabel: 'Saving...',
    submitDisabled: false,
    accent: 'emerald',
})

const emit = defineEmits<{
    close: []
    submit: []
}>()

const submitClass = computed(() =>
    props.accent === 'red'
        ? 'flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
        : 'flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-60'
)
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-11 items-center justify-center rounded-2xl"
                            :class="iconClass"
                        >
                            <UIcon :name="icon" class="size-5" />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                {{ title }}
                            </h3>
                            <p class="text-sm text-slate-500">
                                {{ subtitle }}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        :disabled="submitting"
                        @click="emit('close')"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div
                    v-if="saved"
                    class="flex flex-col items-center gap-2 py-10"
                >
                    <span
                        class="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                        <UIcon name="i-lucide-check" class="size-6" />
                    </span>
                    <p class="text-base font-semibold text-slate-800">Saved</p>
                    <p class="text-sm text-slate-500">{{ savedText }}</p>
                </div>

                <form v-else class="space-y-5" @submit.prevent="emit('submit')">
                    <slot />

                    <p
                        v-if="error"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {{ error }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                            :disabled="submitting"
                            @click="emit('close')"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            :class="submitClass"
                            :disabled="submitDisabled"
                        >
                            <UIcon
                                v-if="submitting"
                                name="i-lucide-loader-circle"
                                class="size-3.5 animate-spin"
                            />
                            {{ submitting ? savingLabel : submitLabel }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
