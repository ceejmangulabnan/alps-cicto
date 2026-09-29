<script setup lang="ts">
import { getErrorStatus } from '~/composables/auth'
import type {
    RiskParcelStatus,
    RiskSeverity,
} from '~/composables/useFarmParcelApi'
import { statusClass, statusDot } from '~/utils/landStatus'
import { avatarColor, initials } from '~/utils/initials'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { getHubById } = useFarmParcelApi()

const parcelId = computed(() => {
    const raw = route.params.id
    return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
})

/**
 * `server: false` because the token only exists in localStorage after
 * hydration, so any server-phase fetch would go out unauthenticated and 403.
 * The `auth` middleware already redirects before this runs.
 */
const {
    data: parcel,
    pending,
    refresh,
} = await useAsyncData(
    () => `parcel-hub:${parcelId.value}`,
    async () => {
        if (!parcelId.value) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Parcel not found',
            })
        }

        let response
        try {
            response = await getHubById(parcelId.value)
        } catch (cause) {
            // Strapi answers an unknown documentId with 404, so that is the only
            // case that means "no such parcel". Anything else is a real failure
            // and must not be dressed up as a missing record.
            throw createError({
                statusCode: getErrorStatus(cause) === 404 ? 404 : 500,
                statusMessage: 'Parcel not found',
                cause,
            })
        }

        if (!response?.data) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Parcel not found',
            })
        }

        return response.data
    },
    { server: false }
)

const showEditModal = ref(false)
const showFarmersModal = ref(false)
const showPlantingModal = ref(false)
const showRiskModal = ref(false)
const showHarvestModal = ref(false)

/**
 * Every modal closes itself after a successful save; the hub's only job is to
 * refetch so the cards reflect what was just written.
 */
async function handleSaved() {
    await refresh()
}

const farm = computed(() => parcel.value?.farm ?? null)
const barangay = computed(() => farm.value?.barangay ?? null)
const farmers = computed(() => parcel.value?.farmers ?? [])
const cycle = computed(() => parcel.value?.planting_cycle ?? null)
const harvests = computed(() => cycle.value?.harvests ?? [])
const inspections = computed(() => parcel.value?.inspections ?? [])
const riskReports = computed(() => parcel.value?.risk_reports ?? [])

const mapEditLink = computed(() => ({
    path: '/map',
    query: { 'edit-parcel': parcelId.value },
}))

/**
 * Strapi `decimal` fields can arrive as a string, so coerce before formatting
 * or a populated card renders "NaN".
 */
const num = (value: number | string | null | undefined, digits = 2): string => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : '—'
}

/**
 * A Strapi `date` is a calendar date with no timezone, but `new Date('2026-03-14')`
 * resolves to UTC midnight — which renders as the day before for anyone at or
 * behind UTC. Date-only values are therefore split and formatted directly.
 */
const fmtDate = (value: string | null | undefined): string => {
    if (!value) return '—'

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (dateOnly) {
        const parsed = new Date(
            Number(dateOnly[1]),
            Number(dateOnly[2]) - 1,
            Number(dateOnly[3])
        )
        return Number.isNaN(parsed.getTime())
            ? '—'
            : parsed.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              })
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
        ? '—'
        : parsed.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
}

/**
 * Written out in full rather than composed at runtime: Tailwind only emits
 * classes it can see as literal strings in the source.
 */
const SEVERITY_CLASS: Record<RiskSeverity, string> = {
    Low: 'bg-green-50 text-green-700',
    Medium: 'bg-amber-50 text-amber-700',
    High: 'bg-orange-50 text-orange-700',
    Critical: 'bg-red-50 text-red-700',
}

const RISK_STATUS_CLASS: Record<RiskParcelStatus, string> = {
    Active: 'bg-red-50 text-red-700',
    Monitoring: 'bg-amber-50 text-amber-700',
    Resolved: 'bg-green-50 text-green-700',
}

const severityClass = (value: unknown) =>
    (SEVERITY_CLASS as Record<string, string>)[String(value)] ??
    'bg-gray-100 text-gray-600'

const riskStatusClass = (value: unknown) =>
    (RISK_STATUS_CLASS as Record<string, string>)[String(value)] ??
    'bg-gray-100 text-gray-600'

const cardTitle =
    'text-[10px] font-semibold uppercase tracking-wider text-gray-400'
const emptyText = 'text-xs text-gray-400'
</script>

<template>
    <div class="space-y-6 p-4 sm:p-6">
        <div v-if="pending && !parcel" class="space-y-4">
            <div class="h-8 w-48 animate-pulse rounded bg-gray-100" />
            <div class="h-24 animate-pulse rounded-lg bg-gray-100" />
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div
                    v-for="n in 6"
                    :key="n"
                    class="h-40 animate-pulse rounded-lg bg-gray-100"
                />
            </div>
        </div>

        <template v-else-if="parcel">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                    <NuxtLink
                        to="/farms"
                        class="mb-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                        <UIcon name="i-lucide-arrow-left" class="size-3" />
                        Back to registry
                    </NuxtLink>
                    <h1 class="text-2xl font-bold text-gray-900 md:text-3xl">
                        {{ parcel.parcel_code }}
                    </h1>
                    <p class="text-sm text-gray-500">
                        {{ farm?.name || farm?.farm_code || 'Unassigned farm' }}
                        <span v-if="barangay"> · {{ barangay.name }}</span>
                    </p>
                </div>
                <span
                    :class="statusClass(parcel.land_status)"
                    class="flex w-fit items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium"
                >
                    <span
                        class="size-1.5 rounded-full"
                        :style="{
                            backgroundColor: statusDot(parcel.land_status),
                        }"
                    />
                    {{ parcel.land_status }}
                </span>
            </div>

            <!-- Quick Actions -->
            <div class="alps-card p-4 sm:p-5">
                <div :class="cardTitle">Quick Actions</div>
                <div class="mt-3 flex flex-wrap gap-2">
                    <NuxtLink
                        :to="mapEditLink"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <UIcon name="i-lucide-map" class="size-3.5" />
                        Edit Plot on Map
                    </NuxtLink>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showEditModal = true"
                    >
                        <UIcon name="i-lucide-pencil" class="size-3.5" />
                        Edit Parcel Details
                    </button>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showFarmersModal = true"
                    >
                        <UIcon name="i-lucide-users" class="size-3.5" />
                        Update Tending Farmers
                    </button>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showPlantingModal = true"
                    >
                        <UIcon name="i-lucide-sprout" class="size-3.5" />
                        Log Planting Cycle
                    </button>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showRiskModal = true"
                    >
                        <UIcon
                            name="i-lucide-triangle-alert"
                            class="size-3.5"
                        />
                        Report Risk
                    </button>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        @click="showHarvestModal = true"
                    >
                        <UIcon name="i-lucide-wheat" class="size-3.5" />
                        Record Harvest
                    </button>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <!-- Plot Summary -->
                <div class="alps-card p-4 sm:p-5">
                    <div :class="cardTitle">Plot Summary</div>
                    <dl class="mt-3 space-y-2 text-xs">
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Parcel code</dt>
                            <dd class="font-mono text-gray-800">
                                {{ parcel.parcel_code }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Area</dt>
                            <dd class="font-mono text-gray-800">
                                {{ num(parcel.area_hectares) }} ha
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Current use</dt>
                            <dd class="text-right text-gray-800">
                                {{ parcel.current_use || '—' }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Status</dt>
                            <dd class="text-gray-800">
                                {{ parcel.land_status }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Parent Farm & Barangay -->
                <div class="alps-card p-4 sm:p-5">
                    <div :class="cardTitle">Parent Farm &amp; Barangay</div>
                    <div v-if="farm" class="mt-3 space-y-2 text-xs">
                        <div class="flex justify-between gap-3">
                            <dt class="shrink-0 text-gray-500">Farm</dt>
                            <dd class="truncate text-right text-gray-800">
                                {{ farm.name || farm.farm_code }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="shrink-0 text-gray-500">Farm code</dt>
                            <dd class="font-mono text-gray-800">
                                {{ farm.farm_code }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="shrink-0 text-gray-500">Barangay</dt>
                            <dd class="text-right text-gray-800">
                                {{ barangay?.name || '—' }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="shrink-0 text-gray-500">
                                Barangay code
                            </dt>
                            <dd class="font-mono text-gray-800">
                                {{ barangay?.code || '—' }}
                            </dd>
                        </div>
                    </div>
                    <p v-else :class="[emptyText, 'mt-3']">
                        This parcel is not linked to a farm yet.
                    </p>
                </div>

                <!-- Tending Farmers -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div :class="cardTitle">Tending Farmers</div>
                        <span
                            v-if="farmers.length"
                            class="text-xs text-gray-400"
                        >
                            {{ farmers.length }}
                        </span>
                    </div>
                    <ul v-if="farmers.length" class="mt-3 space-y-2">
                        <li
                            v-for="farmer in farmers"
                            :key="farmer.documentId"
                            class="flex items-center gap-2"
                        >
                            <span
                                class="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                :style="{
                                    backgroundColor: avatarColor(farmer.name),
                                }"
                            >
                                {{ initials(farmer.name) }}
                            </span>
                            <span class="min-w-0">
                                <span
                                    class="block truncate text-xs text-gray-800"
                                >
                                    {{ farmer.name }}
                                </span>
                                <span
                                    class="block font-mono text-[10px] text-gray-400"
                                >
                                    {{ farmer.farmer_code }}
                                </span>
                            </span>
                        </li>
                    </ul>
                    <p v-else :class="[emptyText, 'mt-3']">
                        No farmers assigned to this parcel.
                    </p>
                </div>

                <!-- Current Planting Cycle -->
                <div class="alps-card p-4 sm:p-5">
                    <div :class="cardTitle">Current Planting Cycle</div>
                    <dl v-if="cycle" class="mt-3 space-y-2 text-xs">
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Crop</dt>
                            <dd class="text-right text-gray-800">
                                {{ cycle.crop?.name || '—' }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Category</dt>
                            <dd class="text-right text-gray-800">
                                {{ cycle.crop?.category || '—' }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Variety</dt>
                            <dd class="text-right text-gray-800">
                                {{ cycle.variety || '—' }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Planted</dt>
                            <dd class="text-right text-gray-800">
                                {{ fmtDate(cycle.planting_date) }}
                            </dd>
                        </div>
                        <div class="flex justify-between gap-3">
                            <dt class="text-gray-500">Expected harvest</dt>
                            <dd class="text-right text-gray-800">
                                {{ fmtDate(cycle.expected_harvest) }}
                            </dd>
                        </div>
                    </dl>
                    <p v-else :class="[emptyText, 'mt-3']">
                        No planting cycle logged yet.
                    </p>
                </div>

                <!-- Current Cycle Harvests -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div :class="cardTitle">Current Cycle Harvests</div>
                        <span
                            v-if="harvests.length"
                            class="text-xs text-gray-400"
                        >
                            {{ harvests.length }}
                        </span>
                    </div>
                    <ul v-if="harvests.length" class="mt-3 space-y-3">
                        <li
                            v-for="harvest in harvests"
                            :key="harvest.documentId"
                            class="rounded-lg bg-gray-50 p-3 text-xs"
                        >
                            <div
                                class="flex items-center justify-between gap-2"
                            >
                                <span class="text-gray-500">
                                    {{ fmtDate(harvest.harvest_date) }}
                                </span>
                                <span class="font-mono text-gray-800">
                                    {{ num(harvest.production_kg, 1) }} kg
                                </span>
                            </div>
                            <div class="mt-1 text-gray-500">
                                Yield
                                {{ num(harvest.yield_per_hectare) }}
                                kg/ha
                            </div>
                        </li>
                    </ul>
                    <!--
                        Harvests hang off the planting cycle, so with no cycle
                        there is nothing to have harvested yet. The copy names the
                        cycle rather than the parcel to match that.
                    -->
                    <p v-else :class="[emptyText, 'mt-3']">
                        {{
                            cycle
                                ? 'No harvests recorded for this cycle yet.'
                                : 'No planting cycle logged yet.'
                        }}
                    </p>
                </div>

                <!-- Inspections -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div :class="cardTitle">Field Inspections</div>
                        <span
                            v-if="inspections.length"
                            class="text-xs text-gray-400"
                        >
                            {{ inspections.length }}
                        </span>
                    </div>
                    <ul v-if="inspections.length" class="mt-3 space-y-3">
                        <li
                            v-for="inspection in inspections"
                            :key="inspection.documentId"
                            class="rounded-lg bg-gray-50 p-3 text-xs"
                        >
                            <div
                                class="flex items-center justify-between gap-2"
                            >
                                <span class="font-medium text-gray-800">
                                    {{ inspection.condition || 'Inspected' }}
                                </span>
                                <span class="text-gray-500">
                                    {{ fmtDate(inspection.date) }}
                                </span>
                            </div>
                            <div
                                v-if="inspection.inspector"
                                class="mt-1 text-gray-500"
                            >
                                {{ inspection.inspector }}
                            </div>
                            <p
                                v-if="inspection.notes"
                                class="mt-1 text-gray-600"
                            >
                                {{ inspection.notes }}
                            </p>
                        </li>
                    </ul>
                    <p v-else :class="[emptyText, 'mt-3']">
                        No field inspections recorded yet.
                    </p>
                </div>

                <!-- Risk Reports -->
                <div class="alps-card p-4 sm:p-5 sm:col-span-2 xl:col-span-1">
                    <div class="flex items-center justify-between">
                        <div :class="cardTitle">Risk Reports</div>
                        <span
                            v-if="riskReports.length"
                            class="text-xs text-gray-400"
                        >
                            {{ riskReports.length }}
                        </span>
                    </div>
                    <ul v-if="riskReports.length" class="mt-3 space-y-3">
                        <li
                            v-for="report in riskReports"
                            :key="report.documentId"
                            class="rounded-lg bg-gray-50 p-3 text-xs"
                        >
                            <div
                                class="flex items-center justify-between gap-2"
                            >
                                <span class="font-medium text-gray-800">
                                    {{ report.risk_type || 'Risk report' }}
                                </span>
                                <span class="text-gray-500">
                                    {{ fmtDate(report.observed_at) }}
                                </span>
                            </div>
                            <div class="mt-2 flex flex-wrap gap-1.5">
                                <span
                                    v-if="report.parcel_status"
                                    :class="[
                                        riskStatusClass(report.parcel_status),
                                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                    ]"
                                >
                                    {{ report.parcel_status }}
                                </span>
                                <span
                                    v-if="report.severity"
                                    :class="[
                                        severityClass(report.severity),
                                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                    ]"
                                >
                                    {{ report.severity }}
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p v-else :class="[emptyText, 'mt-3']">
                        No risk reports filed for this parcel.
                    </p>
                </div>
            </div>

            <ParcelEditModal
                v-model="showEditModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelFarmersModal
                v-model="showFarmersModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelCycleModal
                v-model="showPlantingModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelRiskModal
                v-model="showRiskModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelHarvestModal
                v-model="showHarvestModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
        </template>
    </div>
</template>
