<script setup lang="ts">
/**
 * The add-user modal. The form state lives here; submitting emits the
 * collected user (the page persists it via the Users API) and resets the
 * form, and any dismissal path emits `close`.
 *
 * Role choices come from the live role list (`roleOptions`) so a label can
 * never map to the wrong Strapi role id, and the form stays disabled until
 * that list has loaded.
 */
import type {
    AdminRole,
    AdminUserInput,
    RoleOption,
} from '~/utils/adminPresentation'
import { PASSWORD_MIN_LENGTH } from '~/utils/adminPresentation'

const props = defineProps<{
    show: boolean
    roleOptions: RoleOption[]
    rolesReady: boolean
    rolesLoading?: boolean
    rolesError?: string | null
}>()

const emit = defineEmits<{
    add: [user: AdminUserInput]
    close: []
}>()

const userForm = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Authenticated' as AdminRole,
})

const formError = ref<string | null>(null)

// Keep the selected role valid as the live role list arrives (or changes).
watch(
    () => props.roleOptions,
    (options) => {
        if (options.length === 0) return
        if (!options.some((o) => o.label === userForm.role)) {
            userForm.role = options[0]!.label
        }
    },
    { immediate: true }
)

function reset() {
    userForm.name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.confirmPassword = ''
    userForm.role = props.roleOptions[0]?.label ?? 'Authenticated'
    formError.value = null
}

function addUser() {
    formError.value = null

    if (!props.rolesReady) {
        formError.value =
            'Roles are still loading. Please try again in a moment.'
        return
    }

    if (!userForm.name.trim() || !userForm.email.trim()) {
        formError.value = 'Full name and email are required.'
        return
    }

    if (userForm.password.length < PASSWORD_MIN_LENGTH) {
        formError.value = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
        return
    }

    if (userForm.password !== userForm.confirmPassword) {
        formError.value = 'Passwords do not match.'
        return
    }

    emit('add', {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
    })
    reset()
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white p-6 font-sans shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 sm:p-7"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e0f0fb] text-[#1d6ab3] ring-1 ring-blue-100"
                        >
                            <UIcon name="i-lucide-user-plus" class="size-5" />
                        </span>

                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Add User
                            </h3>
                            <p class="text-sm text-slate-500">
                                Register a new system user account.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        @click="emit('close')"
                    >
                        <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                </div>

                <form class="space-y-5" @submit.prevent="addUser">
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Full Name
                        </label>
                        <input
                            v-model="userForm.name"
                            type="text"
                            required
                            placeholder="e.g. Agri. Ana Fernandez"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Email
                        </label>
                        <input
                            v-model="userForm.email"
                            type="email"
                            required
                            placeholder="name@sanfernando.gov.ph"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>

                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Role
                        </label>

                        <select
                            v-model="userForm.role"
                            :disabled="!rolesReady"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option
                                v-for="option in roleOptions"
                                :key="option.id"
                                :value="option.label"
                            >
                                {{ option.label }}
                            </option>
                        </select>

                        <p
                            v-if="rolesError"
                            class="mt-1.5 text-xs font-medium text-red-600"
                        >
                            {{ rolesError }}
                        </p>
                        <p
                            v-else-if="rolesLoading || !rolesReady"
                            class="mt-1.5 text-xs text-slate-400"
                        >
                            Loading available roles…
                        </p>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Password
                            </label>
                            <input
                                v-model="userForm.password"
                                type="password"
                                required
                                :minlength="PASSWORD_MIN_LENGTH"
                                placeholder="Set a password"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Confirm Password
                            </label>
                            <input
                                v-model="userForm.confirmPassword"
                                type="password"
                                required
                                placeholder="Repeat password"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    <p class="text-xs text-slate-400">
                        Use at least {{ PASSWORD_MIN_LENGTH }} characters.
                    </p>

                    <p
                        v-if="formError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
                    >
                        {{ formError }}
                    </p>

                    <div
                        class="flex justify-end gap-2 border-t border-slate-100 pt-5"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            @click="emit('close')"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            :disabled="!rolesReady"
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <UIcon name="i-lucide-user-plus" class="size-4" />
                            Add User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
