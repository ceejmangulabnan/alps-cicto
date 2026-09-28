<script setup lang="ts">
import type { ParcelAlertAction } from '~/composables/useParcelData'

defineProps<{
    message: string
    action: ParcelAlertAction
}>()

const emit = defineEmits<{
    retry: []
    signIn: []
}>()
</script>

<template>
    <div
        class="absolute left-1/2 top-4 z-20 flex w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-lg"
        role="alert"
    >
        <span>{{ message }}</span>
        <button
            v-if="action === 'sign-in'"
            type="button"
            class="flex flex-shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            @click="emit('signIn')"
        >
            <UIcon name="i-lucide-log-in" class="size-3" />
            Sign in again
        </button>
        <button
            v-else-if="action === 'retry'"
            type="button"
            class="flex-shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            @click="emit('retry')"
        >
            Retry
        </button>
    </div>
</template>
