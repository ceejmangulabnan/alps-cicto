<script setup lang="ts">
/**
 * The export centre: every report dataset with its category chips, the search
 * box and the CSV download buttons. Filters here are page-local and purely
 * presentational — the datasets themselves arrive from the analytics composable
 * and are shared with the generate modal.
 */
import type { ReportCategory, ReportDataset } from '~/utils/analytics'
import { csvFilename, downloadCsv, toCsv } from '~/utils/csv'
import { CATEGORY_STYLE, fmtCount, fmtDate } from '~/utils/reportPresentation'

interface Props {
    datasets: ReportDataset[]
    categories: ReportCategory[]
    rowTotal: number
}

const { datasets, categories, rowTotal } = defineProps<Props>()

type CategoryFilter = ReportCategory | 'All'

const filterCategory = ref<CategoryFilter>('All')

const searchQuery = ref('')

const filteredDatasets = computed<ReportDataset[]>(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return datasets.filter((dataset) => {
        const matchesCategory =
            filterCategory.value === 'All' ||
            dataset.category === filterCategory.value

        const matchesSearch =
            !query ||
            dataset.title.toLowerCase().includes(query) ||
            dataset.description.toLowerCase().includes(query) ||
            dataset.category.toLowerCase().includes(query)

        return matchesCategory && matchesSearch
    })
})

const categoryCount = (category: ReportCategory): number =>
    datasets.filter((dataset) => dataset.category === category).length

/** Backs the empty-state escape hatch, so both filters widen at once. */
function clearFilters() {
    filterCategory.value = 'All'

    searchQuery.value = ''
}

/** Hands a dataset to the browser as a CSV, named for the day it was taken. */
function download(dataset: ReportDataset) {
    downloadCsv(csvFilename(dataset.title), toCsv(dataset))
}
</script>

<template>
    <!-- Export Center -->
    <div
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
        <div
            class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
        >
            <div class="flex items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                >
                    <UIcon name="i-lucide-folder-open" class="size-4.5" />
                </div>

                <div>
                    <h2
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        Export Center
                    </h2>
                    <p class="mt-0.5 text-xs text-slate-500 sm:text-sm">
                        {{ datasets.length }} reports ·
                        {{ fmtCount(rowTotal) }} rows · generated in your
                        browser as CSV
                    </p>
                </div>
            </div>

            <div class="flex w-full flex-wrap items-center gap-2 xl:w-auto">
                <div class="relative w-full sm:w-72">
                    <UIcon
                        name="i-lucide-search"
                        class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        v-model="searchQuery"
                        type="search"
                        placeholder="Search reports…"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                </div>
            </div>
        </div>

        <div
            class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
        >
            <button
                type="button"
                class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                :class="
                    filterCategory === 'All'
                        ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                "
                @click="filterCategory = 'All'"
            >
                All
            </button>

            <button
                v-for="category in categories"
                :key="category"
                type="button"
                class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                :class="
                    filterCategory === category
                        ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                "
                @click="filterCategory = category"
            >
                <UIcon :name="CATEGORY_STYLE[category].icon" class="size-3.5" />
                {{ category }}
                <span class="opacity-60">
                    {{ categoryCount(category) }}
                </span>
            </button>

            <span class="ml-auto text-sm font-medium text-slate-500">
                {{ filteredDatasets.length }} shown
            </span>
        </div>

        <div v-if="filteredDatasets.length" class="divide-y divide-slate-100">
            <div
                v-for="dataset in filteredDatasets"
                :key="dataset.key"
                class="group flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/30 sm:px-6"
            >
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                        :style="{
                            background: CATEGORY_STYLE[dataset.category].bg,
                        }"
                    >
                        <UIcon
                            :name="CATEGORY_STYLE[dataset.category].icon"
                            class="size-4.5"
                            :style="{
                                color: CATEGORY_STYLE[dataset.category].text,
                            }"
                        />
                    </div>

                    <div class="min-w-0">
                        <div class="text-sm font-semibold text-slate-800">
                            {{ dataset.title }}
                        </div>

                        <div class="mt-0.5 truncate text-xs text-slate-500">
                            {{ dataset.description }}
                        </div>

                        <div
                            class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400"
                        >
                            <span>{{ dataset.category }}</span>
                            <span class="h-1 w-1 rounded-full bg-slate-300" />
                            <span>
                                {{ fmtCount(dataset.rows.length) }} rows
                            </span>

                            <template v-if="dataset.latest">
                                <span
                                    class="h-1 w-1 rounded-full bg-slate-300"
                                />
                                <span>
                                    latest {{ fmtDate(dataset.latest) }}
                                </span>
                            </template>
                        </div>
                    </div>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                    <span
                        class="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600"
                    >
                        CSV
                    </span>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-[#2d6a2d] hover:bg-[#2d6a2d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="dataset.rows.length === 0"
                        :title="
                            dataset.rows.length === 0
                                ? 'Nothing recorded to export yet'
                                : `Download ${csvFilename(dataset.title)}`
                        "
                        @click="download(dataset)"
                    >
                        <UIcon name="i-lucide-download" class="size-4" />
                        Download
                    </button>
                </div>
            </div>
        </div>

        <div
            v-else
            class="flex flex-col items-center justify-center px-5 py-14 text-center"
        >
            <div
                class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
            >
                <UIcon name="i-lucide-file-question" class="size-6" />
            </div>

            <div class="text-base font-semibold text-slate-700">
                No reports match this filter
            </div>

            <button
                type="button"
                class="mt-2 text-sm font-semibold text-[#2d6a2d] hover:underline"
                @click="clearFilters"
            >
                Clear the filters
            </button>
        </div>

        <div
            class="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-400 sm:px-6"
        >
            <UIcon name="i-lucide-info" class="size-3.5" />
            Exports are generated from the current registries, so every
            downloaded file matches the figures above. Nothing is stored
            server-side.
        </div>
    </div>
</template>
