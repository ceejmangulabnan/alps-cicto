import { version } from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    // The whole app hard-codes light Tailwind colours, so Nuxt UI's theme
    // tokens (e.g. the dropdown hover `--ui-bg-elevated`) must stay in light
    // mode too. With the default `preference: 'system'` a dark OS flips the
    // `dark` class onto <html> and every Nuxt UI surface turns dark.
    colorMode: {
        preference: 'light',
        fallback: 'light',
    },
    modules: [
        '@nuxt/ui',
        '@nuxtjs/leaflet',
        'nuxt-maplibre',
        'nuxt-auth-utils',
    ],
    css: ['~/assets/css/main.css'],
    app: {
        head: {
            link: [
                {
                    rel: 'icon',
                    type: 'image/svg+xml',
                    href: '/animap.svg',
                },
            ],
        },
    },
    vite: {
        optimizeDeps: {
            exclude: ['maplibre-gl'],
        },
    },
    runtimeConfig: {
        // Private key: used server-side by the Strapi proxy. Overridden by
        // NUXT_STRAPI_URL. `public.strapiUrl` below stays for media URLs that
        // the browser loads directly from Strapi.
        strapiUrl: 'http://localhost:1337',
        public: {
            maptilerKey: '',
            strapiUrl: '',
            appVersion: version,
        },
    },
})
