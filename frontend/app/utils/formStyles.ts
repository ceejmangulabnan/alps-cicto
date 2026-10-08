/**
 * Shared class strings for the CRUD modal form controls. Inputs, selects and
 * textareas across all four registry pages use the same field styling; keeping
 * it as one literal (rather than a template snippet) means the Tailwind scan
 * sees it once and the fields cannot drift apart.
 *
 * Inputs that should look "quiet" add `placeholder:text-slate-400` on top —
 * date fields have no placeholder, so they omit it.
 */
export const FIELD_CLASS =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:opacity-60'

/**
 * The same field with the red focus ring: the risk report form files records
 * in the page's red accent, and its create modal has always focused red while
 * its edit modal focuses emerald — the modal passes whichever matches its mode.
 */
export const FIELD_CLASS_RED =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:opacity-60'
