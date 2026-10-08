<script setup lang="ts">
import type { AssistanceRow } from '~/composables/useAssistanceRegistry'
import {
    ASSISTANCE_STATUS_DOT,
    ASSISTANCE_STATUS_STYLE,
    peso,
} from '~/utils/assistanceStatus'
import { avatarColor, initials } from '~/utils/initials'

/**
 * The assistance records card: columns, cells and row actions on top of the
 * shared RecordsTable shell. The search field and the status pills arrive
 * from the page through the forwarded header/toolbar slots.
 */
interface Props {
    /** Already filtered by the page's search/status state. */
    rows: AssistanceRow[]
    /** All programs, so an empty registry can be told from an empty filter. */
    total: number
    loading: boolean
    loadError: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    edit: [row: AssistanceRow]
    delete: [row: AssistanceRow]
    retry: []
}>()

/** Reuses the shared land-status pills, one shade per assistance status. */

const STATUS_STYLE = ASSISTANCE_STATUS_STYLE

const STATUS_DOT = ASSISTANCE_STATUS_DOT

/**
 * Program colours, keyed by name. A program recorded outside this list still
 * renders — it falls back to the neutral grey rather than losing its pill.
 */

const PROGRAM_COLORS: Record<string, string> = {
    'Rice Seed Subsidy': '#16a34a',
    'Corn Seed Assistance': '#ca8a04',
    'Veggie Growers Kit': '#7c3aed',
    'Farm Machinery Access': '#1d6fa4',
    'Livelihood Starter Pack': '#0891b2',
    'Training - Rice Production': '#6b7280',
    'Soil Amendment Support': '#d97706',
}

const programColor = (program: string) => PROGRAM_COLORS[program] ?? '#6b7280'
</script>

<template>
    <RecordsTable
        title="Assistance Records"
        description="Review farmer recipients, assistance programs, released items, values, and status."
        :colspan="9"
        min-width="min-w-[1040px]"
        :loading="props.loading"
        loading-text="Loading assistance records..."
        :load-error="props.loadError"
        :empty="props.total === 0"
        empty-icon="i-lucide-hand-heart"
        empty-title="No assistance recorded yet"
        empty-description="Record the first assistance entry for a registered farmer."
        :no-results="props.rows.length === 0"
        no-results-text="No assistance records match the current search or status filter."
        @retry="emit('retry')"
    >
        <template #header-right>
            <slot name="header-right" />
        </template>

        <template #toolbar>
            <slot name="toolbar" />
        </template>

        <template #head>
            <th class="px-5 py-3.5 text-left">Ref</th>
            <th class="px-5 py-3.5 text-left">Program</th>
            <th class="px-5 py-3.5 text-left">Recipient</th>
            <th class="px-5 py-3.5 text-left">Barangay</th>
            <th class="px-5 py-3.5 text-left">Items</th>
            <th class="px-5 py-3.5 text-right">Value (₱)</th>
            <th class="px-5 py-3.5 text-left">Date</th>
            <th class="px-5 py-3.5 text-left">Status</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
        </template>

        <template #body>
            <tr
                v-for="a in props.rows"
                :key="a.documentId"
                class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
            >
                <td class="px-5 py-4">
                    <span
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500"
                    >
                        {{ a.reference_code }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <span
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        :style="{
                            background: `${programColor(a.program)}1a`,
                            color: programColor(a.program),
                        }"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: programColor(a.program),
                            }"
                        />
                        {{ a.program }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                backgroundColor: avatarColor(a.recipient),
                            }"
                        >
                            {{ initials(a.recipient) }}
                        </span>

                        <span class="min-w-0">
                            <span
                                class="block truncate font-medium text-slate-800"
                            >
                                {{ a.recipient }}
                            </span>

                            <NuxtLink
                                v-if="a.farmerDocumentId"
                                :to="{
                                    path: '/farmers',
                                    query: {
                                        farmer: a.farmerDocumentId,
                                    },
                                }"
                                class="mt-0.5 block font-mono text-xs text-slate-400 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                                :title="`Open ${a.recipient}'s profile`"
                            >
                                {{ a.farmer_code }}
                            </NuxtLink>

                            <span
                                v-else
                                class="mt-0.5 block font-mono text-xs text-slate-400"
                            >
                                {{ a.farmer_code || '—' }}
                            </span>
                        </span>
                    </div>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    <span class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-map-pin"
                            class="size-3.5 text-slate-400"
                        />
                        {{ a.barangay || '—' }}
                    </span>
                </td>

                <td
                    class="max-w-xs truncate px-5 py-4 text-slate-600"
                    :title="a.items"
                >
                    {{ a.items || '—' }}
                </td>

                <td
                    class="px-5 py-4 text-right font-mono font-semibold text-emerald-700"
                >
                    {{ peso(a.value) }}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    <span class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-calendar"
                            class="size-3.5 text-slate-400"
                        />
                        {{ a.date ?? '—' }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <span
                        :class="STATUS_STYLE[a.status] || 'status-idle'"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background: STATUS_DOT[a.status],
                            }"
                        />
                        {{ a.status }}
                    </span>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            title="Edit assistance"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                            @click="emit('edit', a)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-3.5" />
                        </button>

                        <button
                            type="button"
                            title="Delete assistance"
                            class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            @click="emit('delete', a)"
                        >
                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
        </template>
    </RecordsTable>
</template>
