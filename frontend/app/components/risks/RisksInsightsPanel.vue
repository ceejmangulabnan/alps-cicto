<script setup lang="ts">
import type {
    AlpsInsight,
    InsightType,
    RiskPriority,
} from '~/utils/riskInsights'

/**
 * The ALPS insights section: the type filter, the three card states
 * (loading / empty / filtered-empty) and the insight cards themselves. The
 * filter lives here because only this section consumes it; the page owns the
 * record table's search and status pills.
 *
 * `create-action` carries the insight title so the page can pre-fill the
 * report form — that is how a card's "Create Action" button opens it.
 */
interface Props {
    insights: AlpsInsight[]
    loading: boolean
    /** Read-only (Viewer role) hides the report-generation actions. */
    canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), { canEdit: true })

const emit = defineEmits<{
    create: []
    'create-action': [title: string]
}>()

/* ---------------------------------------------------------------- */
/* Presentation maps                                                  */
/* ---------------------------------------------------------------- */

const PRIORITY_STYLE: Record<
    RiskPriority,
    { bg: string; text: string; border: string; dot: string }
> = {
    High: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
    Medium: {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        dot: '#ca8a04',
    },
    Low: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', dot: '#0891b2' },
}

const TYPE_ICON: Record<InsightType, string> = {
    risk: 'i-lucide-alert-triangle',
    warning: 'i-lucide-zap',
    opportunity: 'i-lucide-trending-up',
}

const TYPE_ICON_CLASS: Record<InsightType, string> = {
    risk: 'text-red-500',
    warning: 'text-yellow-500',
    opportunity: 'text-green-600',
}

const TYPE_BG: Record<InsightType, string> = {
    risk: '#fee2e2',
    warning: '#fef9c3',
    opportunity: '#dcfce7',
}

const TYPE_TEXT: Record<InsightType, string> = {
    risk: '#b91c1c',
    warning: '#a16207',
    opportunity: '#166534',
}

const TYPE_LABEL: Record<InsightType, string> = {
    risk: 'Risk',
    warning: 'Warning',
    opportunity: 'Opportunity',
}

/* ---------------------------------------------------------------- */
/* Type filter                                                         */
/* ---------------------------------------------------------------- */

const insightTypeFilterOptions = [
    'All',
    'risk',
    'warning',
    'opportunity',
] as const
type InsightFilter = (typeof insightTypeFilterOptions)[number]
const filterType = ref<InsightFilter>('All')

const filteredInsights = computed(() =>
    props.insights.filter(
        (insight) =>
            filterType.value === 'All' || insight.type === filterType.value
    )
)

const insightTotals = computed(() => ({
    parcels: filteredInsights.value.reduce((s, i) => s + i.affectedParcels, 0),
    area:
        Math.round(
            filteredInsights.value.reduce((s, i) => s + i.affectedArea, 0) * 10
        ) / 10,
}))
</script>

<template>
    <section
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
    >
        <div
            class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
        >
            <div class="flex flex-wrap items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-[#2d6a2d] text-white shadow-sm"
                >
                    <UIcon name="i-lucide-activity" class="size-4.5" />
                </div>

                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <h2
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            ALPS Insights
                        </h2>
                        <span
                            class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                            Rule-based · Transparent
                        </span>
                    </div>
                    <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                        {{ filteredInsights.length }} active insights ·
                        {{ insightTotals.parcels }} parcels ·
                        {{ insightTotals.area }} ha
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
                <button
                    v-for="t in insightTypeFilterOptions"
                    :key="t"
                    type="button"
                    class="rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all"
                    :class="
                        filterType === t
                            ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                    "
                    @click="filterType = t"
                >
                    {{ t }}
                </button>
            </div>
        </div>

        <div class="p-4 sm:p-5">
            <div
                v-if="props.loading"
                class="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-12 text-sm text-slate-400"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="size-4 animate-spin"
                />
                Loading risk reports...
            </div>

            <div
                v-else-if="props.insights.length === 0"
                class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center"
            >
                <div
                    class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
                >
                    <UIcon name="i-lucide-shield-check" class="size-6" />
                </div>
                <p class="text-base font-semibold text-slate-700">
                    No active insights
                </p>
                <p class="max-w-md text-sm text-slate-400">
                    Every filed risk report has been resolved, and no idle or
                    fallow ground is waiting to be brought back into use.
                </p>
                <button
                    v-if="props.canEdit"
                    type="button"
                    class="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f5125]"
                    @click="emit('create')"
                >
                    <UIcon name="i-lucide-plus" class="size-4" />
                    Generate Risk Report
                </button>
            </div>

            <div
                v-else-if="filteredInsights.length === 0"
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-sm text-slate-400"
            >
                No {{ filterType }} insights right now.
            </div>

            <div v-else class="space-y-4">
                <div
                    v-for="insight in filteredInsights"
                    :key="insight.key"
                    class="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:p-6"
                >
                    <div
                        class="absolute inset-y-0 left-0 w-1"
                        :style="{
                            background: PRIORITY_STYLE[insight.priority].dot,
                        }"
                    />

                    <div
                        class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
                    >
                        <div class="flex min-w-0 flex-1 items-start gap-4">
                            <div
                                class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
                                :style="{
                                    background: TYPE_BG[insight.type],
                                }"
                            >
                                <UIcon
                                    :name="TYPE_ICON[insight.type]"
                                    class="size-4.5"
                                    :class="TYPE_ICON_CLASS[insight.type]"
                                />
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h3
                                        class="text-base font-bold text-slate-800"
                                    >
                                        {{ insight.title }}
                                    </h3>

                                    <span
                                        class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                                        :style="{
                                            background: TYPE_BG[insight.type],
                                            color: TYPE_TEXT[insight.type],
                                        }"
                                    >
                                        {{ TYPE_LABEL[insight.type] }}
                                    </span>

                                    <span
                                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                        :style="{
                                            background:
                                                PRIORITY_STYLE[insight.priority]
                                                    .bg,
                                            color: PRIORITY_STYLE[
                                                insight.priority
                                            ].text,
                                            border: `1px solid ${PRIORITY_STYLE[insight.priority].border}`,
                                        }"
                                    >
                                        {{ insight.priority }} Priority
                                    </span>
                                </div>

                                <p
                                    class="mt-2 text-sm leading-6 text-slate-600"
                                >
                                    {{ insight.description }}
                                </p>

                                <div
                                    v-if="insight.signals.length > 0"
                                    class="mt-3 flex flex-wrap items-center gap-1.5"
                                >
                                    <span
                                        v-for="signal in insight.signals"
                                        :key="signal"
                                        class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                                    >
                                        {{ signal }}
                                    </span>
                                </div>

                                <div
                                    class="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"
                                >
                                    <div
                                        class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
                                    >
                                        <UIcon
                                            name="i-lucide-code-2"
                                            class="size-3.5"
                                        />
                                        Detection Rule
                                    </div>
                                    <code
                                        class="break-all font-mono text-xs text-slate-600"
                                    >
                                        {{ insight.rule }}
                                    </code>
                                </div>

                                <div
                                    class="mt-4 flex flex-wrap items-center gap-2"
                                >
                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                                    >
                                        <UIcon
                                            name="i-lucide-map-pin"
                                            class="size-3.5 text-slate-400"
                                        />
                                        {{ insight.affectedParcels }} parcels ·
                                        {{ insight.affectedArea }} ha
                                    </span>

                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                                    >
                                        <UIcon
                                            name="i-lucide-trending-up"
                                            class="size-3.5"
                                        />
                                        Impact score
                                        {{ insight.potentialScore }}
                                    </span>
                                </div>

                                <div
                                    class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                                >
                                    <div
                                        class="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700"
                                    >
                                        Recommendation
                                    </div>
                                    <div
                                        class="text-sm leading-6 text-slate-700"
                                    >
                                        {{ insight.recommendation }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex shrink-0 flex-row gap-2 xl:flex-col">
                            <button
                                v-if="
                                    props.canEdit &&
                                    insight.type !== 'opportunity'
                                "
                                type="button"
                                class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f5125]"
                                @click="emit('create-action', insight.title)"
                            >
                                <UIcon name="i-lucide-plus" class="size-4" />
                                Create Action
                            </button>

                            <NuxtLink
                                :to="`/map?parcel=${insight.parcelDocumentId ?? insight.rows[0]?.parcelDocumentId ?? ''}`"
                                class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <UIcon name="i-lucide-eye" class="size-4" />
                                View Parcels
                            </NuxtLink>

                            <span class="text-right text-xs text-slate-400">
                                <template v-if="insight.type === 'opportunity'">
                                    {{ insight.affectedParcels }} parcels
                                    available
                                </template>
                                <template v-else>
                                    {{ insight.rows.length }} open reports
                                </template>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
