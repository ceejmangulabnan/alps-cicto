<script setup lang="ts">
/**
 * System-administration dashboard: static system statistics, the
 * administration-tools panel, a user registry (search/filter/add/edit) and the
 * system-information strip. Each region is an isolated Admin* component; the
 * page owns the data, the role list and the create/edit wiring.
 */
import AdminEditUserModal from '~/components/admin/AdminEditUserModal.vue'
import type {
    AdminRole,
    AdminUser,
    AdminUserInput,
} from '~/utils/adminPresentation'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { getErrorMessage } from '~/utils/apiError'

const {
    users: registryUsers,
    roleOptions,
    rolesReady,
    rolesLoading,
    rolesError,
    loading: usersLoading,
    loadError: usersLoadError,
    loadUsers,
    loadRoles,
    createUser,
    updateUser,
} = useAdminUsers()

const toast = useToast()
const { user: currentUser } = useAuth()

const systemStats = computed(() => [
    {
        label: 'Total System Users',
        val: String(registryUsers.value.length),
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
])

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
const showEditModal = ref(false)
const editingUser = ref<AdminUser | null>(null)

/** Active administrators, used to protect the last one from lock-out. */
const activeAdmins = computed(() =>
    registryUsers.value.filter(
        (u) => u.role === 'Administrator' && u.status === 'Active'
    )
)

const editingIsSelf = computed(
    () => !!editingUser.value && editingUser.value.id === currentUser.value?.id
)

const editingIsLastAdmin = computed(
    () =>
        !!editingUser.value &&
        editingUser.value.role === 'Administrator' &&
        editingUser.value.status === 'Active' &&
        activeAdmins.value.length <= 1
)

const editLocked = computed(
    () => editingIsSelf.value || editingIsLastAdmin.value
)

const editLockReason = computed(() => {
    if (editingIsSelf.value) {
        return 'You cannot change your own role or block your own account.'
    }
    if (editingIsLastAdmin.value) {
        return 'This is the only active administrator, so its role and status are locked.'
    }
    return ''
})

function openEdit(u: AdminUser) {
    editingUser.value = u
    showEditModal.value = true
}

function closeEdit() {
    showEditModal.value = false
    editingUser.value = null
}

interface EditPayload {
    id: number
    username?: string
    email?: string
    password?: string
    role: AdminRole
    blocked?: boolean
}

async function saveEdit(payload: EditPayload) {
    const target = editingUser.value
    if (!target) return

    // Defense in depth: the modal disables the role/blocked controls when
    // self/last-admin, but the server is the final authority, so re-check here.
    const targetRole = target.role === 'Public' ? 'Authenticated' : target.role
    const roleChanged = payload.role !== targetRole
    const blockChanged =
        (payload.blocked ?? false) !== (target.status === 'Inactive')

    if (editingIsSelf.value && (roleChanged || blockChanged)) {
        toast.add({
            title: "You can't change your own role or block your own account.",
            color: 'error',
        })
        return
    }
    if (
        editingIsLastAdmin.value &&
        (payload.role !== 'Administrator' || payload.blocked)
    ) {
        toast.add({
            title: "You can't remove the last active administrator.",
            color: 'error',
        })
        return
    }

    try {
        await updateUser(payload.id, {
            username: payload.username,
            email: payload.email,
            password: payload.password,
            role: payload.role,
            blocked: payload.blocked,
        })
        closeEdit()
        await loadUsers()
        toast.add({ title: 'User updated', color: 'success' })
    } catch (err) {
        console.error(err)
        toast.add({
            title: 'Failed to update user',
            description: getErrorMessage(err, 'Please try again.'),
            color: 'error',
        })
    }
}

function addUser(user: AdminUserInput) {
    createUser({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
    })
        .then(async () => {
            showAddModal.value = false
            await loadUsers()
            toast.add({ title: 'User created', color: 'success' })
        })
        .catch((err) => {
            console.error(err)
            toast.add({
                title: 'Failed to create user',
                description: getErrorMessage(err, 'Please try again.'),
                color: 'error',
            })
        })
}

onMounted(async () => {
    await Promise.all([loadUsers(), loadRoles()])
})
</script>

<template>
    <div
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <AdminHeader
                :user-count="registryUsers.length"
                @add="showAddModal = true"
            />

            <AdminStatsCards :stats="systemStats" />

            <div class="grid grid-cols-12 gap-4">
                <AdminSettingsPanel :items="settingsItems" />
                <AdminUsersPanel
                    :users="registryUsers"
                    :loading="usersLoading"
                    :load-error="usersLoadError"
                    :roles-error="rolesError"
                    @retry="loadUsers"
                    @edit="openEdit"
                />
            </div>

            <AdminSystemInfo :items="systemInfo" />
        </div>
    </div>

    <AdminAddUserModal
        :show="showAddModal"
        :role-options="roleOptions"
        :roles-ready="rolesReady"
        :roles-loading="rolesLoading"
        :roles-error="rolesError"
        @add="addUser"
        @close="showAddModal = false"
    />
    <AdminEditUserModal
        :show="showEditModal"
        :user="editingUser"
        :role-options="roleOptions"
        :roles-ready="rolesReady"
        :locked="editLocked"
        :lock-reason="editLockReason"
        @close="closeEdit"
        @save="saveEdit"
    />
</template>
