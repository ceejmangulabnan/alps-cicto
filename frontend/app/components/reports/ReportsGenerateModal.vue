<script setup lang="ts">
/**
 * The "Generate Report" modal: pick a dataset, see its columns, and hand it to
 * the browser as a CSV. All state lives here; the page only opens and closes
 * it, so `show` is watched to reset the selection the way the old
 * `openGenerate` did.
 */
import type { ReportDataset } from '~/utils/analytics'
import { csvFilename, downloadCsv, toCsv } from '~/utils/csv'
import { CATEGORY_STYLE, fmtCount } from '~/utils/reportPresentation'

interface Props {
    show: boolean
    datasets: ReportDataset[]
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const selectedKey = ref('')

const generatedName = ref<string | null>(null)

let generatedTimer: ReturnType<typeof setTimeout> | null = null

/** Opens on the first report that has rows, so the modal is never empty. */
watch(
    () => props.show,
    (open) => {
        if (!open) return

        selectedKey.value = props.datasets[0]?.key ?? ''

        generatedName.value = null
    }
)

const selectedDataset = computed(
    () =>
        props.datasets.find((dataset) => dataset.key === selectedKey.value) ??
        null
)

/** The first column of a dataset, which is what its file opens on. */
const datasetColumns = (dataset: ReportDataset): string =>
    dataset.columns.map((column) => column.label).join(' · ')

function generateSelected() {
    const dataset = selectedDataset.value

    if (!dataset) return

    const filename = csvFilename(dataset.title)

    downloadCsv(csvFilename(dataset.title), toCsv(dataset))

    generatedName.value = filename

    if (generatedTimer) clearTimeout(generatedTimer)

    generatedTimer = setTimeout(() => {
        generatedTimer = null

        generatedName.value = null
    }, 4000)
}

function closeGenerate() {
    if (generatedTimer) {
        clearTimeout(generatedTimer)

        generatedTimer = null
    }

    generatedName.value = null

    emit('close')
}

onUnmounted(() => {
    if (generatedTimer) clearTimeout(generatedTimer)
})
</script>

<template>
    <!-- Generate Report Modal -->
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="closeGenerate"
        >
            <div
                class="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e8] text-[#2d6a2d] ring-1 ring-emerald-100"
                        >
                            <UIcon name="i-lucide-file-down" class="size-5" />
                        </span>

                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Generate Report
                            </h3>
                            <p class="text-sm text-slate-500">
                                Pick a report to generate a CSV from the current
                                registry figures.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                        @click="closeGenerate"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <div class="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                    <button
                        v-for="dataset in datasets"
                        :key="dataset.key"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all"
                        :class="
                            dataset.key === selectedKey
                                ? 'border-emerald-300 bg-emerald-50/70 shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                        "
                        @click="selectedKey = dataset.key"
                    >
                        <span
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                            :style="{
                                background: CATEGORY_STYLE[dataset.category].bg,
                            }"
                        >
                            <UIcon
                                :name="CATEGORY_STYLE[dataset.category].icon"
                                class="size-4.5"
                                :style="{
                                    color: CATEGORY_STYLE[dataset.category]
                                        .text,
                                }"
                            />
                        </span>

                        <span class="min-w-0 flex-1">
                            <span
                                class="block text-sm font-semibold text-slate-800"
                            >
                                {{ dataset.title }}
                            </span>
                            <span class="mt-0.5 block text-xs text-slate-400">
                                {{ dataset.category }} ·
                                {{ fmtCount(dataset.rows.length) }} rows
                            </span>
                        </span>

                        <UIcon
                            v-if="dataset.key === selectedKey"
                            name="i-lucide-circle-check"
                            class="size-5 shrink-0 text-[#2d6a2d]"
                        />
                    </button>
                </div>

                <div
                    v-if="selectedDataset"
                    class="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3"
                >
                    <div
                        class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                        Columns
                    </div>
                    <div class="mt-1.5 text-sm leading-6 text-slate-600">
                        {{ datasetColumns(selectedDataset) }}
                    </div>
                </div>

                <p
                    v-if="generatedName"
                    class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700"
                >
                    <UIcon name="i-lucide-circle-check" class="size-4" />
                    Downloaded {{ generatedName }}
                </p>

                <div
                    class="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5"
                >
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        @click="closeGenerate"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="!selectedDataset"
                        @click="generateSelected"
                    >
                        <UIcon name="i-lucide-download" class="size-4" />
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
