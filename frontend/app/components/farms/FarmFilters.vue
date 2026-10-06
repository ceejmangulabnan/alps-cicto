<script setup lang="ts">
import type { FarmRow, FarmStatusFilter } from '~/composables/useFarmsData'
import { FARM_STATUS_OPTIONS } from '~/composables/useFarmsApi'
import { farmStatusDot } from '~/utils/farmStatus'

defineProps<{
    search: string
    filterStatus: FarmStatusFilter
    filteredCount: number
    totalCount: number
    selected: FarmRow | null
}>()

const emit = defineEmits<{
    'update:search': [value: string]
    'update:filterStatus': [value: FarmStatusFilter]
}>()

const filters: FarmStatusFilter[] = ['All', ...FARM_STATUS_OPTIONS]
</script>

<template>
    <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="relative w-full max-w-md flex-1">
                <UIcon
                    name="i-lucide-search"
                    class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />

                <input
                    :value="search"
                    type="text"
                    placeholder="Search farm code, barangay or farmer..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    @input="
                        emit(
                            'update:search',
                            ($event.target as HTMLInputElement).value
                        )
                    "
                />

                <button
                    v-if="search"
                    type="button"
                    class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    @click="emit('update:search', '')"
                >
                    <UIcon name="i-lucide-x" class="size-3.5" />
                </button>
            </div>

            <div
                class="flex items-center gap-1.5 text-sm font-medium text-slate-500 sm:ml-auto"
            >
                <UIcon name="i-lucide-filter" class="size-3.5" />
                {{ filteredCount }} of {{ totalCount }} farms
            </div>
        </div>

        <div
            class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
        >
            <button
                v-for="status in filters"
                :key="status"
                type="button"
                class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                :class="
                    filterStatus === status
                        ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                "
                @click="emit('update:filterStatus', status)"
            >
                <span
                    v-if="status !== 'All'"
                    class="h-1.5 w-1.5 rounded-full"
                    :style="{ background: farmStatusDot(status) }"
                />
                {{ status }}
            </button>
        </div>

        <div
            v-if="selected"
            class="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-800"
        >
            <UIcon
                name="i-lucide-panel-right-open"
                class="size-4 shrink-0 text-emerald-700"
            />
            <span>
                Showing
                <span class="font-mono font-semibold">
                    {{ selected.farm_code }}
                </span>
                in the detail panel.
            </span>
        </div>
    </div>
</template>
