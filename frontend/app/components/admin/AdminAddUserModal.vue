<script setup lang="ts">
/**
 * The add-user modal. The form state lives here; submitting emits the
 * collected user (the page appends it to the registry) and resets the form,
 * and any dismissal path emits `close`.
 */
import type {
    AdminRole,
    AdminUserInput,
    AdminUserStatus,
} from '~/utils/adminPresentation'

const { show } = defineProps<{ show: boolean }>()

const emit = defineEmits<{
    add: [user: AdminUserInput]
    close: []
}>()

const userForm = reactive({
    name: '',
    email: '',
    role: 'Agriculture Technician',
    status: 'Active',
})

function addUser() {
    if (!userForm.name.trim() || !userForm.email.trim()) return

    emit('add', {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role as AdminRole,
        status: userForm.status as AdminUserStatus,
    })
    userForm.name = ''
    userForm.email = ''
    userForm.role = 'Agriculture Technician'
    userForm.status = 'Active'
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

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Role
                            </label>

                            <select
                                v-model="userForm.role"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option
                                    v-for="r in [
                                        'System Admin',
                                        'Agricultural Engineer',
                                        'Agriculture Technician',
                                        'Data Encoder',
                                    ]"
                                    :key="r"
                                    :value="r"
                                >
                                    {{ r }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Status
                            </label>

                            <select
                                v-model="userForm.status"
                                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

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
                            class="flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1f5125]"
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
