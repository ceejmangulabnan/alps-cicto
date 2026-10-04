<script setup lang="ts">
import type { DrawMode } from '~/composables/useParcelDrawing'

const props = defineProps<{
    mode: DrawMode
    /** A parcel is being edited in the side panel (the form is open). */
    isEditing: boolean
    /** A parcel is selected in view mode (read-only details open). */
    isInspecting: boolean
}>()

/**
 * Dismissible, and re-shown whenever the mode changes so the panel always
 * matches what the map is currently doing.
 */
const dismissed = ref(false)
watch(
    () => props.mode,
    () => {
        dismissed.value = false
    }
)

const title = computed(() =>
    props.mode === 'plot'
        ? 'Plotting Guide'
        : props.isInspecting
          ? 'Parcel Details'
          : props.isEditing
            ? 'Editing Parcel'
            : props.mode === 'edit'
              ? 'Edit Mode'
              : 'View Mode'
)

const icon = computed(() =>
    props.mode === 'plot'
        ? 'i-lucide-pen-tool'
        : props.isInspecting
          ? 'i-lucide-map-pin'
          : 'i-lucide-pencil'
)

const hintColor = computed(() =>
    props.mode === 'edit' ? 'bg-amber-500' : 'bg-[#2d6a2d]'
)

const hints = computed<string[]>(() => {
    if (props.mode === 'plot') {
        return [
            'Click points to trace the parcel boundary',
            'Click the first point again to close the parcel',
            'Press Esc to cancel the draft',
        ]
    }
    if (props.isInspecting) {
        return [
            'These details are read-only',
            'Farmers and the farm link to their records',
            'Press Esc or close the panel to dismiss',
        ]
    }
    if (props.isEditing) {
        return [
            'Drag the outline or its dots to reshape the parcel',
            'Edit the parcel details in the side panel',
            'Done Editing in the toolbar (or Esc) to exit',
        ]
    }
    if (props.mode === 'edit') {
        return [
            'Click a parcel on the map to edit it',
            'Done Editing in the toolbar (or Esc) to exit',
        ]
    }
    return [
        'Click a parcel on the map to see its details',
        'Use Edit in the toolbar to change a parcel',
    ]
})
</script>

<template>
    <div
        v-if="!dismissed"
        class="absolute left-4 top-4 z-10 w-56 rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm sm:w-64"
    >
        <div class="flex items-center gap-2">
            <span
                class="flex h-6 w-6 items-center justify-center rounded-md"
                :class="mode === 'edit' ? 'bg-amber-500' : 'bg-[#2d6a2d]'"
            >
                <UIcon :name="icon" class="size-3 text-white" />
            </span>
            <span class="text-xs font-semibold text-gray-800">
                {{ title }}
            </span>
            <button
                type="button"
                class="ml-auto rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Dismiss guide"
                @click="dismissed = true"
            >
                <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
        </div>
        <div class="mt-2.5 space-y-1.5 text-[11px] text-gray-500">
            <div
                v-for="hint in hints"
                :key="hint"
                class="flex items-center gap-2"
            >
                <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="hintColor"
                />
                {{ hint }}
            </div>
        </div>
    </div>
</template>
