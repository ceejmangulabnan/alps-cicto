<script setup lang="ts">
import {
    LAND_STATUS_OPTIONS,
    type FarmParcel,
} from '~/composables/useFarmParcelApi'
import {
    useParcelForm,
    type ParcelFormProps,
} from '~/composables/useParcelForm'
import { STATUS_COLOR } from '~/utils/landStatus'
import { selectMenuSlots } from '~/utils/lightSelectMenu'

const props = defineProps<ParcelFormProps>()

const emit = defineEmits<{
    close: []
    saved: [parcel: FarmParcel]
}>()

const {
    form,
    loading,
    farmers,
    farmerOptions,
    farmersLoading,
    error,
    success,
    areaHectares,
    canSave,
    title,
    subtitle,
    hint,
    submitLabel,
    handleSave,
} = useParcelForm(props, emit)

/**
 * Match the form's hand-rolled inputs instead of Nuxt UI's default theme:
 * same light grey border, white fill, `text-xs`, green focus ring, and a light
 * dropdown. `variant="none"` strips Nuxt's variant classes so the trigger is
 * styled purely from these slots.
 */
const menuUi = {
    ...selectMenuSlots,
    base: 'gap-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-100',
}
</script>

<template>
    <!--
        A fixed side panel has no room below `sm`, where it would leave the map
        as a sliver. There it becomes a full-height sheet instead.
    -->
    <aside
        class="w-full shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 sm:w-80 sm:p-5"
    >
        <div class="mb-5 flex items-start justify-between">
            <div>
                <h2 class="text-base font-bold text-gray-900">{{ title }}</h2>
                <p class="text-[11px] text-gray-500">{{ subtitle }}</p>
            </div>
            <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                @click="emit('close')"
            >
                <UIcon name="i-lucide-x" class="size-4" />
            </button>
        </div>

        <form id="parcel-form" class="space-y-4" @submit.prevent="handleSave">
            <div class="border-b border-gray-100 pb-4">
                <div
                    class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                    <UIcon
                        name="i-lucide-tractor"
                        class="size-3.5 text-[#2d6a2d]"
                    />
                    Farm Reference
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Farm
                    </label>
                    <select
                        v-model="form.farm"
                        :disabled="loading || farms.length === 0"
                        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                        <option value="">
                            {{
                                farms.length === 0
                                    ? 'No farms available'
                                    : 'Select a farm...'
                            }}
                        </option>
                        <option
                            v-for="farm in farms"
                            :key="farm.documentId"
                            :value="farm.documentId"
                        >
                            {{ farm.name }} · {{ farm.farm_code }}
                        </option>
                    </select>
                    <p
                        v-if="farms.length === 0"
                        class="mt-1 text-[11px] leading-relaxed text-amber-600"
                    >
                        No farms available yet. A parcel cannot be saved without
                        one because every parcel must belong to a farm.
                        <NuxtLink
                            to="/farms"
                            class="font-semibold underline underline-offset-2"
                        >
                            Create a farm
                        </NuxtLink>
                        first.
                    </p>
                </div>
                <div class="mt-3">
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Parcel Code (generated)
                    </label>
                    <input
                        v-model="form.parcel_code"
                        type="text"
                        placeholder="Generated after saving"
                        readonly
                        class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                </div>
                <div class="mt-3">
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Farmers tending this parcel
                    </label>
                    <!--
                        `loading` matters: without it the menu briefly shows the
                        raw documentIds held by the form before the farmer list
                        arrives and can resolve them to names.

                        `ui.content` lifts the menu clear of this panel, which is
                        `absolute ... z-30` below `sm`. The menu is portalled to
                        <body> and Nuxt UI gives it no z-index, so it would be
                        painted under the panel.
                    -->
                    <USelectMenu
                        v-model="form.farmers"
                        :items="farmerOptions"
                        :disabled="loading || farmersLoading"
                        :loading="farmersLoading"
                        multiple
                        value-key="value"
                        placeholder="Optional - assign farmers"
                        variant="none"
                        size="xs"
                        :ui="menuUi"
                        class="w-full"
                    />
                    <p
                        v-if="!farmersLoading && farmers.length === 0"
                        class="mt-1 text-[11px] text-gray-400"
                    >
                        No farmers registered yet.
                    </p>
                </div>
            </div>

            <div class="border-b border-gray-100 pb-4">
                <div
                    class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                    <UIcon
                        name="i-lucide-layers"
                        class="size-3.5 text-[#2d6a2d]"
                    />
                    Land Details
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600"
                        >Area (ha)</label
                    >
                    <input
                        :value="areaHectares"
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0.0000"
                        readonly
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"
                    />
                    <p class="mt-1 text-[10px] text-gray-500">
                        Calculated from polygon
                    </p>
                </div>
                <div class="mt-3">
                    <label class="mb-1 block text-xs font-medium text-gray-600">
                        Land Status
                    </label>
                    <div class="flex flex-wrap gap-1.5">
                        <button
                            v-for="status in LAND_STATUS_OPTIONS"
                            :key="status"
                            type="button"
                            :disabled="loading"
                            class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            :class="
                                form.land_status === status
                                    ? 'border-[#2d6a2d] bg-[#e8f5e8] text-[#2d6a2d]'
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                            "
                            @click="form.land_status = status"
                        >
                            <span
                                class="h-2 w-2 rounded-full"
                                :style="{
                                    backgroundColor: STATUS_COLOR[status],
                                }"
                            />
                            {{ status }}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <div
                    class="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                >
                    <UIcon
                        name="i-lucide-file-text"
                        class="size-3.5 text-[#2d6a2d]"
                    />
                    Notes
                </div>
                <label class="mb-1 block text-xs font-medium text-gray-600">
                    Current Use
                </label>
                <input
                    v-model="form.current_use"
                    type="text"
                    placeholder="e.g. Rice / Corn / Sugarcane"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    :disabled="loading"
                />
            </div>

            <div
                v-if="error"
                class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
                role="alert"
            >
                <UIcon
                    name="i-lucide-circle-alert"
                    class="inline-block size-3 mr-1"
                />
                {{ error }}
            </div>
            <div
                v-if="success"
                class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs"
                role="status"
            >
                <UIcon
                    name="i-lucide-circle-check"
                    class="inline-block size-3 mr-1"
                />
                {{ success }}
            </div>
        </form>

        <div class="mt-6 border-t border-gray-100 pt-4">
            <NuxtLink
                v-if="isEditing && parcel"
                :to="`/parcels/${parcel.parcel_code}`"
                class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:border-green-200 hover:bg-[#f2f7f0]"
            >
                <UIcon name="i-lucide-external-link" class="size-3.5" />
                View Parcel Details
            </NuxtLink>
            <button
                type="submit"
                form="parcel-form"
                :disabled="!canSave"
                class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#245524] disabled:cursor-not-allowed disabled:opacity-60"
            >
                <UIcon
                    v-if="loading"
                    name="i-lucide-loader-2"
                    class="size-4 animate-spin"
                />
                <UIcon v-else name="i-lucide-vector-polygon" class="size-4" />
                {{ submitLabel }}
            </button>
            <div
                class="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 p-2.5"
            >
                <UIcon
                    name="i-lucide-info"
                    class="mt-0.5 size-3 shrink-0 text-gray-400"
                />
                <p class="text-[10px] leading-relaxed text-gray-500">
                    {{ hint }}
                </p>
            </div>
        </div>
    </aside>
</template>
