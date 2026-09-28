<script setup lang="ts">
import type { LoadErrorAction } from '~/utils/loadError'

defineProps<{
    message: string
    action: LoadErrorAction
}>()

const emit = defineEmits<{
    retry: []
    signIn: []
}>()
</script>

<template>
    <div
        class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
    >
        <span>{{ message }}</span>
        <button
            v-if="action === 'sign-in'"
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            @click="emit('signIn')"
        >
            <UIcon name="i-lucide-log-in" class="size-3" />
            Sign in again
        </button>
        <button
            v-else-if="action === 'retry'"
            type="button"
            class="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            @click="emit('retry')"
        >
            Retry
        </button>
    </div>
</template>
