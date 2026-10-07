<script setup lang="ts">
//@ts-nocheck
import type { TableColumn } from '@nuxt/ui'
const systemStats = [
    {
        label: 'Total System Users',

        val: '24',

        icon: 'i-lucide-users',

        color: '#2d6a2d',
    },

    {
        label: 'Database Records',

        val: '14,829',

        icon: 'i-lucide-database',

        color: '#1d6fa4',
    },

    { label: 'GIS Layers', val: '8', icon: 'i-lucide-map', color: '#0891b2' },

    {
        label: 'System Uptime',

        val: '99.9%',

        icon: 'i-lucide-activity',

        color: '#16a34a',
    },
]

const settingsItems = [
    {
        icon: 'i-lucide-settings',

        label: 'System Configuration',

        desc: 'General settings, logos, org details',
    },

    {
        icon: 'i-lucide-map',

        label: 'GIS Layer Manager',

        desc: 'Manage basemaps and overlay layers',
    },

    {
        icon: 'i-lucide-bell',

        label: 'Alert & Notification Rules',

        desc: 'Configure thresholds and triggers',
    },

    {
        icon: 'i-lucide-database',

        label: 'Data Backup & Export',

        desc: 'Automated backups and data exports',
    },

    {
        icon: 'i-lucide-shield',

        label: 'Audit Logs',

        desc: 'User activity and system events',
    },
]

const users = ref([
    {
        name: 'Admin Reyes',

        email: 'admin.reyes\@sanfernando.gov.ph',

        role: 'System Admin',

        status: 'Active',

        lastLogin: '2024-11-25 09:14',
    },

    {
        name: 'Engr. Jose Lim',

        email: 'j.lim\@sanfernando.gov.ph',

        role: 'Agricultural Engineer',

        status: 'Active',

        lastLogin: '2024-11-25 08:32',
    },

    {
        name: 'Agri. Maria Santos',

        email: 'm.santos\@sanfernando.gov.ph',

        role: 'Agriculture Technician',

        status: 'Active',

        lastLogin: '2024-11-24 14:52',
    },

    {
        name: 'Agri. Carlo Reyes',

        email: 'c.reyes\@sanfernando.gov.ph',

        role: 'Agriculture Technician',

        status: 'Active',

        lastLogin: '2024-11-24 11:20',
    },

    {
        name: 'Encoder Juan Cruz',

        email: 'j.cruz\@sanfernando.gov.ph',

        role: 'Data Encoder',

        status: 'Active',

        lastLogin: '2024-11-23 16:05',
    },
])

const systemInfo = [
    {
        label: 'System',

        val: 'ALPS v2.4.1 — Agricultural Land Profiling System',

        icon: 'i-lucide-info',
    },

    {
        label: 'Agency',

        val: 'City Agriculture Office, San Fernando, Pampanga',

        icon: 'i-lucide-building-2',
    },

    {
        label: 'Last Data Sync',

        val: 'November 25, 2024 · 06:00 AM (Automated)',

        icon: 'i-lucide-refresh-cw',
    },
]

const ROLE_STYLE: Record<
    string,
    { bg: string; text: string; dot: string; avatar: string }
> = {
    'System Admin': {
        bg: '#ede9fe',

        text: '#6d28d9',

        dot: '#7c3aed',

        avatar: '#7c3aed',
    },

    'Agricultural Engineer': {
        bg: '#dbeafe',

        text: '#1d4ed8',

        dot: '#2563eb',

        avatar: '#2563eb',
    },

    'Agriculture Technician': {
        bg: '#dcfce7',

        text: '#15803d',

        dot: '#16a34a',

        avatar: '#16a34a',
    },

    'Data Encoder': {
        bg: '#fef3c7',

        text: '#b45309',

        dot: '#d97706',

        avatar: '#d97706',
    },
}

const ROLE_FILTER_OPTIONS = [
    'All',

    'System Admin',

    'Agricultural Engineer',

    'Agriculture Technician',

    'Data Encoder',
]

const filterRole = ref('All')

const searchQuery = ref('')

const filteredUsers = computed(() =>
    users.value.filter((u) => {
        const matchesRole =
            filterRole.value === 'All' || u.role === filterRole.value

        const q = searchQuery.value.trim().toLowerCase()

        const matchesSearch =
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)

        return matchesRole && matchesSearch
    })
)

type AdminUser = (typeof users.value)[number]

/**
 * The system-user table's columns.
 *
 * Every field is a string, including `lastLogin`, whose "YYYY-MM-DD HH:mm"
 * form sorts correctly as text — so no column needs `sortDescFirst`. That flag
 * is what stops TanStack peeking at the first row and starting a numeric column
 * on descending while the string columns start on ascending.
 */
const columns: TableColumn<AdminUser>[] = [
    { accessorKey: 'name', header: sortHeader('Name') },
    { accessorKey: 'email', header: sortHeader('Email') },
    { accessorKey: 'role', header: sortHeader('Role') },
    { accessorKey: 'status', header: sortHeader('Status') },
    { accessorKey: 'lastLogin', header: sortHeader('Last Login') },
]

const MONTHS = [
    'Jan',

    'Feb',

    'Mar',

    'Apr',

    'May',

    'Jun',

    'Jul',

    'Aug',

    'Sep',

    'Oct',

    'Nov',

    'Dec',
]

function lastLoginLabel(date: string) {
    if (!date.includes('-')) return date

    const [d, t] = date.split(' ')

    const parts = d.split('-')

    return `${MONTHS[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${t}`
}

function initials(name: string) {
    return name

        .replace(/^(Engr\.|Agri\.)\s+/i, '')

        .split(' ')

        .map((w) => w[0])

        .slice(0, 2)

        .join('')

        .toUpperCase()
}

const showAddModal = ref(false)

const userForm = reactive({
    name: '',

    email: '',

    role: 'Agriculture Technician',

    status: 'Active',
})

function addUser() {
    if (!userForm.name.trim() || !userForm.email.trim()) return

    users.value.unshift({
        name: userForm.name.trim(),

        email: userForm.email.trim(),

        role: userForm.role,

        status: userForm.status,

        lastLogin: 'Just now',
    })

    showAddModal.value = false

    userForm.name = ''

    userForm.email = ''

    userForm.role = 'Agriculture Technician'

    userForm.status = 'Active'
}
</script>

<template>
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Header -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div
                    class="relative flex flex-wrap items-center justify-between gap-5"
                >
                    <div class="flex min-w-0 items-start gap-4">
                        <div
                            class="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-white shadow-[0_8px_22px_rgba(45,106,45,0.22)] sm:flex"
                        >
                            <UIcon
                                name="i-lucide-shield-check"
                                class="size-6"
                            />
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
                                    {{ users.length }} system users
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
                                Manage system users, configuration, GIS
                                settings, notifications, backups, and audit
                                activity.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_10px_24px_rgba(45,106,45,0.28)]"
                        @click="showAddModal = true"
                    >
                        <UIcon name="i-lucide-user-plus" class="size-4.5" />
                        Add User
                    </button>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="s in systemStats"
                    :key="s.label"
                    class="group relative min-h-[190px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${s.color}, ${s.color}55, transparent)`,
                        }"
                    />

                    <div
                        class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                        :style="{ backgroundColor: s.color }"
                    />

                    <div class="relative flex h-full flex-col">
                        <div class="flex items-start justify-between gap-3">
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5"
                                :style="{ background: `${s.color}18` }"
                            >
                                <UIcon
                                    :name="s.icon"
                                    class="size-5"
                                    :style="{ color: s.color }"
                                />
                            </div>

                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{ backgroundColor: s.color }"
                                />
                                Live
                            </span>
                        </div>

                        <div class="mt-5">
                            <div
                                class="text-3xl font-bold tracking-tight text-slate-950"
                            >
                                {{ s.val }}
                            </div>
                            <div
                                class="mt-1 text-sm font-semibold text-slate-700"
                            >
                                {{ s.label }}
                            </div>
                        </div>

                        <div
                            class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                        >
                            {{
                                s.label === 'Total System Users'
                                    ? 'Registered application accounts'
                                    : s.label === 'Database Records'
                                      ? 'Current stored system records'
                                      : s.label === 'GIS Layers'
                                        ? 'Configured spatial data layers'
                                        : 'Current system availability'
                            }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings + Users -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Settings -->
                <div
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] lg:col-span-4"
                >
                    <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-settings"
                                    class="size-4.5"
                                />
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
                            v-for="item in settingsItems"
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
                                <div
                                    class="text-sm font-semibold text-slate-800"
                                >
                                    {{ item.label }}
                                </div>
                                <div
                                    class="mt-0.5 text-xs leading-5 text-slate-500"
                                >
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

                <!-- System Users -->
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
                                    {{ filteredUsers.length }} shown ·
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
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search users…"
                                class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                            <button
                                v-if="searchQuery"
                                type="button"
                                class="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                @click="searchQuery = ''"
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
                                filterRole === r
                                    ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-md shadow-green-900/10'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                            "
                            @click="filterRole = r"
                        >
                            {{ r }}
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <UTable
                            :data="filteredUsers"
                            :columns="columns"
                            :get-row-id="(u: AdminUser) => u.email"
                            :ui="{
                                th: 'bg-slate-50/70 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                                td: 'px-5 py-4 text-sm text-slate-600',
                                tr: 'border-b border-slate-100 last:border-0 hover:bg-emerald-50/40',
                            }"
                        >
                            <template #name-cell="{ row }">
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                        :style="{
                                            background:
                                                ROLE_STYLE[row.original.role]
                                                    .avatar,
                                        }"
                                    >
                                        {{ initials(row.original.name) }}
                                    </span>

                                    <span
                                        class="font-semibold text-slate-800"
                                    >
                                        {{ row.original.name }}
                                    </span>
                                </div>
                            </template>

                            <template #email-cell="{ row }">
                                {{ row.original.email }}
                            </template>

                            <template #role-cell="{ row }">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                    :style="{
                                        background: ROLE_STYLE[row.original.role]
                                            .bg,
                                        color: ROLE_STYLE[row.original.role]
                                            .text,
                                    }"
                                >
                                    <span
                                        class="size-1.5 rounded-full"
                                        :style="{
                                            background:
                                                ROLE_STYLE[row.original.role]
                                                    .dot,
                                        }"
                                    />
                                    {{ row.original.role }}
                                </span>
                            </template>

                            <template #status-cell="{ row }">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-emerald-500"
                                    />
                                    {{ row.original.status }}
                                </span>
                            </template>

                            <template #lastLogin-cell="{ row }">
                                <span class="font-mono text-xs text-slate-500">
                                    {{ lastLoginLabel(row.original.lastLogin) }}
                                </span>
                            </template>

                            <!-- No error state: an empty list is the only failure
                                 mode this client-side filter can produce. -->
                            <template #empty>
                                <div
                                    class="flex flex-col items-center justify-center px-5 py-14 text-center"
                                >
                                    <div
                                        class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                                    >
                                        <UIcon
                                            name="i-lucide-user-x"
                                            class="size-6"
                                        />
                                    </div>
                                    <div
                                        class="text-base font-semibold text-slate-700"
                                    >
                                        No users found
                                    </div>
                                    <div class="mt-1 text-sm text-slate-400">
                                        Try a different search term or role
                                        filter.
                                    </div>
                                </div>
                            </template>
                        </UTable>
                    </div>
                </div>
            </div>

            <!-- System Information -->
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
                        v-for="info in systemInfo"
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
                            <div
                                class="text-sm font-semibold leading-6 text-slate-700"
                            >
                                {{ info.val }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add User Modal -->
    <Teleport to="body">
        <div
            v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="showAddModal = false"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e0f0fb] text-[#1d6ab3] ring-1 ring-blue-100"
                        >
                            <UIcon name="i-lucide-user-plus" class="size-5" />
                        </span>

                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Add User
                            </h3>
                            <p class="text-sm text-slate-500">
                                Register a new system user account.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="showAddModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="addUser">
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="userForm.name"
                            type="text"
                            required
                            placeholder="e.g. Agri. Ana Fernandez"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Email
                        </label>
                        <input
                            v-model="userForm.email"
                            type="email"
                            required
                            placeholder="name@sanfernando.gov.ph"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Role
                            </label>

                            <select
                                v-model="userForm.role"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option
                                    v-for="r in [
                                        'System Admin',
                                        'Agricultural Engineer',
                                        'Agriculture Technician',
                                        'Data Encoder',
                                    ]"
                                    :key="r"
                                    :value="r"
                                >
                                    {{ r }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>

                            <select
                                v-model="userForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            @click="showAddModal = false"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125]"
                        >
                            <UIcon name="i-lucide-user-plus" class="size-4" />
                            Add User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
