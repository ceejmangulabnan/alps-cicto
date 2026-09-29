<script setup lang="ts">
import type { ParcelInspectionPhoto } from '~/composables/useFarmParcelApi'

/**
 * Field photos for an inspection form. Saved photos are the media files
 * already attached to the record (shown as thumbnails, removable); pending
 * files are the ones the officer picked this session but that have not been
 * uploaded yet. Nothing is sent to Strapi until the form is submitted.
 */
const props = defineProps<{
    /** Media files already attached to the record being edited. */
    saved: ParcelInspectionPhoto[]
    /** Files picked in this session, not yet uploaded. */
    pending: File[]
    disabled?: boolean
}>()

const emit = defineEmits<{
    'update:saved': [value: ParcelInspectionPhoto[]]
    'update:pending': [value: File[]]
}>()

const config = useRuntimeConfig()
const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')

const fileInput = ref<HTMLInputElement | null>(null)

/** Absolute URL for a saved Strapi media file, preferring the thumbnail. */
const fileUrl = (photo: ParcelInspectionPhoto): string => {
    const url = photo.formats?.thumbnail?.url ?? photo.url
    return url ? `${strapiUrl}${url}` : ''
}

/** Stable object-URL previews for the pending files. */
const pendingPreviews = computed(() =>
    props.pending.map((file) => ({ file, url: URL.createObjectURL(file) }))
)

function pickFiles(entries: FileList | null) {
    if (!entries?.length) return
    emit('update:pending', [...props.pending, ...Array.from(entries)])
    // Reset so picking the same file again still fires the change event.
    if (fileInput.value) fileInput.value.value = ''
}

function removeSaved(id: number) {
    emit(
        'update:saved',
        props.saved.filter((photo) => photo.id !== id)
    )
}

function removePending(file: File) {
    emit(
        'update:pending',
        props.pending.filter((item) => item !== file)
    )
}
</script>

<template>
    <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-600">
            Field Photos
            <span class="font-normal text-gray-400">
                ({{ saved.length + pending.length }})
            </span>
        </label>

        <div class="flex flex-wrap gap-2">
            <div
                v-for="photo in saved"
                :key="photo.id"
                class="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
                <img
                    v-if="fileUrl(photo)"
                    :src="fileUrl(photo)"
                    class="h-full w-full object-cover"
                    alt="Attached field photo"
                />
                <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-gray-300"
                >
                    <UIcon name="i-lucide-image" class="size-5" />
                </div>
                <button
                    type="button"
                    class="absolute right-0.5 top-0.5 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :title="`Remove photo ${saved.indexOf(photo) + 1}`"
                    :disabled="disabled"
                    @click="removeSaved(photo.id ?? -1)"
                >
                    <UIcon name="i-lucide-x" class="size-3" />
                </button>
            </div>

            <div
                v-for="preview in pendingPreviews"
                :key="preview.file.name"
                class="group relative h-16 w-16 overflow-hidden rounded-lg border border-dashed border-green-300 bg-green-50"
            >
                <img
                    :src="preview.url"
                    class="h-full w-full object-cover"
                    :alt="preview.file.name"
                />
                <button
                    type="button"
                    class="absolute right-0.5 top-0.5 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :title="`Remove ${preview.file.name}`"
                    :disabled="disabled"
                    @click="removePending(preview.file)"
                >
                    <UIcon name="i-lucide-x" class="size-3" />
                </button>
            </div>

            <label
                class="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-green-400 hover:text-[#2d6a2d] disabled:cursor-not-allowed disabled:opacity-50"
                :class="{ 'pointer-events-none opacity-50': disabled }"
                :title="disabled ? undefined : 'Add field photos'"
            >
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    multiple
                    :disabled="disabled"
                    class="hidden"
                    @change="
                        pickFiles(($event.target as HTMLInputElement).files)
                    "
                />
                <UIcon name="i-lucide-plus" class="size-4" />
            </label>
        </div>

        <p class="mt-1.5 text-[11px] text-gray-400">
            Photos upload when you save the record.
        </p>
    </div>
</template>
