/**
 * SSR-safe `window.matchMedia` wrapper.
 *
 * Written by hand rather than pulled from @vueuse/core: that package is only in
 * the tree as a transitive dependency of Nuxt UI, so importing from it directly
 * would couple us to a version we do not declare.
 *
 * The ref is keyed by query in `useState`, so every caller shares one listener
 * and one source of truth rather than each subscribing separately.
 */
export function useMediaQuery(query: string) {
    const state = useState(`media:${query}`, () => false)

    // Starts false and is only corrected on mount. Nothing that depends on it
    // may drive first paint -- the sidebar's open/closed state is CSS-defaulted
    // instead, so a mobile viewport does not flash the panel open first.
    let list: MediaQueryList | undefined
    const onChange = (e: MediaQueryListEvent) => {
        state.value = e.matches
    }

    onMounted(() => {
        list = window.matchMedia(query)
        state.value = list.matches
        list.addEventListener('change', onChange)
    })

    onScopeDispose(() => list?.removeEventListener('change', onChange))

    return readonly(state)
}

/** Tailwind's `lg` breakpoint, as a media query. */
export const MOBILE_QUERY = '(max-width: 1023.98px)'
