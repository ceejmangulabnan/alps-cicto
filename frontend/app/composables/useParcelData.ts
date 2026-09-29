import { LngLatBounds } from 'maplibre-gl'
import type { Farm } from '~/composables/useFarmsApi'
import type { FarmParcel } from '~/composables/useFarmParcelApi'
import type { ParcelDrawing } from '~/composables/useParcelDrawing'
import { getErrorMessage, getHttpStatus } from '~/utils/apiError'
import { getParcelGeometry } from '~/utils/parcelGeometry'

export type ParcelAlertAction = 'retry' | 'sign-in' | null

export interface ParcelAlert {
    message: string
    /** Which recovery action, if any, the alert should offer. */
    action: ParcelAlertAction
}

/**
 * `farm.farmers` is the farm-wide rollup, so it cannot stand in for `farmers`:
 * without the parcel's own tendees the sidebar's picker would come up empty for
 * a parcel that has farmers, and saving would then wipe them.
 */
const PARCEL_POPULATE = ['farm', 'farm.barangay', 'farm.farmers', 'farmers']

/**
 * Owns the fetched side of the map: farms and parcels, the single alert banner
 * they surface problems through, and the camera helpers.
 */
export const useParcelData = (drawing: ParcelDrawing) => {
    const { getAll: getAllParcels, getById: getParcelById } = useFarmParcelApi()
    const { getAllForSelect: getFarms } = useFarmsApi()

    const parcels = ref<FarmParcel[]>([])
    const farms = ref<Farm[]>([])
    const alert = ref<ParcelAlert | null>(null)

    const parcelList = computed(() =>
        [...parcels.value].sort((a, b) =>
            a.parcel_code.localeCompare(b.parcel_code)
        )
    )

    function setAlert(message: string, action: ParcelAlertAction = null) {
        alert.value = { message, action }
    }

    function clearAlert() {
        alert.value = null
    }

    function handleLoadError(value: unknown) {
        const status = getHttpStatus(value)

        if (status === 401) {
            setAlert(
                'Your session has expired. Please sign in again to view parcels on the map.',
                'sign-in'
            )
        } else if (status === 403) {
            setAlert(
                'You do not have access to parcel data. Ask an administrator to grant the "find" permission for the farms and farm-parcels content types to your role.'
            )
        } else {
            setAlert(
                getErrorMessage(
                    value,
                    'Unable to load parcels. Check that the API is running and press Retry.'
                ),
                'retry'
            )
        }
    }

    async function loadFarms() {
        try {
            farms.value = await getFarms()
        } catch (value: unknown) {
            handleLoadError(value)
        }
    }

    async function loadExistingParcels() {
        try {
            const response = await getAllParcels({ populate: PARCEL_POPULATE })
            parcels.value = response.data

            if (drawing.draw.value && response.data.length > 0) {
                const rejected = drawing.addParcelFeatures(response.data)
                if (rejected.length > 0) {
                    console.error(
                        'terra-draw rejected parcel features:',
                        rejected
                    )
                    setAlert(
                        `${rejected.length} parcel(s) could not be plotted on the map.`
                    )
                }
                // The default centre is a fixed San Fernando coordinate, so any
                // parcel plotted elsewhere would load off-screen and look
                // missing.
                fitToAllParcels()
            }
        } catch (value: unknown) {
            handleLoadError(value)
        }
    }

    async function loadAll() {
        await loadFarms()
        await loadExistingParcels()
    }

    async function retryLoad() {
        clearAlert()
        await loadAll()
    }

    function upsertParcel(parcel: FarmParcel) {
        const index = parcels.value.findIndex(
            (item) => item.documentId === parcel.documentId
        )

        if (index === -1) {
            parcels.value = [...parcels.value, parcel]
        } else {
            parcels.value[index] = parcel
        }
    }

    async function ensureParcel(documentId: string) {
        const localParcel = parcels.value.find(
            (parcel) => parcel.documentId === documentId
        )
        if (localParcel) return localParcel

        const response = await getParcelById(documentId)
        upsertParcel(response.data)
        return response.data
    }

    function fitToParcel(parcel: FarmParcel) {
        const instance = drawing.mapInstance.value
        const coordinates = getParcelGeometry(parcel).coordinates[0]
        const first = coordinates?.[0]
        if (!instance || !first || first.length < 2) return

        const firstLng = first[0]
        const firstLat = first[1]
        if (typeof firstLng !== 'number' || typeof firstLat !== 'number') {
            return
        }

        const bounds = new LngLatBounds(
            [firstLng, firstLat],
            [firstLng, firstLat]
        )
        coordinates.forEach((coordinate) => {
            const lng = coordinate[0]
            const lat = coordinate[1]
            if (typeof lng === 'number' && typeof lat === 'number') {
                bounds.extend([lng, lat])
            }
        })

        instance.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 500 })
    }

    function fitToAllParcels() {
        const instance = drawing.mapInstance.value
        if (!instance || parcels.value.length === 0) return

        const bounds = new LngLatBounds()
        let extended = false

        for (const parcel of parcels.value) {
            for (const coordinate of getParcelGeometry(parcel).coordinates[0] ??
                []) {
                const lng = coordinate[0]
                const lat = coordinate[1]
                if (typeof lng === 'number' && typeof lat === 'number') {
                    bounds.extend([lng, lat])
                    extended = true
                }
            }
        }
        if (!extended) return

        instance.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 0 })
    }

    return {
        parcels,
        farms,
        parcelList,
        alert,
        setAlert,
        clearAlert,
        loadAll,
        retryLoad,
        upsertParcel,
        ensureParcel,
        fitToParcel,
        fitToAllParcels,
    }
}

export type ParcelData = ReturnType<typeof useParcelData>
