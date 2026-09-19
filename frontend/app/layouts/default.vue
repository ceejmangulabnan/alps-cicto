<template>
    <div
        class="min-h-screen bg-[#f4f8f6] text-slate-900 dark:bg-slate-950 dark:text-white"
    >
        <!-- Mobile sidebar overlay -->
        <div
            v-if="mobileOpen"
            class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            @click="closeMobileSidebar"
        />

        <!-- Sidebar -->
        <aside
            class="fixed inset-y-0 left-0 z-50 border-r border-white/10 bg-[#0f172a]/95 shadow-2xl backdrop-blur-2xl transition-all duration-300"
            :class="[
                sidebarCollapsed ? 'w-20' : 'w-72',
                mobileOpen
                    ? 'translate-x-0'
                    : '-translate-x-full lg:translate-x-0',
            ]"
        >
            <div class="flex h-full flex-col">
                <!-- Sidebar header -->
                <div
                    class="flex h-[88px] items-center border-b border-white/10 px-4"
                >
                    <div
                        class="flex w-full items-center"
                        :class="sidebarCollapsed ? 'justify-center' : 'gap-3'"
                    >
                        <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(0,193,106,0.40)]"
                        >
                            <UIcon name="i-lucide-leaf" class="size-6" />
                        </div>

                        <div v-if="!sidebarCollapsed" class="min-w-0">
                            <h1
                                class="text-wrap leading-none text-base font-semibold tracking-tight text-white"
                            >
                                ALPS
                            </h1>

                            <p class="truncate text-xs text-slate-400">
                                Agricultural Land Profiling System
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Desktop collapse button -->
                <div class="hidden px-4 py-3 lg:block">
                    <UButton
                        block
                        color="neutral"
                        variant="soft"
                        :icon="
                            isCollapsed
                                ? 'i-lucide-panel-right-open'
                                : 'i-lucide-panel-left-close'
                        "
                        @click="toggleSidebar"
                    >
                        <span v-if="!isCollapsed"> Collapse Sidebar </span>
                    </UButton>
                </div>

                <!-- Navigation links -->
                <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2">
                    <UTooltip
                        v-for="item in links"
                        :key="item.to"
                        :text="sidebarCollapsed ? item.label : ''"
                        :disabled="!sidebarCollapsed"
                        :delay-duration="0"
                    >
                        <NuxtLink
                            :to="item.to"
                            class="group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all"
                            :class="[
                                isActive(item.to)
                                    ? 'bg-white/10 text-white shadow-lg backdrop-blur'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                                sidebarCollapsed ? 'justify-center' : '',
                            ]"
                            @click="closeMobileSidebar"
                        >
                            <!-- Active indicator -->
                            <span
                                v-if="isActive(item.to) && !sidebarCollapsed"
                                class="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-green-400"
                            />

                            <!-- Navigation icon -->
                            <div
                                class="flex size-9 shrink-0 items-center justify-center rounded-xl transition"
                                :class="
                                    isActive(item.to)
                                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                                "
                            >
                                <UIcon :name="item.icon" class="size-4" />
                            </div>

                            <!-- Navigation label -->
                            <span v-if="!sidebarCollapsed" class="truncate">
                                {{ item.label }}
                            </span>
                        </NuxtLink>
                    </UTooltip>
                </nav>

                <!-- User information -->
                <div
                    class="border-t border-white/10 transition-all duration-300"
                    :class="sidebarCollapsed ? 'p-2' : 'p-4'"
                >
                    <div
                        class="rounded-3xl border border-white/10 bg-white/5 text-white backdrop-blur-xl transition-all duration-300"
                        :class="sidebarCollapsed ? 'p-2' : 'p-4'"
                    >
                        <div
                            class="flex items-center transition-all duration-300"
                            :class="
                                sidebarCollapsed ? 'justify-center' : 'gap-3'
                            "
                        >
                            <div
                                class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-green-500/20 text-green-300"
                            >
                                <UIcon name="i-lucide-user" class="size-5" />
                            </div>

                            <div
                                v-if="!sidebarCollapsed"
                                class="min-w-0 flex-1"
                            >
                                <p class="truncate text-sm font-semibold">
                                    {{ displayName }}
                                </p>

                                <p
                                    class="truncate text-xs capitalize text-slate-400"
                                >
                                    {{ displayRole }}
                                </p>
                            </div>
                        </div>

                        <UButton
                            color="error"
                            variant="soft"
                            icon="i-lucide-log-out"
                            :class="[
                                'mt-4 flex justify-center',
                                sidebarCollapsed ? 'rounded-2xl' : '',
                            ]"
                            :block="true"
                            :aria-label="
                                sidebarCollapsed ? 'Logout' : undefined
                            "
                            @click="openLogoutModal"
                        >
                            <span v-if="!sidebarCollapsed"> Logout </span>
                        </UButton>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Mobile header -->
        <header
            class="sticky top-0 z-30 border-b border-green-100 bg-[#f4f8f6]/85 px-4 py-3 backdrop-blur-2xl lg:hidden dark:border-slate-700 dark:bg-slate-950/85"
        >
            <div class="flex items-center justify-between">
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-lg shadow-green-500/30"
                    >
                        <UIcon name="i-lucide-leaf" class="size-5" />
                    </div>

                    <div class="min-w-0">
                        <p
                            class="truncate text-sm font-bold text-slate-900 dark:text-white"
                        >
                            ALPS
                        </p>

                        <p
                            class="truncate text-xs text-slate-500 dark:text-slate-400"
                        >
                            {{ pageTitle }}
                        </p>
                    </div>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                    <UColorModeButton
                        color="neutral"
                        variant="ghost"
                        aria-label="Toggle theme"
                    />

                    <UButton
                        color="error"
                        variant="ghost"
                        icon="i-lucide-log-out"
                        aria-label="Logout"
                        @click="openLogoutModal"
                    />

                    <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-menu"
                        aria-label="Open navigation menu"
                        @click="mobileOpen = true"
                    />
                </div>
            </div>
        </header>

        <!-- Main content -->
        <main
            class="min-h-screen transition-all duration-300"
            :class="isCollapsed ? 'lg:pl-20' : 'lg:pl-72'"
        >
            <!-- Desktop page header -->
            <div
                v-if="!hideDesktopHeader"
                class="sticky top-0 z-20 hidden border-b border-green-100 bg-white/75 px-8 py-3 backdrop-blur-2xl lg:block dark:border-slate-700 dark:bg-slate-900/75"
            >
                <div class="flex items-center justify-between">
                    <!-- Breadcrumb Navigation -->
                    <nav class="flex" aria-label="Breadcrumb">
                        <ol class="flex items-center">
                            <li
                                v-for="(crumb, index) in breadcrumbs"
                                :key="crumb.to"
                                class="flex items-center"
                            >
                                <!-- Separator Icon -->
                                <UIcon
                                    v-if="index > 0"
                                    name="i-lucide-chevron-right"
                                    class="mx-2 size-4 shrink-0 text-slate-400"
                                />

                                <!-- Clickable link for previous pages -->
                                <NuxtLink
                                    v-if="!crumb.isLast"
                                    :to="crumb.to"
                                    class="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                    {{ crumb.label }}
                                </NuxtLink>

                                <!-- Non-clickable bold text for current page -->
                                <span
                                    v-else
                                    class="text-sm font-bold text-slate-900 dark:text-white"
                                    aria-current="page"
                                >
                                    {{ crumb.label }}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <UColorModeButton
                        color="neutral"
                        variant="ghost"
                        aria-label="Toggle theme"
                    />
                </div>
            </div>

            <!-- Page content -->
            <div
                class="mx-auto px-4 sm:px-6 lg:px-8"
                :class="hideDesktopHeader ? 'py-2' : 'py-4 sm:py-6 lg:py-8'"
            >
                <slot />
            </div>
        </main>

        <!-- Logout confirmation modal -->
        <UModal v-model:open="logoutOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:bg-slate-900/90"
                >
                    <!-- BACKGROUND EFFECT -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-red-50/70 via-white to-green-50/40 dark:from-red-950/30 dark:via-slate-900 dark:to-green-950/30"
                    />

                    <!-- TOP DECOR -->
                    <div
                        class="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-500/10 blur-3xl"
                    />
                    <div
                        class="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"
                    />

                    <div class="relative p-7">
                        <!-- ICON -->
                        <div
                            class="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_40px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-log-out" class="size-10" />
                        </div>

                        <!-- CONTENT -->
                        <div class="mt-5 text-center">
                            <h2
                                class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Logout Session?
                            </h2>

                            <p
                                class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                            >
                                You are about to sign out from the
                                <span
                                    class="font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    SNC Custodian System </span
                                >.
                                <br />
                                You can login again anytime.
                            </p>
                        </div>

                        <!-- USER CARD -->
                        <div
                            class="mt-6 rounded-3xl border border-green-100 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20"
                                >
                                    <UIcon
                                        name="i-lucide-user"
                                        class="size-5"
                                    />
                                </div>

                                <div class="min-w-0 flex-1 text-left">
                                    <p
                                        class="truncate text-sm font-semibold text-slate-900 dark:text-white"
                                    >
                                        {{ displayName }}
                                    </p>

                                    <p
                                        class="truncate text-xs capitalize text-slate-500 dark:text-slate-400"
                                    >
                                        {{ displayRole }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- ACTIONS -->
                        <div class="mt-7 flex gap-3">
                            <UButton
                                block
                                color="neutral"
                                variant="soft"
                                size="lg"
                                class="rounded-2xl"
                                :disabled="isLoggingOut"
                                @click="logoutOpen = false"
                            >
                                Stay Logged In
                            </UButton>

                            <UButton
                                block
                                color="error"
                                size="lg"
                                icon="i-lucide-log-out"
                                class="rounded-2xl shadow-lg shadow-red-500/20"
                                :loading="isLoggingOut"
                                @click="confirmLogout"
                            >
                                Logout
                            </UButton>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
interface NavigationLink {
    label: string
    icon: string
    to: string
}

const route = useRoute()

const logoutOpen = ref(false)
const isLoggingOut = ref(false)
const isCollapsed = ref(false)
const mobileOpen = ref(false)

// const { fetch: refreshSession, session } = useUserSession()

/*
|--------------------------------------------------------------------------
| Navigation links
|--------------------------------------------------------------------------
*/

const links: NavigationLink[] = [
    {
        label: 'Dashboard',
        icon: 'i-lucide-layout-dashboard',
        to: '/',
    },
    {
        label: 'Agricultural Map',
        icon: 'i-lucide-map',
        to: '/map',
    },
    {
        label: 'Farmers',
        icon: 'i-lucide-users',
        to: '/farmers',
    },
    {
        label: 'Farms & Parcels',
        icon: 'i-lucide-layers',
        to: '/farms',
    },
    {
        label: 'Planting & Crops',
        icon: 'i-lucide-sprout',
        to: '/planting',
    },
    {
        label: 'Harvests',
        icon: 'i-lucide-wheat',
        to: '/harvests',
    },
    {
        label: 'Inspections',
        icon: 'i-lucide-clipboard-check',
        to: '/inspections',
    },
    {
        label: 'Risk Monitoring',
        icon: 'i-lucide-alert-triangle',
        to: '/risks',
    },
    {
        label: 'Reports',
        icon: 'i-lucide-bar-chart-3',
        to: '/reports',
    },
]

/*
|--------------------------------------------------------------------------
| Sidebar
|--------------------------------------------------------------------------
*/

const sidebarCollapsed = computed(() => {
    if (mobileOpen.value) {
        return false
    }

    return isCollapsed.value
})

const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
}

const closeMobileSidebar = () => {
    mobileOpen.value = false
}

/*
|--------------------------------------------------------------------------
| Navigation state
|--------------------------------------------------------------------------
*/

const isActive = (path: string): boolean => {
    if (path === '/') {
        return route.path === '/'
    }

    return route.path === path || route.path.startsWith(`${path}/`)
}

// Add this interface near the top with NavigationLink
interface BreadcrumbItem {
    label: string
    to: string
    isLast: boolean
}

/*
|--------------------------------------------------------------------------
| Breadcrumbs
|--------------------------------------------------------------------------
*/

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const path = route.path

    // Default root breadcrumb
    const crumbs = [
        {
            label: 'Dashboard',
            to: '/',
            isLast: path === '/',
        },
    ]

    if (path === '/') return crumbs

    // Split the path and remove empty segments
    const segments = path.split('/').filter(Boolean)
    let currentPath = ''

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`

        // Format the segment to be readable (e.g., "planting-crops" -> "Planting Crops")
        let label = segment.replace(/-/g, ' ')
        label = label.charAt(0).toUpperCase() + label.slice(1)

        crumbs.push({
            label,
            to: currentPath,
            isLast: index === segments.length - 1,
        })
    })

    return crumbs
})

const pageTitle = computed(() => {
    return breadcrumbs.value[breadcrumbs.value.length - 1]?.label || 'Dashboard'
})

const hideDesktopHeader = computed(() => {
    return false
})

/*
|--------------------------------------------------------------------------
| User information
|--------------------------------------------------------------------------
*/

// TODO: Update user info display when authentication is finished
const displayName = computed(() => {
    return 'Username'
    // return session.value.user?.username
})

const displayRole = computed(() => {
    return 'Admininistrator'
    // return session.value.user?.role?.name
})

// const isAdmin = computed(() => {
//     return true
//     // return session.value.user?.role?.name === 'Administrator'
// })

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const openLogoutModal = () => {
    mobileOpen.value = false
    logoutOpen.value = true
}

const confirmLogout = async () => {
    if (isLoggingOut.value) {
        return
    }

    isLoggingOut.value = true

    try {
        /*
         * Replace this section with your real logout function when your
         * authentication system is ready.
         *
         * Example:
         * const { logout } = useAuth()
         * await logout()
         */

        await $fetch('/api/auth/logout', { method: 'POST' })
        // await refreshSession()
        await navigateTo('/auth/login')
        logoutOpen.value = false
    } catch (error) {
        console.error('Logout failed:', error)
    } finally {
        isLoggingOut.value = false
    }
}

/*
|--------------------------------------------------------------------------
| Route watcher
|--------------------------------------------------------------------------
*/

watch(
    () => route.fullPath,
    () => {
        mobileOpen.value = false
    }
)
</script>
