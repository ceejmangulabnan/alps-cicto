import { h } from 'vue'
// Imported rather than resolved by name with `resolveComponent`. Nuxt resolves
// `<UIcon>` in templates at compile time, but @nuxt/ui registers its components
// without `global: true`, so there is no runtime global registration for
// `resolveComponent` to find. It returns the string "UIcon", `h()` treats that
// as an unknown element tag, and the icon silently renders as nothing.
import UIcon from '@nuxt/ui/components/Icon.vue'

/**
 * The slice of TanStack's column API this helper touches. Typing it structurally
 * keeps `utils/` free of the table library's generic machinery, and keeps the
 * helper usable by any table whose column is compatible.
 */
type SortableColumn = {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
}

export type SortHeaderOptions = {
    /** Set for columns whose header text is right-aligned over numeric cells. */
    align?: 'left' | 'right'
}

/**
 * A UTable column header that sorts when clicked.
 *
 * UTable renders whatever `header` returns but supplies no sort affordance of
 * its own, so every sortable column needs one written by hand. The icon follows
 * the three states TanStack cycles through — ascending, descending, unsorted —
 * and `aria-label` spells the same state out for screen readers.
 *
 * `toggleSorting` is called with no argument on purpose. With no explicit
 * direction TanStack advances its own cycle, which is what lets a third click
 * drop the sort and restore the order the API delivered; passing a boolean
 * instead would pin the column to ascending/descending and never clear it.
 */
export function sortHeader(label: string, options: SortHeaderOptions = {}) {
    const { align = 'left' } = options

    return ({ column }: { column: SortableColumn }) => {
        const sorted = column.getIsSorted()

        const icon =
            sorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : sorted === 'desc'
                  ? 'i-lucide-arrow-down-wide-narrow'
                  : 'i-lucide-arrow-up-down'

        /**
         * The icon has to survive being read against the `bg-gray-50` header.
         * At `gray-300` it measured 1.4:1 there — present in the DOM and
         * effectively invisible, which is worse than no icon at all because it
         * looks like the control is not implemented. `gray-500` clears the 3:1
         * WCAG floor for graphics while staying recessive next to the label,
         * and the sorted state goes green so the active column is obvious.
         */
        const iconTone =
            sorted === false
                ? 'text-gray-500 group-hover:text-gray-700'
                : 'text-[#2d6a2d]'

        return h(
            'button',
            {
                type: 'button',
                class: [
                    'group inline-flex max-w-full items-center gap-1 rounded transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d6a2d]',
                    align === 'right' ? 'w-full justify-end' : '',
                ],
                'aria-label': `${label}, sorted ${
                    sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : 'not sorted'
                }`,
                onClick: () => column.toggleSorting(),
            },
            [
                h('span', { class: 'truncate' }, label),
                h(UIcon, {
                    name: icon,
                    class: ['size-3.5 shrink-0 transition-colors', iconTone],
                }),
            ]
        )
    }
}
