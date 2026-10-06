<script setup lang="ts">
//@ts-nocheck
import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl'

import { Position } from '@indoorequal/vue-maplibre-gl'

import type { FarmParcel } from '~/composables/useFarmParcelApi'

import { getErrorMessage } from '~/utils/apiError'

import { STATUS_LEGEND } from '~/utils/landStatus'



const config = useRuntimeConfig()

const maptilerKey = config.public.maptilerKey as string | undefined



const OSM_STYLE: StyleSpecification = {

    version: 8,

    sources: {

        openstreetmap: {

            type: 'raster',

            attribution: '© OpenStreetMap contributors',

            tiles: ['https\://tile.openstreetmap.org/{z}/{x}/{y}.png'],

            tileSize: 256,

            maxzoom: 19,

        },

    },

    layers: [

        {

            id: 'osm-tiles',

            type: 'raster',

            source: 'openstreetmap',

        },

    ],

}



const mapStyle = computed<StyleSpecification | string>(() =>

    maptilerKey

        ? `https\://api.maptiler.com/maps/hybrid-v4/style.json?key=${maptilerKey}`

        : OSM_STYLE

)



// San Fernando, Pampanga Coordinates

const mapCenter = ref({ lng: 120.6896, lat: 15.0282 })

const mapZoom = ref(14)



const attributionControl = {

    compact: true,

    customAttribution: 'ALPS GIS',

}



const coordinatesText = computed(() => {

    const { lng, lat } = mapCenter.value

    const ns = lat >= 0 ? 'N' : 'S'

    const ew = lng >= 0 ? 'E' : 'W'

    return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew} · Zoom ${Math.round(mapZoom.value)}`

})



// ---------------------------------------------------------------------------

// State

// ---------------------------------------------------------------------------

const drawing = useParcelDrawing()

const {

    parcelCount,

    drawMode,

    modeMeta,

    draftFeatureId,

    selectedParcelId,

    selectedParcel,

    init: initDrawing,

    enterPlotMode,

    enterViewMode,

    enterEditMode,

    selectParcel,

    clearSelection,

    discardDraft,

} = drawing



const data = useParcelData(drawing)

const {

    parcels,

    farms,

    parcelList,

    alert,

    setAlert,

    loadAll,

    retryLoad,

    upsertParcel,

    ensureParcel,

    fitToParcel,

    fitToAllParcels,

} = data



const showSidebar = ref(false)



/** Bumped on every open so the form remounts with clean state. */

const sidebarKey = ref(0)



const isEditing = computed(() => selectedParcelId.value !== null)



/**

 * What the side panel is currently showing. A selected parcel is only shown as

 * the editable form while edit mode is active: view mode's panel is the

 * read-only details, which is the whole point of selecting in view mode.

 */

type MapPanel = 'none' | 'add' | 'edit' | 'details'



const sidebarPanel = computed<MapPanel>(() => {

    if (!showSidebar.value) return 'none'

    if (!isEditing.value) return 'add'

    return drawMode.value === 'edit' ? 'edit' : 'details'

})



// ---------------------------------------------------------------------------

// Deep links

// ---------------------------------------------------------------------------

const route = useRoute()

const router = useRouter()



function queryId(value: unknown): string | undefined {

    return typeof value === 'string' ? value : undefined

}



const editParcelId = computed(() => queryId(route.query['edit-parcel']))

const focusParcelId = computed(() => queryId(route.query['focus-parcel']))

const isAddingParcel = computed(() => route.query['add-parcel'] !== undefined)



// ---------------------------------------------------------------------------

// Sidebar flow

// ---------------------------------------------------------------------------

function startEditing() {

    // A parcel can already be open read-only, picked or clicked in view mode.

    // Carrying that selection into edit mode beats closing the panel and making

    // the user find the parcel on the map again.

    if (selectedParcelId.value) {

        void openParcelForEdit(selectedParcelId.value)

        return

    }



    enterEditMode()

}



/** The toolbar's "Done Editing" button: leave edit mode for view mode. */

function exitEditMode() {

    clearSelection()

    showSidebar.value = false

    enterViewMode()

    void router.replace({ path: '/map' })

}



function openAddParcel() {

    // Clearing the selection runs the deselect handler first, which drops edit

    // mode back to view — so this must happen before enterPlotMode() below.

    discardDraft()

    clearSelection()

    showSidebar.value = true

    sidebarKey.value += 1

    void router.replace({ path: '/map', query: { 'add-parcel': '1' } })

    enterPlotMode()

}



function closeSidebar() {

    discardDraft()

    clearSelection()

    showSidebar.value = false

    enterViewMode()

    void router.replace({ path: '/map' })

}



async function openParcelForEdit(documentId: string) {

    try {

        const parcel = await ensureParcel(documentId)

        discardDraft()

        // Before the panel is opened: switching modes deselects whatever the

        // previous mode had selected, and that deselection closes the panel

        // again through onParcelDeselect.

        enterEditMode()

        selectedParcelId.value = parcel.documentId

        selectedParcel.value = parcel

        showSidebar.value = true

        sidebarKey.value += 1

        selectParcel(parcel)

        fitToParcel(parcel)

    } catch (value: unknown) {

        setAlert(getErrorMessage(value, 'Unable to open parcel.'))

    }

}



/**

 * View mode's counterpart to `openParcelForEdit`: the panel is opened on the

 * parcel's details and the map stays in view mode, so nothing on the map can be

 * reshaped while it is up.

 */

async function openParcelDetails(documentId: string) {

    try {

        const parcel = await ensureParcel(documentId)

        discardDraft()

        selectedParcelId.value = parcel.documentId

        selectedParcel.value = parcel

        showSidebar.value = true

        selectParcel(parcel)

        fitToParcel(parcel)

    } catch (value: unknown) {

        setAlert(getErrorMessage(value, 'Unable to open parcel.'))

    }

}



/**

 * The toolbar picker follows the map's mode: in view mode it is a way of

 * looking a parcel up, so it opens the read-only panel, while edit mode keeps

 * the existing behaviour of dropping straight into the form.

 */

function openParcelFromPicker(documentId: string) {

    if (drawMode.value === 'view') {

        void openParcelDetails(documentId)

        return

    }



    void openParcelForEdit(documentId)

}



/** The read-only panel's Edit button: the one gesture that starts an edit. */

function editSelectedParcel() {

    if (selectedParcelId.value) void openParcelForEdit(selectedParcelId.value)

}



async function focusParcel(documentId: string) {

    try {

        const parcel = await ensureParcel(documentId)

        enterViewMode()

        fitToParcel(parcel)

    } catch (value: unknown) {

        setAlert(getErrorMessage(value, 'Unable to focus parcel.'))

    }

}



function onParcelSaved(parcel: FarmParcel) {

    upsertParcel(parcel)

    // Reassigning forces the form's watcher to reload from the server echo.

    if (selectedParcelId.value === parcel.documentId) {

        selectedParcel.value = parcel

    }

}



async function signInAgain() {

    const { logout } = useAuth()

    await logout()

    await navigateTo('/login')

}



// ---------------------------------------------------------------------------

// Map + terra-draw wiring

// ---------------------------------------------------------------------------

function onParcelSelect(id: string | number) {

    if (draftFeatureId.value === id) return



    const parcel = parcels.value.find((item) => item.documentId === String(id))

    if (!parcel) return



    discardDraft()

    selectedParcelId.value = parcel.documentId

    selectedParcel.value = parcel

    showSidebar.value = true



    // A click in view mode is a look, not an edit: the panel opens on the

    // parcel's details and only becomes the form once edit mode is entered.

    if (drawMode.value === 'view') return



    enterEditMode()

}



function onParcelDeselect(id: string | number) {

    if (selectedParcelId.value !== String(id)) return

    if (showSidebar.value) {

        showSidebar.value = false

        sidebarKey.value += 1

    }

    selectedParcelId.value = null

    selectedParcel.value = null



    // Esc (or an empty-map click) deselected the parcel while edit mode was

    // active. That is the implicit "leave edit mode" gesture, so drop back to

    // view mode — unless the scene re-entered edit mode before the deferred

    // check runs, e.g. clicking straight from one parcel to another.

    if (drawMode.value === 'edit') {

        void nextTick(() => {

            if (

                drawMode.value === 'edit' &&

                !selectedParcelId.value &&

                !showSidebar.value

            ) {

                enterViewMode()

            }

        })

    }

}



function onMapLoad(payload: { map: MaplibreMap }) {

    initDrawing(payload.map, {

        onSelect: onParcelSelect,

        onDeselect: onParcelDeselect,

    })



    void (async () => {

        await loadAll()



        if (isAddingParcel.value) {

            showSidebar.value = true

            enterPlotMode()

            return

        }



        if (editParcelId.value) {

            await openParcelForEdit(editParcelId.value)

            return

        }



        if (focusParcelId.value) {

            await focusParcel(focusParcelId.value)

            return

        }



        enterViewMode()

    })()

}

</script>

<template>
    <div
        class="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-slate-100"
    >
        <!-- Modern toolbar shell -->
        <div
            class="relative z-20 border-b border-slate-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
        >
            <MapToolbar
                :parcel-count="parcelCount"
                :parcels="parcelList"
                :selected-parcel-id="selectedParcelId"
                :mode="drawMode"
                @edit="startEditing"
                @done="exitEditMode"
                @add="openAddParcel"
                @select-parcel="openParcelFromPicker"
                @fit-all="fitToAllParcels"
            />
        </div>

        <!-- GIS workspace -->
        <div class="relative flex min-h-0 flex-1 overflow-hidden">
            <!-- Map -->
            <div class="relative min-w-0 flex-1 overflow-hidden bg-[#dce8dc]">
                <ClientOnly>
                    <div class="absolute inset-0">
                        <MglMap
                            v-model:center="mapCenter"
                            v-model:zoom="mapZoom"
                            :map-style="mapStyle"
                            :attribution-control="attributionControl"
                            height="100%"
                            width="100%"
                            @map:load="onMapLoad"
                        >
                            <MglNavigationControl
                                :position="Position.TOP_RIGHT"
                                :show-compass="false"
                            />

                            <MglFullscreenControl
                                :position="Position.TOP_RIGHT"
                            />
                        </MglMap>
                    </div>

                    <template #fallback>
                        <div
                            class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-emerald-50 text-slate-500"
                        >
                            <div
                                class="flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200"
                            >
                                <UIcon
                                    name="i-lucide-map"
                                    class="size-6 animate-pulse text-emerald-700"
                                />
                            </div>
                            <div class="text-sm font-medium">Loading agricultural map...</div>
                        </div>
                    </template>
                </ClientOnly>

                <!-- Subtle map treatment -->
                <div
                    class="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-gradient-to-b from-slate-950/10 to-transparent"
                />
                <div
                    class="pointer-events-none absolute inset-0 z-[2] ring-1 ring-inset ring-black/5"
                />

                <!-- Load / API alert -->
                <div class="absolute left-4 right-4 top-4 z-20 sm:right-auto sm:max-w-xl">
                    <MapLoadAlert
                        v-if="alert"
                        :message="alert.message"
                        :action="alert.action"
                        @retry="retryLoad"
                        @sign-in="signInAgain"
                    />
                </div>

                <!-- Plotting instructions -->
                <div class="relative z-10">
                    <MapPlottingGuide
                        :mode="drawMode"
                        :is-editing="sidebarPanel === 'edit'"
                        :is-inspecting="sidebarPanel === 'details'"
                    />
                </div>

                <!-- Status -->
                <MapStatusBar
                    :coordinates="coordinatesText"
                    :mode="modeMeta"
                />

                <!-- Legend -->
                <MapStatusLegend
                    v-if="parcelCount > 0"
                    :entries="STATUS_LEGEND"
                />
            </div>

            <!-- Mobile panel backdrop -->
            <Transition
                enter-active-class="transition-opacity duration-200"
                leave-active-class="transition-opacity duration-150"
                enter-from-class="opacity-0"
                leave-to-class="opacity-0"
            >
                <button
                    v-if="sidebarPanel !== 'none'"
                    type="button"
                    aria-label="Close parcel panel"
                    class="absolute inset-0 z-20 bg-slate-950/25 backdrop-blur-[1px] sm:hidden"
                    @click="closeSidebar"
                />
            </Transition>

            <!-- Parcel details -->
            <Transition
                enter-active-class="transition duration-250 ease-out"
                leave-active-class="transition duration-180 ease-in"
                enter-from-class="translate-x-4 opacity-0"
                leave-to-class="translate-x-4 opacity-0"
            >
                <MapParcelDetails
                    v-if="sidebarPanel === 'details' && selectedParcel"
                    class="absolute inset-y-3 right-3 z-30 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.20)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:relative sm:inset-auto sm:z-auto sm:m-3 sm:ml-0"
                    :parcel="selectedParcel"
                    @close="closeSidebar"
                    @edit="editSelectedParcel"
                />
            </Transition>

            <!-- Parcel form -->
            <Transition
                enter-active-class="transition duration-250 ease-out"
                leave-active-class="transition duration-180 ease-in"
                enter-from-class="translate-x-4 opacity-0"
                leave-to-class="translate-x-4 opacity-0"
            >
                <MapParcelForm
                    v-if="sidebarPanel === 'add' || sidebarPanel === 'edit'"
                    :key="sidebarKey"
                    class="absolute inset-y-3 right-3 z-30 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.20)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:relative sm:inset-auto sm:z-auto sm:m-3 sm:ml-0"
                    :parcel="selectedParcel"
                    :farms="farms"
                    :drawing="drawing"
                    :is-editing="isEditing"
                    @close="closeSidebar"
                    @saved="onParcelSaved"
                />
            </Transition>
        </div>
    </div>
</template>
