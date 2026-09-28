import type { HexColor } from 'terra-draw'
import { LAND_STATUS_OPTIONS } from '~/composables/useFarmParcelApi'

/**
 * Single source of truth for land_status -> colour. Both the terra-draw style
 * callbacks and the on-map legend read from here, so they cannot drift apart.
 */
export const STATUS_COLOR: Record<string, HexColor> = {
    Cultivated: '#16a34a',
    Preparation: '#0369a1',
    Harvesting: '#ca8a04',
    Fallow: '#b45309',
    Idle: '#6b7280',
    'At Risk': '#dc2626',
    Converted: '#0f766e',
}

/**
 * Colour for features that have no persisted land_status yet, i.e. a polygon
 * that is still being drawn. Neutral so it never implies a real status.
 */
export const STATUS_COLOR_FALLBACK: HexColor = '#6b7280'

/**
 * Resolves a parcel polygon's map colour from its persisted land_status.
 *
 * Must always return a concrete colour: terra-draw silently substitutes its
 * default blue when a styling callback returns undefined, which would make a
 * saved parcel look like a fresh drawing.
 */
export function statusColor(status: unknown): HexColor {
    return typeof status === 'string'
        ? (STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK)
        : STATUS_COLOR_FALLBACK
}

export interface StatusLegendEntry {
    label: string
    color: HexColor
}

/** Legend entries, derived from the same source as STATUS_COLOR. */
export const STATUS_LEGEND: StatusLegendEntry[] = LAND_STATUS_OPTIONS.map(
    (status) => ({
        label: status,
        color: STATUS_COLOR[status] ?? STATUS_COLOR_FALLBACK,
    })
)
