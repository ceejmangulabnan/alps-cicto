<script setup lang="ts">
/**
 * Farmers registry page. All farmer state and flows live in
 * `useFarmersRegistry`; this page orchestrates the shared `FarmersTable`
 * list, the farmer detail view, and the register / edit / assistance modals.
 */
import {
    ASSISTANCE_STATUS_DOT,
    ASSISTANCE_STATUS_STYLE,
    peso,
} from '~/utils/assistanceStatus'


const route = useRoute()

const {
    farmers,
    loading,
    loadError,
    search,
    filterBarangay,
    filtered,
    summaryCards,
    barangaysByParcels,
    areaByFarmer,
    farmerBarangay,
    selectedFarmer,
    selectedFarmerParcels,
    profileFields,
    detailStats,
    selectedFarmerAssistance,
    selectedFarmerAssistanceTotal,
    registerForm,
    registering,
    registerError,
    submitRegister,
    showRegisterModal,
    showEditModal,
    editing,
    editError,
    editForm,
    openEditModal,
    submitEdit,
    showAssistModal,
    recordingAssist,
    assistError,
    assistForm,
    assistanceProgramOptions,
    barangays,
    canRecordAssist,
    openAssistModal,
    closeAssistModal,
    submitAssist,
    loadFarmers,
    backToRegistry,
    openFromQuery,
} = useFarmersRegistry()

onMounted(async () => {
    await loadFarmers()
    openFromQuery(route.query.farmer)
})
</script>

<template>
    <!-- Farmer Detail View -->
    <div
        v-if="selectedFarmer"
        class="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <!-- Back -->
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700"
                @click="backToRegistry"
            >
                <UIcon name="i-lucide-arrow-left" class="size-4" />
                Back to Farmers Registry
            </button>

            <!-- Profile Hero -->
            <div
                class="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-linear-to-r from-white via-white to-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7"
            >
                <div
                    class="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div
                    class="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between"
                >
                    <div class="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row">
                        <div
                            class="flex size-20 shrink-0 items-center justify-center rounded-3xl text-2xl font-extrabold text-white shadow-[0_12px_30px_rgba(15,23,42,0.15)] ring-4 ring-white"
                            :style="{
                                backgroundColor: farmerAvatarColor(
                                    selectedFarmer.name
                                ),
                            }"
                        >
                            {{ farmerInitials(selectedFarmer.name) }}
                        </div>

                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-emerald-500"
                                    />
                                    Farmer Profile
                                </span>

                                <span
                                    class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                                    :class="
                                        selectedFarmer.farmer_status ===
                                        'Active'
                                            ? 'bg-green-50 text-green-700 ring-green-100'
                                            : selectedFarmer.farmer_status ===
                                                'Inactive'
                                              ? 'bg-slate-100 text-slate-600 ring-slate-200'
                                              : 'bg-amber-50 text-amber-700 ring-amber-100'
                                    "
                                >
                                    <span
                                        class="size-1.5 rounded-full"
                                        :class="
                                            selectedFarmer.farmer_status ===
                                            'Active'
                                                ? 'bg-green-500'
                                                : selectedFarmer.farmer_status ===
                                                    'Inactive'
                                                  ? 'bg-slate-400'
                                                  : 'bg-amber-500'
                                        "
                                    />
                                    {{ selectedFarmer.farmer_status }}
                                </span>
                            </div>

                            <h1
                                class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                            >
                                {{ selectedFarmer.name }}
                            </h1>

                            <div
                                class="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500"
                            >
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600"
                                >
                                    <UIcon
                                        name="i-lucide-badge-check"
                                        class="size-3.5"
                                    />
                                    {{ selectedFarmer.farmer_code }}
                                </span>

                                <span class="inline-flex items-center gap-1.5">
                                    <UIcon
                                        name="i-lucide-map-pin"
                                        class="size-4 text-slate-400"
                                    />
                                    {{ farmerBarangay(selectedFarmer) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <button
                            type="button"
                            class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            @click="openEditModal(selectedFarmer)"
                        >
                            <UIcon name="i-lucide-pencil" class="size-4" />
                            Edit Profile
                        </button>

                        <button
                            type="button"
                            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_8px_20px_rgba(45,106,45,0.28)]"
                            @click="openAssistModal(selectedFarmer)"
                        >
                            <UIcon name="i-lucide-hand-heart" class="size-4" />
                            Add Assistance
                        </button>
                    </div>
                </div>

                <div
                    class="relative mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div
                        v-for="field in profileFields"
                        :key="field.label"
                        class="rounded-2xl border border-slate-100 bg-white/70 p-4"
                    >
                        <div
                            class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
                        >
                            <UIcon
                                :name="field.icon"
                                class="size-3.5 text-emerald-600"
                            />
                            {{ field.label }}
                        </div>

                        <div class="text-sm font-semibold text-slate-800">
                            {{ field.val }}
                        </div>
                    </div>

                    <div
                        class="rounded-2xl border border-slate-100 bg-white/70 p-4"
                    >
                        <div
                            class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
                        >
                            <UIcon
                                name="i-lucide-phone"
                                class="size-3.5 text-emerald-600"
                            />
                            Contact
                        </div>

                        <div class="text-sm font-semibold text-slate-800">
                            {{ selectedFarmer.contact || 'Not provided' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="stat in detailStats"
                    :key="stat.label"
                    class="group relative min-h-47.5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:p-6"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${stat.color}, ${stat.color}55, transparent)`,
                        }"
                    />

                    <div
                        class="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full opacity-[0.10] blur-2xl transition-transform duration-500 group-hover:scale-125"
                        :style="{ backgroundColor: stat.color }"
                    />

                    <div class="relative flex h-full flex-col">
                        <div class="flex items-start justify-between">
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5"
                                :style="{ background: stat.bg }"
                            >
                                <UIcon
                                    :name="stat.icon"
                                    class="size-5"
                                    :style="{ color: stat.color }"
                                />
                            </div>

                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ring-1 ring-slate-100"
                            >
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{ backgroundColor: stat.color }"
                                />
                                Live
                            </span>
                        </div>

                        <div class="mt-5">
                            <div
                                class="text-3xl font-bold tracking-tight text-slate-950"
                            >
                                {{ stat.val }}
                            </div>
                            <div
                                class="mt-1 text-sm font-semibold text-slate-700"
                            >
                                {{ stat.label }}
                            </div>
                        </div>

                        <div
                            class="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400"
                        >
                            {{
                                stat.label === 'Total Parcels'
                                    ? 'Parcels assigned to this farmer'
                                    : stat.label === 'Total Area'
                                      ? 'Combined registered area'
                                      : stat.label === 'Cultivated Parcels'
                                        ? 'Currently cultivated parcels'
                                        : 'Parcels requiring attention'
                            }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Detail Grid -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Parcels -->
                <section
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] xl:col-span-7"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#2d6a2d] ring-1 ring-emerald-100"
                            >
                                <UIcon
                                    name="i-lucide-layers"
                                    class="size-4.5"
                                />
                            </div>

                            <div>
                                <h2
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Registered Parcels
                                </h2>
                                <p class="text-xs text-slate-500 sm:text-sm">
                                    Land assignments and current parcel use.
                                </p>
                            </div>
                        </div>

                        <span
                            class="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        >
                            {{ selectedFarmerParcels.length }} records
                        </span>
                    </div>

                    <div
                        v-if="selectedFarmerParcels.length === 0"
                        class="flex flex-col items-center justify-center px-6 py-14 text-center"
                    >
                        <div
                            class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                        >
                            <UIcon name="i-lucide-layers" class="size-6" />
                        </div>
                        <div class="text-base font-semibold text-slate-700">
                            No parcels registered
                        </div>
                        <p class="mt-1 max-w-sm text-sm text-slate-400">
                            This farmer has no parcel assignments yet.
                        </p>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="w-full min-w-175 text-sm">
                            <thead
                                class="border-b border-slate-100 bg-slate-50/70"
                            >
                                <tr
                                    class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    <th class="px-5 py-3.5 text-left">
                                        Parcel Code
                                    </th>
                                    <th class="px-5 py-3.5 text-left">
                                        Barangay
                                    </th>
                                    <th class="px-5 py-3.5 text-right">
                                        Area (ha)
                                    </th>
                                    <th class="px-5 py-3.5 text-left">
                                        Land Status
                                    </th>
                                    <th class="px-5 py-3.5 text-left">
                                        Current Use
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    v-for="p in selectedFarmerParcels"
                                    :key="p.parcel_code"
                                    class="border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/40"
                                >
                                    <td class="px-5 py-4">
                                        <NuxtLink
                                            :to="`/parcels/${p.parcel_code}`"
                                            class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            {{ p.parcel_code }}
                                            <UIcon
                                                name="i-lucide-arrow-up-right"
                                                class="size-3"
                                            />
                                        </NuxtLink>
                                    </td>

                                    <td class="px-5 py-4 text-slate-600">
                                        <span class="flex items-center gap-1.5">
                                            <UIcon
                                                name="i-lucide-map-pin"
                                                class="size-3.5 text-slate-400"
                                            />
                                            {{ p.barangay }}
                                        </span>
                                    </td>

                                    <td
                                        class="px-5 py-4 text-right font-mono font-semibold text-slate-800"
                                    >
                                        {{ Number(p.area_hectares).toFixed(2) }}
                                    </td>

                                    <td class="px-5 py-4">
                                        <span
                                            :class="
                                                farmerParcelStatusClass(
                                                    p.land_status
                                                )
                                            "
                                            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                        >
                                            {{ p.land_status }}
                                        </span>
                                    </td>

                                    <td class="px-5 py-4 text-slate-600">
                                        {{ p.current_use ?? '—' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Assistance -->
                <section
                    class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] xl:col-span-5"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                            >
                                <UIcon
                                    name="i-lucide-hand-heart"
                                    class="size-4.5"
                                />
                            </div>

                            <div>
                                <h2
                                    class="text-base font-bold tracking-tight text-slate-800"
                                >
                                    Assistance Received
                                </h2>
                                <p class="text-xs text-slate-500 sm:text-sm">
                                    Program support and release history.
                                </p>
                            </div>
                        </div>

                        <div
                            v-if="selectedFarmerAssistance.length > 0"
                            class="text-right"
                        >
                            <div class="text-sm font-bold text-emerald-700">
                                {{ peso(selectedFarmerAssistanceTotal) }}
                            </div>
                            <div class="text-xs text-slate-400">
                                {{ selectedFarmerAssistance.length }} record(s)
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="selectedFarmerAssistance.length === 0"
                        class="flex flex-col items-center justify-center px-6 py-14 text-center"
                    >
                        <div
                            class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-300"
                        >
                            <UIcon name="i-lucide-hand-heart" class="size-6" />
                        </div>
                        <div class="text-base font-semibold text-slate-700">
                            No assistance recorded
                        </div>
                        <p class="mt-1 max-w-sm text-sm text-slate-400">
                            Assistance released to this farmer will appear here.
                        </p>
                    </div>

                    <div
                        v-else
                        class="max-h-107.5 divide-y divide-slate-100 overflow-y-auto"
                    >
                        <div
                            v-for="a in selectedFarmerAssistance"
                            :key="a.documentId"
                            class="p-5 transition-colors hover:bg-emerald-50/30"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <div
                                        class="flex flex-wrap items-center gap-2"
                                    >
                                        <span
                                            class="font-mono text-xs font-semibold text-slate-400"
                                        >
                                            {{ a.reference_code || '—' }}
                                        </span>

                                        <span
                                            :class="
                                                ASSISTANCE_STATUS_STYLE[
                                                    a.status ?? 'Scheduled'
                                                ]
                                            "
                                            class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                                        >
                                            <span
                                                class="size-1.5 rounded-full"
                                                :style="{
                                                    background:
                                                        ASSISTANCE_STATUS_DOT[
                                                            a.status ??
                                                                'Scheduled'
                                                        ],
                                                }"
                                            />
                                            {{ a.status ?? '—' }}
                                        </span>
                                    </div>

                                    <div
                                        class="mt-2 text-sm font-semibold text-slate-800"
                                    >
                                        {{ a.program }}
                                    </div>

                                    <p
                                        v-if="a.items"
                                        class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500"
                                        :title="a.items"
                                    >
                                        {{ a.items }}
                                    </p>
                                </div>

                                <div
                                    class="shrink-0 text-right font-mono text-sm font-bold text-emerald-700"
                                >
                                    {{ peso(a.value) }}
                                </div>
                            </div>

                            <div
                                class="mt-3 flex items-center gap-1.5 text-xs text-slate-400"
                            >
                                <UIcon
                                    name="i-lucide-calendar"
                                    class="size-3.5"
                                />
                                {{ a.date ?? '—' }}
                            </div>
                        </div>
                    </div>

                    <div
                        class="border-t border-slate-100 bg-slate-50/60 px-5 py-4"
                    >
                        <button
                            type="button"
                            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1f5125]"
                            @click="openAssistModal(selectedFarmer)"
                        >
                            <UIcon name="i-lucide-plus" class="size-4" />
                            Record Assistance
                        </button>
                    </div>
                </section>
            </div>
        </div>
    </div>

    <FarmersTable
        v-else
        v-model:search="search"
        v-model:filterBarangay="filterBarangay"
        :barangay-options="barangaysByParcels"
        :rows="filtered"
        :total="farmers.length"
        :summary-cards="summaryCards"
        :loading="loading"
        :load-error="loadError"
        :area-by-farmer="areaByFarmer"
        :farmer-barangay="farmerBarangay"
        @select="selectedFarmer = $event"
        @register="showRegisterModal = true"
        @retry="loadFarmers"
    />

    <FarmersRegisterModal
        :show="showRegisterModal"
        :form="registerForm"
        :submitting="registering"
        :error="registerError"
        @submit="submitRegister"
        @cancel="showRegisterModal = false"
    />

    <FarmersEditModal
        :show="showEditModal"
        :form="editForm"
        :submitting="editing"
        :error="editError"
        :barangays="barangays"
        @submit="submitEdit"
        @cancel="showEditModal = false"
    />

    <FarmersAssistanceModal
        :show="showAssistModal"
        :form="assistForm"
        :farmer="selectedFarmer"
        :program-options="assistanceProgramOptions"
        :barangays="barangays"
        :submitting="recordingAssist"
        :error="assistError"
        :can-submit="canRecordAssist"
        @submit="submitAssist"
        @cancel="closeAssistModal"
    />
</template>
