<script setup lang="ts">
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
        email: 'admin.reyes@sanfernando.gov.ph',
        role: 'System Admin',
        status: 'Active',
        lastLogin: '2024-11-25 09:14',
    },
    {
        name: 'Engr. Jose Lim',
        email: 'j.lim@sanfernando.gov.ph',
        role: 'Agricultural Engineer',
        status: 'Active',
        lastLogin: '2024-11-25 08:32',
    },
    {
        name: 'Agri. Maria Santos',
        email: 'm.santos@sanfernando.gov.ph',
        role: 'Agriculture Technician',
        status: 'Active',
        lastLogin: '2024-11-24 14:52',
    },
    {
        name: 'Agri. Carlo Reyes',
        email: 'c.reyes@sanfernando.gov.ph',
        role: 'Agriculture Technician',
        status: 'Active',
        lastLogin: '2024-11-24 11:20',
    },
    {
        name: 'Encoder Juan Cruz',
        email: 'j.cruz@sanfernando.gov.ph',
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
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Administration
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    System users · Data management · GIS configuration
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
                @click="showAddModal = true"
            >
                <UIcon name="i-lucide-user-plus" class="size-3.5" />
                Add User
            </button>
        </div>

        <div class="grid grid-cols-4 gap-4">
            <div
                v-for="s in systemStats"
                :key="s.label"
                class="alps-card relative overflow-hidden p-5"
            >
                <div
                    class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    :style="{
                        backgroundImage: `linear-gradient(90deg, ${s.color}, transparent)`,
                    }"
                />
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: `${s.color}18` }"
                >
                    <UIcon
                        :name="s.icon"
                        class="size-[18px]"
                        :style="{ color: s.color }"
                    />
                </div>
                <div
                    class="text-2xl font-bold font-sans"
                    :style="{
                        color: s.color,
                    }"
                >
                    {{ s.val }}
                </div>
                <div class="text-xs text-gray-500">{{ s.label }}</div>
            </div>
        </div>

        <!-- System Settings + User Table -->
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 space-y-4 md:col-span-4">
                <div
                    v-for="item in settingsItems"
                    :key="item.label"
                    class="alps-card group relative flex cursor-pointer items-center gap-3 overflow-hidden p-4 transition-colors hover:border-green-200"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#2d6a2d] to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <div
                        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50"
                    >
                        <UIcon
                            :name="item.icon"
                            class="size-4 text-green-700"
                        />
                    </div>
                    <div class="flex-1">
                        <div class="text-xs font-semibold text-gray-700">
                            {{ item.label }}
                        </div>
                        <div class="text-[10px] text-gray-400">
                            {{ item.desc }}
                        </div>
                    </div>
                    <UIcon
                        name="i-lucide-chevron-right"
                        class="absolute right-4 size-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-green-600"
                    />
                </div>
            </div>

            <div class="alps-card col-span-12 overflow-hidden md:col-span-8">
                <div
                    class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"
                >
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e8]"
                        >
                            <UIcon
                                name="i-lucide-users"
                                class="size-4 text-[#2d6a2d]"
                            />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700">
                                System Users
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                {{ filteredUsers.length }} shown ·
                                {{ users.length }} total
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <UIcon
                                name="i-lucide-search"
                                class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search users…"
                                class="w-44 rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <button
                                v-if="searchQuery"
                                type="button"
                                class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                @click="searchQuery = ''"
                            >
                                <UIcon name="i-lucide-x" class="size-3" />
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    class="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-5 py-2.5"
                >
                    <button
                        v-for="r in ROLE_FILTER_OPTIONS"
                        :key="r"
                        type="button"
                        class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                        :class="
                            filterRole === r
                                ? 'border-[#2d6a2d] bg-[#2d6a2d] text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        "
                        @click="filterRole = r"
                    >
                        {{ r }}
                    </button>
                </div>
                <div v-if="filteredUsers.length" class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead class="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Name
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Email
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Role
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Status
                                </th>
                                <th
                                    class="px-4 py-3 text-left font-semibold text-gray-600"
                                >
                                    Last Login
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(u, i) in filteredUsers"
                                :key="u.email"
                                class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                :class="
                                    i % 2 === 1
                                        ? 'bg-gray-50/40'
                                        : 'bg-white'
                                "
                            >
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                            :style="{
                                                background:
                                                    ROLE_STYLE[u.role].avatar,
                                            }"
                                        >
                                            {{ initials(u.name) }}
                                        </span>
                                        <span
                                            class="font-medium text-gray-800"
                                        >
                                            {{ u.name }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-gray-500">
                                    {{ u.email }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="rounded px-2 py-0.5 text-[10px] font-semibold"
                                        :style="{
                                            background: ROLE_STYLE[u.role].bg,
                                            color: ROLE_STYLE[u.role].text,
                                        }"
                                    >
                                        {{ u.role }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex items-center gap-1.5 text-[10px] font-medium"
                                        :style="{
                                            color: ROLE_STYLE[u.role].dot,
                                        }"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            style="background: #16a34a"
                                        />
                                        {{ u.status }}
                                    </span>
                                </td>
                                <td
                                    class="px-4 py-3 font-mono text-gray-400"
                                >
                                    {{ lastLoginLabel(u.lastLogin) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div
                    v-else
                    class="flex flex-col items-center justify-center px-5 py-12 text-center"
                >
                    <div
                        class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50"
                    >
                        <UIcon
                            name="i-lucide-user-x"
                            class="size-5 text-gray-400"
                        />
                    </div>
                    <div class="text-xs font-medium text-gray-500">
                        No users found
                    </div>
                    <div class="mt-0.5 text-[11px] text-gray-400">
                        Try a different search term or role filter.
                    </div>
                </div>
            </div>
        </div>

        <!-- System Info -->
        <div
            class="alps-card grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0"
        >
            <div
                v-for="info in systemInfo"
                :key="info.label"
                class="flex items-start gap-3 p-4"
            >
                <div
                    class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100"
                >
                    <UIcon
                        :name="info.icon"
                        class="size-4 text-gray-600"
                    />
                </div>
                <div>
                    <div class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {{ info.label }}
                    </div>
                    <div class="text-xs font-medium text-gray-700">
                        {{ info.val }}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add User Modal -->
    <Teleport to="body">
        <div
            v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            @click.self="showAddModal = false"
        >
            <div
                class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style="font-family: 'DM Sans', sans-serif"
            >
                <div class="mb-5 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#e0f0fb] text-[#1d6ab3]"
                            style="box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12)"
                        >
                            <UIcon name="i-lucide-user-plus" class="size-5" />
                        </span>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">
                                Add User
                            </h3>
                            <p class="text-xs text-gray-500">
                                Register a new system user account.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        @click="showAddModal = false"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="addUser">
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="userForm.name"
                            type="text"
                            required
                            placeholder="e.g. Agri. Ana Fernandez"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                        >
                            Email
                        </label>
                        <input
                            v-model="userForm.email"
                            type="email"
                            required
                            placeholder="name@sanfernando.gov.ph"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Role
                            </label>
                            <select
                                v-model="userForm.role"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option
                                    v-for="r in ['System Admin', 'Agricultural Engineer', 'Agriculture Technician', 'Data Encoder']"
                                    :key="r"
                                    :value="r"
                                >
                                    {{ r }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-gray-600"
                            >
                                Status
                            </label>
                            <select
                                v-model="userForm.status"
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            @click="showAddModal = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-1.5 rounded-lg bg-[#2d6a2d] px-4 py-2 text-xs font-medium text-white hover:bg-[#245524]"
                        >
                            <UIcon
                                name="i-lucide-user-plus"
                                class="size-3.5"
                            />
                            Add User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
