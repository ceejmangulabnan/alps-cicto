<template>
    <main class="relative min-h-screen overflow-hidden bg-[#f4f8f4]">
        <!-- Background -->
        <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,106,45,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(29,111,164,0.12),transparent_30%)]"
            aria-hidden="true"
        />
        <div
            class="absolute -left-30 -top-25 size-80 rounded-full bg-emerald-300/10 blur-3xl"
            aria-hidden="true"
        />
        <div
            class="absolute -bottom-32.5 -right-25 size-90 rounded-full bg-blue-300/10 blur-3xl"
            aria-hidden="true"
        />

        <div
            class="relative mx-auto flex min-h-screen w-full max-w-375 items-center justify-center px-4 py-6 sm:px-6 lg:px-8"
        >
            <section
                class="grid w-full max-w-6xl overflow-hidden rounded-4xl border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5 lg:grid-cols-[1.08fr_0.92fr]"
            >
                <!-- Visual / Welcome Panel -->
                <div
                    class="relative min-h-75 overflow-hidden bg-[#143c29] lg:min-h-180"
                >
                    <div
                        class="absolute inset-0 bg-cover bg-center"
                        style="
                            background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=88');
                        "
                        aria-hidden="true"
                    />
                    <div
                        class="absolute inset-0 bg-linear-to-br from-[#0f3423]/96 via-[#1b5e3d]/84 to-[#2d6a2d]/72"
                        aria-hidden="true"
                    />

                    <div
                        class="absolute -right-16 top-10 size-56 rounded-full bg-white/5 blur-2xl"
                        aria-hidden="true"
                    />

                    <div
                        class="relative z-10 flex h-full min-h-75 flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12"
                    >
                        <!-- Brand -->
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-sm"
                                >
                                    <img
                                        src="/animap.svg"
                                        alt="AniMap logo"
                                        class="size-12 shrink-0 object-cover"
                                    />
                                </div>
                                <div>
                                    <div
                                        class="text-lg font-extrabold tracking-[0.14em] text-white"
                                    >
                                        AniMap
                                    </div>
                                    <div
                                        class="mt-0.5 text-[11px] font-medium text-white/65"
                                    >
                                        Agricultural Land Profiling System
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Main Message -->
                        <div class="max-w-xl py-10 lg:py-0">
                            <h1
                                class="text-4xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
                            >
                                Manage agricultural data with clarity.
                            </h1>

                            <p
                                class="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base"
                            >
                                Map farms, monitor land use, track crop
                                activity, manage farmer records, and support
                                better planning across San Fernando, Pampanga.
                            </p>

                            <div class="mt-7 hidden grid-cols-3 gap-3 sm:grid">
                                <div
                                    class="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                                >
                                    <UIcon
                                        name="i-lucide-map-pinned"
                                        class="size-5 text-emerald-200"
                                    />
                                    <div
                                        class="mt-3 text-sm font-semibold text-white"
                                    >
                                        GIS Mapping
                                    </div>
                                    <div class="mt-1 text-xs text-white/50">
                                        Farms & parcels
                                    </div>
                                </div>

                                <div
                                    class="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                                >
                                    <UIcon
                                        name="i-lucide-sprout"
                                        class="size-5 text-emerald-200"
                                    />
                                    <div
                                        class="mt-3 text-sm font-semibold text-white"
                                    >
                                        Crop Monitoring
                                    </div>
                                    <div class="mt-1 text-xs text-white/50">
                                        Planting & harvests
                                    </div>
                                </div>

                                <div
                                    class="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                                >
                                    <UIcon
                                        name="i-lucide-chart-no-axes-combined"
                                        class="size-5 text-emerald-200"
                                    />
                                    <div
                                        class="mt-3 text-sm font-semibold text-white"
                                    >
                                        Analytics
                                    </div>
                                    <div class="mt-1 text-xs text-white/50">
                                        Reports & risks
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="hidden items-center justify-between border-t border-white/10 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 lg:flex"
                        >
                            <span>City Agriculture and Veterinary Office</span>
                            <span>San Fernando, Pampanga</span>
                        </div>
                    </div>
                </div>

                <!-- Login Panel -->
                <div
                    class="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10 xl:p-12"
                >
                    <div class="w-full max-w-md">
                        <!-- Mobile Logo -->
                        <div class="mb-7 flex items-center gap-3 lg:hidden">
                            <div
                                class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-emerald-950/10"
                            >
                                <img
                                    src="/animap.svg"
                                    alt="AniMap logo"
                                    class="size-11 shrink-0 object-cover"
                                />
                            </div>
                            <div>
                                <div
                                    class="text-lg font-extrabold tracking-[0.14em] text-slate-900"
                                >
                                    AniMap
                                </div>
                                <div class="text-xs text-slate-500">
                                    Agricultural Land Profiling System
                                </div>
                            </div>
                        </div>

                        <div class="mb-8">
                            <h2
                                class="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                Sign in to AniMap
                            </h2>

                            <p class="mt-2 text-sm leading-6 text-slate-500">
                                Use your authorized AniMap account.
                            </p>
                        </div>

                        <form class="space-y-5" @submit.prevent="handleSubmit">
                            <div>
                                <label
                                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    Username or Email
                                </label>

                                <div class="relative">
                                    <UIcon
                                        name="i-lucide-user-round"
                                        class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        v-model="identifier"
                                        type="text"
                                        autocomplete="username"
                                        placeholder="Enter your username or email"
                                        autofocus
                                        class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    Password
                                </label>

                                <div class="relative">
                                    <UIcon
                                        name="i-lucide-lock-keyhole"
                                        class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        v-model="password"
                                        :type="
                                            showPassword ? 'text' : 'password'
                                        "
                                        autocomplete="current-password"
                                        placeholder="Enter your password"
                                        class="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    />

                                    <button
                                        type="button"
                                        class="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
                                        :aria-label="
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        "
                                        @click="showPassword = !showPassword"
                                    >
                                        <UIcon
                                            :name="
                                                showPassword
                                                    ? 'i-lucide-eye-off'
                                                    : 'i-lucide-eye'
                                            "
                                            class="size-4"
                                        />
                                    </button>
                                </div>
                            </div>

                            <div
                                v-if="authError"
                                class="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                                role="alert"
                            >
                                <UIcon
                                    name="i-lucide-circle-alert"
                                    class="mt-0.5 size-4 shrink-0"
                                />
                                <span>{{ authError }}</span>
                            </div>

                            <button
                                type="submit"
                                class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(45,106,45,0.20)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_14px_30px_rgba(45,106,45,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                                :disabled="loading"
                            >
                                <UIcon
                                    v-if="loading"
                                    name="i-lucide-loader-2"
                                    class="size-4 animate-spin"
                                />
                                <UIcon
                                    v-else
                                    name="i-lucide-log-in"
                                    class="size-4"
                                />
                                {{ loading ? 'Signing in...' : 'Sign in' }}
                            </button>
                        </form>

                        <div
                            class="mt-7 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5"
                        >
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
                                >
                                    <UIcon
                                        name="i-lucide-shield-check"
                                        class="size-4"
                                    />
                                </div>

                                <div>
                                    <div
                                        class="text-sm font-semibold text-slate-700"
                                    >
                                        Protected access
                                    </div>
                                    <p
                                        class="mt-0.5 text-xs leading-5 text-slate-500"
                                    >
                                        Authorized personnel only. System
                                        activity may be logged for security and
                                        audit purposes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 text-center">
                            <div
                                class="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"
                            >
                                <span
                                    class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]"
                                />
                                System operational
                            </div>

                            <div
                                class="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400"
                            >
                                <span
                                    >© 2026 City of San Fernando, Pampanga</span
                                >
                                <span
                                    class="hidden size-1 rounded-full bg-slate-300 sm:inline-block"
                                />
                                <span
                                    class="rounded-full bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-500"
                                >
                                    v{{ appVersion }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
useHead({ title: 'Sign In' })

definePageMeta({ layout: false })

const auth = useAuth()
const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const authError = ref('')
const loading = ref(false)

const handleSubmit = async () => {
    loading.value = true
    authError.value = ''

    try {
        await auth.login(identifier.value, password.value)
        await navigateTo('/')
    } catch (error: any) {
        // The login route serializes failures as h3 errors with a
        // `statusMessage`; fall back to Strapi's direct error shape and a
        // generic message.
        authError.value =
            error?.data?.statusMessage ||
            error?.data?.error?.message ||
            error?.data?.message ||
            'Invalid username or password.'
    } finally {
        loading.value = false
    }
}
</script>
