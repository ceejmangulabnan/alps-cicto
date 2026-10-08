<script setup lang="ts">
/**
 * The system-users registry: search box, role filter pills, the user table
 * and the empty state. Search + role filtering reuse useTableFilters (the
 * same composable every registry page uses), with the role pills standing in
 * for the usual status pills.
 */
import {
    ROLE_FILTER_OPTIONS,
    ROLE_STYLE,
    lastLoginLabel,
    userInitials,
} from '~/utils/adminPresentation'
import type { AdminUser } from '~/utils/adminPresentation'

const props = defineProps<{ users: AdminUser[] }>()

const { search, filterStatus, filtered } = useTableFilters(
    () => props.users,
    {
        statusOptions: ROLE_FILTER_OPTIONS,
        haystack: (u) => `${u.name} ${u.email} ${u.role}`,
        matchesStatus: (u, role) => role === 'All' || u.role === role,
    }
)
</script>

<template>
    <div
        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-8"
    >
        <div
            class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"
        >
            <div class="flex items-center gap-3">
                <div
                    class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                >
                    <UIcon name="i-lucide-users" class="size-4.5" />
                </div>

                <div>
                    <h2
                        class="text-base font-bold tracking-tight text-slate-800"
                    >
                        System Users
                    </h2>
                    <p class="text-xs text-slate-500 sm:text-sm">
                        {{ filtered.length }} shown ·
                        {{ users.length }} total
                    </p>
                </div>
            </div>

            <div class="relative w-full sm:w-72">
                <UIcon
                    name="i-lucide-search"
                    class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search users…"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <button
                    v-if="search"
                    type="button"
                    class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    @click="search = ''"
                >
                    <UIcon name="i-lucide-x" class="size-3.5" />
                </button>
            </div>
        </div>

        <div
            class="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6"
        >
            <button
                v-for="r in ROLE_FILTER_OPTIONS"
                :key="r"
                type="button"
                class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                :class="
                    filterStatus === r
                        ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                "
                @click="filterStatus = r"
            >
                {{ r }}
            </button>
        </div>

        <div v-if="filtered.length" class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
                <thead class="border-b border-slate-100 bg-slate-50/70">
                    <tr
                        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                        <th class="px-5 py-3.5 text-left">Name</th>
                        <th class="px-5 py-3.5 text-left">Email</th>
                        <th class="px-5 py-3.5 text-left">Role</th>
                        <th class="px-5 py-3.5 text-left">Status</th>
                        <th class="px-5 py-3.5 text-left">Last Login</th>
                    </tr>
                </thead>

                <tbody>
                    <tr
                        v-for="u in filtered"
                        :key="u.email"
                        class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                    >
                        <td class="px-5 py-4">
                            <div class="flex items-center gap-3">
                                <span
                                    class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                    :style="{
                                        background:
                                            ROLE_STYLE[u.role].avatar,
                                    }"
                                >
                                    {{ userInitials(u.name) }}
                                </span>

                                <span
                                    class="font-semibold text-slate-800"
                                >
                                    {{ u.name }}
                                </span>
                            </div>
                        </td>

                        <td class="px-5 py-4 text-slate-600">
                            {{ u.email }}
                        </td>

                        <td class="px-5 py-4">
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                :style="{
                                    background: ROLE_STYLE[u.role].bg,
                                    color: ROLE_STYLE[u.role].text,
                                }"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{
                                        background: ROLE_STYLE[u.role].dot,
                                    }"
                                />
                                {{ u.role }}
                            </span>
                        </td>

                        <td class="px-5 py-4">
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            >
                                <span
                                    class="size-1.5 rounded-full bg-emerald-500"
                                />
                                {{ u.status }}
                            </span>
                        </td>

                        <td
                            class="px-5 py-4 font-mono text-xs text-slate-500"
                        >
                            {{ lastLoginLabel(u.lastLogin) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-else
            class="flex flex-col items-center justify-center px-5 py-14 text-center"
        >
            <div
                class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
            >
                <UIcon name="i-lucide-user-x" class="size-6" />
            </div>
            <div class="text-base font-semibold text-slate-700">
                No users found
            </div>
            <div class="mt-1 text-sm text-slate-400">
                Try a different search term or role filter.
            </div>
        </div>
    </div>
</template>