<script setup lang="ts">
/**
 * A labelled form control: the uppercase label every modal field uses, an
 * optional required marker, the control (slot), and an optional hint line.
 */
interface Props {
    label: string
    required?: boolean
    /** Helper line under the control; hidden when empty. */
    hint?: string
}

defineProps<Props>()
</script>

<template>
    <div>
        <label
            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>

        <slot />

        <p v-if="hint" class="mt-1.5 text-xs text-slate-400">{{ hint }}</p>
    </div>
</template>
