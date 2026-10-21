# TestSprite · Reporte de ejecución en la nube (portal web)

Proyecto: **AsesorIA Planes (Unidad 4)** · Frontend UI · URL `https://asesoria-planes.vercel.app` · sin inicio de sesión · PRD: `PRD_AsesorIA_Planes.pdf` (generado desde `standard_prd.json`).

## 1. Exploración autónoma (Sources)

1 agente · 3 pasos · 8 páginas capturadas · 53 s. Páginas identificadas: `/` ("view and select subscription plans"), `/planes` ("choose a subscription plan"), `/cuenta`. El agente detectó los tres planes, sus precios (USD 19 / 49 / 199) y el botón Suscribirse.

## 2. Plan de pruebas generado

TestSprite propuso **43 pruebas en 6 casos de uso** (Landing y catálogo; Selección de plan y checkout; Pasarela de pago simulada; Confirmación y activación; Mi cuenta y estado de suscripción; Validaciones de estado y sesión). El plan era redundante: cada caso de uso repetía los mismos siete flujos (catálogo, suscripción Pro, pago completo, cancelación y reintento, correo inválido, 404 de plan, tarjeta rechazada). Se revisó el plan y se seleccionaron **11 pruebas únicas** (equivalentes a TC001–TC012 del plan del repositorio, salvo TC010/TC012):

| Caso de uso | Prueba | Prioridad |
|---|---|---|
| Landing y catálogo de planes | Ver landing y catálogo de planes | High |
| Landing y catálogo de planes | Suscribirse al plan Pro desde el catálogo | High |
| Landing y catálogo de planes | Completar checkout, pago y activación del plan Pro | High |
| Landing y catálogo de planes | Cancelar el pago y reintentar desde la pantalla de cancelación | Medium |
| Landing y catálogo de planes | Validar correo inválido en checkout | Medium |
| Landing y catálogo de planes | Mostrar 404 para un plan inexistente | Medium |
| Landing y catálogo de planes | Rechazo de tarjeta en la pasarela simulada | Medium |
| Pasarela de pago simulada | Ver cuenta sin suscripción activa | Low |
| Mi cuenta y estado de suscripción | Mostrar estado de cuenta tras activación de suscripción | High |
| Validaciones de estado y sesión | Activar suscripción sin pago confirmado | Medium |
| Validaciones de estado y sesión | Estado de salud de la aplicación | Low |

## 3. Ejecución 1 · 2026-10-20 21:29 · 11 pruebas · commit 8373c53

**9 Passed · 1 Failed · 1 Blocked · Pass rate 82 %** (88,9 % sobre el subconjunto ejecutable).

Diagnóstico de TestSprite (texto original):

> The hosting/app flow is likely using a generic fallback after payment cancellation: when Stripe (or the payment provider) sends the user back, the app does not retain the original plan context, so the "Reintentar" button points to the plans catalog (/planes) rather than regenerating or reopening the Pro checkout.

Fix prompt generado por TestSprite ("Copy Fix Prompt"):

> 1) Cancelar el pago y reintentar desde la pantalla de cancelación — What we observed: "Reintentar no volvió al checkout del plan Pro; terminó mostrando el catálogo de planes." Likely root cause: UI bug. Suggested fix: wire the retry CTA on the cancelation page to the saved Pro checkout route/state.
> 2) Activar suscripción sin pago confirmado — What we observed: "/exito muestra «No encontramos un pago confirmado»". Suggested fix: add a visible recovery action on /exito for the no-confirmed-payment state.

### Revisión de cada hallazgo

| Prueba | Resultado | Revisión | Decisión |
|---|---|---|---|
| Cancelar el pago y reintentar | Failed | **Defecto real.** `MockGateway` redirigía a `/cancelado` sin `?plan=`, mientras que `StripeProvider` sí envía `cancel_url=/cancelado?plan=<id>`; por eso "Reintentar" caía en `/planes`. La prueba propia TC008 no lo detectó porque aceptaba `/(checkout\?plan=basico|planes)/` (expectativa laxa). | Corregido en `components/MockGateway.tsx` (conserva el plan) y TC008 ahora exige `/checkout?plan=basico`. |
| Activar suscripción sin pago confirmado | Blocked | **Limitación del agente UI, no defecto.** El control está en la API (`POST /api/activar` → 402 sin pago); el agente visitó `/api/activar` con GET y obtuvo 405, y en `/exito` sin sesión válida no existe botón Activar por diseño (no debe existir). La sugerencia de "añadir una acción de recuperación en /exito" se descartó: expondría la activación sin pago. | Caso cubierto por TC010/TC011 (Playwright, nivel API). Se documenta como falso positivo del diagnóstico de IA. |

## 4. Ejecución 2 (re-run de las 2 pruebas) · 2026-10-20 21:38 · commit 51f2185

**1 Passed · 0 Failed · 1 Blocked.** "Cancelar el pago y reintentar" pasa contra el nuevo despliegue (ci + deploy-planes en verde). "Activar sin pago" sigue bloqueada por la razón anterior (el agente no puede emitir un POST).

## 5. Comparación TestSprite vs. Playwright (mismo plan, mismo despliegue)

| Aspecto | TestSprite (nube, agente IA) | Playwright (repositorio, CI) |
|---|---|---|
| Generación del plan | Automática desde PRD + exploración (43 casos, redundantes) | Escrito a partir del plan TestSprite del repo (12 casos) |
| Ejecución | 11 pruebas ≈ 3 min, con video por caso | 12 pruebas en 14 s (mock) |
| Hallazgos | 1 defecto real (reintento sin plan) + 1 bloqueo por diseño | 1 defecto real (cabecera no refresca) + 2 curaciones de localizadores |
| Falsos positivos | Diagnóstico del caso bloqueado (propone exponer activación sin pago) | 4 expectativas incorrectas en la 1.ª ejecución |
| Self-healing | Fix prompt para el agente del IDE; re-run selectivo | Localizadores con estrategias alternativas + healing-log |
| Uso recomendado | Descubrimiento y revisión exploratoria antes de cada release | Compuerta determinista del despliegue (job e2e) |
