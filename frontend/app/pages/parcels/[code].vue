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
const { getHubByCode } = useFarmParcelApi()

/**
 * Parcel codes are uppercase in the data model (`PLC-2026-0001`); normalise
 * whatever was typed so a lowercase or padded route still resolves.
 */
const parcelCode = computed(() => {
    const raw = route.params.code
    const value = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
    return value.trim().toUpperCase()
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
    () => `parcel-hub:${parcelCode.value}`,
    async () => {
        if (!parcelCode.value) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Parcel not found',
            })
        }

        let found
        try {
            found = await getHubByCode(parcelCode.value)
        } catch (cause) {
            // A code lookup never draws a 404 from Strapi (unknown codes answer
            // with an empty list), but keep the branch uniform: any other
            // failure is a real error and must not be dressed up as a missing
            // record.
            throw createError({
                statusCode: getErrorStatus(cause) === 404 ? 404 : 500,
                statusMessage: 'Parcel not found',
                cause,
            })
        }

        if (!found?.data) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Parcel not found',
            })
        }

        return found.data
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

/**
 * The map's `edit-parcel` param resolves a documentId, not the route's code, so
 * it reads the fetched parcel itself. The toolbar that uses this link only
 * renders once the parcel has loaded, at which point documentId is present.
 */
const mapEditLink = computed(() => {
    const documentId = parcel.value?.documentId
    return documentId
        ? { path: '/map', query: { 'edit-parcel': documentId } }
        : { path: '/map' }
})

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

/**
 * Quick-action tiles. Written out in full so Tailwind sees the literal strings.
 * The map edit is the primary action (it changes the boundary), the rest are
 * secondary record-writing actions.
 */
const tileClass =
    'flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-center transition-colors'
const tileSecondary =
    'border border-gray-200 bg-white text-gray-700 hover:border-green-200 hover:bg-[#f2f7f0]'
const tilePrimary = 'bg-[#2d6a2d] text-white hover:bg-[#245524]'
const tileIconClass = 'flex size-7 items-center justify-center rounded-md'
const tileLabelClass = 'text-[11px] font-medium leading-tight'
const chipClass =
    'inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-200'
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
                        class="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                        <UIcon name="i-lucide-arrow-left" class="size-3" />
                        Back to registry
                    </NuxtLink>
                    <div class="flex flex-wrap items-center gap-2">
                        <h1
                            class="font-mono text-2xl font-bold tracking-tight text-gray-900 md:text-3xl"
                        >
                            {{ parcel.parcel_code }}
                        </h1>
                        <span
                            :class="statusClass(parcel.land_status)"
                            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        >
                            <span
                                class="size-1.5 rounded-full"
                                :style="{
                                    backgroundColor: statusDot(
                                        parcel.land_status
                                    ),
                                }"
                            />
                            {{ parcel.land_status }}
                        </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">
                        {{ farm?.name || farm?.farm_code || 'Unassigned farm' }}
                        <span v-if="barangay"> · {{ barangay.name }}</span>
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <span :class="chipClass">
                            <UIcon
                                name="i-lucide-ruler"
                                class="size-3 text-gray-400"
                            />
                            {{ num(parcel.area_hectares) }} ha
                        </span>
                        <span :class="chipClass">
                            <UIcon
                                name="i-lucide-users"
                                class="size-3 text-gray-400"
                            />
                            {{ farmers.length }}
                            {{ farmers.length === 1 ? 'farmer' : 'farmers' }}
                        </span>
                        <span v-if="farm" :class="chipClass">
                            <UIcon
                                name="i-lucide-building"
                                class="size-3 text-gray-400"
                            />
                            {{ farm.farm_code }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="alps-card p-4 sm:p-5">
                <div :class="cardTitle">Quick Actions</div>
                <div
                    class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
                >
                    <NuxtLink
                        :to="mapEditLink"
                        :class="[tileClass, tilePrimary]"
                    >
                        <span
                            :class="[tileIconClass, 'bg-white/20 text-white']"
                        >
                            <UIcon name="i-lucide-map" class="size-4" />
                        </span>
                        <span :class="tileLabelClass">Edit Plot on Map</span>
                    </NuxtLink>
                    <button
                        type="button"
                        :class="[tileClass, tileSecondary]"
                        @click="showEditModal = true"
                    >
                        <span
                            :class="[
                                tileIconClass,
                                'bg-[#e8f2e6] text-[#2d6a2d]',
                            ]"
                        >
                            <UIcon name="i-lucide-pencil" class="size-4" />
                        </span>
                        <span :class="tileLabelClass">Edit Parcel Details</span>
                    </button>
                    <button
                        type="button"
                        :class="[tileClass, tileSecondary]"
                        @click="showFarmersModal = true"
                    >
                        <span
                            :class="[
                                tileIconClass,
                                'bg-[#e8f2e6] text-[#2d6a2d]',
                            ]"
                        >
                            <UIcon name="i-lucide-users" class="size-4" />
                        </span>
                        <span :class="tileLabelClass">
                            Update Tending Farmers
                        </span>
                    </button>
                    <button
                        type="button"
                        :class="[tileClass, tileSecondary]"
                        @click="showPlantingModal = true"
                    >
                        <span
                            :class="[
                                tileIconClass,
                                'bg-[#e8f2e6] text-[#2d6a2d]',
                            ]"
                        >
                            <UIcon name="i-lucide-sprout" class="size-4" />
                        </span>
                        <span :class="tileLabelClass">Log Planting Cycle</span>
                    </button>
                    <button
                        type="button"
                        :class="[tileClass, tileSecondary]"
                        @click="showRiskModal = true"
                    >
                        <span
                            :class="[
                                tileIconClass,
                                'bg-[#e8f2e6] text-[#2d6a2d]',
                            ]"
                        >
                            <UIcon
                                name="i-lucide-triangle-alert"
                                class="size-4"
                            />
                        </span>
                        <span :class="tileLabelClass">Report Risk</span>
                    </button>
                    <button
                        type="button"
                        :class="[tileClass, tileSecondary]"
                        @click="showHarvestModal = true"
                    >
                        <span
                            :class="[
                                tileIconClass,
                                'bg-[#e8f2e6] text-[#2d6a2d]',
                            ]"
                        >
                            <UIcon name="i-lucide-wheat" class="size-4" />
                        </span>
                        <span :class="tileLabelClass">Record Harvest</span>
                    </button>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <!-- Plot Summary -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-map-pin"
                            class="size-3.5 text-gray-400"
                        />
                        <div :class="cardTitle">Plot Summary</div>
                    </div>
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
                            <dd class="flex items-center gap-1.5 text-gray-800">
                                <span
                                    class="size-1.5 rounded-full"
                                    :style="{
                                        backgroundColor: statusDot(
                                            parcel.land_status
                                        ),
                                    }"
                                />
                                {{ parcel.land_status }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Parent Farm & Barangay -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-building"
                            class="size-3.5 text-gray-400"
                        />
                        <div :class="cardTitle">Parent Farm &amp; Barangay</div>
                    </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        message="This parcel is not linked to a farm yet."
                    />
                </div>

                <!-- Tending Farmers -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-users"
                                class="size-3.5 text-gray-400"
                            />
                            <div :class="cardTitle">Tending Farmers</div>
                        </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        message="No farmers assigned to this parcel."
                    />
                </div>

                <!-- Current Planting Cycle -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center gap-1.5">
                        <UIcon
                            name="i-lucide-sprout"
                            class="size-3.5 text-gray-400"
                        />
                        <div :class="cardTitle">Current Planting Cycle</div>
                    </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        icon="i-lucide-sprout"
                        message="No planting cycle logged yet."
                    />
                </div>

                <!-- Current Cycle Harvests -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-wheat"
                                class="size-3.5 text-gray-400"
                            />
                            <div :class="cardTitle">Current Cycle Harvests</div>
                        </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        icon="i-lucide-wheat"
                        :message="
                            cycle
                                ? 'No harvests recorded for this cycle yet.'
                                : 'No planting cycle logged yet.'
                        "
                    />
                </div>

                <!-- Inspections -->
                <div class="alps-card p-4 sm:p-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-clipboard-check"
                                class="size-3.5 text-gray-400"
                            />
                            <div :class="cardTitle">Field Inspections</div>
                        </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        icon="i-lucide-clipboard-check"
                        message="No field inspections recorded yet."
                    />
                </div>

                <!-- Risk Reports -->
                <div class="alps-card p-4 sm:p-5 sm:col-span-2 xl:col-span-1">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <UIcon
                                name="i-lucide-triangle-alert"
                                class="size-3.5 text-gray-400"
                            />
                            <div :class="cardTitle">Risk Reports</div>
                        </div>
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
                    <ParcelsParcelEmpty
                        v-else
                        icon="i-lucide-triangle-alert"
                        message="No risk reports filed for this parcel."
                    />
                </div>
            </div>

            <ParcelsParcelEditModal
                v-model="showEditModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelsParcelFarmersModal
                v-model="showFarmersModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelsParcelCycleModal
                v-model="showPlantingModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelsParcelRiskModal
                v-model="showRiskModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
            <ParcelsParcelHarvestModal
                v-model="showHarvestModal"
                :parcel="parcel"
                @saved="handleSaved"
            />
        </template>
    </div>
</template>
