import type { Farmer, FarmerStatus } from '~/composables/useFarmersApi'
import type { FarmParcel, LandStatus } from '~/composables/useFarmParcelApi'
import type {
    AssistanceProgram,
    AssistanceStatus,
} from '~/composables/useAssistanceApi'

/**
 * A farmer as the registry pages need them: the API record, plus the parcel
 * tally the table shows. The tally is derived rather than stored, because a
 * farmer has no count of its own any more — they are counted by the parcels
 * they tend.
 */
export type FarmerRow = Farmer & { parcelCount: number }

/**
 * A parcel as the registry pages need it: a farmer's own tendees, flattened. A
 * parcel can have several tendees, so the join is on documentId rather than a
 * single code.
 */
export type FarmerParcel = {
    documentId: string
    parcel_code: string
    farm_code: string
    barangay: string
    area_hectares: number
    land_status: LandStatus
    current_use: string | null
    farmerDocumentIds: string[]
}

/**
 * The farmers registry shared by the `/farmers` page and the dashboard. Both
 * pages show the same registry list, and both can open a farmer's profile, so
 * every piece of state — the roster, the parcel-derived tallies and
 * locations, the register/edit/assistance flows — lives here once.
 */
export const useFarmersRegistry = () => {
    const parcels = ref<FarmerParcel[]>([])

    /** The parcels a farmer tends, matched on documentId. */
    const parcelsOf = (farmer: Farmer) =>
        parcels.value.filter((p) =>
            p.farmerDocumentIds.includes(farmer.documentId)
        )

    /**
     * A farmer has no barangay of its own: they are located by the parcels
     * they tend, and the parcels by the farms those belong to. A farmer with
     * no parcel therefore has no location to show.
     */
    const farmerBarangays = (farmer: Farmer): string[] => [
        ...new Set(parcelsOf(farmer).map((p) => p.barangay)),
    ]

    const farmerBarangay = (farmer: Farmer) => {
        const residence = farmer.residence_barangay?.name
        if (residence) return residence
        const names = farmerBarangays(farmer)
        return names.length > 0 ? names.join(', ') : 'No parcel assigned'
    }

    const { getAll, create, update, remove } = useFarmersApi()
    const { getAll: getAllParcels } = useFarmParcelApi()
    const { getAllForSelect: getAllBarangays } = useBarangayApi()
    const { create: createAssistance } = useAssistanceApi()

    const farmers = ref<FarmerRow[]>([])
    const loading = ref(true)
    const loadError = ref<string | null>(null)

    const UNKNOWN_BARANGAY = 'Unknown barangay'

    /**
     * Flattens the parcel records into the shape the registry joins against.
     * Only the parcel's own `farmers` counts: `farm.farmers` is the farm-wide
     * rollup, which would credit every farmer on the farm with every parcel
     * in it.
     */
    function toFarmerParcel(parcel: FarmParcel): FarmerParcel {
        return {
            documentId: parcel.documentId,
            parcel_code: parcel.parcel_code,
            farm_code: parcel.farm?.farm_code ?? 'Unassigned',
            barangay: parcel.farm?.barangay?.name ?? UNKNOWN_BARANGAY,
            area_hectares: parcel.area_hectares,
            land_status: parcel.land_status,
            current_use: parcel.current_use ?? null,
            farmerDocumentIds: (parcel.farmers ?? []).map(
                (farmer) => farmer.documentId
            ),
        }
    }

    /**
     * Loads the parcels first: they are what the farmer list's counts, areas
     * and locations are derived from, so counting before they arrive would
     * report every farmer as having no parcels.
     */
    async function loadParcels() {
        const response = await getAllParcels({
            populate: ['farm', 'farm.barangay', 'farm.farmers', 'farmers'],
        })
        parcels.value = response.data.map(toFarmerParcel)
    }

    async function loadFarmers() {
        loading.value = true
        loadError.value = null
        try {
            await Promise.all([
                loadParcels(),
                loadBarangays(),
                loadAssistance(),
            ])
            const response = await getAll()
            farmers.value = response.data.map((farmer) => ({
                ...farmer,
                parcelCount: parcelsOf(farmer).length,
            }))
        } catch (error) {
            loadError.value =
                error instanceof Error
                    ? error.message
                    : 'Could not load farmers.'
        } finally {
            loading.value = false
        }
    }

    /**
     * Total area each farmer tends. A shared parcel counts in full for every
     * farmer on it, matching the parcel count, rather than being split
     * between them.
     */
    const areaByFarmer = computed(() => {
        const totals = new Map<string, number>()
        for (const parcel of parcels.value) {
            for (const farmerId of parcel.farmerDocumentIds) {
                totals.set(
                    farmerId,
                    (totals.get(farmerId) ?? 0) + parcel.area_hectares
                )
            }
        }
        return totals
    })

    const search = ref('')
    const filterBarangay = ref('All')
    const selectedFarmer = ref<FarmerRow | null>(null)
    const showRegisterModal = ref(false)
    // The farmer code is not a field: it is generated by the backend on create.
    const registerForm = reactive({
        name: '',
        contact: '',
        status: 'Active' as FarmerStatus,
    })
    const registering = ref(false)
    const registerError = ref<string | null>(null)

    function resetRegisterForm() {
        registerForm.name = ''
        registerForm.contact = ''
        registerForm.status = 'Active'
        registerError.value = null
    }

    async function submitRegister() {
        // The name is the only field the backend requires, so it is the only
        // one worth blocking on; everything else has a sensible empty value.
        if (!registerForm.name.trim()) {
            registerError.value = 'A name is required.'
            return
        }

        registering.value = true
        registerError.value = null
        try {
            await create({
                name: registerForm.name.trim(),
                contact: registerForm.contact.trim(),
                farmer_status: registerForm.status,
            })
            showRegisterModal.value = false
            resetRegisterForm()
            // Re-read rather than pushing the response into the list, so the
            // ordering and the derived parcel tally come from one place.
            await loadFarmers()
        } catch (error) {
            registerError.value =
                error instanceof Error
                    ? error.message
                    : 'Could not register the farmer.'
        } finally {
            registering.value = false
        }
    }

    const showEditModal = ref(false)
    const editing = ref(false)
    const editError = ref<string | null>(null)
    const selectedFarmerForEdit = ref<Farmer | null>(null)
    const editForm = reactive({
        farmer_code: '',
        name: '',
        contact: '',
        status: 'Active' as FarmerStatus,
        residence_barangay: '' as string,
    })

    function openEditModal(farmer: Farmer) {
        selectedFarmerForEdit.value = farmer
        editForm.farmer_code = farmer.farmer_code
        editForm.name = farmer.name
        editForm.contact = farmer.contact ?? ''
        editForm.status = farmer.farmer_status
        editForm.residence_barangay =
            farmer.residence_barangay?.documentId ?? ''
        editError.value = null
        editing.value = false
        showEditModal.value = true
    }

    async function submitEdit() {
        if (!selectedFarmerForEdit.value?.documentId) return
        if (!editForm.name.trim()) {
            editError.value = 'A name is required.'
            return
        }

        editing.value = true
        editError.value = null
        try {
            showEditModal.value = false
            const updatedFarmer = await update(
                selectedFarmerForEdit.value.documentId,
                {
                    name: editForm.name.trim(),
                    contact: editForm.contact.trim() || null,
                    farmer_status: editForm.status,
                    residence_barangay: editForm.residence_barangay || null,
                }
            )
            const updated = updatedFarmer as Farmer
            selectedFarmerForEdit.value = updated
            const farmerInList = farmers.value.find(
                (f) => f.documentId === updated.documentId
            )
            if (farmerInList) {
                Object.assign(farmerInList, updated, {
                    parcelCount: parcelsOf(updated).length,
                })
            }
            if (selectedFarmer.value?.documentId === updated.documentId) {
                Object.assign(selectedFarmer.value, updated)
            }
        } catch (error) {
            editError.value =
                error instanceof Error
                    ? error.message
                    : 'Could not update the farmer.'
        } finally {
            editing.value = false
        }
    }

    // Closing the modal by any route — cancel, the X, or the backdrop —
    // clears what was typed, so reopening it never shows a stale name or a
    // stale error.
    watch(showRegisterModal, (open) => {
        if (!open) {
            resetRegisterForm()
        }
    })

    const filtered = computed(() =>
        farmers.value.filter((farmer) => {
            const matchSearch =
                !search.value ||
                farmer.name
                    .toLowerCase()
                    .includes(search.value.toLowerCase()) ||
                farmer.farmer_code
                    .toLowerCase()
                    .includes(search.value.toLowerCase())
            // The filter lists the barangays farmers work in, so a farmer with
            // no parcel appears under "All" but under no specific barangay.
            const matchBarangay =
                filterBarangay.value === 'All' ||
                farmerBarangays(farmer).includes(filterBarangay.value)
            return matchSearch && matchBarangay
        })
    )

    const barangaysByParcels = computed(() =>
        [...new Set(parcels.value.map((p) => p.barangay))].sort()
    )

    const barangays = ref<{ value: string; label: string }[]>([])

    async function loadBarangays() {
        try {
            const rows = await getAllBarangays()
            barangays.value = rows.map((barangay) => ({
                value: barangay.documentId,
                label: barangay.name,
            }))
        } catch {
            barangays.value = []
        }
    }

    const summaryCards = computed(() => [
        {
            label: 'Total Farmers',
            val: farmers.value.length,
            hint: 'Registered farmer profiles',
            color: '#2d6a2d',
            bg: '#e8f5e8',
            icon: 'i-lucide-users',
        },
        {
            label: 'Barangays Covered',
            val: barangaysByParcels.value.length,
            hint: 'Based on parcel locations',
            color: '#1d6fa4',
            bg: '#e0f0fb',
            icon: 'i-lucide-map-pin',
        },
        {
            label: 'Registered Parcels',
            val: parcels.value.length,
            hint: 'Linked agricultural parcels',
            color: '#16a34a',
            bg: '#dcfce7',
            icon: 'i-lucide-layers-3',
        },
        {
            label: 'Total Registered Area',
            val: `${parcels.value
                .reduce((area, parcel) => area + parcel.area_hectares, 0)
                .toFixed(1)} ha`,
            hint: 'Mapped agricultural coverage',
            color: '#ca8a04',
            bg: '#fef3c7',
            icon: 'i-lucide-wheat',
        },
    ])

    const selectedFarmerParcels = computed(() =>
        selectedFarmer.value ? parcelsOf(selectedFarmer.value) : []
    )

    const profileFields = computed(() =>
        selectedFarmer.value
            ? [
                  {
                      icon: 'i-lucide-map-pin',
                      label: 'Barangay',
                      val: farmerBarangay(selectedFarmer.value),
                  },
                  {
                      icon: 'i-lucide-wheat',
                      label: 'Registry Code',
                      val: selectedFarmer.value.farmer_code,
                  },
                  {
                      icon: 'i-lucide-clipboard-check',
                      label: 'Parcels',
                      val: `${selectedFarmerParcels.value.length} parcel(s)`,
                  },
              ]
            : []
    )

    /* ------------------------------------------------------------------ */
    /* Record assistance                                                   */
    /* ------------------------------------------------------------------ */

    /**
     * The same record-assistance form the assistance page uses, opened from a
     * farmer's profile. The recipient is the farmer being viewed, so it is
     * fixed rather than chosen, and the barangay starts at their residence —
     * the release is handed to the person, not to one of their parcels — but
     * stays editable, since a release can still be picked up in another
     * barangay.
     */
    const showAssistModal = ref(false)
    const recordingAssist = ref(false)
    const assistError = ref<string | null>(null)

    const assistForm = reactive({
        program: '',
        barangayDocumentId: '',
        items: '',
        /** v-model casts the number input, so this is a string only while blank. */
        value: '' as string | number,
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending' as AssistanceStatus,
    })

    const parsedValue = (raw: string | number): number | null => {
        const amount = Number(raw)
        return String(raw).trim() !== '' && Number.isFinite(amount)
            ? amount
            : null
    }

    /** Program names already in use, offered as suggestions on the free-text field. */
    const assistanceProgramOptions = ref<string[]>([])

    /**
     * Every assistance program, kept so a farmer's own records can be listed
     * on their profile without a second request.
     *
     * The profile needs one farmer's history, but the registry already loads
     * all of them to build the datalist above, so filtering the list that is
     * in hand costs nothing and saves a round trip per farmer opened. It is
     * refreshed after a record is added, so the new row appears without a
     * reload.
     */
    const assistanceRecords = ref<AssistanceProgram[]>([])

    async function loadAssistance() {
        try {
            const { getAll } = useAssistanceApi()
            const response = await getAll({ sort: 'date:desc' })
            assistanceRecords.value = response.data
            assistanceProgramOptions.value = [
                ...new Set(
                    response.data.map((row) => row.program).filter(Boolean)
                ),
            ].sort()
        } catch {
            assistanceRecords.value = []
            assistanceProgramOptions.value = []
        }
    }

    /** The selected farmer's assistance, most recent first as the API returned it. */
    const selectedFarmerAssistance = computed(() => {
        const farmerId = selectedFarmer.value?.documentId
        if (!farmerId) return []
        return assistanceRecords.value.filter(
            (row) => row.farmer?.documentId === farmerId
        )
    })

    /** Headline figures for the assistance card, so the table needs no summary row. */
    const selectedFarmerAssistanceTotal = computed(() =>
        selectedFarmerAssistance.value.reduce((sum, row) => {
            const amount = Number(row.value)
            return sum + (Number.isFinite(amount) ? amount : 0)
        }, 0)
    )

    const canRecordAssist = computed(
        () =>
            !recordingAssist.value &&
            Boolean(assistForm.program.trim()) &&
            Boolean(assistForm.date)
    )

    function openAssistModal(farmer: Farmer) {
        assistForm.program = ''
        assistForm.barangayDocumentId =
            farmer.residence_barangay?.documentId ?? ''
        assistForm.items = ''
        assistForm.value = ''
        assistForm.date = new Date().toISOString().slice(0, 10)
        assistForm.status = 'Pending'
        assistError.value = null
        showAssistModal.value = true
    }

    function closeAssistModal() {
        if (recordingAssist.value) return
        assistError.value = null
        showAssistModal.value = false
    }

    async function submitAssist() {
        const farmer = selectedFarmer.value
        if (!farmer) return

        recordingAssist.value = true
        assistError.value = null
        try {
            await createAssistance({
                program: assistForm.program.trim(),
                farmer: farmer.documentId,
                barangay: assistForm.barangayDocumentId || null,
                items: assistForm.items.trim() || null,
                value: parsedValue(assistForm.value),
                date: assistForm.date,
                status: assistForm.status,
            })
            showAssistModal.value = false
            // Re-read so the record appears in the profile's list straight
            // away rather than after a manual reload.
            await loadAssistance()
        } catch (error) {
            assistError.value =
                error instanceof Error
                    ? error.message
                    : 'Could not record the assistance.'
        } finally {
            recordingAssist.value = false
        }
    }

    const detailStats = computed(() => {
        const farmerParcels = selectedFarmerParcels.value
        return [
            {
                label: 'Total Parcels',
                val: selectedFarmer.value?.parcelCount ?? 0,
                icon: 'i-lucide-layers',
                color: '#2d6a2d',
                bg: '#e8f5e8',
            },
            {
                label: 'Total Area',
                val: `${farmerParcels
                    .reduce((sum, parcel) => sum + parcel.area_hectares, 0)
                    .toFixed(1)} ha`,
                icon: 'i-lucide-map-pin',
                color: '#1d6fa4',
                bg: '#e0f0fb',
            },
            {
                label: 'Cultivated Parcels',
                val: farmerParcels.filter((p) => p.land_status === 'Cultivated')
                    .length,
                icon: 'i-lucide-activity',
                color: '#16a34a',
                bg: '#dcfce7',
            },
            {
                label: 'At-Risk Parcels',
                val: farmerParcels.filter((p) => p.land_status === 'At Risk')
                    .length,
                icon: 'i-lucide-alert-triangle',
                color: '#dc2626',
                bg: '#fee2e2',
            },
        ]
    })

    /**
     * Leaves the profile, dropping the `?farmer=` deep link on the way out:
     * the registry is the page's resting state, so a refresh there should
     * show the registry rather than reopen the profile that was just
     * dismissed.
     */
    async function backToRegistry() {
        selectedFarmer.value = null
        await navigateTo({ path: '/farmers' }, { replace: true })
    }

    /**
     * Deep link from a registry that links a farmer by id (the assistance
     * page's recipient column does): open that farmer's profile straight
     * away, the way `?farm=<documentId>` opens a farm card on /farms.
     */
    function openFromQuery(farmerId: unknown) {
        if (typeof farmerId !== 'string') return
        const row = farmers.value.find(
            (farmer) => farmer.documentId === farmerId
        )
        if (row) selectedFarmer.value = row
    }

    /**
     * Deletes a farmer and drops it from the registry. The profile is closed
     * when it is showing the record that was just removed. The server refuses
     * (409) while assistance records still reference the farmer.
     */
    async function deleteFarmer(documentId: string) {
        await remove(documentId)

        farmers.value = farmers.value.filter(
            (farmer) => farmer.documentId !== documentId
        )

        if (selectedFarmer.value?.documentId === documentId) {
            selectedFarmer.value = null
        }
    }

    return {
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
        selectedFarmerForEdit,
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
        deleteFarmer,
    }
}
