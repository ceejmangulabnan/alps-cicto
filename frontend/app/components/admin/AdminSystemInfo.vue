<script setup lang="ts">
/** One row of the System Information strip (system, agency, last sync). */
interface AdminSystemInfoItem {
    label: string
    val: string
    icon: string
}

interface Props {
    items: AdminSystemInfoItem[]
}

defineProps<Props>()
</script>

<template>
    <div
        class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                    <UIcon name="i-lucide-server" class="size-4.5" />
                </div>

                <div>
                    <h2
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        System Information
                    </h2>
                    <p class="text-xs text-slate-500">
                        Current application and synchronization details.
                    </p>
                </div>
            </div>
        </div>

        <div
            class="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0"
        >
            <div
                v-for="info in items"
                :key="info.label"
                class="flex items-start gap-3 p-5 sm:p-6"
            >
                <div
                    class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                    <UIcon :name="info.icon" class="size-4.5" />
                </div>

                <div>
                    <div
                        class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                        {{ info.label }}
                    </div>
                    <div class="text-sm font-semibold leading-6 text-slate-700">
                        {{ info.val }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
