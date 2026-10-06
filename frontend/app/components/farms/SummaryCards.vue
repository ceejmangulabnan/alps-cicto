<script setup lang="ts">
interface SummaryCard {
    label: string
    /** Pre-formatted: counts and formatted areas are both valid. */
    val: string | number
    color: string
    bg: string
    icon: string
    /** Optional supporting copy. Existing card data does not need to provide it. */
    hint?: string
}

defineProps<{
    cards: SummaryCard[]
}>()

function cardHint(card: SummaryCard): string {
    if (card.hint) return card.hint

    const label = card.label.toLowerCase()

    if (label.includes('farm')) return 'Registered farm records'
    if (label.includes('parcel')) return 'Mapped agricultural parcels'
    if (label.includes('barangay')) return 'Areas represented in the registry'
    if (label.includes('area')) return 'Registered agricultural coverage'
    if (label.includes('active')) return 'Currently active records'
    if (label.includes('risk')) return 'Records requiring attention'

    return 'Updated from the land registry'
}
</script>

<template>
    <div class="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
            v-for="card in cards"
            :key="card.label"
            class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
        >
            <!-- Top accent -->
            <div
                class="absolute inset-x-0 top-0 h-1"
                :style="{
                    backgroundImage: `linear-gradient(90deg, ${card.color}, ${card.color}55, transparent)`,
                }"
            />

            <!-- Soft decorative glow -->
            <div
                class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                :style="{ backgroundColor: card.color }"
            />

            <div class="relative flex h-full flex-col">
                <!-- Icon + status -->
                <div class="flex items-start justify-between gap-3">
                    <div
                        class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
                        :style="{ background: card.bg }"
                    >
                        <UIcon
                            :name="card.icon"
                            class="size-5"
                            :style="{ color: card.color }"
                        />
                    </div>

                    <span
                        class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                    >
                        <span
                            class="size-1.5 rounded-full"
                            :style="{ backgroundColor: card.color }"
                        />
                        Live
                    </span>
                </div>

                <!-- Value -->
                <div class="mt-5">
                    <div
                        class="font-sans text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ card.val }}
                    </div>

                    <div class="mt-1 text-sm font-semibold text-slate-700">
                        {{ card.label }}
                    </div>
                </div>

                <!-- Supporting information -->
                <div
                    class="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400"
                >
                    <UIcon
                        name="i-lucide-circle-check"
                        class="size-3.5 shrink-0"
                        :style="{ color: card.color }"
                    />
                    <span>{{ cardHint(card) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
