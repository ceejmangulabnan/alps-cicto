'use strict'

/**
 * Seeds the barangays and farmers referenced by frontend/app/pages/farmers.vue
 * so the Create Farm modal has real options to pick from.
 *
 * Idempotent: existing records are matched by name and left untouched, so
 * re-running only fills in what is missing.
 *
 *   npm run seed
 */

const core = require('@strapi/core')

const BARANGAY_UID = 'api::barangay.barangay'
const FARMER_UID = 'api::farmer.farmer'

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

const FARMERS = [
    { name: 'Jose Mendoza', barangay: 'Sto. Niño' },
    { name: 'Rosa Dizon', barangay: 'Sindalan' },
    { name: 'Pedro Santos', barangay: 'Sto. Niño' },
    { name: 'Ana Reyes', barangay: 'Calulut' },
    { name: 'Carlos Garcia', barangay: 'Pulung Bulu' },
    { name: 'Liza Ramos', barangay: 'Dolores' },
    { name: 'Mario Cruz', barangay: 'Telabastagan' },
    { name: 'Elena Bautista', barangay: 'San Pedro' },
    { name: 'Ramon Villanueva', barangay: 'Maimpis' },
    { name: 'Fe Domingo', barangay: 'Del Pilar' },
    { name: 'Arturo Salazar', barangay: 'Pulung Bulu' },
    { name: 'Corazon Lim', barangay: 'Sindalan' },
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

    for (const { name, barangay } of FARMERS) {
        const existing = await strapi
            .documents(FARMER_UID)
            .findFirst({ filters: { name: { $eq: name } } })

        if (existing) {
            skipped.push(name)
            continue
        }

        // Relations are addressed by documentId, not by name.
        const parent = await strapi
            .documents(BARANGAY_UID)
            .findFirst({ filters: { name: { $eq: barangay } } })

        if (!parent) {
            throw new Error(
                `Cannot seed farmer "${name}": barangay "${barangay}" does not exist`
            )
        }

        const entry = await strapi.documents(FARMER_UID).create({
            data: {
                name,
                farmer_status: 'Active',
                barangays: [parent.documentId],
            },
        })

        created.push(`${entry.farmer_code} ${name} — ${barangay}`)
    }

    console.log(
        `farmers: ${created.length} created, ${skipped.length} already present`
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
