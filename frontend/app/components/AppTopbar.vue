<script setup lang="ts">
const props = defineProps<{ page: string }>()

const auth = useAuth()
const route = useRoute()
const { toggleDrawer, close: closeDrawer } = useSidebar()

const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    map: 'Agricultural Map',
    farmers: 'Farmers',
    farms: 'Farms & Parcels',
    'parcels-id': 'Parcel Details',
    crops: 'Planting & Crops',
    harvests: 'Harvests',
    inspections: 'Inspections',
    assistance: 'Assistance',
    risks: 'Risk Monitoring',
    reports: 'Reports & Analytics',
    admin: 'Administration',
}

const showMenu = ref(false)

const displayName = computed(() => {
    const u = auth.user.value
    const raw = (u as any)?.name || u?.username
    return raw || 'Administrator'
})

const displayEmail = computed(() => auth.user.value?.email ?? '')

const displayRole = computed(() => {
    const r = auth.user.value?.role
    if (r?.name && r.name !== 'Authenticated') return r.name
    if (r?.type === 'administrator') return 'Administrator'
    return r?.name || 'Administrator'
})

const initials = computed(() =>
    displayName.value
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
)

const toggleMenu = () => {
    showMenu.value = !showMenu.value
}

const closeMenu = () => {
    showMenu.value = false
}

watch(
    () => route.fullPath,
    () => closeMenu()
)

// Both the user menu and the sidebar drawer dismiss on Escape.
function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    closeMenu()
    closeDrawer()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const handleLogout = async () => {
    await auth.logout()
    await navigateTo('/login')
}
</script>

<template>
    <header
        class="relative z-20 flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-5"
    >
        <div class="flex min-w-0 items-center gap-2">
            <button
                type="button"
                class="-ml-1 shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                aria-label="Open navigation"
                @click="toggleDrawer"
            >
                <UIcon name="i-lucide-menu" class="size-5" />
            </button>
            <!--
                The office name is the first thing to go when width is tight;
                the page title is what the user is actually reading.
            -->
            <div class="hidden truncate text-xs text-gray-400 sm:block">
                City Agriculture Office · San Fernando, Pampanga
            </div>
            <UIcon
                name="i-lucide-chevron-right"
                class="hidden size-3 shrink-0 text-gray-300 sm:block"
            />
            <div class="truncate text-xs font-semibold text-gray-700">
                {{ PAGE_TITLES[page] || page }}
            </div>
        </div>

        <div class="relative">
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
                :class="showMenu ? 'bg-gray-50' : ''"
                aria-haspopup="menu"
                :aria-expanded="showMenu"
                @click="toggleMenu"
            >
                <div
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-[#2d6a2d] text-[10px] font-bold text-white"
                >
                    {{ initials }}
                </div>
                <div class="hidden text-left md:block">
                    <div class="text-xs font-medium text-gray-700">
                        {{ displayName }}
                    </div>
                    <div class="text-[10px] text-gray-400">
                        {{ displayRole }}
                    </div>
                </div>
                <UIcon
                    name="i-lucide-chevron-down"
                    class="size-3 text-gray-400 transition-transform"
                    :class="showMenu ? 'rotate-180' : ''"
                />
            </button>

            <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 translate-y-1"
                leave-active-class="transition duration-100 ease-in"
                leave-to-class="opacity-0 translate-y-1"
            >
                <div
                    v-if="showMenu"
                    class="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
                    role="menu"
                >
                    <div
                        class="flex items-center gap-3 border-b border-gray-50 bg-green-50/40 px-4 py-3"
                    >
                        <div
                            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2d6a2d] text-xs font-bold text-white"
                        >
                            {{ initials }}
                        </div>
                        <div class="min-w-0">
                            <div
                                class="truncate text-xs font-semibold text-gray-800"
                            >
                                {{ displayName }}
                            </div>
                            <div
                                class="truncate text-[10px] text-gray-500"
                                :title="displayEmail"
                            >
                                {{ displayEmail || displayRole }}
                            </div>
                        </div>
                    </div>

                    <div class="p-1.5">
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                            role="menuitem"
                        >
                            <UIcon
                                name="i-lucide-user"
                                class="size-3.5 text-gray-400"
                            />
                            My Profile
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="ml-auto size-3 text-gray-300"
                            />
                        </button>
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                            role="menuitem"
                        >
                            <UIcon
                                name="i-lucide-settings"
                                class="size-3.5 text-gray-400"
                            />
                            Preferences
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="ml-auto size-3 text-gray-300"
                            />
                        </button>
                    </div>

                    <div class="border-t border-gray-100 p-1.5">
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            role="menuitem"
                            @click="handleLogout"
                        >
                            <UIcon name="i-lucide-log-out" class="size-3.5" />
                            Logout
                        </button>
                    </div>
                </div>
            </transition>
        </div>
    </header>
</template>
