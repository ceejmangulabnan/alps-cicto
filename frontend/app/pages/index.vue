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

definePageMeta({ middleware: 'auth' })

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
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="w-full">
            <button
                type="button"
                class="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                @click="backToRegistry"
            >
                <UIcon name="i-lucide-arrow-left" class="size-3.5" />
                Back to Farmers Registry
            </button>

            <!-- Profile Header -->
            <div
                class="relative mb-6 overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-white to-emerald-50/60 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.07)] ring-1 ring-white/80 sm:p-7"
            >
                <div class="flex flex-col items-start gap-5 sm:flex-row">
                    <div
                        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#5cba5c] via-[#3d9948] to-[#246c31] text-2xl font-extrabold text-white shadow-[0_12px_30px_rgba(45,106,45,0.25)] ring-4 ring-emerald-50"
                    >
                        {{ farmerInitials(selectedFarmer.name) }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div>
                                <div
                                    class="flex flex-col gap-3 sm:flex-row sm:items-center"
                                >
                                    <h2
                                        class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                                    >
                                        {{ selectedFarmer.name }}
                                    </h2>
                                    <span
                                        class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                                        :class="
                                            selectedFarmer.farmer_status ===
                                            'Active'
                                                ? 'bg-green-50 text-green-700 ring-green-100'
                                                : selectedFarmer.farmer_status ===
                                                    'Inactive'
                                                  ? 'bg-gray-50 text-gray-600 ring-gray-200'
                                                  : 'bg-amber-50 text-amber-700 ring-amber-100'
                                        "
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :class="
                                                selectedFarmer.farmer_status ===
                                                'Active'
                                                    ? 'bg-green-500'
                                                    : selectedFarmer.farmer_status ===
                                                        'Inactive'
                                                      ? 'bg-gray-400'
                                                      : 'bg-amber-500'
                                            "
                                        ></span>
                                        {{ selectedFarmer.farmer_status }}
                                    </span>
                                </div>
                                <div class="mt-1 flex items-center gap-3">
                                    <span
                                        class="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-600"
                                    >
                                        {{ selectedFarmer.farmer_code }}
                                    </span>
                                    <span class="text-sm text-slate-500">
                                        {{ farmerBarangay(selectedFarmer) }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                                    @click="openEditModal(selectedFarmer)"
                                >
                                    <UIcon
                                        name="i-lucide-pencil"
                                        class="size-4"
                                    />
                                    Edit Profile
                                </button>
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(45,106,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f5125] hover:shadow-[0_8px_20px_rgba(45,106,45,0.28)]"
                                    @click="openAssistModal(selectedFarmer)"
                                >
                                    <UIcon
                                        name="i-lucide-hand-heart"
                                        class="size-4"
                                    />
                                    Add Assistance
                                </button>
                            </div>
                        </div>
                        <div
                            class="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <div
                                v-for="field in profileFields"
                                :key="field.label"
                                class="text-sm"
                            >
                                <div
                                    class="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
                                >
                                    {{ field.label }}
                                </div>
                                <div
                                    class="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                                >
                                    <UIcon
                                        :name="field.icon"
                                        class="size-2.75 text-gray-400"
                                    />
                                    {{ field.val }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div
                class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                <div
                    v-for="stat in detailStats"
                    :key="stat.label"
                    class="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)]"
                >
                    <div
                        class="absolute inset-x-0 top-0 h-1 opacity-80"
                        :style="{
                            backgroundImage: `linear-gradient(90deg, ${stat.color}, transparent)`,
                        }"
                    />
                    <div
                        class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105"
                        :style="{ background: stat.bg }"
                    >
                        <UIcon
                            :name="stat.icon"
                            class="size-4"
                            :style="{ color: stat.color }"
                        />
                    </div>
                    <div
                        class="text-3xl font-bold tracking-tight text-slate-950"
                    >
                        {{ stat.val }}
                    </div>
                    <div class="text-sm font-medium text-slate-500">
                        {{ stat.label }}
                    </div>
                </div>
            </div>

            <!-- Parcels -->
            <div
                class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]"
            >
                <h3
                    class="border-b border-slate-100 px-6 py-5 text-base font-bold tracking-tight text-slate-800"
                >
                    Registered Parcels
                </h3>
                <div
                    v-if="selectedFarmerParcels.length === 0"
                    class="px-6 py-12 text-center text-sm text-slate-400"
                >
                    No parcels registered for this farmer.
                </div>
                <div v-else class="overflow-x-auto px-2 pb-2">
                    <table class="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr
                                class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400"
                            >
                                <th class="pb-2 text-left font-medium">
                                    Parcel Code
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Barangay
                                </th>
                                <th class="pb-2 text-right font-medium">
                                    Area (ha)
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Land Status
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Current Use
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="p in selectedFarmerParcels"
                                :key="p.parcel_code"
                                class="border-b border-slate-100 last:border-0 transition-colors hover:bg-emerald-50/40"
                            >
                                <td
                                    class="px-4 py-3.5 font-mono font-semibold text-slate-700"
                                >
                                    {{ p.parcel_code }}
                                </td>
                                <td class="px-4 py-3.5 text-slate-600">
                                    {{ p.barangay }}
                                </td>
                                <td
                                    class="px-4 py-3.5 text-right font-mono font-semibold text-slate-700"
                                >
                                    {{ p.area_hectares }}
                                </td>
                                <td class="px-4 py-3.5">
                                    <span
                                        :class="
                                            farmerParcelStatusClass(
                                                p.land_status
                                            )
                                        "
                                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                    >
                                        {{ p.land_status }}
                                    </span>
                                </td>
                                <td class="px-4 py-3.5 text-slate-600">
                                    {{ p.current_use ?? '—' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Assistance -->
            <div
                class="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
                <div
                    class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5"
                >
                    <h3
                        class="flex items-center gap-2 text-base font-bold tracking-tight text-slate-800"
                    >
                        <UIcon
                            name="i-lucide-hand-heart"
                            class="size-3.5 text-gray-400"
                        />
                        Assistance Received
                    </h3>
                    <span
                        v-if="selectedFarmerAssistance.length > 0"
                        class="text-xs text-slate-400"
                    >
                        {{ selectedFarmerAssistance.length }} record(s) ·
                        {{ peso(selectedFarmerAssistanceTotal) }} total
                    </span>
                </div>
                <div
                    v-if="selectedFarmerAssistance.length === 0"
                    class="px-6 py-12 text-center text-sm text-slate-400"
                >
                    No assistance recorded for this farmer yet.
                </div>
                <div v-else class="overflow-x-auto px-2 pb-2">
                    <table class="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr
                                class="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400"
                            >
                                <th class="pb-2 text-left font-medium">Ref</th>
                                <th class="pb-2 text-left font-medium">
                                    Program
                                </th>
                                <th class="pb-2 text-left font-medium">Date</th>
                                <th class="pb-2 text-right font-medium">
                                    Value
                                </th>
                                <th class="pb-2 text-left font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="a in selectedFarmerAssistance"
                                :key="a.documentId"
                                class="border-b border-slate-100 last:border-0 transition-colors hover:bg-emerald-50/40"
                            >
                                <td class="py-2.5 font-mono text-gray-400">
                                    {{ a.reference_code || '—' }}
                                </td>
                                <td class="px-4 py-3.5">
                                    <div
                                        class="font-medium text-slate-800"
                                        :title="a.program"
                                    >
                                        {{ a.program }}
                                    </div>
                                    <!-- Items are free text and often long, so they
                                         sit under the program rather than taking a
                                         column that would force a scrollbar. -->
                                    <div
                                        v-if="a.items"
                                        class="mt-0.5 max-w-xs truncate text-[10px] text-gray-400"
                                        :title="a.items"
                                    >
                                        {{ a.items }}
                                    </div>
                                </td>
                                <td class="py-2.5 text-gray-500">
                                    <span class="flex items-center gap-1.5">
                                        <UIcon
                                            name="i-lucide-calendar"
                                            class="size-[10px] text-gray-400"
                                        />
                                        {{ a.date ?? '—' }}
                                    </span>
                                </td>
                                <td
                                    class="py-2.5 text-right font-mono font-medium text-green-700"
                                >
                                    {{ peso(a.value) }}
                                </td>
                                <td class="py-2.5 text-gray-500">
                                    <span
                                        :class="
                                            ASSISTANCE_STATUS_STYLE[
                                                a.status ?? 'Scheduled'
                                            ]
                                        "
                                        class="flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        <span
                                            class="h-1.5 w-1.5 rounded-full"
                                            :style="{
                                                background:
                                                    ASSISTANCE_STATUS_DOT[
                                                        a.status ?? 'Scheduled'
                                                    ],
                                            }"
                                        />
                                        {{ a.status ?? '—' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
