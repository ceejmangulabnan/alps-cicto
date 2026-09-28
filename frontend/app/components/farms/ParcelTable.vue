<script setup lang="ts">
import type { ParcelRow } from '~/composables/useParcelsData'
import { statusClass, statusDot } from '~/utils/landStatus'
import { avatarColor, initials } from '~/utils/initials'

defineProps<{
    parcels: ParcelRow[]
    selectedDocumentId: string | null
    loading: boolean
    /** Suppresses the empty state while an error banner is already showing. */
    hasError: boolean
}>()

const emit = defineEmits<{
    select: [parcel: ParcelRow]
}>()
</script>

<template>
    <div class="alps-card flex-1 overflow-hidden">
        <table class="w-full text-xs">
            <thead class="border-b border-gray-100 bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Parcel Code
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Farmer
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Barangay
                    </th>
                    <th
                        class="px-4 py-3 text-right font-semibold text-gray-600"
                    >
                        Area (ha)
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Status
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">
                        Current Use
                    </th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(p, i) in parcels"
                    :key="p.documentId"
                    class="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-green-50/30"
                    :class="[
                        i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white',
                        selectedDocumentId === p.documentId
                            ? 'bg-green-50/60!'
                            : '',
                    ]"
                    @click="emit('select', p)"
                >
                    <td class="px-4 py-2.5 font-mono text-gray-700">
                        {{ p.parcel_code }}
                    </td>
                    <td class="px-4 py-2.5">
                        <div class="flex items-center gap-2.5">
                            <span
                                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                :style="{
                                    backgroundColor: avatarColor(p.farmerName),
                                }"
                            >
                                {{ initials(p.farmerName) }}
                            </span>
                            <span class="font-medium text-gray-800">
                                {{ p.farmerName }}
                            </span>
                        </div>
                    </td>
                    <td class="px-4 py-2.5 text-gray-500">{{ p.barangay }}</td>
                    <td
                        class="px-4 py-2.5 text-right font-mono font-medium text-gray-900"
                    >
                        {{ p.area_hectares }}
                    </td>
                    <td class="px-4 py-2.5">
                        <span
                            :class="statusClass(p.land_status) || 'status-idle'"
                            class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full"
                                :style="{
                                    background: statusDot(p.land_status),
                                }"
                            />
                            {{ p.land_status }}
                        </span>
                    </td>
                    <td class="px-4 py-2.5 text-gray-600">
                        {{ p.current_use ?? '—' }}
                    </td>
                    <td class="px-4 py-2.5">
                        <div class="flex items-center justify-end gap-1.5">
                            <span
                                class="text-[10px] font-semibold text-[#2d6a2d] opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                View
                            </span>
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="size-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#2d6a2d]"
                            />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            v-if="!loading && !hasError && parcels.length === 0"
            class="py-12 text-center text-gray-400"
        >
            <UIcon
                name="i-lucide-layers"
                class="mx-auto mb-3 size-8 opacity-30"
            />
            <div class="text-sm">No parcels found matching your filters.</div>
        </div>
    </div>
</template>
