<script setup lang="ts">
const props = defineProps<{ isEditing: boolean }>()

/**
 * Dismissible, and dismissed when editing ends: the guide is written for
 * plotting a boundary, so leaving it up over the canvas during every later
 * edit just covers the map it is describing.
 */
const dismissed = ref(false)
watch(
    () => props.isEditing,
    () => {
        dismissed.value = false
    }
)
</script>

<template>
    <div
        v-if="!dismissed"
        class="absolute left-4 top-4 z-10 w-56 rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm sm:w-64"
    >
        <div class="flex items-center gap-2">
            <span
                class="flex h-6 w-6 items-center justify-center rounded-md bg-[#2d6a2d]"
            >
                <UIcon name="i-lucide-pen-tool" class="size-3 text-white" />
            </span>
            <span class="text-xs font-semibold text-gray-800">
                {{ isEditing ? 'Edit Parcel' : 'Plotting Guide' }}
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
            <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d6a2d]" />
                Click points to trace the parcel boundary
            </div>
            <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d6a2d]" />
                Click the first point again to close the parcel
            </div>
            <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                Use Edit mode to adjust existing vertices
            </div>
        </div>
    </div>
</template>
