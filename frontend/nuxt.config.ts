import { version } from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
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
