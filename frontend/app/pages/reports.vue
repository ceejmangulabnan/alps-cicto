<script setup lang="ts">
/**
 * Reports and analytics. Every figure, chart and export below is derived by
 * `useReportAnalytics` from the registries, so a chart cannot disagree with the
 * registry page it summarises, and an export always contains the same rows the
 * chart above it is drawn from. This page only wires the shared view
 * components to that data and handles the two header actions.
 */
import { useReportAnalytics } from '~/composables/useReportAnalytics'

definePageMeta({ middleware: 'auth' })

const {
    load,
    loading,
    loadError,

    parcelCount,

    totalArea,

    landStatusSlices,

    landStatusTotals,

    barangayRows,

    barangayCount,

    leadingBarangay,

    monthlyProduction,

    productionWindowMonths,

    datasets,

    categories,

    rowTotal,
} = useReportAnalytics()

const { logout } = useAuth()

async function signInAgain() {
    await logout()

    await navigateTo('/login')
}

const showGenerate = ref(false)

onMounted(() => {
    load()
})
</script>

<template>
    <div
        class="min-h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-4 sm:p-6 lg:p-8"
    >
        <div class="mx-auto max-w-[1800px] space-y-6">
            <ReportsHeader
                :parcels="parcelCount"
                :area-ha="totalArea"
                :loading="loading"
                :can-generate="datasets.length > 0"
                @refresh="load"
                @generate="showGenerate = true"
            />

            <LoadErrorBanner
                v-if="loadError"
                :message="loadError.message"
                :action="loadError.action"
                @retry="load"
                @sign-in="signInAgain"
            />

            <!-- Loading -->
            <div
                v-if="loading"
                class="flex items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-12 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.055)]"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="size-5 animate-spin text-[#2d6a2d]"
                />
                Loading report figures...
            </div>

            <!-- No parcel data -->
            <div
                v-else-if="parcelCount === 0"
                class="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
                <div
                    class="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                >
                    <UIcon name="i-lucide-map-pin-off" class="size-7" />
                </div>

                <div class="text-lg font-bold text-slate-800">
                    No parcels mapped yet
                </div>

                <p class="max-w-md text-sm leading-6 text-slate-500">
                    The charts and exports on this page are derived from the
                    parcel registry. Once a parcel is drawn on the GIS map, the
                    analytics will populate automatically.
                </p>

                <NuxtLink
                    to="/map"
                    class="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#2d6a2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5125]"
                >
                    <UIcon name="i-lucide-map-pin" class="size-4" />
                    Open GIS Map
                </NuxtLink>
            </div>

            <template v-else>
                <ReportsOverviewCards
                    :parcel-count="parcelCount"
                    :total-area="totalArea"
                    :production-total="monthlyProduction.total"
                    :window-months="productionWindowMonths"
                    :barangay-count="barangayCount"
                />

                <ReportsCharts
                    :monthly-production="monthlyProduction"
                    :land-status-slices="landStatusSlices"
                    :land-status-totals="landStatusTotals"
                    :production-window-months="productionWindowMonths"
                />

                <ReportsBarangayChart
                    :barangay-rows="barangayRows"
                    :barangay-count="barangayCount"
                    :leading-barangay="leadingBarangay"
                />
            </template>

            <ReportsExportCenter
                :datasets="datasets"
                :categories="categories"
                :row-total="rowTotal"
            />

            <ReportsGenerateModal
                :show="showGenerate"
                :datasets="datasets"
                @close="showGenerate = false"
            />
        </div>
    </div>
</template>
