/**
 * Roles a system user can be assigned through the Administration UI. These
 * map 1:1 to the Strapi users-permissions role types the backend provisions
 * (`administrator`, `authenticated`, `viewer`).
 */
export type AdminRole = 'Administrator' | 'Authenticated' | 'Viewer'

/**
 * Roles that can appear on a row but are not assignable from the add/edit
 * forms. `Public` is Strapi's anonymous role; it should never be granted to a
 * named user, but legacy/mis-assigned accounts are displayed truthfully rather
 * than masked as `Authenticated`.
 */
export type AdminRoleDisplay = AdminRole | 'Public'

export type AdminUserStatus = 'Active' | 'Inactive'

/** A system user rendered by the administration user registry. */
export interface AdminUser {
    id: number
    name: string
    email: string
    role: AdminRoleDisplay
    status: AdminUserStatus
    /** Account creation timestamp (the Users API carries no last-login field). */
    createdAt: string
}

/** Fields the add-user modal collects. */
export interface AdminUserInput {
    name: string
    email: string
    password: string
    role: AdminRole
}

/** A role the add/edit forms may assign, resolved from the live role list. */
export interface RoleOption {
    label: AdminRole
    id: number
}

/** Minimum password length enforced client-side (Strapi itself allows 1). */
export const PASSWORD_MIN_LENGTH = 8

/**
 * Pill styles keyed by the Strapi-backed role names. These keep visual
 * parity with the existing palette (one map for filters, table and modal).
 */
export const ROLE_STYLE: Record<
    AdminRoleDisplay,
    { bg: string; text: string; dot: string; avatar: string }
> = {
    Administrator: {
        bg: '#ede9fe',
        text: '#6d28d9',
        dot: '#7c3aed',
        avatar: '#7c3aed',
    },
    Authenticated: {
        bg: '#dcfce7',
        text: '#15803d',
        dot: '#16a34a',
        avatar: '#16a34a',
    },
    Viewer: {
        bg: '#dbeafe',
        text: '#1d4ed8',
        dot: '#2563eb',
        avatar: '#2563eb',
    },
    Public: {
        bg: '#fee2e2',
        text: '#b91c1c',
        dot: '#dc2626',
        avatar: '#dc2626',
    },
}

/** Role filter pills; the first entry is the "all roles" value. */
export const ROLE_FILTER_OPTIONS: readonly (AdminRoleDisplay | 'All')[] = [
    'All',
    'Administrator',
    'Authenticated',
    'Viewer',
    'Public',
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
] as const

/**
 * "2024-11-25 09:14" -> "Nov 25, 09:14". Values without a date part pass
 * through untouched.
 */
export function createdAtLabel(date: string): string {
    if (!date.includes('-')) return date

    const [d = '', t = ''] = date.split(' ')
    const parts = d.split('-')
    const month = MONTHS[parseInt(parts[1] ?? '', 10) - 1] ?? ''
    const day = parseInt(parts[2] ?? '', 10)

    return `${month} ${day}, ${t}`
}

/**
 * "Agri. Maria Santos" -> "MS" (drops the courtesy titles first). Named
 * userInitials because the shared utils/initials helper keeps titles and
 * would render "AM" here.
 */
export function userInitials(name: string): string {
    return name
        .replace(/^(Engr\.|Agri\.)\s+/i, '')
        .split(' ')
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase()
}
