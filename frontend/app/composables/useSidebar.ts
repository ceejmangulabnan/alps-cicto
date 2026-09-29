/**
 * Sidebar state, split across the two things it actually controls:
 *
 *  - `drawerOpen` is the off-canvas overlay used below `lg`. It starts closed,
 *    so a narrow viewport never opens onto a nav panel covering the page.
 *  - `collapsed` is the desktop rail-to-icon toggle, which is a preference and
 *    is left alone when the viewport changes.
 *
 * `isRail` is what the sidebar renders against: a collapsed *drawer* would be a
 * 64px strip of icons with no labels, which is not a useful mobile nav, so the
 * collapse only applies once there is room for it.
 */
export function useSidebar() {
    const isMobile = useMediaQuery(MOBILE_QUERY)

    const drawerOpen = useState('sidebar:drawer', () => false)
    const collapsed = useState('sidebar:collapsed', () => false)

    const isRail = computed(() => !isMobile.value && collapsed.value)

    function open() {
        drawerOpen.value = true
    }

    function close() {
        drawerOpen.value = false
    }

    function toggleDrawer() {
        drawerOpen.value = !drawerOpen.value
    }

    function toggleCollapsed() {
        collapsed.value = !collapsed.value
    }

    return {
        isMobile,
        drawerOpen,
        collapsed,
        isRail,
        open,
        close,
        toggleDrawer,
        toggleCollapsed,
    }
}
