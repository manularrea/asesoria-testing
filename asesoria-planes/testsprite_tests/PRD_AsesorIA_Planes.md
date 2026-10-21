# PRD · AsesorIA Planes (portal de suscripción con pasarela de pagos)

Versión 0.1.0 · 2026-10-20 · Manuela Larrea (con asistencia de agente de IA)

## 1. Descripción del producto

AsesorIA Planes es el portal de suscripción del asistente de IA para asesores financieros. Permite comparar planes, iniciar una suscripción mensual pagando con Stripe Checkout (modo test) y activar la cuenta tras la confirmación del pago. Está construido con Next.js 15 (App Router, TypeScript), se despliega automáticamente en Vercel desde GitHub y expone una capa de pagos intercambiable (Stripe / mock) para pruebas deterministas en CI.

## 2. Objetivos

- Convertir visitantes en suscriptores con un flujo de pago de tres pasos (plan → datos → pasarela).
- Nunca almacenar datos de tarjeta: el cobro ocurre en la página alojada del proveedor.
- Garantizar que solo un pago confirmado activa la suscripción (verificación servidor a servidor de la sesión).
- Ser verificable de extremo a extremo por agentes de prueba (TestSprite, Playwright) sin cargos reales.

## 3. Funcionalidades

### F1 · Landing y catálogo

Página de inicio con propuesta de valor, CTA y resumen de planes; catálogo /planes con tres planes (Básico USD 19, Pro USD 49 destacado, Enterprise USD 199) y botón Suscribirse por plan.

### F2 · Checkout

Página /checkout?plan=<id> con resumen del plan y formulario de correo de facturación; valida el correo y crea la sesión de pago vía POST /api/checkout; plan inexistente → 404.

### F3 · Pasarela de pagos

Proveedor Stripe (Checkout, suscripción mensual, success/cancel URLs, webhook firmado) o proveedor mock stateless (sesión firmada HMAC, página simulada con tarjeta de prueba 4242…, pagar/cancelar).

### F4 · Confirmación y activación

/exito?session_id= verifica la sesión en el servidor y muestra plan, importe, correo y referencia solo si paymentStatus=paid; botón Activar crea una cookie firmada con la suscripción; /cancelado permite reintentar.

### F5 · Mi cuenta

/cuenta muestra la suscripción activa (plan, correo, fecha, proveedor) y permite cancelarla; sin suscripción invita a ver planes; la cabecera muestra el plan activo.

### F6 · API y observabilidad

GET /api/health (estado, proveedor, commit), GET /api/session/{id}, POST /api/webhook (Stripe), POST /api/activar, DELETE /api/activar.

## 4. Flujos de usuario

1. Visitante → Landing → Ver planes → Suscribirse (Pro) → Checkout (correo) → Pasarela → Pago exitoso → /exito → Activar → /cuenta con plan Pro.
2. Visitante → Checkout → Pasarela → Cancelar → /cancelado → Reintentar → Checkout del mismo plan.
3. Visitante con suscripción → /cuenta → Cancelar suscripción → /planes (sin plan activo).

## Validation criteria

- Los precios mostrados en landing, catálogo, checkout, pasarela y confirmación coinciden con el catálogo.
- Un correo inválido no crea sesión de pago y muestra un error accesible (role=alert).
- Una sesión de pago no confirmada, manipulada o inexistente nunca muestra la pantalla de éxito ni activa la suscripción (402).
- La cancelación en la pasarela no activa ninguna suscripción.
- Todas las acciones críticas tienen identificadores estables (data-testid) y nombres accesibles para localizadores resilientes.

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Stripe SDK
- Vercel
- GitHub Actions
- Playwright 1.56
- TestSprite MCP

## Test environment

- **local**: http://localhost:3000 con PAYMENTS_PROVIDER=mock
- **staging**: URL de Vercel (preview) con Stripe en modo test
- **credentials**: tarjeta de prueba Stripe 4242 4242 4242 4242, cualquier fecha futura y CVC

## Entorno de pruebas

URL pública: https://asesoria-planes.vercel.app (proveedor de pagos simulado: la pasarela es /checkout/mock con tarjeta 4242 4242 4242 4242; no hay cargos reales). Sin inicio de sesión. Identificadores estables data-testid en todos los elementos interactivos.