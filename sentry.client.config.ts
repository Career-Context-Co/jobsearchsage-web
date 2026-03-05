import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,

  tracesSampleRate: 0.5,

  replaysSessionSampleRate: 0.5,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  enableLogs: true,
  sendDefaultPii: true,
  debug: false,
});
