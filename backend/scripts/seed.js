'use strict'

/**
 * Seeds the barangays and farmers referenced by frontend/app/pages/farmers.vue
 * so the Create Farm and parcel forms have real options to pick from.
 *
 * A farmer is linked to a farm through the parcels they tend, so this script
 * also seeds one farm with a parcel and two farmers assigned to it. That gives
 * the farm's farmer rollup and its derived status something to resolve.
 *
 * Finally it seeds a few assistance programs, so frontend/app/pages/assistance.vue
 * opens on a populated registry rather than an empty one.
 *
 * Idempotent: existing records are matched by name and left untouched, so
 * re-running only fills in what is missing.
 *
 *   npm run seed
 */

const core = require('@strapi/core')

const BARANGAY_UID = 'api::barangay.barangay'
const FARMER_UID = 'api::farmer.farmer'
const FARM_UID = 'api::farm.farm'
const PARCEL_UID = 'api::farm-parcel.farm-parcel'
const ASSISTANCE_PROGRAM_UID = 'api::assistance-program.assistance-program'

/**
 * A worked example of the linkage: two farmers sharing one parcel of a farm.
 * Several farmers on a single parcel is the norm, not the exception. It gets its
 * own farm so it never disturbs farms created through the UI.
 */
const WORKED_EXAMPLE = {
    farm: 'Sto. Niño',
    parcel: {
        current_use: 'Rice',
        land_status: 'Cultivated',
        // A small square, comfortably over the minimum area the app requires.
        boundary_geojson: {
            type: 'Polygon',
            coordinates: [
                [
                    [120.7125, 15.1435],
                    [120.7145, 15.1435],
                    [120.7145, 15.1455],
                    [120.7125, 15.1455],
                    [120.7125, 15.1435],
                ],
            ],
        },
    },
    farmers: ['Jose Mendoza', 'Pedro Santos'],
}

const BARANGAYS = [
    { name: 'Alasas', code: 'ALASAS' },
    { name: 'Baliti', code: 'BALITI' },
    { name: 'Bulaon', code: 'BULAON' },
    { name: 'Calulut', code: 'CALULUT' },
    { name: 'Dela Paz Norte', code: 'DELAPAZNORTE' },
    { name: 'Dela Paz Sur', code: 'DELAPAZSUR' },
    { name: 'Del Carmen', code: 'DELCARMEN' },
    { name: 'Del Pilar', code: 'DELPILAR' },
    { name: 'Del Rosario', code: 'DELROSARIO' },
    { name: 'Dolores', code: 'DOLORES' },
    { name: 'Juliana', code: 'JULIANA' },
    { name: 'Lara', code: 'LARA' },
    { name: 'Lourdes', code: 'LOURDES' },
    { name: 'Magliman', code: 'MAGLIMAN' },
    { name: 'Maimpis', code: 'MAIMPIS' },
    { name: 'Malino', code: 'MALINO' },
    { name: 'Malpitic', code: 'MALPITIC' },
    { name: 'Pandaras', code: 'PANDARAS' },
    { name: 'Panipuan', code: 'PANIPUAN' },
    { name: 'Pulung Bulu', code: 'PULUNGBULU' },
    { name: 'Quebiawan', code: 'QUEBIAWAN' },
    { name: 'Saguin', code: 'SAGUIN' },
    { name: 'San Agustin', code: 'SANAGUSTIN' },
    { name: 'San Felipe', code: 'SANFELIPE' },
    { name: 'San Isidro', code: 'SANISIDRO' },
    { name: 'San Jose', code: 'SANJOSE' },
    { name: 'San Juan', code: 'SANJUAN' },
    { name: 'San Nicolas', code: 'SANNICOLAS' },
    { name: 'San Pedro Cutud', code: 'SANPEDROCUTUD' },
    { name: 'Santa Lucia', code: 'SANTALUCIA' },
    { name: 'Santa Teresita', code: 'SANTATERESITA' },
    { name: 'Sto. Niño', code: 'STONINO' },
    { name: 'Santo Rosario (Poblacion)', code: 'SANTOROSARIO' },
    { name: 'Sindalan', code: 'SINDALAN' },
    { name: 'Telabastagan', code: 'TELABASTAGAN' },
]

/**
 * A farmer's barangay is not stored on them; it follows from the parcels they
 * tend. So these entries carry no location, and a farmer only gets one once a
 * parcel is assigned to them.
 */
const FARMERS = [
    { name: 'Jose Mendoza' },
    { name: 'Rosa Dizon' },
    { name: 'Pedro Santos' },
    { name: 'Ana Reyes' },
    { name: 'Carlos Garcia' },
    { name: 'Liza Ramos' },
    { name: 'Mario Cruz' },
    { name: 'Elena Bautista' },
    { name: 'Ramon Villanueva' },
    { name: 'Fe Domingo' },
    { name: 'Arturo Salazar' },
    { name: 'Corazon Lim' },
]

/**
 * A worked set of released, queued and scheduled assistance, so the assistance
 * registry has every status represented. Each entry names a farmer and a
 * barangay that the lists above already create.
 */
const ASSISTANCE_PROGRAMS = [
    {
        program: 'Rice Seed Subsidy',
        farmer: 'Rosa Dizon',
        barangay: 'Sindalan',
        items: '4 bags certified rice seed (40 kg), 1 bag fertilizer',
        value: 5200,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        program: 'Rice Seed Subsidy',
        farmer: 'Jose Mendoza',
        barangay: 'Sto. Niño',
        items: '5 bags certified rice seed (40 kg), 2 bags urea',
        value: 7800,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        program: 'Corn Seed Assistance',
        farmer: 'Arturo Salazar',
        barangay: 'Pulung Bulu',
        items: '3 bags hybrid corn seed, 1 bag complete fertilizer',
        value: 6400,
        date: '2024-11-12',
        status: 'Released',
    },
    {
        program: 'Veggie Growers Kit',
        farmer: 'Ana Reyes',
        barangay: 'Calulut',
        items: 'Assorted vegetable seeds, organic fertilizers, drip hoses',
        value: 3850,
        date: '2024-11-18',
        status: 'For Release',
    },
    {
        program: 'Farm Machinery Access',
        farmer: 'Carlos Garcia',
        barangay: 'Pulung Bulu',
        items: 'Tractor service (2 ha), 1 pump engine rental',
        value: 9400,
        date: '2024-11-22',
        status: 'For Release',
    },
    {
        program: 'Livelihood Starter Pack',
        farmer: 'Liza Ramos',
        barangay: 'Dolores',
        items: 'Feeds, 10 native chickens, starter housing',
        value: 15000,
        date: '2024-11-28',
        status: 'Pending',
    },
    {
        program: 'Training - Rice Production',
        farmer: 'Elena Bautista',
        barangay: 'San Pedro Cutud',
        items: 'Capacity building (3-day), training kits',
        value: 2500,
        date: '2024-12-05',
        status: 'Scheduled',
    },
    {
        program: 'Soil Amendment Support',
        farmer: 'Fe Domingo',
        barangay: 'Del Pilar',
        items: '10 bags biochar, 5 bags lime',
        value: 4600,
        date: '2024-12-08',
        status: 'Pending',
    },
]

async function seedBarangays(strapi) {
    const created = []
    const skipped = []

    for (const { name, code } of BARANGAYS) {
        const existing = await strapi
            .documents(BARANGAY_UID)
            .findFirst({ filters: { name: { $eq: name } } })

        if (existing) {
            skipped.push(name)
            continue
        }

        const entry = await strapi
            .documents(BARANGAY_UID)
            .create({ data: { name, code } })
        created.push(`${name} (${entry.code})`)
    }

    console.log(
        `barangays: ${created.length} created, ${skipped.length} already present`
    )
    created.forEach((label) => console.log(`  + ${label}`))
    skipped.forEach((label) => console.log(`  = ${label}`))
}

async function seedFarmers(strapi) {
    const created = []
    const skipped = []

    for (const { name } of FARMERS) {
        const existing = await strapi
            .documents(FARMER_UID)
            .findFirst({ filters: { name: { $eq: name } } })

        if (existing) {
            skipped.push(name)
            continue
        }

        const entry = await strapi.documents(FARMER_UID).create({
            data: {
                name,
                farmer_status: 'Active',
            },
        })

        created.push(`${entry.farmer_code} ${name}`)
    }

    console.log(
        `farmers: ${created.length} created, ${skipped.length} already present`
    )
    created.forEach((label) => console.log(`  + ${label}`))
    skipped.forEach((label) => console.log(`  = ${label}`))
}

/**
 * Seeds one farm with a parcel and two farmers on it, so the parcel-to-farmer
 * link, the farm's farmer rollup, and the derived farm status all have
 * something real to resolve.
 */
async function seedWorkedExample(strapi) {
    const barangay = await strapi
        .documents(BARANGAY_UID)
        .findFirst({ filters: { name: { $eq: WORKED_EXAMPLE.farm } } })

    if (!barangay) {
        throw new Error(
            `Cannot seed the worked example: barangay "${WORKED_EXAMPLE.farm}" does not exist`
        )
    }

    // Its own farm, so re-running never disturbs a farm made through the UI.
    const farm =
        (await strapi.documents(FARM_UID).findFirst({
            filters: { barangay: { documentId: barangay.documentId } },
        })) ??
        (await strapi.documents(FARM_UID).create({
            data: {
                name: `${WORKED_EXAMPLE.farm} Demonstration Farm`,
                barangay: barangay.documentId,
            },
        }))

    const existingParcel = await strapi
        .documents(PARCEL_UID)
        .findFirst({ filters: { farm: { documentId: farm.documentId } } })

    if (existingParcel) {
        console.log(
            `worked example: farm ${farm.farm_code} already has parcel ${existingParcel.parcel_code}`
        )
        return
    }

    const farmers = []
    for (const name of WORKED_EXAMPLE.farmers) {
        const farmer = await strapi
            .documents(FARMER_UID)
            .findFirst({ filters: { name: { $eq: name } } })

        if (!farmer) {
            throw new Error(
                `Cannot seed the worked example: farmer "${name}" does not exist`
            )
        }
        farmers.push(farmer.documentId)
    }

    // The parcel is the source of truth for who tends the land, so it is created
    // with its farmers and the farm's rollup is left to the lifecycle.
    const parcel = await strapi.documents(PARCEL_UID).create({
        data: {
            farm: farm.documentId,
            ...WORKED_EXAMPLE.parcel,
            farmers,
        },
        populate: { farmers: true, farm: { populate: { farmers: true } } },
    })

    // Re-read rather than trusting the create response: the rollup runs in the
    // parcel's afterCreate, after that response was populated.
    const rolledUpFarm = await strapi.documents(FARM_UID).findOne({
        documentId: farm.documentId,
        populate: { farmers: { fields: ['name'] } },
    })
    const rolledUp =
        (rolledUpFarm?.farmers ?? []).map((farmer) => farmer.name).join(', ') ||
        '(none)'

    console.log(
        `worked example: parcel ${parcel.parcel_code} on ${farm.farm_code} with ${farmers.length} farmers`
    )
    console.log(`  farmers on the parcel: ${WORKED_EXAMPLE.farmers.join(', ')}`)
    console.log(`  rollup on the farm: ${rolledUp}`)
}

/**
 * Re-derives every farm's farmer list from its parcels. The same union the parcel
 * lifecycle performs, inlined because this script runs as plain JavaScript and
 * cannot import the TypeScript service.
 */
async function syncFarmFarmers(strapi, farmDocumentId) {
    if (!farmDocumentId) {
        return
    }

    const parcels = await strapi.documents(PARCEL_UID).findMany({
        filters: { farm: { documentId: farmDocumentId } },
        fields: ['documentId'],
        populate: { farmers: { fields: ['documentId'] } },
    })

    const farmerIds = new Set()
    for (const parcel of parcels) {
        for (const farmer of parcel.farmers ?? []) {
            if (farmer?.documentId) {
                farmerIds.add(farmer.documentId)
            }
        }
    }

    await strapi.documents(FARM_UID).update({
        documentId: farmDocumentId,
        data: { farmers: [...farmerIds] },
    })
}

/**
 * Settles farms whose farmer links predate the rollup, such as ones created
 * through the UI before farmers moved to the parcel.
 */
async function resyncFarmRollups(strapi) {
    const farms = await strapi.documents(FARM_UID).findMany({
        fields: ['documentId', 'farm_code'],
    })

    const names = (record) =>
        (record?.farmers ?? []).map((farmer) => farmer.name).join(', ') ||
        '(none)'

    for (const farm of farms) {
        const before = await strapi.documents(FARM_UID).findOne({
            documentId: farm.documentId,
            populate: { farmers: { fields: ['name'] } },
        })

        await syncFarmFarmers(strapi, farm.documentId)

        const after = await strapi.documents(FARM_UID).findOne({
            documentId: farm.documentId,
            populate: { farmers: { fields: ['name'] } },
        })

        if (names(before) !== names(after)) {
            console.log(
                `  ${farm.farm_code}: ${names(before)} -> ${names(after)}`
            )
        }
    }
}

/**
 * Creates one assistance program, resolving its farmer and barangay by name. A
 * missing one is fatal rather than skipped: silently dropping half a record
 * would leave the registry quietly wrong.
 */
async function seedAssistanceProgram(strapi, entry) {
    const farmer = await strapi
        .documents(FARMER_UID)
        .findFirst({ filters: { name: { $eq: entry.farmer } } })

    if (!farmer) {
        throw new Error(
            `Cannot seed assistance: farmer "${entry.farmer}" does not exist`
        )
    }

    const barangay = await strapi
        .documents(BARANGAY_UID)
        .findFirst({ filters: { name: { $eq: entry.barangay } } })

    if (!barangay) {
        throw new Error(
            `Cannot seed assistance: barangay "${entry.barangay}" does not exist`
        )
    }

    const existing = await strapi.documents(ASSISTANCE_PROGRAM_UID).findFirst({
        filters: {
            program: { $eq: entry.program },
            farmer: { documentId: farmer.documentId },
            date: entry.date,
        },
    })

    if (existing) {
        return {
            created: false,
            label: `${existing.reference_code} ${entry.program}`,
        }
    }

    // The reference code is generated server-side by the document middleware in
    // src/index.ts, which this create goes through, so it is not sent here.
    const created = await strapi.documents(ASSISTANCE_PROGRAM_UID).create({
        data: {
            program: entry.program,
            farmer: farmer.documentId,
            barangay: barangay.documentId,
            items: entry.items,
            value: entry.value,
            date: entry.date,
            status: entry.status,
        },
    })

    return {
        created: true,
        label: `${created.reference_code} ${entry.program}`,
    }
}

async function seedAssistancePrograms(strapi) {
    const created = []
    const skipped = []

    for (const entry of ASSISTANCE_PROGRAMS) {
        const result = await seedAssistanceProgram(strapi, entry)
        if (result.created) {
            created.push(result.label)
        } else {
            skipped.push(result.label)
        }
    }

    console.log(
        `assistance programs: ${created.length} created, ${skipped.length} already present`
    )
    created.forEach((label) => console.log(`  + ${label}`))
    skipped.forEach((label) => console.log(`  = ${label}`))
}

async function main() {
    const appContext = await core.compileStrapi()
    const app = await core.createStrapi(appContext).load()

    try {
        await seedBarangays(app)
        await seedFarmers(app)
        await seedWorkedExample(app)
        await resyncFarmRollups(app)
        await seedAssistancePrograms(app)
    } finally {
        // Teardown can time out acquiring a pooled connection, especially when a
        // dev server is already connected. The data is already committed, so a
        // failure here must not be reported as a seeding failure.
        try {
            await app.destroy()
        } catch (error) {
            console.log('(ignored teardown error:', error.message + ')')
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
