<script setup lang="ts">
import type { FarmParcel, ParcelFarmer } from '~/composables/useFarmParcelApi'
import { avatarColor, initials } from '~/utils/initials'
import { statusDot } from '~/utils/landStatus'

const props = defineProps<{
    parcel: FarmParcel
}>()

const emit = defineEmits<{
    close: []
    edit: []
}>()

const farm = computed(() => props.parcel.farm ?? null)
const farmers = computed(() => props.parcel.farmers ?? [])

/** `?farm=<documentId>` is the deep link the farms registry opens a card for. */
const farmLink = computed(() =>
    farm.value
        ? { path: '/farms', query: { farm: farm.value.documentId } }
        : null
)

/** Likewise `?farmer=<documentId>` opens a farmer's profile on /farmers. */
function farmerLink(farmer: ParcelFarmer) {
    return { path: '/farmers', query: { farmer: farmer.documentId } }
}

/**
 * Strapi `decimal` can arrive as a string, and the editor shows four places, so
 * this matches its precision rather than leaving a long float to render.
 */
const areaHectares = computed(() =>
    Number(props.parcel.area_hectares || 0).toFixed(4)
)

const details = computed(() => [
    { label: 'Farm code', val: farm.value?.farm_code ?? '—' },
    { label: 'Barangay', val: farm.value?.barangay?.name ?? '—' },
    { label: 'Current use', val: props.parcel.current_use || '—' },
])
</script>

<template>
    <!--
        Shares the editor's panel geometry so opening a read-only parcel and then
        editing it does not resize the map. A fixed side panel has no room below
        `sm`, where it would leave the map as a sliver; there it becomes a
        full-height sheet instead.
    -->
    <aside
        class="w-full shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 sm:w-80 sm:p-5"
    >
        <div class="mb-4 flex items-start justify-between gap-2">
            <div class="min-w-0">
                <div class="font-mono text-sm font-bold text-gray-900">
                    {{ parcel.parcel_code }}
                </div>
                <p class="truncate text-[11px] text-gray-500">
                    {{ farm?.name || farm?.farm_code || 'Unassigned farm' }}
                </p>
            </div>
            <button
                type="button"
                class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                aria-label="Close details"
                @click="emit('close')"
            >
                <UIcon name="i-lucide-x" class="size-4" />
            </button>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
            <span
                class="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700"
            >
                <span
                    class="h-2 w-2 rounded-full"
                    :style="{
                        backgroundColor: statusDot(parcel.land_status),
                    }"
                />
                {{ parcel.land_status }}
            </span>
            <span
                class="flex items-center gap-1.5 rounded-full bg-[#e8f5e8] px-2.5 py-1 text-[11px] font-medium text-[#2d6a2d]"
            >
                <UIcon name="i-lucide-ruler" class="size-3" />
                {{ areaHectares }} ha
            </span>
        </div>

        <div class="mt-4 space-y-2 text-xs">
            <div
                v-for="field in details"
                :key="field.label"
                class="flex justify-between gap-3 border-b border-gray-100 pb-2 last:border-0"
            >
                <span class="shrink-0 text-gray-400">{{ field.label }}</span>
                <span class="truncate text-right font-medium text-gray-700">{{
                    field.val
                }}</span>
            </div>
        </div>

        <!--
            A parcel belongs to a farm, so the farm is always the more useful
            place to go next; the farmers are the only other records this panel
            can reach.
        -->
        <div class="mt-4">
            <div
                class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >
                <UIcon
                    name="i-lucide-tractor"
                    class="size-3.5 text-[#2d6a2d]"
                />
                Farm
            </div>
            <NuxtLink
                v-if="farmLink"
                :to="farmLink"
                class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:border-green-200 hover:bg-[#f2f7f0]"
            >
                <span class="min-w-0">
                    <span class="block truncate">
                        {{ farm?.name || farm?.farm_code }}
                    </span>
                    <!--
                        Only alongside a name: a farm with no name is already
                        showing its code as the title.
                    -->
                    <span
                        v-if="farm?.name"
                        class="block font-mono text-[10px] text-gray-400"
                    >
                        {{ farm?.farm_code }}
                    </span>
                </span>
                <UIcon
                    name="i-lucide-external-link"
                    class="size-3.5 shrink-0 text-gray-400"
                />
            </NuxtLink>
            <p v-else class="text-[11px] text-gray-400">
                This parcel is not linked to a farm yet.
            </p>
        </div>

        <div class="mt-4">
            <div
                class="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >
                <span class="flex items-center gap-1.5">
                    <UIcon
                        name="i-lucide-users"
                        class="size-3.5 text-[#2d6a2d]"
                    />
                    Tending Farmers
                </span>
                <span v-if="farmers.length" class="text-gray-300">
                    {{ farmers.length }}
                </span>
            </div>
            <ul v-if="farmers.length" class="space-y-1.5">
                <li v-for="farmer in farmers" :key="farmer.documentId">
                    <NuxtLink
                        :to="farmerLink(farmer)"
                        class="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-gray-50"
                    >
                        <span
                            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            :style="{
                                backgroundColor: avatarColor(farmer.name),
                            }"
                        >
                            {{ initials(farmer.name) }}
                        </span>
                        <span class="min-w-0 flex-1">
                            <span
                                class="block truncate text-xs font-medium text-gray-700"
                            >
                                {{ farmer.name }}
                            </span>
                            <span
                                class="block font-mono text-[10px] text-gray-400"
                            >
                                {{ farmer.farmer_code }}
                            </span>
                        </span>
                        <UIcon
                            name="i-lucide-external-link"
                            class="size-3 shrink-0 text-gray-300"
                        />
                    </NuxtLink>
                </li>
            </ul>
            <p v-else class="text-[11px] text-gray-400">
                No farmers assigned to this parcel.
            </p>
        </div>

        <div class="mt-5 space-y-2 border-t border-gray-100 pt-4">
            <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] py-2.5 text-xs font-medium text-white hover:bg-[#245524]"
                @click="emit('edit')"
            >
                <UIcon name="i-lucide-pencil" class="size-3.5" />
                Edit Parcel
            </button>
            <NuxtLink
                :to="`/parcels/${parcel.parcel_code}`"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:border-green-200 hover:bg-[#f2f7f0]"
            >
                <UIcon name="i-lucide-external-link" class="size-3.5" />
                View Full Parcel Record
            </NuxtLink>
            <div class="flex items-start gap-1.5 rounded-lg bg-gray-50 p-2.5">
                <UIcon
                    name="i-lucide-lock"
                    class="mt-0.5 size-3 shrink-0 text-gray-400"
                />
                <p class="text-[10px] leading-relaxed text-gray-500">
                    View mode is read-only. Editing is entered deliberately, and
                    turns this panel into the parcel form.
                </p>
            </div>
        </div>
    </aside>
</template>
