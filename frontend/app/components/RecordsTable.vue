<script setup lang="ts">
/**
 * The records table shell all four registry pages share: card chrome, header
 * (title/description plus a `header-right` slot for a count badge or search
 * field), an optional `toolbar` slot (the pill rows), and the loading / error /
 * empty / no-results state rows. Callers supply the column headers (`head`)
 * and row cells (`body`), so column count and content stay page-specific.
 */
interface Props {
    title: string
    description?: string
    /** Columns in the row, used as the colspan of the state rows. */
    colspan: number
    /** Table min-width class, e.g. `min-w-[980px]`. */
    minWidth?: string
    loading?: boolean
    loadingText?: string
    /** Load failure message; shows the retry row when set. */
    loadError?: string | null
    /** No rows at all, as opposed to none matching the current filter. */
    empty?: boolean
    emptyIcon?: string
    emptyTitle?: string
    emptyDescription?: string
    /** The filter matched nothing. */
    noResults?: boolean
    noResultsText?: string
    /** Header badge text; the badge is hidden when omitted. */
    count?: string
}

const props = withDefaults(defineProps<Props>(), {
    description: undefined,
    minWidth: 'min-w-[980px]',
    loading: false,
    loadingText: 'Loading...',
    loadError: null,
    empty: false,
    emptyIcon: 'i-lucide-inbox',
    emptyTitle: 'Nothing here yet',
    emptyDescription: '',
    noResults: false,
    noResultsText: 'No records match the current search or status filter.',
    count: undefined,
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
    <div
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        {{ props.title }}
                    </h3>
                    <p
                        v-if="props.description"
                        class="mt-1 text-xs text-slate-500 sm:text-sm"
                    >
                        {{ props.description }}
                    </p>
                </div>

                <slot name="header-right">
                    <div
                        v-if="props.count !== undefined"
                        class="hidden rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"
                    >
                        {{ props.count }}
                    </div>
                </slot>
            </div>
        </div>

        <slot name="toolbar" />

        <div class="overflow-x-auto">
            <table class="w-full text-sm" :class="props.minWidth">
                <thead class="border-b border-slate-100 bg-slate-50/70">
                    <tr
                        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                        <slot name="head" />
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="props.loading">
                        <td
                            :colspan="props.colspan"
                            class="px-5 py-12 text-center text-sm text-slate-400"
                        >
                            <span class="inline-flex items-center gap-2">
                                <UIcon
                                    name="i-lucide-loader-circle"
                                    class="size-4 animate-spin"
                                />
                                {{ props.loadingText }}
                            </span>
                        </td>
                    </tr>

                    <tr v-else-if="props.loadError">
                        <td
                            :colspan="props.colspan"
                            class="px-5 py-12 text-center"
                        >
                            <p class="text-sm text-red-600">
                                {{ props.loadError }}
                            </p>
                            <button
                                type="button"
                                class="mt-2 text-sm font-semibold text-green-700 underline"
                                @click="emit('retry')"
                            >
                                Try again
                            </button>
                        </td>
                    </tr>

                    <tr v-else-if="props.empty">
                        <td
                            :colspan="props.colspan"
                            class="px-5 py-14 text-center"
                        >
                            <div class="flex flex-col items-center gap-2">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                >
                                    <UIcon
                                        :name="props.emptyIcon"
                                        class="size-6"
                                    />
                                </div>
                                <p
                                    class="text-base font-semibold text-slate-700"
                                >
                                    {{ props.emptyTitle }}
                                </p>
                                <p class="max-w-sm text-sm text-slate-400">
                                    {{ props.emptyDescription }}
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr v-else-if="props.noResults">
                        <td
                            :colspan="props.colspan"
                            class="px-5 py-12 text-center text-sm text-slate-400"
                        >
                            {{ props.noResultsText }}
                        </td>
                    </tr>

                    <template v-else>
                        <slot name="body" />
                    </template>
                </tbody>
            </table>
        </div>
    </div>
</template>
