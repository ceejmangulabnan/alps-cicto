<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type { DrawMode } from '~/composables/useParcelDrawing'

defineProps<{
    parcelCount: number
    parcels: FarmParcel[]
    selectedParcelId: string | null
    mode: DrawMode
}>()

const emit = defineEmits<{
    edit: []
    done: []
    add: []
    selectParcel: [documentId: string]
    fitAll: []
}>()
</script>

<template>
    <div
        class="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
        <div class="flex min-w-0 items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d6a2d] text-white shadow-sm"
            >
                <UIcon name="i-lucide-map" class="size-4.5" />
            </span>
            <div class="min-w-0">
                <span
                    class="block truncate text-sm font-bold text-gray-900 font-sans"
                >
                    Agricultural Parcel Map
                </span>
                <div class="hidden text-[11px] text-gray-400 sm:block">
                    Base map · OpenStreetMap / MapTiler GL
                </div>
            </div>
        </div>
        <div class="flex w-full items-center gap-3 sm:w-auto">
            <!--
                The parcel picker lives in the toolbar rather than over the map.
                As a floating panel it sat on top of the zoom and fullscreen
                controls, and it covered a quarter of the canvas to list what a
                search box handles better.
            -->
            <MapParcelPicker
                :parcels="parcels"
                :selected-id="selectedParcelId"
                @select="emit('selectParcel', $event)"
                @fit-all="emit('fitAll')"
            />
            <span
                class="hidden items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600 md:flex"
            >
                <UIcon
                    name="i-lucide-vector-polygon"
                    class="size-3.5 text-[#2d6a2d]"
                />
                <span class="font-semibold text-gray-800">{{
                    parcelCount
                }}</span>
                parcel{{ parcelCount === 1 ? '' : 's' }} drawn
            </span>
            <!--
                While drawing, the create flow owns the interaction and the Edit
                button is disabled so a stray click cannot abandon a partial
                boundary. It becomes the "Done Editing" exit button while edit
                mode is active.
            -->
            <button
                type="button"
                :disabled="
                    mode !== 'edit' && (mode === 'plot' || parcelCount === 0)
                "
                :class="[
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm sm:px-4',
                    mode === 'edit'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
                ]"
                @click="mode === 'edit' ? emit('done') : emit('edit')"
            >
                <UIcon
                    :name="
                        mode === 'edit' ? 'i-lucide-check' : 'i-lucide-pencil'
                    "
                    class="size-3.5"
                />
                {{ mode === 'edit' ? 'Done Editing' : 'Edit' }}
            </button>
            <button
                type="button"
                :class="[
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm sm:px-4',
                    mode === 'plot'
                        ? 'bg-[#2d6a2d] ring-2 ring-[#2d6a2d]/25 ring-offset-1 hover:bg-[#245524]'
                        : 'bg-[#2d6a2d] hover:bg-[#245524]',
                ]"
                @click="emit('add')"
            >
                <UIcon
                    :name="
                        mode === 'plot'
                            ? 'i-lucide-pen-tool'
                            : 'i-lucide-layers'
                    "
                    class="size-3.5"
                />
                {{ mode === 'plot' ? 'Drawing…' : 'Add Parcel' }}
            </button>
        </div>
    </div>
</template>
