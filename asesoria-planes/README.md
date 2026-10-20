# AsesorIA Planes · MVP con pasarela de pagos (Unidad 4)

Portal de suscripción del asistente AsesorIA: catálogo de planes → checkout → **Stripe Checkout** (modo test) → confirmación → activación.
Next.js 15 (App Router, TypeScript) · despliegue automático en **Vercel** · pruebas E2E generadas a partir de un plan estilo **TestSprite**.

| Ruta | Función |
|---|---|
| `/` · `/planes` | Landing y catálogo (Básico USD 19, Pro USD 49, Enterprise USD 199) |
| `/checkout?plan=` | Resumen + correo de facturación → `POST /api/checkout` crea la sesión de pago |
| Stripe Checkout o `/checkout/mock` | Página alojada de pago (real en Stripe; simulada con `PAYMENTS_PROVIDER=mock`) |
| `/exito?session_id=` · `/cancelado` | Confirmación verificada en servidor / cancelación con reintento |
| `/cuenta` | Suscripción activa (cookie firmada), cancelar |
| `/api/health` · `/api/session/:id` · `/api/webhook` · `/api/activar` | API y webhook de Stripe |

## Ejecutar

```bash
npm install
cp .env.example .env.local            # PAYMENTS_PROVIDER=mock para probar sin Stripe
npm run dev                            # http://localhost:3000
npm run build && npm start             # producción local
```

Con Stripe real: `PAYMENTS_PROVIDER=stripe`, `STRIPE_SECRET_KEY=sk_test_…` (y `STRIPE_WEBHOOK_SECRET` si se prueba el webhook con `stripe listen --forward-to localhost:3000/api/webhook`). Tarjeta de prueba: `4242 4242 4242 4242`.

## Pruebas E2E (plan TestSprite → Playwright)

```bash
npx playwright install chromium
npm run test:e2e                       # levanta la app en modo mock y ejecuta TC001..TC012
BASE_URL=https://<app>.vercel.app npx playwright test tests/e2e/api.spec.ts tests/e2e/catalogo.spec.ts   # smoke en Vercel
npm run test:e2e:report
```

- `testsprite_tests/standard_prd.json` — PRD de entrada para TestSprite.
- `testsprite_tests/testsprite_frontend_test_plan.json` — plan de 12 casos (functional, error handling, security, api).
- `tests/e2e/*.spec.ts` — implementación de los casos; `tests/support/healing.ts` — localizadores auto-curables (registro en `test-results/healing-log.json`).
- `testsprite_tests/*.log` — ejecuciones (primera con fallos, final en verde).

## TestSprite + Cursor

1. En Cursor: `Settings → MCP` (o `.cursor/mcp.json` de este proyecto) con `@testsprite/testsprite-mcp` y tu `API_KEY`.
2. Levanta la app (`PAYMENTS_PROVIDER=mock npm run dev`) y en el chat de Cursor: *"Help me test this project with TestSprite"* → tipo **frontend**, puerto **3000**, alcance **codebase**.
3. Revisa el PRD y el plan generados (compáralos con `testsprite_tests/`), ejecuta y guarda `testsprite_tests/testsprite-mcp-test-report.md`.

## Despliegue

`.github/workflows/deploy-planes.yml`: E2E (mock) → `vercel deploy --prod` → smoke contra la URL pública. Secretos: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. En Vercel: *Root Directory* = `asesoria-planes`, variables `PAYMENTS_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUBSCRIPTION_SECRET`.
