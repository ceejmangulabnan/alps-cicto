<script setup lang="ts">
const props = defineProps<{ page: string }>()

const auth = useAuth()

const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    map: 'Agricultural Map',
    farmers: 'Farmers',
    farms: 'Farms & Parcels',
    crops: 'Planting & Crops',
    harvests: 'Harvests',
    inspections: 'Inspections',
    assistance: 'Assistance',
    risks: 'Risk Monitoring',
    reports: 'Reports & Analytics',
    admin: 'Administration',
}

const handleLogout = async () => {
    await auth.logout()
    await navigateTo('/login')
}
</script>

<template>
    <header
        class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 z-10"
    >
        <div class="flex items-center gap-3">
            <div class="text-xs text-gray-400">
                City Agriculture Office / San Fernando, Pampanga
            </div>
            <span class="text-gray-300">/</span>
            <div class="text-xs font-semibold text-gray-700">
                {{ PAGE_TITLES[page] || page }}
            </div>
        </div>

        <div class="flex items-center gap-3">
            <div
                class="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium"
            >
                <UIcon name="i-lucide-alert-triangle" class="size-[11px]" />
                2 High-Risk Alerts
            </div>

            <div class="relative">
                <UIcon
                    name="i-lucide-search"
                    class="size-[13px] absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Quick search..."
                    class="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 w-44 bg-gray-50"
                />
            </div>

            <button
                type="button"
                class="relative p-2 hover:bg-gray-100 rounded-lg"
            >
                <UIcon name="i-lucide-bell" class="size-[15px] text-gray-500" />
                <span
                    class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                ></span>
            </button>

            <button
                type="button"
                class="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
                <div
                    class="w-7 h-7 rounded-full bg-[#2d6a2d] flex items-center justify-center text-white text-[10px] font-bold"
                >
                    CA
                </div>
                <div class="text-left hidden md:block">
                    <div class="text-xs font-medium text-gray-700">
                        City Agri Office
                    </div>
                    <div class="text-[10px] text-gray-400">Administrator</div>
                </div>
                <UIcon
                    name="i-lucide-chevron-down"
                    class="size-3 text-gray-400"
                />
            </button>

            <button
                type="button"
                class="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors text-xs text-gray-500"
                @click="handleLogout"
            >
                <UIcon name="i-lucide-log-out" class="size-3.5" />
                Logout
            </button>
        </div>
    </header>
</template>
