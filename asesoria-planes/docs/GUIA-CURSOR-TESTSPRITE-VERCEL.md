# Guía de ejecución con cuentas propias (Cursor · TestSprite · Stripe · Vercel)

Esta guía reproduce, con tus cuentas, la parte del flujo que requiere servicios externos. Tiempo estimado: 45–60 min.

## 1. Cursor (IDE con IA)
1. Abre la carpeta `asesoria-planes` en Cursor. Las reglas del proyecto están en `.cursor/rules/asesoria-planes.mdc`.
2. Prompts usados/recomendados (Composer, modelo Claude o GPT):
   - "Genera una app Next.js 15 (App Router, TS) con catálogo de 3 planes, checkout con Stripe Checkout en modo suscripción, páginas de éxito/cancelado, cuenta con cookie firmada y un proveedor de pagos mock intercambiable para pruebas."
   - "Añade data-testid estables en español a todos los elementos interactivos y role=alert a los errores."
   - "A partir de testsprite_tests/testsprite_frontend_test_plan.json implementa las pruebas en Playwright con localizadores auto-curables."
3. Captura: el Composer con la conversación y el árbol del proyecto (evidencia del criterio "aplicación generada con Cursor").

## 2. Stripe (modo test)
1. dashboard.stripe.com → Developers → API keys (modo test) → copia `sk_test_…`.
2. (Opcional) Products → crea 3 precios recurrentes mensuales (19, 49, 199 USD) y copia sus `price_…` a `STRIPE_PRICE_*`.
3. Webhook: Developers → Webhooks → endpoint `https://<app>.vercel.app/api/webhook`, evento `checkout.session.completed` → copia `whsec_…`.
4. Pago de prueba: tarjeta `4242 4242 4242 4242`, fecha futura, CVC cualquiera.

## 3. Vercel (despliegue automático)
1. vercel.com → Add New → Project → importa `manularrea/asesoria-testing`, **Root Directory: asesoria-planes**, framework Next.js.
2. Environment Variables: `PAYMENTS_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUBSCRIPTION_SECRET`, `MOCK_SIGNING_SECRET`.
3. Deploy. Cada push a `main` redespliega (integración Git) y, además, el workflow `deploy-planes.yml` ejecuta E2E → deploy → smoke
   (requiere `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` en GitHub → Settings → Secrets; los IDs están en `.vercel/project.json` tras `vercel link`).
4. Captura: dashboard de Vercel con el deployment "Ready" y la URL; `https://<app>.vercel.app/api/health` debe responder `paymentsProvider: "stripe"`.

## 4. TestSprite (MCP en Cursor)
1. testsprite.com → Sign up → Settings → API Keys → crea una clave.
2. Cursor → Settings → MCP → Add: nombre `TestSprite`, comando `npx @testsprite/testsprite-mcp@latest`, env `API_KEY=<clave>` (o edita `.cursor/mcp.json`).
3. Levanta la app local: `PAYMENTS_PROVIDER=mock npm run dev` (puerto 3000).
4. En el chat de Cursor (modo Agent): **"Help me test this project with TestSprite"**. Responde: tipo *frontend*, puerto *3000*, alcance *codebase*, sin login.
5. TestSprite genera `testsprite_tests/standard_prd.json` y `testsprite_frontend_test_plan.json`; compáralos con los incluidos (puedes pedirle
   "usa el plan existente en testsprite_tests/testsprite_frontend_test_plan.json como base"). Ejecuta las pruebas desde el chat.
6. Resultado: `testsprite_tests/testsprite-mcp-test-report.md` y el dashboard en testsprite.com (capturas: resumen de pasados/fallidos, detalle de un caso con video).
7. Para la URL de Vercel repite con alcance *frontend* y la URL pública (Stripe en modo test: TestSprite llegará hasta la página de Stripe Checkout).

## 5. Qué capturas necesita el informe
| Figura | Captura |
|---|---|
| Cursor | Composer generando/ajustando la app |
| Vercel | Deployment Ready + URL pública + /api/health |
| Stripe | Checkout alojado con el plan y pago de prueba exitoso (Payments en modo test) |
| TestSprite | Dashboard con el resumen de la ejecución y el detalle de un caso |
| GitHub Actions | Workflow deploy-planes en verde (e2e → deploy → smoke-prod) |
