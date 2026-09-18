// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    modules: ['@nuxt/ui', '@nuxtjs/leaflet', 'nuxt-maplibre'],
    css: ['~/assets/css/main.css'],
    vite: {
        optimizeDeps: {
            exclude: ['maplibre-gl'],
        },
    },
    runtimeConfig: {
        public: {
            maptilerKey: '',
            strapiUrl: '',
        },
    },
})
