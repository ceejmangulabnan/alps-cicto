import type { LandStatus } from '~/composables/useFarmParcelApi'

/**
 * The palette and hashing the farmers registry used before the pages were
 * modularized. The app-wide `utils/initials.ts` versions use different colours
 * and a different hash, so those are NOT interchangeable here: reusing them
 * would silently repaint every farmer avatar.
 */
export const FARMER_AVATAR_COLORS = [
    '#2d6a2d',
    '#1d6fa4',
    '#7c3aed',
    '#b45309',
    '#0f766e',
    '#be123c',
]

/** First letters of the first two words, uppercased. */
export function farmerInitials(name: string): string {
    const letters = name
        .split(' ')
        .map((part) => part[0] ?? '')
        .slice(0, 2)
    return letters.join('').toUpperCase()
}

/**
 * Stable colour per name, so the same person keeps the same avatar across the
 * registry table and their profile.
 */
export function farmerAvatarColor(name: string): string {
    const hash = name
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return FARMER_AVATAR_COLORS[hash % FARMER_AVATAR_COLORS.length] ?? '#2d6a2d'
}

/** Tailwind status-pill class for a parcel's land status on farmer profiles. */
export function farmerParcelStatusClass(status: LandStatus): string {
    switch (status) {
        case 'At Risk':
            return 'status-atrisk'
        case 'Cultivated':
            return 'status-cultivated'
        case 'Idle':
            return 'status-idle'
        case 'Fallow':
            return 'status-fallow'
        case 'Harvesting':
            return 'status-harvesting'
        case 'Preparation':
            return 'status-preparation'
        case 'Converted':
            return 'status-converted'
        default:
            return 'status-idle'
    }
}
