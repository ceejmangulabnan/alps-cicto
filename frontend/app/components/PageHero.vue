<script setup lang="ts">
/**
 * The banner every registry page opens with: gradient card, icon tile,
 * eyebrow badge with a count chip, title, blurb, and the primary action.
 * `tone` switches the emerald palette for the red one the risk page uses.
 */
interface Props {
    /** Iconify name for the header tile. */
    icon: string
    /** Eyebrow text in the pill, e.g. "Crop & Planting Management". */
    badge: string
    /** Count chip beside the badge, e.g. "12 planting cycles". */
    count: string
    title: string
    description: string
    /** Label on the primary action button. */
    actionLabel: string
    /** Iconify name on the primary action button. */
    actionIcon: string
    tone?: 'emerald' | 'red'
}

const props = withDefaults(defineProps<Props>(), { tone: 'emerald' })

const emit = defineEmits<{ action: [] }>()

const tones = computed(() =>
    props.tone === 'red'
        ? {
              card: 'border-red-100/80 to-red-50/50',
              glow: 'bg-red-300/10',
              tile: 'bg-red-600 shadow-[0_8px_22px_rgba(220,38,38,0.20)]',
              badge: 'border-red-100 bg-red-50/80 text-red-700',
              dot: 'bg-red-500',
              action: 'bg-red-600 shadow-[0_8px_20px_rgba(220,38,38,0.20)] hover:bg-red-700 hover:shadow-[0_10px_24px_rgba(220,38,38,0.24)]',
          }
        : {
              card: 'border-emerald-100/80 to-emerald-50/70',
              glow: 'bg-emerald-300/15',
              tile: 'bg-[#2d6a2d] shadow-[0_8px_22px_rgba(45,106,45,0.22)]',
              badge: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
              dot: 'bg-emerald-500',
              action: 'bg-[#2d6a2d] shadow-[0_8px_20px_rgba(45,106,45,0.22)] hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]',
          }
)
</script>

<template>
    <div
        class="relative overflow-hidden rounded-3xl border bg-linear-to-r from-white via-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
        :class="tones.card"
    >
        <div
            class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full blur-3xl"
            :class="tones.glow"
        />

        <div class="relative flex flex-wrap items-center justify-between gap-5">
            <div class="flex min-w-0 items-start gap-4">
                <div
                    class="hidden size-12 shrink-0 items-center justify-center rounded-2xl text-white sm:flex"
                    :class="tones.tile"
                >
                    <UIcon :name="icon" class="size-6" />
                </div>

                <div>
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                            :class="tones.badge"
                        >
                            <span
                                class="size-1.5 rounded-full"
                                :class="tones.dot"
                            />
                            {{ badge }}
                        </span>

                        <span
                            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                        >
                            {{ count }}
                        </span>
                    </div>

                    <h1
                        class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                    >
                        {{ title }}
                    </h1>

                    <p
                        class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                    >
                        {{ description }}
                    </p>
                </div>
            </div>

            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                :class="tones.action"
                @click="emit('action')"
            >
                <UIcon :name="actionIcon" class="size-4.5" />
                {{ actionLabel }}
            </button>
        </div>
    </div>
</template>
