<script setup lang="ts">
const props = defineProps<{ active: string }>()

const collapsed = ref(false)

const auth = useAuth()

const navItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'i-lucide-layout-dashboard',
        to: '/',
    },
    { id: 'map', label: 'Agricultural Map', icon: 'i-lucide-map', to: '/map' },
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
    {
        id: 'reports',
        label: 'Reports & Analytics',
        icon: 'i-lucide-bar-chart-3',
        to: '/reports',
    },
]

const visibleNavItems = computed(() =>
    auth.hasRole('administrator')
        ? [
              ...navItems,
              {
                  id: 'admin',
                  label: 'Administration',
                  icon: 'i-lucide-settings',
                  to: '/admin',
              },
          ]
        : navItems
)

const toggle = () => {
    collapsed.value = !collapsed.value
}
</script>

<template>
    <aside
        class="flex flex-col h-screen bg-[#1a2f1a] text-white transition-all duration-300 z-20 flex-shrink-0"
        :class="collapsed ? 'w-16' : 'w-60'"
    >
        <div
            class="flex items-center gap-3 px-4 py-5 border-b border-white/10"
            :class="collapsed ? 'justify-center px-2' : ''"
        >
            <div
                class="w-8 h-8 rounded-lg bg-[#4a9d4a] flex items-center justify-center flex-shrink-0"
            >
                <UIcon name="i-lucide-leaf" class="size-4 text-white" />
            </div>
            <div v-if="!collapsed">
                <div class="text-sm font-bold tracking-wide leading-tight">
                    ALPS
                </div>
                <div class="text-[10px] text-green-400/70 leading-tight">
                    Agriculture Land Profiling System
                </div>
            </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            <NuxtLink
                v-for="item in visibleNavItems"
                :key="item.id"
                :to="item.to"
                :title="collapsed ? item.label : undefined"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150"
                :class="[
                    active === item.id
                        ? 'bg-[#4a9d4a] text-white font-medium'
                        : 'text-green-100/70 hover:bg-white/10 hover:text-white',
                    collapsed ? 'justify-center px-0' : '',
                ]"
            >
                <UIcon :name="item.icon" class="size-[17px] flex-shrink-0" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
        </nav>

        <div class="p-3 border-t border-white/10">
            <button
                type="button"
                class="w-full flex items-center justify-center py-2 rounded-md text-green-300/50 hover:text-white hover:bg-white/10 transition-colors"
                @click="toggle"
            >
                <UIcon
                    v-if="collapsed"
                    name="i-lucide-chevron-right"
                    class="size-4"
                />
                <span v-else class="flex items-center gap-2 text-xs">
                    <UIcon name="i-lucide-chevron-left" class="size-3.5" />
                    Collapse
                </span>
            </button>
            <div
                v-if="!collapsed"
                class="mt-2 text-center text-[10px] text-green-400/40"
            >
                City Agriculture Office<br />San Fernando, Pampanga
            </div>
        </div>
    </aside>
</template>
