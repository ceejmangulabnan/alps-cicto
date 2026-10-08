<script setup lang="ts">
/**
 * The reports page hero: gradient card, live-coverage badge, headline figures,
 * and the Refresh / Generate Report actions.
 */
import { fmtCount, fmtWhole } from '~/utils/reportPresentation'

interface Props {
    parcels: number
    areaHa: number
    loading: boolean
    /** Disables Generate Report while no exportable dataset exists. */
    canGenerate: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    refresh: []
    generate: []
}>()
</script>

<template>
    <div
        class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-linear-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
    >
        <div
            class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
        />

        <div class="relative flex flex-wrap items-center justify-between gap-5">
            <div class="flex min-w-0 items-start gap-4">
                <div
                    class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                >
                    <UIcon
                        name="i-lucide-chart-no-axes-combined"
                        class="size-6"
                    />
                </div>

                <div>
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                        >
                            <span
                                class="size-1.5 rounded-full bg-emerald-500"
                            />
                            Analytics & Reporting Center
                        </span>

                        <span
                            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                        >
                            {{ fmtCount(parcels) }} parcels ·
                            {{ fmtWhole(areaHa) }} ha
                        </span>
                    </div>

                    <h1
                        class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                    >
                        Reports &amp; Analytics
                    </h1>

                    <p
                        class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                    >
                        Review production summaries, land-use analytics,
                        barangay comparisons, and export-ready registry reports.
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="emit('refresh')"
                >
                    <UIcon
                        name="i-lucide-refresh-cw"
                        class="size-4"
                        :class="loading ? 'animate-spin' : ''"
                    />
                    Refresh
                </button>

                <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!canGenerate"
                    @click="emit('generate')"
                >
                    <UIcon name="i-lucide-file-down" class="size-4" />
                    Generate Report
                </button>
            </div>
        </div>
    </div>
</template>
