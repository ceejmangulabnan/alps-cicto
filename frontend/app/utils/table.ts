import { h, resolveComponent } from 'vue'

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
 * and `aria-sort` carries the same state for screen readers.
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

        return h(
            'button',
            {
                type: 'button',
                class: [
                    'inline-flex max-w-full items-center gap-1 rounded transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d6a2d]',
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
                h(resolveComponent('UIcon'), {
                    name: icon,
                    class: 'size-3 shrink-0 text-gray-300',
                }),
            ]
        )
    }
}