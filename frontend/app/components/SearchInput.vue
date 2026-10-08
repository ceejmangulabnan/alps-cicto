<script setup lang="ts">
/**
 * The registry search field: magnifier, clear button, and the focus ring.
 * `accent` switches the ring to red for the risk page. Layout width comes in
 * through the class fallthrough (`max-w-md flex-1`, `sm:w-80`, …).
 */
interface Props {
    search: string
    placeholder: string
    accent?: 'emerald' | 'red'
}

const props = withDefaults(defineProps<Props>(), { accent: 'emerald' })

const emit = defineEmits<{ 'update:search': [value: string] }>()

const inputClass = computed(() =>
    props.accent === 'red'
        ? 'w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10'
        : 'w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10'
)

function onInput(event: Event) {
    emit('update:search', (event.target as HTMLInputElement).value)
}
</script>

<template>
    <div class="relative w-full">
        <UIcon
            name="i-lucide-search"
            class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
            type="text"
            :value="search"
            :placeholder="placeholder"
            :class="inputClass"
            @input="onInput"
        />
        <button
            v-if="search"
            type="button"
            class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            @click="emit('update:search', '')"
        >
            <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
    </div>
</template>
