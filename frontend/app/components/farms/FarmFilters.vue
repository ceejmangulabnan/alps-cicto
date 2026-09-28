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
    <div class="mb-5 space-y-3">
        <div class="flex items-center gap-3">
            <div class="relative max-w-xs flex-1">
                <UIcon
                    name="i-lucide-search"
                    class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                />
                <input
                    :value="search"
                    type="text"
                    placeholder="Search farm code, barangay or farmer..."
                    class="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-8 text-xs shadow-sm focus:border-[#2d6a2d] focus:outline-none focus:ring-1 focus:ring-green-500"
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
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                    @click="emit('update:search', '')"
                >
                    <UIcon name="i-lucide-x" class="size-3" />
                </button>
            </div>
            <div
                class="ml-auto flex items-center gap-1.5 text-xs text-gray-400"
            >
                <UIcon name="i-lucide-filter" class="size-3" />
                {{ filteredCount }} of {{ totalCount }} farms
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
            <button
                v-for="status in filters"
                :key="status"
                type="button"
                class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                :class="
                    filterStatus === status
                        ? 'bg-[#2d6a2d] text-white border-[#2d6a2d] shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

        <p v-if="selected" class="text-[11px] text-gray-400">
            Showing
            <span class="font-mono font-medium text-gray-600">
                {{ selected.farm_code }}
            </span>
            in the panel.
        </p>
    </div>
</template>
