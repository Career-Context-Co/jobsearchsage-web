import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@posthog/nuxt',
    '@sentry/nuxt/module'
  ],

  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    aiGatewayApiKey: process.env.NUXT_AI_GATEWAY_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL,
      appRedirectUrl: process.env.NUXT_PUBLIC_APP_REDIRECT_URL,
      posthog: {
        publicKey: process.env.NUXT_PUBLIC_POSTHOG_KEY || '',
        host: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
      },
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ''
      }
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    rollupConfig: {
      external: ['pdf-parse', 'pdfjs-dist']
    }
  },

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

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  posthogConfig: {
    publicKey: process.env.NUXT_PUBLIC_POSTHOG_KEY || '',
    host: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    clientConfig: {
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false
    }
  },

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/signin',
      callback: '/confirm',
      exclude: ['/signin', '/confirm']
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    }
  },

  sentry: {
    org: 'careercontext',
    project: 'jobsearchsage-web'
  },

  sourcemap: {
    client: 'hidden'
  }
})