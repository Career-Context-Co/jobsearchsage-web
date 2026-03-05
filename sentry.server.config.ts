import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,

  tracesSampleRate: 0.5,

  enableLogs: true,
  sendDefaultPii: true,
  debug: false,
});
