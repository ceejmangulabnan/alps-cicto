/**
 * Month-axis arithmetic and date-only parsing, shared by the dashboard and the
 * reports page.
 *
 * Both pages plot a trailing window of months and both read the same
 * date-only columns off Strapi, so the window and the parser live here rather
 * than being written twice — two parsers would eventually disagree about which
 * day a harvest falls on.
 */

const MONTH_LABELS = [
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
]

/**
 * Strapi `date` fields are date-only strings. Parsed as local midnight rather
 * than handed to `new Date()` — that would read them as UTC and land on the
 * previous day for anyone west of Greenwich, turning "harvests tomorrow" into
 * "today". Falls back to a full parse so a column that is a real timestamp
 * still resolves.
 */
export const parseDateOnly = (
    value: string | null | undefined
): Date | null => {
    if (!value) return null

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (match) {
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        )
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** `2026-09`, sortable and usable as a lookup key. */
export const monthKeyOf = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

/** Axis label for a month. */
export const monthLabelOf = (date: Date): string =>
    MONTH_LABELS[date.getMonth()] ?? ''

export interface MonthWindow {
    /** First of each month in the window, oldest first. */
    dates: Date[]
    /** `monthKeyOf` for each month, for bucketing a record into a column. */
    keys: string[]
    labels: string[]
}

/**
 * The `count` months ending with the month `from` falls in, oldest first. The
 * window is anchored on the current month rather than on a fixed year, so the
 * charts age on their own.
 */
export const trailingMonths = (count: number, from: Date): MonthWindow => {
    const dates = Array.from(
        { length: count },
        (_, index) =>
            new Date(
                from.getFullYear(),
                from.getMonth() - (count - 1 - index),
                1
            )
    )

    return {
        dates,
        keys: dates.map(monthKeyOf),
        labels: dates.map(monthLabelOf),
    }
}
