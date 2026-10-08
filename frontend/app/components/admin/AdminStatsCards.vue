<script setup lang="ts">
/**
 * The admin page's four KPI cards (system statistics). The cards carry a
 * colour-coded top bar, a Live chip and a label-keyed footnote, so they stay
 * hand-rolled rather than reusing StatCards (whose icon/ footnote shapes
 * differ).
 */
interface AdminStat {
    label: string
    val: string
    icon: string
    color: string
}

interface Props {
    stats: AdminStat[]
}

defineProps<Props>()
</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
            v-for="s in stats"
            :key="s.label"
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <div
                class="absolute inset-x-0 top-0 h-1"
                :style="{
                    backgroundImage: `linear-gradient(90deg, ${s.color}, ${s.color}55, transparent)`,
                }"
            />

            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                :style="{ backgroundColor: s.color }"
            />

            <div class="relative flex h-full flex-col">
                <div class="flex items-start justify-between gap-3">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5"
                        :style="{ background: `${s.color}18` }"
                    >
                        <UIcon
                            :name="s.icon"
                            class="size-5"
                            :style="{ color: s.color }"
                        />
                    </div>

                    <span
                        class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        <span
                            class="size-1.5 rounded-full"
                            :style="{ backgroundColor: s.color }"
                        />
                        Live
                    </span>
                </div>

                <div class="mt-5">
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ s.val }}
                    </div>
                    <div
                        class="mt-1 text-sm font-semibold text-slate-700"
                    >
                        {{ s.label }}
                    </div>
                </div>

                <div
                    class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                >
                    {{
                        s.label === 'Total System Users'
                            ? 'Registered application accounts'
                            : s.label === 'Database Records'
                              ? 'Current stored system records'
                              : s.label === 'GIS Layers'
                                ? 'Configured spatial data layers'
                                : 'Current system availability'
                    }}
                </div>
            </div>
        </div>
    </div>
</template>