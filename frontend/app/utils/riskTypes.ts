import type { RiskSeverity } from '~/composables/useFarmParcelApi'

/**
 * The vocabulary the risk rules share: the severity scale the forms offer, the
 * risk types the registry suggests, and the fold that collapses free text onto
 * a canonical label.
 *
 * `risk_type` is deliberately a free-text field on the report — an officer
 * should be able to write what they actually saw — so the grouping has to
 * normalise on the way into an insight rather than restrict what can be saved.
 * The synonym rules below are what make "flood", "Flooding" and "flood risk"
 * land in one bucket instead of three.
 */

export const RISK_SEVERITY_OPTIONS: RiskSeverity[] = [
    'Critical',
    'High',
    'Medium',
    'Low',
]

/** The types the form suggests; the registry adds whatever is already in use. */
export const SUGGESTED_RISK_TYPES = [
    'Flood & Waterlogging',
    'Drought Stress',
    'Soil Erosion',
    'Pest Infestation',
    'Crop Disease',
    'Typhoon Damage',
    'Soil Fertility Decline',
    'Salinity',
]

/**
 * Substring rules, first match wins. Kept as data (rather than a switch) so the
 * grouping is inspectable and can be extended without touching the fold.
 */
export const RISK_TYPE_RULES: { label: string; patterns: string[] }[] = [
    {
        label: 'Flood & Waterlogging',
        patterns: ['flood', 'waterlog', 'inundat', 'drainage', 'standing water'],
    },
    {
        label: 'Drought Stress',
        patterns: ['drought', 'dry spell', 'water shortage', 'moisture stress'],
    },
    {
        label: 'Soil Erosion',
        patterns: ['erosion', 'landslide', 'gully', 'sediment', 'slope'],
    },
    {
        label: 'Pest Infestation',
        patterns: [
            'pest',
            'insect',
            'locust',
            'rodent',
            'rat',
            'worm',
            'aphid',
            'borer',
        ],
    },
    {
        label: 'Crop Disease',
        patterns: [
            'disease',
            'fung',
            'blight',
            'rust',
            'virus',
            'wilt',
            'mildew',
            'bacterial',
        ],
    },
    {
        label: 'Typhoon Damage',
        patterns: ['typhoon', 'storm', 'strong wind', 'wind damage'],
    },
    {
        label: 'Soil Fertility Decline',
        patterns: ['fertil', 'nutrient', 'deficien', 'acidity', 'organic matter'],
    },
    {
        label: 'Salinity',
        patterns: ['salin', 'salt'],
    },
]

export const UNCLASSIFIED_RISK = 'Unclassified'

/**
 * The canonical label for a raw risk type. Unknown text keeps its trimmed
 * original, so a type nobody anticipated still reads as itself.
 */
export const normalizeRiskType = (raw: string | null | undefined): string => {
    const value = (raw ?? '').trim()
    if (!value) return UNCLASSIFIED_RISK

    const lower = value.toLowerCase()
    for (const rule of RISK_TYPE_RULES) {
        if (rule.patterns.some((pattern) => lower.includes(pattern))) {
            return rule.label
        }
    }

    return value
}

/**
 * What a response to each canonical risk looks like. The fold appends the live
 * counts, so a recommendation talks about the parcels it is actually about.
 */
export const RISK_PLAYBOOK: Record<string, string> = {
    'Flood & Waterlogging':
        'Clear and re-cut drainage, then verify the outfall before the next rains.',
    'Drought Stress':
        'Prioritise irrigation or water hauling, and mulch to hold soil moisture.',
    'Soil Erosion':
        'Establish contour barriers or vegetative strips before the next heavy rain.',
    'Pest Infestation':
        'Scout the block, confirm the threshold, and coordinate a timed treatment.',
    'Crop Disease':
        'Isolate affected rows, confirm the pathogen, and remove infected material.',
    'Typhoon Damage':
        'Assess lodging and stem damage, then plan replanting for the worst-hit parcels.',
    'Soil Fertility Decline':
        'Pull composite soil samples and schedule corrective fertilisation.',
    Salinity: 'Flush and amend the affected area, and check the irrigation source.',
}

export const DEFAULT_RECOMMENDATION =
    'Validate the finding on the ground and log the corrective action.'
