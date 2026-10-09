/**
 * Light-theme slot overrides for Nuxt UI's `USelectMenu`, matching the app's
 * hand-rolled inputs (`rounded-lg`, `border-gray-200`, white fill, `text-xs`,
 * green focus ring) instead of Nuxt UI's default theme (rounded-md, larger
 * type, `ring-accented`).
 *
 * Use with `variant="none"` and `size="xs"` on the component so the trigger is
 * styled purely from those slots, then spread this object into the `:ui` prop
 * and add a context-specific `base` (toolbar button vs. form input).
 *
 * `content` keeps `z-[70]` so the portalled menu stays above the map panel and
 * modal backdrops, which Nuxt UI's theme gives no z-index.
 */
export const selectMenuSlots = {
    content:
        'z-[70] rounded-xl border border-gray-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)] ring-0',
    input: 'border-b border-gray-200 bg-transparent px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400',
    empty: 'px-3 py-2.5 text-xs text-gray-400',
    /*
     * The hover fill is hardcoded instead of Nuxt UI's `bg-elevated` token so
     * it stays light regardless of color mode / theme resolution. Gray-200 is
     * light enough to keep the dark text readable while still being a visible
     * hover against the white menu. Nuxt UI's default highlight also flips
     * text to `text-highlighted`, so pin that too.
     */
    item: 'p-1.5 text-xs text-gray-700 data-highlighted:not-data-disabled:before:bg-gray-200 data-highlighted:not-data-disabled:text-gray-900',
    group: 'p-1',
}