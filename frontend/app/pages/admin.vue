<script setup lang="ts">
/**
 * System-administration dashboard: static system statistics, the
 * administration-tools panel, a user registry (search/filter/add) and the
 * system-information strip. Each region is an isolated Admin* component; the
 * page only owns the data and the add-user wiring.
 */
import type { AdminUser, AdminUserInput } from '~/utils/adminPresentation'

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
    {
        label: 'GIS Layers',
        val: '8',
        icon: 'i-lucide-map',
        color: '#0891b2',
    },
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

const users = ref<AdminUser[]>([
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

const showAddModal = ref(false)

function addUser(user: AdminUserInput) {
    users.value.unshift({ ...user, lastLogin: 'Just now' })
    showAddModal.value = false
}
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <AdminHeader
                :user-count="users.length"
                @add="showAddModal = true"
            />

            <AdminStatsCards :stats="systemStats" />

            <div class="grid grid-cols-12 gap-4">
                <AdminSettingsPanel :items="settingsItems" />
                <AdminUsersPanel :users="users" />
            </div>

            <AdminSystemInfo :items="systemInfo" />
        </div>
    </div>

    <AdminAddUserModal
        :show="showAddModal"
        @add="addUser"
        @close="showAddModal = false"
    />
</template>
