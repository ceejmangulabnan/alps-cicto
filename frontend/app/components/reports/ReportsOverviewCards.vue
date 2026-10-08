<script setup lang="ts">
/**
 * The four headline analytics cards. These stay hand-rolled rather than
 * reusing `StatCards` because their internals differ: gradient top bars, icon
 * tiles with rings, and fixed "Live" badges.
 */
import { fmtCount, fmtWhole } from '~/utils/reportPresentation'

interface Props {
    parcelCount: number
    totalArea: number
    productionTotal: number
    windowMonths: number
    barangayCount: number
}

defineProps<Props>()
</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <div
                class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-300 to-transparent"
            />
            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-emerald-300/10 blur-2xl"
            />

            <div class="relative flex h-full flex-col">
                <div class="flex items-start justify-between">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    >
                        <UIcon name="i-lucide-layers" class="size-5" />
                    </div>
                    <span
                        class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        Live
                    </span>
                </div>

                <div class="mt-5">
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ fmtCount(parcelCount) }}
                    </div>
                    <div class="mt-1 text-sm font-semibold text-slate-700">
                        Registered Parcels
                    </div>
                </div>

                <div
                    class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                >
                    Current parcel registry coverage
                </div>
            </div>
        </div>

        <div
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <div
                class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-300 to-transparent"
            />
            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-blue-300/10 blur-2xl"
            />

            <div class="relative flex h-full flex-col">
                <div class="flex items-start justify-between">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    >
                        <UIcon name="i-lucide-ruler" class="size-5" />
                    </div>
                    <span
                        class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        Live
                    </span>
                </div>

                <div class="mt-5">
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ fmtWhole(totalArea) }}
                        <span class="text-lg font-semibold text-slate-400"
                            >ha</span
                        >
                    </div>
                    <div class="mt-1 text-sm font-semibold text-slate-700">
                        Total Agricultural Area
                    </div>
                </div>

                <div
                    class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                >
                    Combined registered parcel area
                </div>
            </div>
        </div>

        <div
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <div
                class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-transparent"
            />
            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-amber-300/10 blur-2xl"
            />

            <div class="relative flex h-full flex-col">
                <div class="flex items-start justify-between">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                    >
                        <UIcon name="i-lucide-wheat" class="size-5" />
                    </div>
                    <span
                        class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        Live
                    </span>
                </div>

                <div class="mt-5">
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ fmtWhole(productionTotal) }}
                        <span class="text-lg font-semibold text-slate-400"
                            >kg</span
                        >
                    </div>
                    <div class="mt-1 text-sm font-semibold text-slate-700">
                        Production Window
                    </div>
                </div>

                <div
                    class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                >
                    Last {{ windowMonths }} months
                </div>
            </div>
        </div>

        <div
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <div
                class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-violet-300 to-transparent"
            />
            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-violet-300/10 blur-2xl"
            />

            <div class="relative flex h-full flex-col">
                <div class="flex items-start justify-between">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                    >
                        <UIcon name="i-lucide-map-pinned" class="size-5" />
                    </div>
                    <span
                        class="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        Live
                    </span>
                </div>

                <div class="mt-5">
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ barangayCount }}
                    </div>
                    <div class="mt-1 text-sm font-semibold text-slate-700">
                        Barangays Covered
                    </div>
                </div>

                <div
                    class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                >
                    Areas represented in analytics
                </div>
            </div>
        </div>
    </div>
</template>
