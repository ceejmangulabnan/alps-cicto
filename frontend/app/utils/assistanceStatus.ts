import type { AssistanceStatus } from '~/composables/useAssistanceApi'

/**
 * Presentation for the assistance status pills, shared by the assistance
 * registry and the assistance list on a farmer's profile.
 *
 * They live here rather than being restated per page because the two views show
 * the same four statuses side by side in this app: a copy in each would drift
 * the moment one shade was adjusted. They reuse the shared land-status pill
 * classes, so an assistance status looks like every other status pill.
 */
export const ASSISTANCE_STATUS_STYLE: Record<AssistanceStatus, string> = {
    Released: 'status-cultivated',
    'For Release': 'status-preparation',
    Pending: 'status-harvesting',
    Scheduled: 'status-idle',
}

export const ASSISTANCE_STATUS_DOT: Record<AssistanceStatus, string> = {
    Released: '#166534',
    'For Release': '#0369a1',
    Pending: '#a16207',
    Scheduled: '#4b5563',
}

/**
 * Formats a peso amount, or an em dash when there is nothing to show.
 *
 * `value` arrives as a Strapi `decimal`, which serialises as a string often
 * enough that the number has to be coerced before it can be compared or
 * formatted — `"0"` would otherwise print as `₱0` rather than as no value.
 */
export function peso(value: number | string | null | undefined): string {
    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) return '—'
    return `₱${amount.toLocaleString()}`
}
