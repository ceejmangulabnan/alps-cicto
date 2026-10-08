<script setup lang="ts">
/**
 * The delete confirmation every registry page shows: red icon tile, title,
 * a caller-written message (slot), the error line, and Cancel/Delete. The
 * page pairs it with `useDeleteModal`.
 */
interface Props {
    show: boolean
    title: string
    deleting?: boolean
    error?: string | null
}

withDefaults(defineProps<Props>(), {
    deleting: false,
    error: null,
})

const emit = defineEmits<{
    close: []
    confirm: []
}>()
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            >
                <div
                    class="mb-4 flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                >
                    <UIcon name="i-lucide-trash-2" class="size-5" />
                </div>

                <h3 class="text-xl font-bold tracking-tight text-slate-950">
                    {{ title }}
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                    <slot />
                </p>

                <p
                    v-if="error"
                    class="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                    {{ error }}
                </p>

                <div class="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        :disabled="deleting"
                        @click="emit('close')"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="deleting"
                        @click="emit('confirm')"
                    >
                        <UIcon
                            v-if="deleting"
                            name="i-lucide-loader-circle"
                            class="size-3.5 animate-spin"
                        />
                        {{ deleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
