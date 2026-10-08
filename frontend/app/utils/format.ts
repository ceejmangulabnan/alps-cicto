/**
 * Small display helpers the registry pages all repeat. Kept in one place so a
 * label reads the same on every table that shows it.
 */

/** First two farmer names, then "+N" when there are more. */
export function farmerLabel(names: string[]): string {
    if (names.length === 0) return '—'

    const visible = names.slice(0, 2).join(', ')

    return names.length > 2 ? `${visible} +${names.length - 2}` : visible
}

/** The readable tail of a Strapi documentId, e.g. `#AB12CD`. */
export const shortId = (documentId: string): string =>
    `#${documentId.slice(-6).toUpperCase()}`

/** Locale-grouped number, or an em dash when there is nothing to show. */
export const num = (value: number | string | null | undefined): string => {
    const n = Number(value)

    return Number.isFinite(n) ? n.toLocaleString() : '—'
}

/**
 * Today's date in UTC (`YYYY-MM-DD`). The harvest and assistance forms have
 * always seeded their date fields from the UTC calendar, so the helper that
 * replaces their local copy keeps that exact behaviour.
 */
export function todayUtc(): string {
    return new Date().toISOString().slice(0, 10)
}

/**
 * Today's date on the local calendar (`YYYY-MM-DD`). The risk forms seed from
 * here so a report filed just after midnight is dated the day the officer
 * actually filed it.
 */
export function todayLocal(): string {
    const now = new Date()

    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${now.getFullYear()}-${month}-${day}`
}
