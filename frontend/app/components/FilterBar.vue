<script setup lang="ts" generic="S extends string">
/**
 * The "Find …" filter card the crops and harvest pages share: header with a
 * running result count, the search field, a mobile count, and the status
 * pills. State stays with the page — this only forwards the two v-models.
 */
const props = defineProps<{
    title: string
    description: string
    placeholder: string
    /** The noun in the two result counts, e.g. "cycles" or "harvests". */
    countLabel: string
    filteredCount: number
    totalCount: number
    search: string
    status: S
    options: readonly S[]
}>()

const emit = defineEmits<{
    'update:search': [value: string]
    'update:status': [value: S]
}>()
</script>

<template>
    <div
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
    >
        <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
        >
            <div class="flex items-center gap-3">
                <div
                    class="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                >
                    <UIcon name="i-lucide-search-check" class="size-4.5" />
                </div>
                <div>
                    <h2
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        {{ props.title }}
                    </h2>
                    <p class="text-xs text-slate-500">
                        {{ props.description }}
                    </p>
                </div>
            </div>

            <div
                class="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex"
            >
                <UIcon name="i-lucide-filter" class="size-3.5" />
                {{ props.filteredCount }} of {{ props.totalCount }}
                {{ props.countLabel }}
            </div>
        </div>

        <div class="space-y-4 p-4 sm:p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchInput
                    :search="props.search"
                    :placeholder="props.placeholder"
                    class="max-w-md flex-1"
                    @update:search="emit('update:search', $event)"
                />

                <div
                    class="flex items-center gap-1.5 text-sm text-slate-500 sm:hidden"
                >
                    <UIcon name="i-lucide-filter" class="size-3.5" />
                    {{ props.filteredCount }} of {{ props.totalCount }}
                    {{ props.countLabel }}
                </div>
            </div>

            <div
                class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
            >
                <FilterPills
                    :status="props.status"
                    :options="props.options"
                    @update:status="emit('update:status', $event)"
                />
            </div>
        </div>
    </div>
</template>
