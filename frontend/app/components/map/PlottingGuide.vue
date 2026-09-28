<script setup lang="ts">
defineProps<{ isEditing: boolean }>()
</script>

<template>
    <div
        class="pointer-events-none absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm"
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
