// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    aiGatewayApiKey: process.env.NUXT_AI_GATEWAY_API_KEY
  },
  ssr: false,
  
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/supabase',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  nitro: {
    rollupConfig: {
      external: ['pdf-parse', 'pdfjs-dist']
    }
  },

  compatibilityDate: '2024-07-11',

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/signin',
      callback: '/confirm',
      exclude: ['/signin', '/confirm']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})