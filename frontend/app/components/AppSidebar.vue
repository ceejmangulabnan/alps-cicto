<script setup lang="ts">
const props = defineProps<{ active: string }>()

const collapsed = ref(false)

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
    { id: 'map', label: 'Agricultural Map', icon: 'i-lucide-map', to: '/map' },
]

const fieldItems: NavItem[] = [
    { id: 'farmers', label: 'Farmers', icon: 'i-lucide-users', to: '/farmers' },
    {
        id: 'farms',
        label: 'Farms & Parcels',
        icon: 'i-lucide-layers',
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
        icon: 'i-lucide-alert-triangle',
        to: '/risks',
    },
]

const analyticsItems: NavItem[] = [
    {
        id: 'reports',
        label: 'Reports & Analytics',
        icon: 'i-lucide-bar-chart-3',
        to: '/reports',
    },
]

const navGroups = computed<NavGroup[]>(() => {
    const analytics = [...analyticsItems]
    if (auth.hasRole('administrator')) {
        analytics.push({
            id: 'admin',
            label: 'Administration',
            icon: 'i-lucide-settings',
            to: '/admin',
        })
    }
    return [
        { label: 'Overview', items: overviewItems },
        { label: 'Field Operations', items: fieldItems },
        { label: 'Analytics', items: analytics },
    ]
})

const toggle = () => {
    collapsed.value = !collapsed.value
}
</script>

<template>
    <aside
        class="relative flex-shrink-0 flex h-screen flex-col overflow-hidden border-r border-white/5 bg-gradient-to-b from-[#19331c] via-[#162c1a] to-[#122419] text-white shadow-2xl shadow-black/40 transition-all duration-300 z-20"
        :class="collapsed ? 'w-16' : 'w-60'"
    >
        <!-- decorative glow -->
        <div
            class="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#4a9d4a]/20 blur-3xl"
        ></div>

        <!-- Brand -->
        <div
            class="relative border-b border-white/10 px-4 py-5"
            :class="collapsed ? 'flex justify-center px-2' : ''"
        >
            <div class="flex items-center gap-3">
                <div
                    class="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5cba5c] to-[#2f7d2f] shadow-lg shadow-black/30 ring-1 ring-white/20"
                >
                    <UIcon name="i-lucide-leaf" class="size-5 text-white" />
                    <span
                        v-if="!collapsed"
                        class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5"
                    >
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"
                        ></span>
                        <span
                            class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-300"
                        ></span>
                    </span>
                </div>
                <div v-if="!collapsed" class="min-w-0">
                    <div
                        class="text-sm font-bold tracking-[0.22em] leading-tight text-green-50"
                    >
                        ALPS
                    </div>
                    <div
                        class="mt-0.5 text-[9px] leading-tight text-green-300/60"
                    >
                        Agriculture Land Profiling System
                    </div>
                    <div
                        class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium text-green-200/70 ring-1 ring-white/10"
                    >
                        <UIcon
                            name="i-lucide-shield-check"
                            class="size-2.5"
                        />
                        LGU San Fernando
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="relative flex-1 space-y-4 overflow-y-auto px-2.5 py-4">
            <div v-for="group in navGroups" :key="group.label">
                <div
                    v-if="!collapsed"
                    class="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-green-300/40"
                >
                    {{ group.label }}
                </div>
                <div
                    v-else
                    class="mx-auto mb-2 h-px w-7 bg-white/10"
                ></div>
                <div class="space-y-0.5">
                    <NuxtLink
                        v-for="item in group.items"
                        :key="item.id"
                        :to="item.to"
                        :title="collapsed ? item.label : undefined"
                        class="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150"
                        :class="[
                            active === item.id
                                ? collapsed
                                    ? 'bg-[#4a9d4a] text-white shadow-md shadow-black/30'
                                    : 'bg-gradient-to-r from-[#3f8f3f]/90 to-[#2c6e2c]/90 text-white shadow-md shadow-black/25'
                                : 'text-green-100/60 hover:translate-x-0.5 hover:bg-white/5 hover:text-white',
                            collapsed ? 'justify-center px-0' : '',
                        ]"
                    >
                        <span
                            v-if="active === item.id && !collapsed"
                            class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#8fe08f]"
                        ></span>
                        <span
                            v-if="active === item.id"
                            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/40"
                        >
                            <UIcon
                                :name="item.icon"
                                class="size-[14px] text-[#8fe08f]"
                            />
                        </span>
                        <UIcon
                            v-else
                            :name="item.icon"
                            class="size-[17px] flex-shrink-0 text-green-300/60 group-hover:text-white"
                        />
                        <span
                            v-if="!collapsed"
                            class="truncate"
                        >{{ item.label }}</span>
                    </NuxtLink>
                </div>
            </div>
        </nav>

        <!-- Footer -->
        <div
            class="relative border-t border-white/10 px-3 pb-3 pt-2"
        >
            <button
                type="button"
                class="flex w-full items-center justify-center rounded-lg py-2 text-xs text-green-200/60 transition-colors hover:bg-white/10 hover:text-white"
                @click="toggle"
            >
                <UIcon
                    v-if="collapsed"
                    name="i-lucide-chevron-right"
                    class="size-4"
                />
                <span v-else class="flex items-center gap-2">
                    <UIcon name="i-lucide-chevron-left" class="size-3.5" />
                    Collapse
                </span>
            </button>

            <div
                v-if="!collapsed"
                class="mt-2 text-center text-[10px] text-green-400/35"
            >
                City Agriculture Office
                <br />
                San Fernando, Pampanga
            </div>
        </div>
    </aside>
</template>