<script setup lang="ts">
import type { AtRiskParcel } from '~/utils/riskInsights'
import { RISK_SEVERITY_STYLE } from '~/utils/riskStatus'
import { avatarColor, initials } from '~/utils/initials'

/**
 * The scrollable list of parcels with open reports, worst severity first, and
 * the monitored-area footer. Totals are folded here from the parcels themselves
 * so the badge, list and footer cannot disagree.
 */
interface Props {
    atRiskParcels: AtRiskParcel[]
}

const props = defineProps<Props>()

const atRiskTotals = computed(() => {
    const area = Math.round(
        props.atRiskParcels.reduce((sum, p) => sum + p.area, 0) * 10
    )
    return {
        area: area / 10,
        count: props.atRiskParcels.length,
        avg:
            props.atRiskParcels.length === 0
                ? 0
                : Math.round((area / 10 / props.atRiskParcels.length) * 10) /
                  10,
    }
})
</script>

<template>
    <div
        class="col-span-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)] md:col-span-5"
    >
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100"
                    >
                        <UIcon name="i-lucide-alert-octagon" class="size-4.5" />
                    </div>
                    <div>
                        <h3
                            class="text-base font-bold tracking-tight text-slate-800"
                        >
                            At-Risk Parcels
                        </h3>
                        <p class="text-xs text-slate-500">
                            Parcels under active risk monitoring
                        </p>
                    </div>
                </div>

                <span
                    class="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                >
                    {{ atRiskTotals.count }} parcels
                </span>
            </div>
        </div>

        <div class="p-5 sm:p-6">
            <div
                v-if="props.atRiskParcels.length === 0"
                class="flex flex-col items-center gap-2 py-10 text-center"
            >
                <div
                    class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
                >
                    <UIcon name="i-lucide-shield-check" class="size-6" />
                </div>
                <p class="text-sm text-slate-400">
                    No parcels under active risk monitoring.
                </p>
            </div>

            <div v-else class="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                <div
                    v-for="p in props.atRiskParcels"
                    :key="p.parcelDocumentId"
                    class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3"
                >
                    <NuxtLink
                        :to="`/parcels/${p.parcel_code}`"
                        class="flex min-w-0 items-center gap-3"
                    >
                        <span
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ring-2 ring-white"
                            :style="{
                                background: avatarColor(p.farmerName),
                            }"
                        >
                            {{ initials(p.farmerName) }}
                        </span>

                        <div class="min-w-0">
                            <div
                                class="truncate text-sm font-semibold text-slate-800"
                            >
                                {{ p.farmerName }}
                            </div>
                            <div class="truncate text-xs text-slate-400">
                                {{ p.parcel_code }}
                                <template v-if="p.barangay">
                                    · {{ p.barangay }}
                                </template>
                            </div>
                        </div>
                    </NuxtLink>

                    <div class="flex shrink-0 items-center gap-2">
                        <span
                            class="font-mono text-sm font-semibold text-slate-600"
                        >
                            {{ p.area }} ha
                        </span>
                        <span
                            :class="RISK_SEVERITY_STYLE[p.severity]"
                            class="rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5"
                        >
                            {{ p.severity }}
                        </span>
                    </div>
                </div>
            </div>

            <div
                class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"
            >
                <span class="font-semibold">
                    {{ atRiskTotals.area }} ha total monitored
                </span>
                <span>avg {{ atRiskTotals.avg }} ha / parcel</span>
            </div>
        </div>
    </div>
</template>
