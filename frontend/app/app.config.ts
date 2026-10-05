/**
 * Runtime overrides for @nuxt/ui components.
 *
 * UTable ships a denser, greyer table than the rest of this app: 14px body text
 * on `p-4` cells with a `text-muted` colour and `divide-y` rules between rows.
 * The registry tables are 12px on `px-4 py-3` with zebra rows and a `bg-gray-50`
 * header, so the defaults are overridden once here rather than restated on every
 * table.
 *
 * These overrides MERGE with the defaults rather than replacing them —
 * `Table.vue` spreads them into `tv({ extend: theme, ... })`, and tailwind-merge
 * only drops a default when an override contradicts it in the same group. So
 * `text-inherit`, `whitespace-normal` and `divide-transparent` are not padding:
 * they are the opposites that actually displace `text-muted`,
 * `whitespace-nowrap` and `divide-default`. Without them the muted grey and the
 * `nowrap` both survive on every cell.
 *
 * The zebra stripe is keyed off `:nth-child` rather than a row index so it
 * tracks the rows as they are shown. An index would keep the value it had before
 * sorting and the stripes would scramble on the first click.
 *
 * `separator` is the hairline UTable draws under the header; the header already
 * carries its own `border-b`, so it is suppressed rather than doubled.
 */
export default defineAppConfig({
    ui: {
        table: {
            slots: {
                base: 'w-full min-w-[880px]',
                thead: 'border-b border-gray-100 bg-gray-50',
                th: 'px-4 py-3 text-xs font-semibold text-gray-600',
                td: 'px-4 py-3 text-xs text-inherit whitespace-normal',
                tbody: 'divide-y-0 divide-transparent [&>tr:nth-child(even)]:bg-gray-50/40 [&>tr]:data-[selectable=true]:hover:bg-green-50/40',
                separator: 'hidden',
                empty: 'py-12 text-center text-gray-400',
                loading: 'py-10 text-center text-gray-400',
            },
        },
    },
})