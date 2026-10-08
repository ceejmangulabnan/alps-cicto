/** Roles a system user can hold. */
export type AdminRole =
    | 'System Admin'
    | 'Agricultural Engineer'
    | 'Agriculture Technician'
    | 'Data Encoder'

export type AdminUserStatus = 'Active' | 'Inactive'

/** A system user rendered by the administration user registry. */
export interface AdminUser {
    name: string
    email: string
    role: AdminRole
    status: AdminUserStatus
    lastLogin: string
}

/** Fields the add-user modal collects; the registry fills in lastLogin. */
export interface AdminUserInput {
    name: string
    email: string
    role: AdminRole
    status: AdminUserStatus
}

/**
 * Pill styles and avatar tints keyed by the exact role labels used in the UI
 * (the role filter, the table cells and the add-user form all agree on these
 * four labels, so a single map keeps them in step).
 */
export const ROLE_STYLE: Record<
    AdminRole,
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

/** Role filter pills; the first entry is the "all roles" value. */
export const ROLE_FILTER_OPTIONS: readonly (AdminRole | 'All')[] = [
    'All',
    'System Admin',
    'Agricultural Engineer',
    'Agriculture Technician',
    'Data Encoder',
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
 * "2024-11-25 09:14" -> "Nov 25, 09:14". Values without a date part (the
 * freshly-added rows carry "Just now") pass through untouched.
 */
export function lastLoginLabel(date: string): string {
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