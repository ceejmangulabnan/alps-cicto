/**
 * CSV generation and browser download, for the reports page's export centre.
 *
 * Nothing is generated server-side or stored: a report is built from the rows
 * already sitting in the browser and handed straight to the officer as a file,
 * so what they download is the same figure the chart above it is drawn from.
 * That also means the export centre can only offer CSV, which every spreadsheet
 * opens, rather than promising a PDF the app has no way to produce.
 */

export type CsvValue = string | number | null | undefined

export interface CsvColumn {
    /** The key this column reads off each row object. */
    key: string
    /** The header text written into the file. */
    label: string
}

export interface CsvTable {
    columns: CsvColumn[]
    rows: Record<string, CsvValue>[]
}

/**
 * Leading characters a spreadsheet reads as the start of a formula. Names here
 * are free text an officer typed, so a value like `=SUM(A1)` must not be handed
 * over as something Excel will evaluate on open. Prefixing with an apostrophe
 * keeps the text readable and neutralises it. Only strings are considered, and
 * our numeric columns are written as numbers, so a negative figure is never
 * touched.
 */
const FORMULA_LEAD = ['=', '+', '-', '@', '\t', '\r']

const cell = (value: CsvValue): string => {
    if (value === null || value === undefined) return ''

    let text = String(value)
    if (FORMULA_LEAD.some((lead) => text.startsWith(lead))) text = `'${text}`

    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** RFC 4180: CRLF line endings, quoted cells, doubled quotes inside them. */
export const toCsv = ({ columns, rows }: CsvTable): string =>
    [
        columns.map((column) => cell(column.label)).join(','),
        ...rows.map((row) =>
            columns.map((column) => cell(row[column.key])).join(',')
        ),
    ].join('\r\n')

/**
 * `alps-land-status-register-2026-10-05.csv`, so a file forwarded by email can
 * be traced back to the figures it held. The day is built from local getters
 * rather than `toISOString`, which would stamp the export with the UTC date and
 * read as yesterday for anyone east of Greenwich in the evening.
 */
export const csvFilename = (title: string, on = new Date()): string => {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    const month = String(on.getMonth() + 1).padStart(2, '0')
    const day = String(on.getDate()).padStart(2, '0')

    return `alps-${slug}-${on.getFullYear()}-${month}-${day}.csv`
}

/**
 * Hands the file to the browser. A BOM is prepended because Excel assumes
 * Windows-1252 without one and would mangle the diacritics in barangay names
 * such as Sto. Niño. No-op outside the browser, so a report can be generated
 * during SSR without reaching for a DOM that is not there.
 */
export const downloadCsv = (filename: string, contents: string): void => {
    if (!import.meta.client) return

    const url = URL.createObjectURL(
        new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8' })
    )

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()

    // Revoked on a delay rather than straight away: Firefox cancels a download
    // whose object URL disappears in the same task as the click.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
