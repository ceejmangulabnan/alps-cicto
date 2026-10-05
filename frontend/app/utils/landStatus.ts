import type { HexColor } from 'terra-draw'
import {
    LAND_STATUS_OPTIONS,
    type LandStatus,
} from '~/composables/useFarmParcelApi'

/**
 * Single source of truth for land_status -> colour. Both the terra-draw style
 * callbacks and the on-map legend read from here, so they cannot drift apart.
 */
export const STATUS_COLOR: Record<string, HexColor> = {
    Cultivated: '#16a34a',
    Preparation: '#0369a1',
    Harvesting: '#ca8a04',
    Fallow: '#b45309',
    Idle: '#cbd5e1',
    'At Risk': '#dc2626',
    Converted: '#0f766e',
}

/**
 * Colour for features that have no persisted land_status yet, i.e. a polygon
 * that is still being drawn. Neutral so it never implies a real status.
 */
export const STATUS_COLOR_FALLBACK: HexColor = '#cbd5e1'

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

/**
 * Table palette, keyed off the same `status-*` classes declared in main.css.
 *
 * These sit a shade darker than STATUS_COLOR because they are used for a small
 * dot and pill text rather than a large map fill.
 */
export const STATUS_DOT: Record<LandStatus, string> = {
    Cultivated: '#166534',
    Preparation: '#0369a1',
    Harvesting: '#a16207',
    Fallow: '#b45309',
    Idle: '#9ca3af',
    'At Risk': '#b91c1c',
    Converted: '#0f766e',
}

export const STATUS_CLASS: Record<LandStatus, string> = {
    Cultivated: 'status-cultivated',
    Preparation: 'status-preparation',
    Harvesting: 'status-harvesting',
    Fallow: 'status-fallow',
    Idle: 'status-idle',
    'At Risk': 'status-atrisk',
    Converted: 'status-converted',
}

const TABLE_FALLBACK_DOT = '#9ca3af'

export function statusClass(status: string): string {
    return STATUS_CLASS[status as LandStatus] ?? 'status-idle'
}

export function statusDot(status: string): string {
    return STATUS_DOT[status as LandStatus] ?? TABLE_FALLBACK_DOT
}
