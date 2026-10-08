import { NEUTRAL_COLOR } from '~/utils/analytics'

/**
 * Crop name -> display colour, shared by the crops and harvest registries.
 *
 * The maps live in both pages today; this is the single copy. `crop` is free
 * text, so the lookup falls back to the neutral grey for anything unlisted
 * rather than failing.
 */
const CROP_COLOR_BY_NAME: Record<string, string> = {
    Rice: '#16a34a',
    Corn: '#ca8a04',
    Sugarcane: '#d97706',
    Vegetables: '#059669',
    Eggplant: '#7c3aed',
    Tomato: '#dc2626',
}

/** Colour for a crop name, or the neutral grey when it is unlisted. */
export const cropColor = (name: string | null | undefined): string =>
    CROP_COLOR_BY_NAME[name ?? ''] ?? NEUTRAL_COLOR
