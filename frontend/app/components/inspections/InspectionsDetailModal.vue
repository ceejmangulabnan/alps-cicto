<script setup lang="ts">
import type { ParcelInspectionPhoto } from '~/composables/useFarmParcelApi'
import type { InspectionRow } from '~/composables/useInspectionRegistry'
import { shortId } from '~/utils/format'
import { gpsLabel } from '~/utils/inspectionStatus'
import {
    INSPECTION_RISK_DOT,
    INSPECTION_RISK_STYLE,
    INSPECTION_STATUS_DOT,
    INSPECTION_STATUS_STYLE,
} from '~/utils/inspectionStatus'

/**
 * The inspection detail view: status/risk/type badges, the key facts grid,
 * the findings block, a photo gallery with a lightbox (keyboard navigable),
 * and the Edit / Close actions. The page flips `show` with the row to show.
 */
interface Props {
    show: boolean
    row: InspectionRow | null
    /** Read-only (Viewer role) hides the Edit Inspection action. */
    canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), { canEdit: true })

const emit = defineEmits<{
    close: []
    edit: []
}>()

const config = useRuntimeConfig()
const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')

/** Small preview URL, preferring Strapi's generated thumbnail when present. */
const thumbnailUrl = (photo: ParcelInspectionPhoto | null): string => {
    const url = photo?.formats?.thumbnail?.url ?? photo?.url
    return url ? `${strapiUrl}${url}` : ''
}

/** Full-size URL for the lightbox. */
const photoUrl = (photo: ParcelInspectionPhoto | null): string =>
    photo?.url ? `${strapiUrl}${photo.url}` : ''

const detailPhotos = computed(() => props.row?.photos ?? [])

/** Index of the photo shown in the lightbox; null while closed. */
const lightboxIndex = ref<number | null>(null)
const lightboxPhoto = computed(() =>
    lightboxIndex.value === null
        ? null
        : (detailPhotos.value[lightboxIndex.value] ?? null)
)

function stepLightbox(direction: 1 | -1) {
    const count = detailPhotos.value.length
    if (count === 0) return
    const current = lightboxIndex.value ?? 0
    lightboxIndex.value = (current + direction + count) % count
}

function onDetailKeydown(event: KeyboardEvent) {
    if (!props.show) return
    if (event.key === 'Escape') {
        if (lightboxIndex.value !== null) {
            lightboxIndex.value = null
        } else {
            emit('close')
        }
    } else if (lightboxIndex.value !== null && event.key === 'ArrowLeft') {
        event.preventDefault()
        stepLightbox(-1)
    } else if (lightboxIndex.value !== null && event.key === 'ArrowRight') {
        event.preventDefault()
        stepLightbox(1)
    }
}

onMounted(() => window.addEventListener('keydown', onDetailKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onDetailKeydown))

/** Each open starts with the lightbox closed, like the original page did. */
watch(
    () => props.show,
    (value) => {
        if (value) lightboxIndex.value = null
    }
)
</script>

<template>
    <!-- Inspection Detail Modal -->
    <Teleport to="body">
        <div
            v-if="show && row"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0faf0]"
                        >
                            <UIcon
                                name="i-lucide-clipboard-check"
                                class="size-5 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Inspection Details
                            </h3>
                            <p class="text-sm text-slate-500">
                                {{ row?.inspection_type }} ·
                                {{ shortId(row?.documentId ?? '') }}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="emit('close')"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <!-- Status + risk badges -->
                <div class="mb-5 flex flex-wrap items-center gap-2">
                    <span
                        :class="
                            INSPECTION_STATUS_STYLE[row?.status ?? 'Pending']
                        "
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background:
                                    INSPECTION_STATUS_DOT[
                                        row?.status ?? 'Pending'
                                    ],
                            }"
                        />
                        {{ row?.status }}
                    </span>
                    <span
                        :class="INSPECTION_RISK_STYLE[row?.riskLevel ?? 'None']"
                        class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                    >
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            :style="{
                                background:
                                    INSPECTION_RISK_DOT[
                                        row?.riskLevel ?? 'None'
                                    ],
                            }"
                        />
                        {{ row?.riskLevel }} risk
                    </span>
                    <span
                        class="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    >
                        <UIcon name="i-lucide-tags" class="size-3" />
                        {{ row?.inspection_type }}
                    </span>
                </div>

                <!-- Key facts -->
                <div
                    class="mb-5 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-3"
                >
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Parcel
                        </p>
                        <NuxtLink
                            :to="`/parcels/${row?.parcel_code}`"
                            class="font-mono text-sm font-semibold text-slate-800 underline-offset-2 hover:text-[#2d6a2d] hover:underline"
                        >
                            {{ row?.parcel_code }}
                        </NuxtLink>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Barangay
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ row?.barangay || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Date
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ row?.date ?? '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Inspector
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ row?.inspector || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            GPS Coordinates
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ gpsLabel(row?.gps_point) || '—' }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                        >
                            Photos
                        </p>
                        <p class="text-sm text-slate-700">
                            {{ detailPhotos.length }}
                            {{ detailPhotos.length === 1 ? 'photo' : 'photos' }}
                        </p>
                    </div>
                </div>

                <!-- Findings -->
                <div class="mb-5">
                    <p class="mb-2 text-sm font-semibold text-slate-700">
                        Findings
                    </p>
                    <div
                        class="rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-sm leading-6 text-slate-600"
                    >
                        <p
                            v-if="row?.notes?.trim()"
                            class="whitespace-pre-wrap"
                        >
                            {{ row.notes }}
                        </p>
                        <p v-else class="italic text-gray-400">
                            No findings recorded.
                        </p>
                    </div>
                </div>

                <!-- Field photos -->
                <div v-if="detailPhotos.length > 0" class="mb-5">
                    <p class="mb-2 text-sm font-semibold text-slate-700">
                        Field Photos
                    </p>
                    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        <button
                            v-for="(photo, index) in detailPhotos"
                            :key="photo.id ?? index"
                            type="button"
                            class="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            @click="lightboxIndex = index"
                        >
                            <img
                                v-if="thumbnailUrl(photo)"
                                :src="thumbnailUrl(photo)"
                                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                                :alt="`Field photo ${index + 1}`"
                            />
                            <div
                                v-else
                                class="flex h-full w-full items-center justify-center text-gray-300"
                            >
                                <UIcon name="i-lucide-image" class="size-5" />
                            </div>
                        </button>
                    </div>
                    <p class="mt-2 text-xs text-slate-400">
                        Click a photo to view it full-size.
                    </p>
                </div>

                <div
                    class="flex justify-end gap-2 border-t border-gray-100 pt-4"
                >
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        @click="emit('close')"
                    >
                        Close
                    </button>
                    <button
                        v-if="props.canEdit"
                        type="button"
                        class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125]"
                        @click="emit('edit')"
                    >
                        <UIcon name="i-lucide-pencil" class="size-3.5" />
                        Edit Inspection
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Photo Lightbox -->
    <Teleport to="body">
        <div
            v-if="lightboxIndex !== null && lightboxPhoto"
            class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            @click.self="lightboxIndex = null"
        >
            <button
                v-if="detailPhotos.length > 1"
                type="button"
                class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Previous photo"
                @click="stepLightbox(-1)"
            >
                <UIcon name="i-lucide-chevron-left" class="size-5" />
            </button>
            <button
                v-if="detailPhotos.length > 1"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Next photo"
                @click="stepLightbox(1)"
            >
                <UIcon name="i-lucide-chevron-right" class="size-5" />
            </button>
            <button
                type="button"
                class="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Close photo"
                @click="lightboxIndex = null"
            >
                <UIcon name="i-lucide-x" class="size-5" />
            </button>
            <figure class="max-h-full max-w-full">
                <img
                    v-if="photoUrl(lightboxPhoto)"
                    :src="photoUrl(lightboxPhoto)"
                    class="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
                    :alt="`Field photo ${(lightboxIndex ?? 0) + 1}`"
                />
                <figcaption class="mt-2 text-center text-xs text-gray-300">
                    Photo {{ (lightboxIndex ?? 0) + 1 }} of
                    {{ detailPhotos.length }}
                </figcaption>
            </figure>
        </div>
    </Teleport>
</template>
