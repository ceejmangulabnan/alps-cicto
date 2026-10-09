<script setup lang="ts">
const props = defineProps<{ active: string }>()

const { drawerOpen, isRail, close, toggleCollapsed } = useSidebar()

const auth = useAuth()

type NavItem = {
    id: string
    label: string
    icon: string
    to: string
}

type NavGroup = {
    label: string
    items: NavItem[]
}

const overviewItems: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'i-lucide-layout-dashboard',
        to: '/',
    },
    {
        id: 'map',
        label: 'Agricultural Map',
        icon: 'i-lucide-map',
        to: '/map',
    },
]

const fieldItems: NavItem[] = [
    {
        id: 'farmers',
        label: 'Farmers',
        icon: 'i-lucide-users',
        to: '/farmers',
    },
    {
        id: 'farms',
        label: 'Farms & Parcels',
        icon: 'i-lucide-layers-3',
        to: '/farms',
    },
    {
        id: 'crops',
        label: 'Planting & Crops',
        icon: 'i-lucide-sprout',
        to: '/crops',
    },
    {
        id: 'harvests',
        label: 'Harvests',
        icon: 'i-lucide-wheat',
        to: '/harvests',
    },
    {
        id: 'inspections',
        label: 'Inspections',
        icon: 'i-lucide-clipboard-check',
        to: '/inspections',
    },
    {
        id: 'assistance',
        label: 'Assistance',
        icon: 'i-lucide-hand-heart',
        to: '/assistance',
    },
    {
        id: 'risks',
        label: 'Risk Monitoring',
        icon: 'i-lucide-triangle-alert',
        to: '/risks',
    },
]

const analyticsItems: NavItem[] = [
    {
        id: 'reports',
        label: 'Reports & Analytics',
        icon: 'i-lucide-chart-no-axes-combined',
        to: '/reports',
    },
]

const navGroups = computed<NavGroup[]>(() => {
    const analytics = [...analyticsItems]

    if (auth.hasRole('administrator')) {
        analytics.push({
            id: 'admin',
            label: 'Administration',
            icon: 'i-lucide-settings-2',
            to: '/admin',
        })
    }

    return [
        {
            label: 'Overview',
            items: overviewItems,
        },
        {
            label: 'Field Operations',
            items: fieldItems,
        },
        {
            label: 'Analytics',
            items: analytics,
        },
    ]
})
</script>

<template>
    <aside
        class="fixed inset-y-0 left-0 z-50 flex h-screen w-64 -translate-x-full flex-col overflow-hidden border-r border-white/10 bg-[#0f2515] text-white shadow-[12px_0_40px_rgba(15,35,20,0.18)] transition-all duration-300 ease-out lg:relative lg:inset-y-auto lg:z-20 lg:shrink-0 lg:translate-x-0"
        :class="[
            drawerOpen ? 'translate-x-0' : '',
            isRail ? 'lg:w-19' : 'lg:w-62.5',
        ]"
    >
        <!-- Soft background glow -->
        <div
            class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div
            class="pointer-events-none absolute -bottom-20 -left-24 h-56 w-56 rounded-full bg-green-500/10 blur-3xl"
        />

        <!-- Brand -->
        <div
            class="relative border-b border-white/10 px-4 py-5"
            :class="isRail ? 'flex justify-center px-2' : ''"
        >
            <div
                class="flex w-full items-center"
                :class="isRail ? 'justify-center' : 'gap-3'"
            >
                <!-- Logo -->
                <div
                    class="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.28)] ring-1 ring-emerald-950/40 border"
                >
                    <img
                        src="/animap.svg"
                        alt="ALPS logo"
                        class="size-11 shrink-0 object-cover"
                    />
                </div>

                <!-- Brand text -->
                <div v-if="!isRail" class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[15px] font-extrabold text-white">
                            AniMap
                        </span>
                    </div>

                    <p
                        class="mt-1 truncate text-[10px] font-medium leading-tight text-green-100/55"
                    >
                        Agriculture Land Profiling System
                    </p>

                    <div
                        class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-2 py-1 text-[9px] font-medium text-green-100/65 ring-1 ring-white/10"
                    >
                        <UIcon
                            name="i-lucide-landmark"
                            class="size-3 text-emerald-300"
                        />
                        City of San Fernando
                    </div>
                </div>

                <!-- Mobile close -->
                <button
                    type="button"
                    class="ml-auto flex size-8 items-center justify-center rounded-lg text-green-100/55 transition-all hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label="Close navigation"
                    @click="close"
                >
                    <UIcon name="i-lucide-x" class="size-4" />
                </button>
            </div>
        </div>

        <!-- Navigation -->
        <nav
            class="relative flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
            <div class="space-y-5">
                <div
                    v-for="group in navGroups"
                    :key="group.label"
                    class="space-y-1.5"
                >
                    <!-- Group title -->
                    <div
                        v-if="!isRail"
                        class="px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-green-200/35"
                    >
                        {{ group.label }}
                    </div>

                    <div v-else class="mx-auto my-2 h-px w-8 bg-white/10" />

                    <!-- Items -->
                    <div class="space-y-1">
                        <NuxtLink
                            v-for="item in group.items"
                            :key="item.id"
                            :to="item.to"
                            :title="isRail ? item.label : undefined"
                            class="group relative flex min-h-11 w-full items-center overflow-hidden rounded-xl text-sm font-medium transition-all duration-200"
                            :class="[
                                active === item.id
                                    ? 'bg-linear-to-r from-[#357c3e] to-[#286a34] text-white shadow-[0_6px_18px_rgba(0,0,0,0.2)] ring-1 ring-white/10'
                                    : 'text-green-50/60 hover:bg-white/6 hover:text-white',
                                isRail
                                    ? 'justify-center px-0'
                                    : 'gap-3 px-3.5 py-2.5',
                            ]"
                        >
                            <!-- Active indicator -->
                            <span
                                v-if="active === item.id && !isRail"
                                class="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-emerald-300"
                            />

                            <!-- Subtle active glow -->
                            <span
                                v-if="active === item.id"
                                class="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 to-transparent"
                            />

                            <!-- Icon box -->
                            <span
                                class="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                                :class="
                                    active === item.id
                                        ? 'bg-white/10 text-emerald-200 ring-1 ring-white/10'
                                        : 'bg-white/3 text-green-200/55 group-hover:bg-white/[0.07] group-hover:text-emerald-200'
                                "
                            >
                                <UIcon :name="item.icon" class="size-4.25" />
                            </span>

                            <!-- Label -->
                            <span
                                v-if="!isRail"
                                class="relative z-10 min-w-0 flex-1 truncate"
                            >
                                {{ item.label }}
                            </span>

                            <!-- Chevron -->
                            <UIcon
                                v-if="!isRail && active === item.id"
                                name="i-lucide-chevron-right"
                                class="relative z-10 size-3.5 shrink-0 text-emerald-200/70"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Footer -->
        <div
            class="relative border-t border-white/10 bg-black/5 px-3 pb-4 pt-3"
        >
            <!-- Collapse -->
            <button
                type="button"
                class="hidden w-full items-center justify-center rounded-xl border border-white/8 bg-white/3 py-2.5 text-xs font-medium text-green-100/55 transition-all duration-200 hover:bg-white/8 hover:text-white lg:flex"
                :aria-label="
                    isRail ? 'Expand navigation' : 'Collapse navigation'
                "
                @click="toggleCollapsed"
            >
                <UIcon
                    v-if="isRail"
                    name="i-lucide-panel-left-open"
                    class="size-4"
                />

                <span v-else class="flex items-center gap-2">
                    <UIcon name="i-lucide-panel-left-close" class="size-4" />
                    Collapse Sidebar
                </span>
            </button>

            <!-- Office footer -->
            <div
                v-if="!isRail"
                class="mt-3 rounded-xl border border-white/6 bg-white/2.5 px-3 py-3"
            >
                <div class="flex items-start gap-2.5">
                    <div
                        class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"
                    >
                        <UIcon name="i-lucide-building-2" class="size-3.5" />
                    </div>

                    <div class="min-w-0">
                        <div class="text-[10px] font-semibold text-green-50/70">
                            City Agriculture and Veterinary Office
                        </div>

                        <div
                            class="mt-0.5 text-[9px] leading-relaxed text-green-100/35"
                        >
                            City of San Fernando, Pampanga
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>
