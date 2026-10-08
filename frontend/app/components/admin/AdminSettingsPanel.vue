<script setup lang="ts">
/** One administration tool listed in the left-hand settings panel. */
interface AdminSetting {
    icon: string
    label: string
    desc: string
}

interface Props {
    items: AdminSetting[]
}

defineProps<Props>()
</script>

<template>
    <div
        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] lg:col-span-4"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                >
                    <UIcon name="i-lucide-settings" class="size-4.5" />
                </div>
                <div>
                    <h2
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        Administration Tools
                    </h2>
                    <p class="text-xs text-slate-500">
                        System configuration and management options.
                    </p>
                </div>
            </div>
        </div>

        <div class="space-y-2 p-4 sm:p-5">
            <button
                v-for="item in items"
                :key="item.label"
                type="button"
                class="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
            >
                <div
                    class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                >
                    <UIcon :name="item.icon" class="size-4.5" />
                </div>

                <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-slate-800">
                        {{ item.label }}
                    </div>
                    <div class="mt-0.5 text-xs leading-5 text-slate-500">
                        {{ item.desc }}
                    </div>
                </div>

                <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-600"
                />
            </button>
        </div>
    </div>
</template>
