import type {
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'

/**
 * Presentation for the risk registry's severity and parcel-status pills: the
 * colour classes, the dot colours, and the parcel-status options the record
 * table's filter row and the report form's status select both offer.
 *
 * They live here rather than being restated per view because the records
 * table, the at-risk parcels card and the page's filter pills show the same
 * two scales side by side — a copy in each would drift the moment one shade
 * was adjusted. The `RISK_` prefix matches the FARM_/ASSISTANCE_ helpers and
 * keeps these clear of the generic land-status auto-imports.
 */
export const RISK_SEVERITY_STYLE: Record<RiskSeverity, string> = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-yellow-100 text-yellow-700',
}

export const RISK_SEVERITY_DOT: Record<RiskSeverity, string> = {
    Critical: '#7f1d1d',
    High: '#dc2626',
    Medium: '#ea580c',
    Low: '#ca8a04',
}

export const RISK_STATUS_STYLE: Record<RiskParcelStatus, string> = {
    Active: 'bg-red-100 text-red-700',
    Monitoring: 'bg-orange-100 text-orange-700',
    Resolved: 'bg-green-100 text-green-700',
}

export const RISK_STATUS_DOT: Record<RiskParcelStatus, string> = {
    Active: '#dc2626',
    Monitoring: '#ea580c',
    Resolved: '#16a34a',
}

/** Parcel statuses in pill order; shared by the filter row and the form. */
export const RISK_STATUS_OPTIONS: RiskParcelStatus[] = [
    'Active',
    'Monitoring',
    'Resolved',
]
