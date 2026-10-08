import { computed, ref } from 'vue'

/**
 * The search + status-pill pair every registry table offers. The caller
 * supplies the row source and how each axis matches, so the pages only differ
 * in their haystack and status rule.
 */
export interface TableFiltersOptions<T, S extends string> {
    /** Status values in pill order; the first one is the "all" value. */
    statusOptions: readonly S[]
    /** The searchable text of a row. */
    haystack: (row: T) => string
    /** Whether a row passes the given status (the caller handles "all"). */
    matchesStatus: (row: T, status: S) => boolean
}

export function useTableFilters<T, S extends string>(
    source: () => T[],
    options: TableFiltersOptions<T, S>
) {
    const search = ref('')
    const filterStatus = ref<S>(options.statusOptions[0]!)

    const rows = computed(source)

    const filtered = computed(() =>
        rows.value.filter((row) => {
            const match =
                !search.value ||
                options
                    .haystack(row)
                    .toLowerCase()
                    .includes(search.value.toLowerCase())

            const status = options.matchesStatus(row, filterStatus.value)

            return match && status
        })
    )

    return { search, filterStatus, filtered }
}
