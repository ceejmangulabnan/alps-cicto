import type { FarmerStatus } from '~/composables/useFarmsApi'

/**
 * farm_status -> pill class and dot colour.
 *
 * There is no dedicated CSS class per farm status, so these reuse the
 * land-status palette the rest of the app already repurposes for non-land
 * values (see harvests.vue and assistance.vue).
 */
export const FARM_STATUS_CLASS: Record<FarmerStatus, string> = {
    Active: 'status-cultivated',
    Inactive: 'status-idle',
    Departed: 'status-atrisk',
}

export const FARM_STATUS_DOT: Record<FarmerStatus, string> = {
    Active: '#16a34a',
    Inactive: '#6b7280',
    Departed: '#dc2626',
}

const FALLBACK_STATUS: FarmerStatus = 'Inactive'

export function farmStatusClass(status: unknown): string {
    return (
        FARM_STATUS_CLASS[status as FarmerStatus] ??
        FARM_STATUS_CLASS[FALLBACK_STATUS]
    )
}

export function farmStatusDot(status: unknown): string {
    return (
        FARM_STATUS_DOT[status as FarmerStatus] ??
        FARM_STATUS_DOT[FALLBACK_STATUS]
    )
}
