import type { ReportCategory } from '~/utils/analytics'
import { parseDateOnly } from '~/utils/monthWindow'

/**
 * Number/date formatting shared by the reports page's extracted components.
 * These were page-local before the modularization; they are moved here so the
 * header, the KPI cards, the charts, the export centre and the generate modal
 * all render the same figures the same way.
 */

export const fmtCount = (value: number): string => value.toLocaleString()

/** Hectares and kilograms: whole numbers, since nothing here is sub-unit. */
export const fmtWhole = (value: number): string =>
    value.toLocaleString(undefined, { maximumFractionDigits: 0 })

/** A recorded date, or an em dash when the row carries none. */
export const fmtDate = (value: string | null): string => {
    const date = parseDateOnly(value)

    return date
        ? date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—'
}

/** Category chips on the export centre: icon, tint and the file badge. */
export const CATEGORY_STYLE: Record<
    ReportCategory,
    { icon: string; bg: string; text: string; ring: string }
> = {
    'Land Use': {
        icon: 'i-lucide-mountain',
        bg: '#e8f5e8',
        text: '#2d6a2d',
        ring: '#bfe0bf',
    },
    Registry: {
        icon: 'i-lucide-users',
        bg: '#e0f0fb',
        text: '#1d6fa4',
        ring: '#bcd9ee',
    },
    Production: {
        icon: 'i-lucide-wheat',
        bg: '#fef3c7',
        text: '#b45309',
        ring: '#f5dfa8',
    },
    Risk: {
        icon: 'i-lucide-alert-triangle',
        bg: '#fee2e2',
        text: '#b91c1c',
        ring: '#f7c9c9',
    },
    Assistance: {
        icon: 'i-lucide-hand-heart',
        bg: '#ede9fe',
        text: '#6d28d9',
        ring: '#d9d0fb',
    },
}
