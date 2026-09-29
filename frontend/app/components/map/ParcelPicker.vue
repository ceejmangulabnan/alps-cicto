<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { statusColor } from '~/utils/landStatus'

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
 * shows in the trigger; the other text is folded into the search so a farmer or
 * a land status can be typed instead of a code.
 */
interface ParcelItem {
    label: string
    value: string
    /** Everything searchable, joined so one string drives the filter. */
    searchText: string
    landStatus: string
    area: string
    color: string
}

const items = computed<ParcelItem[]>(() =>
    props.parcels.map((parcel) => ({
        label: parcel.parcel_code,
        value: parcel.documentId,
        searchText: [
            parcel.parcel_code,
            parcel.land_status,
            parcel.farm?.farm_code ?? '',
            (parcel.farmers ?? []).map((farmer) => farmer.name).join(' '),
        ]
            .filter(Boolean)
            .join(' '),
        landStatus: parcel.land_status,
        area: `${parcel.area_hectares.toFixed(2)} ha`,
        color: statusColor(parcel.land_status),
    }))
)

const selected = computed<string | null>({
    get: () => props.selectedId,
    set: (value) => {
        // Clearing the menu should not deselect the map: there is nothing to
        // show with no parcel selected, so the choice is simply not acted on.
        if (value) emit('select', value)
    },
})

const selectedItem = computed(
    () => items.value.find((item) => item.value === props.selectedId) ?? null
)

const emptyMessage = computed(() =>
    props.parcels.length === 0 ? 'No parcels drawn yet' : 'No parcel matches'
)
</script>

<template>
    <div class="flex items-center gap-2">
        <USelectMenu
            v-model="selected"
            :items="items"
            :filter-fields="['searchText']"
            placeholder="Find a parcel"
            :empty-message="emptyMessage"
            value-key="value"
            class="w-full sm:w-64"
        >
            <template #item="{ item }">
                <span
                    class="size-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: item.color }"
                />
                <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold">
                        {{ item.label }}
                    </span>
                    <span class="block truncate text-[10px] text-gray-500">
                        {{ item.landStatus }} · {{ item.area }}
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
