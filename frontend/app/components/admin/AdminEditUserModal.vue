<script setup lang="ts">
/**
 * The edit-user modal. Role choices come from the parent's live role list so
 * the label always maps to the correct Strapi role id. When `locked` is set
 * (editing your own account, or the last active administrator) the role and
 * blocked controls are disabled to avoid locking everyone out of user
 * management; name, email and password stay editable.
 */
import type {
    AdminRole,
    AdminUser,
    RoleOption,
} from '~/utils/adminPresentation'
import { PASSWORD_MIN_LENGTH } from '~/utils/adminPresentation'

const props = defineProps<{
    show: boolean
    user: AdminUser | null
    roleOptions: RoleOption[]
    rolesReady: boolean
    locked?: boolean
    lockReason?: string
}>()

const emit = defineEmits<{
    close: []
    save: [
        payload: {
            id: number
            username?: string
            email?: string
            password?: string
            role: AdminRole
            blocked?: boolean
        },
    ]
}>()

const form = reactive({
    username: '',
    email: '',
    password: '',
    role: 'Authenticated' as AdminRole,
    blocked: false,
})

const formError = ref<string | null>(null)

watch(
    () => props.user,
    (user) => {
        if (!user) return
        form.username = user.name
        form.email = user.email
        form.password = ''
        // `Public` is not assignable; fall back to the default so the select
        // still renders a valid option for a legacy/mis-assigned row.
        form.role = (
            user.role === 'Public' ? 'Authenticated' : user.role
        ) as AdminRole
        form.blocked = user.status === 'Inactive'
        formError.value = null
    },
    { immediate: true }
)

function save() {
    if (!props.user) return
    formError.value = null

    if (!props.rolesReady) {
        formError.value =
            'Roles are still loading. Please try again in a moment.'
        return
    }

    if (form.password && form.password.length < PASSWORD_MIN_LENGTH) {
        formError.value = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
        return
    }

    const payload: {
        id: number
        username?: string
        email?: string
        password?: string
        role: AdminRole
        blocked?: boolean
    } = {
        id: props.user.id,
        username: form.username.trim() || props.user.name,
        email: form.email.trim() || props.user.email,
        role: props.locked
            ? ((props.user.role === 'Public'
                  ? 'Authenticated'
                  : props.user.role) as AdminRole)
            : form.role,
        blocked: props.locked ? props.user.status === 'Inactive' : form.blocked,
    }

    if (form.password) {
        payload.password = form.password
    }

    emit('save', payload)
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
                            <UIcon name="i-lucide-user-pen" class="size-5" />
                        </span>
                        <div>
                            <h3
                                class="text-xl font-bold tracking-tight text-slate-950"
                            >
                                Edit User
                            </h3>
                            <p class="text-sm text-slate-500">
                                Update user details, role and password.
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

                <form class="space-y-5" @submit.prevent="save">
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Full Name</label
                        >
                        <input
                            v-model="form.username"
                            type="text"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Email</label
                        >
                        <input
                            v-model="form.email"
                            type="email"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >Role</label
                            >
                            <select
                                v-model="form.role"
                                :disabled="locked || !rolesReady"
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
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >New Password (optional)</label
                            >
                            <input
                                v-model="form.password"
                                type="password"
                                :minlength="PASSWORD_MIN_LENGTH"
                                placeholder="Leave blank to keep"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>
                    <label
                        class="flex items-center gap-2 text-sm"
                        :class="locked ? 'text-slate-400' : 'text-slate-700'"
                    >
                        <input
                            type="checkbox"
                            v-model="form.blocked"
                            :disabled="locked"
                            class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
                        />
                        Blocked (Inactive)
                    </label>
                    <p
                        v-if="locked && lockReason"
                        class="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-700"
                    >
                        {{ lockReason }}
                    </p>
                    <p
                        v-if="formError"
                        class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
                    >
                        {{ formError }}
                    </p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            @click="emit('close')"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245524]"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
