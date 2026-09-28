import type { FarmStatus } from '~/composables/useFarmsApi'

/**
 * Derived farm status -> pill class and dot colour.
 *
 * A farm is Active or Inactive depending on whether any of the farmers tending
 * its parcels is Active; it has no `Departed` state, since that describes a
 * person. There is no dedicated CSS class per status, so these reuse the
 * land-status palette the rest of the app already repurposes for non-land
 * values (see harvests.vue and assistance.vue).
 */
export const FARM_STATUS_CLASS: Record<FarmStatus, string> = {
    Active: 'status-cultivated',
    Inactive: 'status-idle',
}

export const FARM_STATUS_DOT: Record<FarmStatus, string> = {
    Active: '#16a34a',
    Inactive: '#6b7280',
}

const FALLBACK_STATUS: FarmStatus = 'Inactive'

export function farmStatusClass(status: unknown): string {
    return (
        FARM_STATUS_CLASS[status as FarmStatus] ??
        FARM_STATUS_CLASS[FALLBACK_STATUS]
    )
}

export function farmStatusDot(status: unknown): string {
    return (
        FARM_STATUS_DOT[status as FarmStatus] ??
        FARM_STATUS_DOT[FALLBACK_STATUS]
    )
}
