<template>
    <main class="login-shell">
        <section class="brand-panel">
            <div class="brand-panel__image" aria-hidden="true"></div>
            <div class="brand-panel__wash" aria-hidden="true"></div>

            <div class="brand-panel__content">
                <header class="brand-lockup">
                    <div class="brand-mark">
                        <UIcon name="i-lucide-leaf" class="size-6" />
                    </div>
                    <div>
                        <p class="brand-name">ALPS</p>
                        <p class="brand-subtitle">
                            Agricultural Land Profiling System
                        </p>
                    </div>
                </header>

                <div class="brand-panel__message">
                    <p class="eyebrow">City Agriculture Office</p>
                    <h1>See the land.<br /><em>Grow the future.</em></h1>
                    <p class="brand-description">
                        A single source of truth for agricultural land
                        inventory, monitoring, and smarter decisions across San
                        Fernando, Pampanga.
                    </p>
                </div>
            </div>

            <p class="brand-panel__footer">OFFICE OF THE CITY AGRICULTURE</p>
        </section>

        <section class="form-panel">
            <div class="form-panel__inner">
                <div class="mobile-brand-lockup">
                    <div class="brand-mark brand-mark--small">
                        <UIcon name="i-lucide-leaf" class="size-5" />
                    </div>
                    <div>
                        <p class="brand-name">ALPS</p>
                        <p class="brand-subtitle">
                            Agricultural Land Profiling System
                        </p>
                    </div>
                </div>

                <div class="form-heading">
                    <p class="form-kicker">Secure access</p>
                    <h2>Welcome back</h2>
                    <p>Sign in to continue to your agricultural dashboard.</p>
                </div>

                <form class="login-form" @submit.prevent="handleSubmit">
                    <UFormField label="Username or Email" name="identifier">
                        <UInput
                            v-model="identifier"
                            class="w-full"
                            type="text"
                            placeholder="Enter your username or email"
                            icon="i-lucide-user-round"
                            size="xl"
                            autocomplete="username"
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
                        >
                            <template #trailing>
                                <button
                                    type="button"
                                    class="password-toggle"
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
                            </template>
                        </UInput>
                    </UFormField>

                    <div class="form-options">
                        <UCheckbox
                            v-model="rememberMe"
                            label="Keep me signed in"
                        />
                        <a href="#" class="forgot-link" @click.prevent
                            >Forgot password?</a
                        >
                    </div>

                    <UButton
                        type="submit"
                        block
                        size="xl"
                        color="primary"
                        class="submit-button justify-center"
                        :loading="loading"
                    >
                        Sign in to ALPS
                    </UButton>

                    <p
                        v-if="authError"
                        class="form-feedback form-feedback--error"
                        role="alert"
                    >
                        <UIcon name="i-lucide-circle-alert" class="size-4" />
                        {{ authError }}
                    </p>
                </form>

                <div class="form-footer">
                    <div class="status-line">System operational</div>
                    <p>
                        Authorized personnel only. Activity is monitored and
                        protected.
                    </p>
                    <p class="copyright">
                        © 2026 City of San Fernando, Pampanga
                    </p>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: false })

const auth = useAuth()

const identifier = ref('')
const password = ref('')
const rememberMe = ref(false)
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
        authError.value =
            error?.data?.error?.message || 'Invalid username or password.'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(420px, 0.92fr) minmax(520px, 1.08fr);
    background: #f7f9f5;
}

.brand-panel {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    color: white;
    background: #164a32;
}

.brand-panel__image,
.brand-panel__wash {
    position: absolute;
    inset: 0;
}

.brand-panel__image {
    background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85');
    background-position: center;
    background-size: cover;
    filter: saturate(0.82);
}

.brand-panel__wash {
    background: linear-gradient(
        145deg,
        rgba(7, 44, 28, 0.96) 0%,
        rgba(12, 75, 45, 0.8) 48%,
        rgba(21, 68, 44, 0.64) 100%
    );
}

.brand-panel__content {
    position: relative;
    z-index: 1;
    display: flex;
    min-height: 100vh;
    flex-direction: column;
    justify-content: space-between;
    padding: clamp(2rem, 5vw, 4.5rem);
}

.brand-lockup,
.mobile-brand-lockup {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.brand-mark {
    display: grid;
    width: 3.2rem;
    height: 3.2rem;
    flex-shrink: 0;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.34);
    border-radius: 0.9rem;
    color: #fff;
    background: rgba(255, 255, 255, 0.14);
    box-shadow: 0 10px 22px rgba(3, 31, 20, 0.16);
}

.brand-name {
    margin: 0;
    color: #fff;
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    line-height: 1.1;
}

.brand-subtitle {
    margin: 0.3rem 0 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.67rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.3;
}

.brand-panel__message {
    width: 100%;
    max-width: 35rem;
    margin-top: auto;
    margin-bottom: auto;
    text-align: left;
}

.eyebrow,
.form-kicker {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    justify-content: flex-start;
    margin: 0 0 1rem;
    color: #f5c95d;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

.eyebrow span,
.status-line span {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 0 0.22rem rgba(245, 201, 93, 0.18);
}

.brand-panel h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(2.8rem, 4.6vw, 4.8rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 0.98;
}

.brand-panel h1 em {
    color: #e8f2d8;
    font-style: normal;
}

.brand-description {
    max-width: 32rem;
    margin: 1.65rem 0 0;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.98rem;
    line-height: 1.7;
}

.insight-strip {
    display: flex;
    align-items: center;
    max-width: 37rem;
    margin-top: 3.5rem;
    padding: 1.1rem 1.35rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 0.85rem;
    background: rgba(3, 35, 21, 0.25);
    backdrop-filter: blur(10px);
}

.insight-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    color: #f5c95d;
}

.insight-item div {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.insight-item strong {
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
}

.insight-item span {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.67rem;
}

.insight-divider {
    width: 1px;
    height: 2rem;
    margin: 0 1.4rem;
    background: rgba(255, 255, 255, 0.2);
}

.brand-panel__footer {
    position: absolute;
    right: clamp(2rem, 5vw, 4.5rem);
    bottom: 1.45rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.16em;
}

.form-panel {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 3rem clamp(2rem, 7vw, 8rem);
    background: #f7f9f5;
}

.form-panel__inner {
    width: 100%;
    max-width: 28rem;
}

.mobile-brand-lockup {
    display: none;
}

.form-heading {
    margin-bottom: 2rem;
}

.form-kicker {
    margin-bottom: 0.65rem;
    color: #28734e;
}

.form-heading h2 {
    margin: 0;
    color: #183328;
    font-size: clamp(2rem, 3vw, 2.65rem);
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1.05;
}

.form-heading > p:last-child {
    margin: 0.8rem 0 0;
    color: #69766d;
    font-size: 0.9rem;
    line-height: 1.6;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.35rem;
}

.login-form :deep(label) {
    color: #32463a;
    font-size: 0.78rem;
    font-weight: 700;
}

.login-form :deep(input) {
    border-color: #d8e1d8;
    background: rgba(255, 255, 255, 0.78);
    color: #183328 !important;
    caret-color: #28734e;
    box-shadow: 0 3px 9px rgba(33, 62, 43, 0.03);
}

.login-form :deep(input::placeholder) {
    color: #8b988f !important;
    opacity: 1;
}

.login-form :deep(input:focus) {
    border-color: #4c9c6b;
    box-shadow: 0 0 0 3px rgba(76, 156, 107, 0.15);
}

.password-toggle {
    display: grid;
    padding: 0.2rem;
    border: 0;
    color: #849289;
    cursor: pointer;
    place-items: center;
    background: transparent;
}

.password-toggle:hover {
    color: #28734e;
}

.form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: -0.35rem;
}

.form-options :deep(label) {
    color: #66756b;
    font-size: 0.76rem;
    font-weight: 500;
}

.forgot-link {
    color: #28734e;
    font-size: 0.76rem;
    font-weight: 700;
    text-decoration: none;
}

.forgot-link:hover {
    color: #164a32;
    text-decoration: underline;
}

.submit-button {
    margin-top: 0.25rem;
    box-shadow: 0 10px 18px rgba(36, 112, 73, 0.18);
}

.form-feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: -0.45rem 0 0;
    color: #28734e;
    font-size: 0.75rem;
}

.form-feedback--error {
    color: #c74b35;
}

.form-feedback--success {
    color: #28734e;
}

.form-footer {
    margin-top: 5.5rem;
    color: #8a978e;
    font-size: 0.67rem;
    line-height: 1.6;
    text-align: center;
}

.status-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    margin-bottom: 0.55rem;
    color: #548866;
    font-weight: 700;
}

.status-line span {
    width: 0.4rem;
    height: 0.4rem;
    color: #4eaf6e;
    box-shadow: 0 0 0 0.2rem rgba(78, 175, 110, 0.14);
}

.form-footer p {
    margin: 0;
}

.copyright {
    margin-top: 1.15rem !important;
    color: #a6afa8;
}

@media (max-width: 900px) {
    .login-shell {
        display: block;
    }

    .brand-panel {
        min-height: 23rem;
    }

    .brand-panel__content {
        min-height: 23rem;
        padding: 2rem;
    }

    .brand-panel__message {
        padding-top: 3rem;
    }

    .brand-panel h1 {
        font-size: clamp(2.5rem, 9vw, 4rem);
    }

    .brand-description,
    .insight-strip,
    .brand-panel__footer {
        display: none;
    }

    .form-panel {
        min-height: calc(100vh - 23rem);
        padding: 3.5rem 2rem;
    }
}

@media (max-width: 520px) {
    .brand-panel {
        min-height: 15rem;
    }

    .brand-panel__content {
        min-height: 15rem;
        padding: 1.5rem;
    }

    .brand-lockup,
    .brand-panel__message {
        display: none;
    }

    .mobile-brand-lockup {
        display: flex;
        margin-bottom: 2.5rem;
    }

    .brand-mark--small {
        width: 2.6rem;
        height: 2.6rem;
        border-color: #cdded0;
        color: #fff;
        background: #e8f2e8;
    }

    .mobile-brand-lockup .brand-name {
        color: #183328;
    }

    .mobile-brand-lockup .brand-subtitle {
        color: #77847a;
    }

    .form-panel {
        display: block;
        min-height: calc(100vh - 15rem);
        padding: 2.5rem 1.5rem;
    }

    .form-heading {
        margin-bottom: 1.75rem;
    }

    .form-footer {
        margin-top: 4rem;
    }
}
</style>
