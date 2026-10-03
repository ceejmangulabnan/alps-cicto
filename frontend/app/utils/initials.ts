const AVATAR_COLORS = [
    '#2d6a2d',
    '#3b82f6',
    '#7c3aed',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#db2777',
    '#65a30d',
]

/** First letters of the first two words, uppercased. */
export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

/**
 * Stable colour per name, so the same person keeps the same avatar across the
 * farm list, the parcel list and the farm detail panel.
 */
export function avatarColor(name: string): string {
    let hash = 0
    for (const character of name) {
        hash = (hash * 31 + character.charCodeAt(0)) % AVATAR_COLORS.length
    }
    // The modulo above keeps the index inside the palette, but the index
    // signature is still read as possibly-undefined under
    // noUncheckedIndexedAccess, so fall back rather than return undefined.
    return AVATAR_COLORS[hash] ?? '#2d6a2d'
}
