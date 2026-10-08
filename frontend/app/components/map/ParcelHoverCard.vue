<script setup lang="ts">
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import { statusDot } from '~/utils/landStatus'

const props = defineProps<{
    parcel: FarmParcel
    x: number
    y: number
}>()

const cardEl = ref<HTMLElement | null>(null)

const farm = computed(() => props.parcel.farm ?? null)

/**
 * Strapi `decimal` can arrive as a string, and the details panel shows four
 * places, so this matches its precision rather than leaving a long float.
 */
const areaHectares = computed(() =>
    Number(props.parcel.area_hectares || 0).toFixed(4)
)

const details = computed(() => [
    { label: 'Farm', val: farm.value?.name || farm.value?.farm_code || '—' },
    { label: 'Barangay', val: farm.value?.barangay?.name ?? '—' },
    { label: 'Current use', val: props.parcel.current_use || '—' },
])

/**
 * Placement is measured rather than assumed: the card is clamped inside the
 * map horizontally, and flips to below the cursor when there is no room above
 * it. Sizes are cached per parcel so a moving cursor only re-reads the refs —
 * calling offsetWidth on every mousemove would force a layout per pixel.
 */
const size = ref({ cardW: 0, cardH: 0, boxW: 0, boxH: 0 })

async function measure() {
    await nextTick()

    const card = cardEl.value
    const box = card?.parentElement
    if (!card || !box) return

    size.value = {
        cardW: card.offsetWidth,
        cardH: card.offsetHeight,
        boxW: box.clientWidth,
        boxH: box.clientHeight,
    }
}

// The card only mounts once a parcel is hovered, so the first measurement
// happens on mount and every parcel change after that.
onMounted(() => {
    void measure()
})
watch(
    () => props.parcel.documentId,
    () => {
        void measure()
    }
)

/** Gap between the cursor and the nearest edge of the card. */
const GAP = 14
/** Keeps the card off the map's edges once it has been clamped. */
const EDGE = 6

const placement = computed(() => {
    const { cardW, cardH, boxW, boxH } = size.value
    const measured = cardW > 0 && boxW > 0

    const half = cardW / 2
    const left = measured
        ? Math.min(Math.max(props.x, half + EDGE), boxW - half - EDGE)
        : props.x

    // Above the cursor is the default; flip below when the top of the map
    // leaves no room, falling back to whichever side has more.
    const roomAbove = props.y - GAP
    const roomBelow = boxH - props.y - GAP
    const above = roomAbove >= cardH || roomAbove >= roomBelow

    const top = above ? props.y - GAP : props.y + GAP

    // The arrow points back at the cursor, which clamping may have pushed
    // outside the card — kept inside so it never overhangs a rounded corner.
    const arrowLeft = measured
        ? Math.min(Math.max(props.x - (left - half), 16), cardW - 16)
        : 0

    return {
        left: `${left}px`,
        top: `${top}px`,
        transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        above,
        arrowLeft: `${arrowLeft}px`,
    }
})
</script>

<template>
    <!--
        Rendered inside the map wrapper, so the pointer's map-container pixels
        are this element's coordinate space. Pointer-events stay off: the card
        is a read-out of what is under the cursor, never something to click,
        and it must not swallow the map's own mouse events.
    -->
    <div
        ref="cardEl"
        class="pointer-events-none absolute z-30 max-w-65 rounded-xl border border-white/70 bg-white/95 px-3 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 backdrop-blur-xl"
        :style="{
            left: placement.left,
            top: placement.top,
            transform: placement.transform,
        }"
    >
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
                <div class="font-mono text-xs font-bold text-gray-900">
                    {{ parcel.parcel_code }}
                </div>
                <p class="truncate text-[10px] text-gray-500">
                    {{ farm?.name || farm?.farm_code || 'Unassigned farm' }}
                </p>
            </div>
            <span
                class="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
            >
                <span
                    class="size-1.5 rounded-full"
                    :style="{
                        backgroundColor: statusDot(parcel.land_status),
                    }"
                />
                {{ parcel.land_status }}
            </span>
        </div>

        <div
            class="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#2d6a2d]"
        >
            <UIcon name="i-lucide-ruler" class="size-3" />
            {{ areaHectares }} ha
        </div>

        <div class="mt-1.5 space-y-0.5 border-t border-gray-100 pt-1.5">
            <div
                v-for="field in details"
                :key="field.label"
                class="flex justify-between gap-3 text-[10px]"
            >
                <span class="shrink-0 text-gray-400">{{ field.label }}</span>
                <span class="truncate text-right font-medium text-gray-600">{{
                    field.val
                }}</span>
            </div>
        </div>

        <!--
            A rotated square, offset so its inner vertex tucks just behind the
            card's edge: its two bordered edges then read as the arrow, meeting
            the card's own border instead of floating clear of it. The offsets
            are half the square's diagonal, which is what keeps the tip on the
            cursor side of the GAP.
        -->
        <span
            class="absolute size-2.5 border-l border-t border-white/70 bg-white/95"
            :class="placement.above ? '-bottom-1' : '-top-1'"
            :style="{
                left: placement.arrowLeft,
                transform: placement.above
                    ? 'translateX(-50%) rotate(-135deg)'
                    : 'translateX(-50%) rotate(45deg)',
            }"
        />
    </div>
</template>
