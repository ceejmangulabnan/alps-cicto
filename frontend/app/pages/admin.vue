<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

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

const users = [
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
]

const systemInfo = [
    {
        label: 'System',
        val: 'ALPS v2.4.1 — Agricultural Land Profiling System',
    },
    { label: 'Agency', val: 'City Agriculture Office, San Fernando, Pampanga' },
    {
        label: 'Last Data Sync',
        val: 'November 25, 2024 · 06:00 AM (Automated)',
    },
]
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900"
                    style="font-family: 'DM Sans', sans-serif"
                >
                    Administration
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    System users · Data management · GIS configuration
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-users" class="size-3.5" />
                Add User
            </button>
        </div>

        <div class="grid grid-cols-4 gap-4">
            <div v-for="s in systemStats" :key="s.label" class="alps-card p-5">
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
                    class="text-2xl font-bold"
                    :style="{
                        color: s.color,
                        fontFamily: 'DM Sans, sans-serif',
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
                    class="alps-card flex cursor-pointer items-center gap-3 p-4 transition-colors hover:border-green-200"
                >
                    <div
                        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50"
                    >
                        <UIcon
                            :name="item.icon"
                            class="size-4 text-green-700"
                        />
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-gray-700">
                            {{ item.label }}
                        </div>
                        <div class="text-[10px] text-gray-400">
                            {{ item.desc }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="alps-card col-span-12 overflow-hidden md:col-span-8">
                <div class="border-b border-gray-100 px-5 py-4">
                    <h3
                        class="text-sm font-semibold text-gray-700"
                        style="font-family: 'DM Sans', sans-serif"
                    >
                        System Users
                    </h3>
                </div>
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
                            v-for="u in users"
                            :key="u.email"
                            class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                        >
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100"
                                    >
                                        <UIcon
                                            name="i-lucide-users"
                                            class="size-[10px] text-green-700"
                                        />
                                    </div>
                                    <span class="font-medium text-gray-800">
                                        {{ u.name }}
                                    </span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-gray-500">
                                {{ u.email }}
                            </td>
                            <td class="px-4 py-3 text-gray-600">
                                {{ u.role }}
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="status-cultivated rounded px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {{ u.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 font-mono text-gray-400">
                                {{ u.lastLogin }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- System Info -->
        <div class="alps-card bg-gray-50 p-5">
            <div class="grid grid-cols-3 gap-6 text-xs">
                <div v-for="info in systemInfo" :key="info.label">
                    <div class="mb-1 text-gray-400">{{ info.label }}</div>
                    <div class="font-medium text-gray-700">{{ info.val }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
