import type { InspectionStatus } from '~/composables/useFarmParcelApi'
import type { RiskInspectionLevel } from '~/composables/useFarmParcelApi'

/**
 * Presentation for the inspections registry: the derived risk-level and
 * workflow status pills (colour classes + dot colours), plus the option lists
 * the form selects and the filter pills share.
 *
 * The risk level is not a stored field: it is the worst severity among the
 * inspection's linked findings, or `None`. The `INSPECTION_` prefix matches the
 * FARM_/ASSISTANCE_/RISK_ helpers and keeps these clear of the generic
 * land-status auto-imports.
 */
export const INSPECTION_RISK_STYLE: Record<RiskInspectionLevel, string> = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-yellow-100 text-yellow-700',
    None: 'bg-gray-100 text-gray-500',
}

export const INSPECTION_RISK_DOT: Record<RiskInspectionLevel, string> = {
    Critical: '#7f1d1d',
    High: '#b91c1c',
    Medium: '#c2410c',
    Low: '#a16207',
    None: '#6b7280',
}

/** Reuses the shared land-status pills, one shade per inspection status. */
export const INSPECTION_STATUS_STYLE: Record<InspectionStatus, string> = {
    Completed: 'status-cultivated',
    Pending: 'status-harvesting',
    'In Progress': 'status-preparation',
}

export const INSPECTION_STATUS_DOT: Record<InspectionStatus, string> = {
    Completed: '#166534',
    Pending: '#a16207',
    'In Progress': '#0369a1',
}

/** Inspection types in the order the form select has always offered them. */
export const INSPECTION_TYPES = [
    'Pre-harvest Assessment',
    'Pest & Disease Scouting',
    'Compliance Check',
    'Crop Establishment Visit',
    'Irrigation Audit',
    'Harvest Monitoring',
] as const

export const INSPECTION_STATUS_OPTIONS: InspectionStatus[] = [
    'Pending',
    'In Progress',
    'Completed',
]

/** Filter pills in the order the page has always shown them. */
export const INSPECTION_STATUS_FILTERS = [
    'All',
    'Completed',
    'Pending',
    'In Progress',
] as const

/**
 * Renders the JSON `gps_point` column; it usually holds a free-text string,
 * but can hold a `{ lat, lng }` pair from older records.
 */
export const gpsLabel = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) return value
    if (value && typeof value === 'object') {
        const point = value as { lat?: unknown; lng?: unknown }
        if (typeof point.lat === 'number' && typeof point.lng === 'number') {
            return `${point.lat}° N, ${point.lng}° E`
        }
        return JSON.stringify(value)
    }
    return ''
}
