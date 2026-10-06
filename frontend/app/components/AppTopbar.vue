<script setup lang="ts">
//@ts-nocheck
const props = defineProps<{ page: string }>()

const auth = useAuth()
const route = useRoute()
const { toggleDrawer, close: closeDrawer } = useSidebar()

const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    map: 'Agricultural Map',
    farmers: 'Farmers',
    farms: 'Farms & Parcels',
    'parcels-code': 'Parcel Details',
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

const currentTitle = computed(() => PAGE_TITLES[props.page] || props.page)

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
        class="relative z-30 flex h-[68px] flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.035)] backdrop-blur sm:px-5 lg:px-6"
    >
        <!-- Left -->
        <div class="flex min-w-0 items-center gap-3">
            <button
                type="button"
                class="-ml-1 flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800 lg:hidden"
                aria-label="Open navigation"
                @click="toggleDrawer"
            >
                <UIcon name="i-lucide-menu" class="size-5" />
            </button>

            <div class="flex min-w-0 items-center gap-3">
                <div
                    class="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100 sm:flex"
                >
                    <UIcon name="i-lucide-building-2" class="size-4" />
                </div>

                <div class="min-w-0">
                    <div
                        class="hidden truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 sm:block"
                    >
                        City Agriculture Office · San Fernando, Pampanga
                    </div>

                    <div class="flex min-w-0 items-center gap-2">
                        <span
                            class="truncate text-sm font-semibold text-slate-800"
                        >
                            {{ currentTitle }}
                        </span>

                        <span
                            class="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 md:inline-flex"
                        >
                            <span class="size-1.5 rounded-full bg-emerald-500" />
                            ALPS
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right -->
        <div class="flex items-center gap-2">
            <div
                class="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs text-slate-500 xl:flex"
            >
                <UIcon
                    name="i-lucide-shield-check"
                    class="size-3.5 text-emerald-600"
                />
                <span>Secure Session</span>
            </div>

            <div class="relative">
                <button
                    type="button"
                    class="flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all"
                    :class="
                        showMenu
                            ? 'border-emerald-200 bg-emerald-50/70 shadow-sm'
                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    "
                    aria-haspopup="menu"
                    :aria-expanded="showMenu"
                    @click="toggleMenu"
                >
                    <div
                        class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2d6a2d] text-xs font-bold text-white shadow-sm"
                    >
                        {{ initials }}
                    </div>

                    <div class="hidden min-w-0 text-left md:block">
                        <div
                            class="max-w-[180px] truncate text-sm font-semibold leading-4 text-slate-800"
                        >
                            {{ displayName }}
                        </div>
                        <div
                            class="mt-1 max-w-[180px] truncate text-[11px] leading-none text-slate-400"
                        >
                            {{ displayRole }}
                        </div>
                    </div>

                    <UIcon
                        name="i-lucide-chevron-down"
                        class="size-4 shrink-0 text-slate-400 transition-transform duration-200"
                        :class="showMenu ? 'rotate-180' : ''"
                    />
                </button>

                <transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="translate-y-1 scale-[0.98] opacity-0"
                    enter-to-class="translate-y-0 scale-100 opacity-100"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="translate-y-0 scale-100 opacity-100"
                    leave-to-class="translate-y-1 scale-[0.98] opacity-0"
                >
                    <div
                        v-if="showMenu"
                        class="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/5"
                        role="menu"
                    >
                        <!-- Account summary -->
                        <div
                            class="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-emerald-50/80 via-white to-white px-4 py-4"
                        >
                            <div
                                class="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-emerald-300/10 blur-2xl"
                            />

                            <div class="relative flex items-center gap-3">
                                <div
                                    class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#2d6a2d] text-sm font-bold text-white shadow-sm"
                                >
                                    {{ initials }}
                                </div>

                                <div class="min-w-0">
                                    <div
                                        class="truncate text-sm font-semibold text-slate-800"
                                    >
                                        {{ displayName }}
                                    </div>

                                    <div
                                        class="mt-0.5 truncate text-xs text-slate-500"
                                        :title="displayEmail"
                                    >
                                        {{ displayEmail || displayRole }}
                                    </div>

                                    <span
                                        class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100"
                                    >
                                        <span
                                            class="size-1.5 rounded-full bg-emerald-500"
                                        />
                                        {{ displayRole }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Menu -->
                        <div class="p-2">
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                role="menuitem"
                            >
                                <span
                                    class="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700"
                                >
                                    <UIcon
                                        name="i-lucide-user"
                                        class="size-4"
                                    />
                                </span>
                                My Profile
                                <UIcon
                                    name="i-lucide-chevron-right"
                                    class="ml-auto size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                                />
                            </button>

                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                role="menuitem"
                            >
                                <span
                                    class="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700"
                                >
                                    <UIcon
                                        name="i-lucide-settings"
                                        class="size-4"
                                    />
                                </span>
                                Preferences
                                <UIcon
                                    name="i-lucide-chevron-right"
                                    class="ml-auto size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                                />
                            </button>
                        </div>

                        <!-- Logout -->
                        <div class="border-t border-slate-100 p-2">
                            <button
                                type="button"
                                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                role="menuitem"
                                @click="handleLogout"
                            >
                                <span
                                    class="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-500"
                                >
                                    <UIcon
                                        name="i-lucide-log-out"
                                        class="size-4"
                                    />
                                </span>
                                Logout
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </header>
</template>
