<script setup lang="ts" generic="S extends string">
/**
 * The status filter pills. Renders as a bare run of label + buttons so the
 * caller's flex container positions them directly (some rows tuck a "Status"
 * label in front, some a result count after — both handled by the caller).
 *
 * Generic over the status union so `v-model:status` keeps the caller's literal
 * type instead of widening to `string`.
 */
const props = defineProps<{
    status: S
    options: readonly S[]
    /** Optional status -> colour dot, shown before each non-"All" option. */
    dots?: Partial<Record<S, string>>
    /** Optional uppercase label rendered before the pills. */
    label?: string
}>()

const emit = defineEmits<{ 'update:status': [value: S] }>()

function pick(value: S) {
    emit('update:status', value)
}
</script>

<template>
    <span
        v-if="props.label"
        class="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
    >
        {{ props.label }}
    </span>

    <button
        v-for="s in props.options"
        :key="s"
        type="button"
        class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
        :class="
            props.status === s
                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
        "
        @click="pick(s)"
    >
        <span
            v-if="props.dots && s !== 'All' && props.dots[s]"
            class="h-1.5 w-1.5 rounded-full"
            :style="{ background: props.dots[s] }"
        />
        {{ s }}
    </button>
</template>
