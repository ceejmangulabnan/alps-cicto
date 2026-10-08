<script setup lang="ts">
/**
 * The admin page hero: gradient band, system-administration badge with the
 * live user count, and the Add User action.
 */
interface Props {
    userCount: number
}

const { userCount } = defineProps<Props>()

const emit = defineEmits<{
    add: []
}>()
</script>

<template>
    <div
        class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-linear-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
    >
        <div
            class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
        />

        <div class="relative flex flex-wrap items-center justify-between gap-5">
            <div class="flex min-w-0 items-start gap-4">
                <div
                    class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                >
                    <UIcon name="i-lucide-shield-check" class="size-6" />
                </div>

                <div>
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                        >
                            <span
                                class="size-1.5 rounded-full bg-emerald-500"
                            />
                            System Administration
                        </span>

                        <span
                            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                        >
                            {{ userCount }} system users
                        </span>
                    </div>

                    <h1
                        class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                    >
                        Administration
                    </h1>

                    <p
                        class="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base"
                    >
                        Manage system users, configuration, GIS settings,
                        notifications, backups, and audit activity.
                    </p>
                </div>
            </div>

            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                @click="emit('add')"
            >
                <UIcon name="i-lucide-user-plus" class="size-4.5" />
                Add User
            </button>
        </div>
    </div>
</template>
