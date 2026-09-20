<template>
    <main class="min-h-screen bg-gray-50">
        <div class="grid grid-cols-1 lg:grid-cols-12">
            <!-- Brand Panel -->
            <section
                class="relative hidden lg:block lg:col-span-7 min-h-screen overflow-hidden text-white bg-emerald-900"
            >
                <!-- Background Image -->
                <div
                    class="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style="
                        background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85');
                    "
                    aria-hidden="true"
                ></div>
                <!-- Gradient Overlay -->
                <div
                    class="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/80 to-emerald-800/65"
                    aria-hidden="true"
                ></div>

                <!-- Content -->
                <div
                    class="relative z-10 flex min-h-screen flex-col justify-between p-8 md:p-12 lg:p-16 xl:p-20"
                >
                    <!-- Brand Lockup -->
                    <header class="flex items-center gap-3.5">
                        <div
                            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm shadow-lg shadow-emerald-950/20"
                        >
                            <UIcon
                                name="i-lucide-leaf"
                                class="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <p
                                class="text-white text-lg font-extrabold tracking-widest leading-tight"
                            >
                                ALPS
                            </p>
                            <p
                                class="mt-1 text-white/70 text-xs font-semibold tracking-wide leading-snug"
                            >
                                Agricultural Land Profiling System
                            </p>
                        </div>
                    </header>

                    <!-- Message -->
                    <div
                        class="mx-auto mt-auto mb-auto w-full max-w-2xl text-left"
                    >
                        <p
                            class="flex items-center gap-2 mb-4 text-amber-400 text-xs font-extrabold tracking-widest uppercase"
                        >
                            <span
                                class="h-1 w-1 rounded-full bg-current shadow-[0_0_0_2px_rgba(245,201,93,0.18)]"
                            ></span>
                            City Agriculture Office
                        </p>
                        <h1
                            class="text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[0.98]"
                        >
                            See the land.<br /><em
                                class="text-emerald-50 not-italic"
                                >Grow the future.</em
                            >
                        </h1>
                        <p
                            class="mt-6 max-w-2xl text-white/80 text-base leading-relaxed"
                        >
                            A single source of truth for agricultural land
                            inventory, monitoring, and smarter decisions across
                            San Fernando, Pampanga.
                        </p>
                    </div>

                    <!-- Footer -->
                    <p
                        class="absolute right-8 bottom-6 text-white/45 text-[0.58rem] font-extrabold tracking-widest uppercase"
                    >
                        OFFICE OF THE CITY AGRICULTURE
                    </p>
                </div>
            </section>

            <!-- Form Panel -->
            <section
                class="col-span-12 lg:col-span-5 flex min-h-screen items-center justify-center p-6 md:p-10 lg:p-16 bg-gray-50"
            >
                <div class="w-full max-w-md">
                    <!-- Mobile Brand Lockup -->
                    <div class="flex items-center gap-3 mb-8 lg:hidden">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100"
                        >
                            <UIcon
                                name="i-lucide-leaf"
                                class="h-5 w-5 text-emerald-700"
                            />
                        </div>
                        <div>
                            <p
                                class="text-emerald-900 text-lg font-extrabold tracking-widest leading-tight"
                            >
                                ALPS
                            </p>
                            <p
                                class="mt-0.5 text-emerald-600 text-xs font-semibold tracking-wide leading-snug"
                            >
                                Agricultural Land Profiling System
                            </p>
                        </div>
                    </div>

                    <!-- Form Heading -->
                    <div class="mb-8">
                        <p
                            class="flex items-center gap-2 mb-2 text-emerald-700 text-xs font-extrabold tracking-widest uppercase text-left"
                        >
                            <span
                                class="h-1 w-1 rounded-full bg-current shadow-[0_0_0_2px_rgba(40,115,78,0.18)]"
                            ></span>
                            Secure access
                        </p>
                        <h2
                            class="text-emerald-950 text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.05]"
                        >
                            Welcome back
                        </h2>
                        <p
                            class="mt-2 text-emerald-600/80 text-sm leading-relaxed"
                        >
                            Sign in to continue to your agricultural dashboard.
                        </p>
                    </div>

                    <!-- Login Form -->
                    <form @submit.prevent="handleSubmit" class="space-y-5">
                        <UFormField label="Username" name="username">
                            <UInput
                                v-model="username"
                                class="w-full"
                                type="text"
                                placeholder="Enter your username"
                                icon="i-lucide-user-round"
                                size="xl"
                                autocomplete="username"
                                :class="{
                                    'border-emerald-300 bg-white/80 focus:border-emerald-500 focus:ring-emerald-500/20': true,
                                    'border-red-300 focus:border-red-500 focus:ring-red-500/20':
                                        authError && !username,
                                }"
                            />
                        </UFormField>

                        <UFormField label="Password" name="password">
                            <UInput
                                v-model="password"
                                class="w-full"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Enter your password"
                                icon="i-lucide-lock-keyhole"
                                size="xl"
                                autocomplete="current-password"
                                :class="{
                                    'border-emerald-300 bg-white/80 focus:border-emerald-500 focus:ring-emerald-500/20': true,
                                    'border-red-300 focus:border-red-500 focus:ring-red-500/20':
                                        authError && !password,
                                }"
                            >
                                <template #trailing>
                                    <button
                                        type="button"
                                        class="p-1 text-emerald-500/70 hover:text-emerald-700 transition-colors"
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
                                            class="h-4 w-4"
                                        />
                                    </button>
                                </template>
                            </UInput>
                        </UFormField>

                        <div class="flex items-center justify-between -mt-1">
                            <UCheckbox
                                v-model="rememberMe"
                                label="Keep me signed in"
                                color="emerald"
                            />
                            <a
                                href="#"
                                class="text-emerald-700 text-sm font-semibold no-underline hover:underline"
                                @click.prevent
                            >
                                Forgot password?
                            </a>
                        </div>

                        <UButton
                            type="submit"
                            block
                            size="xl"
                            color="emerald"
                            class="mt-1 shadow-lg shadow-emerald-600/20"
                        >
                            Sign in to ALPS
                        </UButton>

                        <p
                            v-if="authError"
                            class="flex items-center justify-center gap-2 text-red-600 text-sm"
                            role="alert"
                        >
                            <UIcon
                                name="i-lucide-circle-alert"
                                class="h-4 w-4 flex-shrink-0"
                            />
                            {{ authError }}
                        </p>

                        <p
                            v-if="isAuthenticated"
                            class="flex items-center justify-center gap-2 text-emerald-700 text-sm"
                            role="status"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="h-4 w-4 flex-shrink-0"
                            />
                            Access granted. Welcome to ALPS.
                        </p>
                    </form>

                    <!-- Form Footer -->
                    <div
                        class="mt-14 text-center text-emerald-600/60 text-xs leading-relaxed"
                    >
                        <div
                            class="flex items-center justify-center gap-2 mb-1.5 text-emerald-700 font-bold"
                        >
                            <span
                                class="h-1 w-1 rounded-full bg-emerald-600 shadow-[0_0_0_2px_rgba(78,175,110,0.14)]"
                            ></span>
                            System operational
                        </div>
                        <p class="mb-3">
                            Authorized personnel only. Activity is monitored and
                            protected.
                        </p>
                        <p class="text-emerald-400">
                            © 2026 City of San Fernando, Pampanga
                        </p>
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const authError = ref('')
const isAuthenticated = ref(false)

const handleSubmit = () => {
    authError.value = ''

    if (username.value.trim() === 'admin' && password.value === 'admin123') {
        isAuthenticated.value = true
        return
    }

    isAuthenticated.value = false
    authError.value = 'Invalid username or password.'
}
</script>
