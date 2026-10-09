<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { statusColor } from '~/utils/landStatus'
import { selectMenuSlots } from '~/utils/lightSelectMenu'

const props = defineProps<{
    parcels: FarmParcel[]
    selectedId: string | null
}>()

const emit = defineEmits<{
    select: [documentId: string]
    fitAll: []
}>()

/**
 * A parcel as the menu offers it. `label` is the parcel code so that is what
 * shows in the trigger; the rest is shown in the row, or searched.
 */
interface ParcelItem {
    label: string
    value: string
    /** The farm's name, or its code when the farm has no name to show. */
    farm: string
    farmCode: string
    barangay: string
    landStatus: string
    area: string
    color: string
    /** One line naming the tendees, shortened once there are several. */
    farmerSummary: string
    /**
     * One entry per searchable attribute rather than one joined string.
     * The menu scores each entry independently, so typing a farmer's name ranks
     * on that name; a joined blob would also match queries that only happen to
     * straddle two attributes.
     */
    searchTerms: string[]
}

const NO_FARMERS = 'No farmers assigned'

/** Names the tendees, collapsing all but the first once the list gets long. */
function summarizeFarmers(farmerNames: string[]): string {
    const [first, ...rest] = farmerNames
    if (first === undefined) return NO_FARMERS
    return rest.length > 0 ? `${first} +${rest.length}` : first
}

const items = computed<ParcelItem[]>(() =>
    props.parcels.map((parcel) => {
        const farm = parcel.farm
        const barangay = farm?.barangay
        const farmerNames = (parcel.farmers ?? []).map((farmer) => farmer.name)

        return {
            label: parcel.parcel_code,
            value: parcel.documentId,
            farm: farm?.name || farm?.farm_code || 'Unassigned',
            farmCode: farm?.farm_code ?? '',
            barangay: barangay?.name ?? '',
            landStatus: parcel.land_status,
            area: `${Number(parcel.area_hectares || 0).toFixed(2)} ha`,
            color: statusColor(parcel.land_status),
            farmerSummary: summarizeFarmers(farmerNames),
            searchTerms: [
                parcel.parcel_code,
                farm?.farm_code ?? '',
                farm?.name ?? '',
                barangay?.name ?? '',
                barangay?.code ?? '',
                parcel.land_status,
                parcel.current_use ?? '',
                ...(parcel.farmers ?? []).flatMap((farmer) => [
                    farmer.name,
                    farmer.farmer_code,
                ]),
            ].filter(Boolean),
        }
    })
)

/**
 * `undefined` rather than the prop's own `null` for "nothing selected": that is
 * the empty value USelectMenu expects, so the v-model type checks.
 */
const selected = computed<string | undefined>({
    get: () => props.selectedId ?? undefined,
    set: (value) => {
        // Clearing the menu should not deselect the map: there is nothing to
        // show with no parcel selected, so the choice is simply not acted on.
        if (value) emit('select', value)
    },
})

const selectedItem = computed(
    () => items.value.find((item) => item.value === props.selectedId) ?? null
)

/**
 * Match the toolbar's hand-rolled controls instead of Nuxt UI's default theme:
 * same light grey border, white fill, `text-xs`, green focus ring, and a light
 * dropdown. `variant="none"` strips Nuxt's variant classes so the trigger is
 * styled purely from these slots.
 */
const menuUi = {
    ...selectMenuSlots,
    base: 'gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500',
}
</script>

<template>
    <div class="flex items-center gap-2">
        <USelectMenu
            v-model="selected"
            :items="items"
            :filter-fields="['searchTerms']"
            :search-input="{ placeholder: 'Parcel, farm, farmer, barangay…' }"
            placeholder="Find a parcel"
            value-key="value"
            variant="none"
            size="xs"
            :ui="menuUi"
            class="w-full sm:w-72"
        >
            <!--
                `empty-message` is not a prop of USelectMenu, so it was falling
                through as a stray attribute and never shown. The `empty` slot is
                the way to say this, and naming the search term tells the user
                which field they can search instead of only that it found none.
            -->
            <template #empty="{ searchTerm }">
                <p
                    v-if="parcels.length === 0"
                    class="py-1 text-center text-xs text-gray-400"
                >
                    No parcels drawn yet
                </p>
                <p v-else class="py-1 text-center text-xs text-gray-400">
                    No parcel matches
                    <span class="font-medium text-gray-500"
                        >"{{ searchTerm }}"</span
                    >
                    — try a parcel code, farm, barangay, or farmer's name.
                </p>
            </template>
            <!--
                Three lines, because the parcel code alone does not say enough to
                tell two parcels apart: which farm and barangay it sits in, how
                big it is, and who tends it.
            -->
            <template #item="{ item }">
                <span
                    class="mt-1 size-2 shrink-0 self-start rounded-full"
                    :style="{ backgroundColor: item.color }"
                />
                <span class="min-w-0 flex-1">
                    <span class="flex items-baseline gap-2">
                        <span class="truncate font-semibold">
                            {{ item.label }}
                        </span>
                        <span
                            class="ml-auto shrink-0 font-mono text-[10px] text-gray-400"
                        >
                            {{ item.area }}
                        </span>
                    </span>
                    <span class="block truncate text-[11px] text-gray-600">
                        {{ item.farm }}
                        <span
                            v-if="item.farmCode && item.farm !== item.farmCode"
                            class="text-gray-400"
                        >
                            · {{ item.farmCode }}
                        </span>
                    </span>
                    <span class="block truncate text-[10px] text-gray-400">
                        <span v-if="item.barangay">{{ item.barangay }} · </span>
                        {{ item.landStatus }} · {{ item.farmerSummary }}
                    </span>
                </span>
            </template>
        </USelectMenu>

        <!--
            The trigger shows the code alone, which loses the land status dot
            that makes the list scannable, so it is repeated beside the menu.
        -->
        <span
            v-if="selectedItem"
            class="flex items-center gap-1.5 text-[11px] text-gray-500"
        >
            <span
                class="size-2 rounded-full"
                :style="{ backgroundColor: selectedItem.color }"
            />
            {{ selectedItem.landStatus }}
        </span>

        <button
            type="button"
            :disabled="parcels.length === 0"
            class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="emit('fitAll')"
        >
            <UIcon name="i-lucide-scan" class="size-3.5" />
            Fit all
        </button>
    </div>
</template>
