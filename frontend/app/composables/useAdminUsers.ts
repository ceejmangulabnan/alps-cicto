import { computed } from 'vue'
/**
 * Admin user registry backed by Strapi users-permissions.
 *
 * - Users are fetched from `GET /api/users?populate=role` (proxied to
 *   `/api/strapi/users` by authFetch).
 * - Creating users uses `POST /api/strapi/users`.
 * - Updating role/blocked uses `PUT /api/strapi/users/:id`.
 *
 * Role IDs are **never hardcoded**: they are resolved from the live role list
 * loaded by `loadRoles`, keyed by Strapi's stable role `type`. If the roles
 * have not loaded, writes fail closed rather than guessing an id (guessing the
 * wrong id used to grant the `Public`/`Administrator` role by accident).
 */
import type {
    AdminRole,
    AdminRoleDisplay,
    AdminUser,
    AdminUserStatus,
    RoleOption,
} from '~/utils/adminPresentation'
import { useAuth } from '~/composables/auth'
import { getErrorMessage } from '~/utils/apiError'

export interface StrapiRole {
    id: number
    name: string
    type: string
}

export interface StrapiUser {
    id: number
    username: string
    email: string
    blocked: boolean | null
    role?: StrapiRole | null
    createdAt?: string
    updatedAt?: string
}

export interface StrapiRoleListResponse {
    roles?: StrapiRole[]
}

export type AdminCreateInput = {
    name: string
    email: string
    password: string
    role: AdminRole
}

export type AdminUpdateInput = {
    username?: string
    email?: string
    password?: string
    role?: AdminRole
    blocked?: boolean
}

/** Strapi role `type` -> display label, including the non-assignable `Public`. */
const ROLE_TYPE_TO_LABEL: Record<string, AdminRoleDisplay> = {
    administrator: 'Administrator',
    authenticated: 'Authenticated',
    viewer: 'Viewer',
    public: 'Public',
}

/** Role types the add/edit forms are allowed to assign. */
const ASSIGNABLE_ROLE_LABELS: Record<string, AdminRole> = {
    administrator: 'Administrator',
    authenticated: 'Authenticated',
    viewer: 'Viewer',
}

export function toAdminUser(user: StrapiUser): AdminUser {
    const roleType = user.role?.type ?? ''
    const role: AdminRoleDisplay = ROLE_TYPE_TO_LABEL[roleType] ?? 'Public'
    const status: AdminUserStatus = user.blocked ? 'Inactive' : 'Active'
    const createdAt = user.createdAt
        ? new Date(user.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—'

    return {
        id: user.id,
        name: user.username,
        email: user.email,
        role,
        status,
        createdAt,
    }
}

export const useAdminUsers = () => {
    const { authFetch } = useAuth()
    const users = ref<AdminUser[]>([])
    const roles = ref<StrapiRole[]>([])
    const loading = ref(false)
    const loadError = ref<string | null>(null)
    const rolesLoading = ref(false)
    const rolesError = ref<string | null>(null)

    /** Assignable roles, resolved from the live list by stable `type`. */
    const roleOptions = computed<RoleOption[]>(() =>
        roles.value
            .filter((r) => r.type in ASSIGNABLE_ROLE_LABELS)
            .map((r) => ({
                label: ASSIGNABLE_ROLE_LABELS[r.type] as AdminRole,
                id: r.id,
            }))
    )

    /** True once roles are loaded without error and at least one is assignable. */
    const rolesReady = computed(
        () => roleOptions.value.length > 0 && !rolesError.value
    )

    function resolveRoleId(label: AdminRole): number {
        const option = roleOptions.value.find((o) => o.label === label)
        if (!option) {
            // Fail closed: never fall back to a guessed id.
            throw new Error(
                'Roles are still loading. Please try again in a moment.'
            )
        }
        return option.id
    }

    async function loadRoles() {
        rolesLoading.value = true
        rolesError.value = null
        try {
            const result = await authFetch<StrapiRoleListResponse>(
                '/api/users-permissions/roles'
            )
            roles.value = result?.roles ?? []
            if (roleOptions.value.length === 0) {
                rolesError.value = 'No assignable roles were found.'
            }
        } catch (error) {
            roles.value = []
            rolesError.value = getErrorMessage(
                error,
                'Unable to load roles. Refresh to try again.'
            )
        } finally {
            rolesLoading.value = false
        }
    }

    async function loadUsers() {
        loading.value = true
        loadError.value = null
        try {
            const result = await authFetch<StrapiUser[]>(
                '/api/users?populate=role'
            )
            users.value = (result || []).map(toAdminUser)
        } catch (error) {
            const message = getErrorMessage(
                error,
                'Unable to load users. Try again.'
            )
            loadError.value = message
            users.value = []
        } finally {
            loading.value = false
        }
    }

    async function createUser(input: AdminCreateInput) {
        const roleId = resolveRoleId(input.role)
        return await authFetch<StrapiUser>('/api/users', {
            method: 'POST',
            body: {
                username: input.name,
                email: input.email,
                password: input.password,
                role: roleId,
            },
        })
    }

    async function updateUser(id: number, update: AdminUpdateInput) {
        const { role, ...rest } = update
        const body: Record<string, unknown> = { ...rest }
        if (role) {
            body.role = resolveRoleId(role)
        }
        return await authFetch<StrapiUser>(`/api/users/${id}`, {
            method: 'PUT',
            body,
        })
    }

    return {
        users,
        roles,
        roleOptions,
        rolesReady,
        loading,
        loadError,
        rolesLoading,
        rolesError,
        loadUsers,
        loadRoles,
        createUser,
        updateUser,
    }
}
