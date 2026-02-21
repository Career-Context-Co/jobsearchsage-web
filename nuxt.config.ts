// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export default defineNuxtConfig({
  hooks: {
    ready(nuxt) {
      const precomputedPath = join(nuxt.options.buildDir, 'dist', 'server', 'client.precomputed.mjs')
      const dir = dirname(precomputedPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      if (!existsSync(precomputedPath)) {
        writeFileSync(precomputedPath, 'export default {}\n')
      }
    }
  },

  runtimeConfig: {
    aiGatewayApiKey: process.env.NUXT_AI_GATEWAY_API_KEY,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appRedirectUrl: process.env.NUXT_PUBLIC_APP_REDIRECT_URL || 'http://localhost:3000/api/auth/callback'
    }
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