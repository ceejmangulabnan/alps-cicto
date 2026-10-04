<script setup lang="ts">
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
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
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
        ? `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${maptilerKey}`
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
        class="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-[#e8f0e5]"
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

        <div class="relative flex flex-1 overflow-hidden">
            <div class="relative flex-1 overflow-hidden">
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
                            class="absolute inset-0 flex items-center justify-center text-xs text-gray-500"
                        >
                            Loading map...
                        </div>
                    </template>
                </ClientOnly>

                <MapLoadAlert
                    v-if="alert"
                    :message="alert.message"
                    :action="alert.action"
                    @retry="retryLoad"
                    @sign-in="signInAgain"
                />

                <!--
                    Always up: it is the only thing on the map that says what
                    each mode's interactions do, and view mode's — click a
                    parcel to read it — is not otherwise discoverable.
                -->
                <MapPlottingGuide
                    :mode="drawMode"
                    :is-editing="sidebarPanel === 'edit'"
                    :is-inspecting="sidebarPanel === 'details'"
                />

                <MapStatusBar :coordinates="coordinatesText" :mode="modeMeta" />

                <MapStatusLegend
                    v-if="parcelCount > 0"
                    :entries="STATUS_LEGEND"
                />
            </div>

            <!--
                Below `sm` the panel overlays the map instead of sitting beside
                it: side by side, the map would be reduced to a few pixels. Both
                panels share those classes, and the editor's own geometry, so the
                map does not jump when a read-only panel turns into the form.
            -->
            <MapParcelDetails
                v-if="sidebarPanel === 'details' && selectedParcel"
                class="absolute inset-0 z-30 sm:relative sm:inset-auto sm:z-auto"
                :parcel="selectedParcel"
                @close="closeSidebar"
                @edit="editSelectedParcel"
            />
            <MapParcelForm
                v-else-if="sidebarPanel === 'add' || sidebarPanel === 'edit'"
                :key="sidebarKey"
                class="absolute inset-0 z-30 sm:relative sm:inset-auto sm:z-auto"
                :parcel="selectedParcel"
                :farms="farms"
                :drawing="drawing"
                :is-editing="isEditing"
                @close="closeSidebar"
                @saved="onParcelSaved"
            />
        </div>
    </div>
</template>
