# Reporte de pruebas · AsesorIA Planes (plan estilo TestSprite ejecutado con Playwright)

> Nota: este reporte sigue la estructura del informe que genera el MCP de TestSprite (`testsprite-mcp-test-report.md`), pero la ejecución
> se realizó localmente con Playwright 1.56 sobre el mismo plan (`testsprite_frontend_test_plan.json`) y la app en modo `PAYMENTS_PROVIDER=mock`.
> La ejecución en la nube de TestSprite (desde Cursor) queda documentada en `docs/GUIA-CURSOR-TESTSPRITE-VERCEL.md` §4.

## 1. Metadatos
- Proyecto: asesoria-planes · Fecha: 2026-10-20 · Tipo: frontend (Next.js 15) · Entorno: http://localhost:3100 (mock) · Navegador: Chromium 141

## 2. Resumen
| Ejecución | Pasaron | Fallaron | Duración | Curaciones de localizadores |
|---|---|---|---|---|
| 1 (plan recién implementado) | 7 | 5 | 45,3 s | 1 |
| 2 (tras correcciones) | 12 | 0 | 14,0 s | 2 |

## 3. Resultados por caso (ejecución final)
| ID | Caso | Categoría | Estado | Hallazgo en la ejecución 1 |
|---|---|---|---|---|
| TC001 | Landing: propuesta de valor, CTA y resumen de planes | functional | ✅ | Formato de moneda (`$19` vs `USD 19`) y aserción multi-elemento mal planteada → corregidos |
| TC002 | Catálogo con precios correctos y plan Pro destacado | functional | ✅ | Formato de moneda → se fijó `USD 49` explícito en `formatUsd` |
| TC003 | Checkout muestra plan y precio | functional | ✅ | Localizador primario obsoleto (`btn-subscribe-pro`) → auto-curado por rol+nombre |
| TC004 | Correo inválido no redirige | error handling | ✅ | `getByRole('alert')` ambiguo (route announcer de Next.js) → `data-testid` |
| TC005 | Plan inexistente → 404 | error handling | ✅ | — |
| TC006 | Pago exitoso extremo a extremo | functional | ✅ | Formato de moneda; `btn-pay` auto-curado por rol+nombre |
| TC007 | Activar suscripción refleja plan en cuenta y cabecera | functional | ✅ | **Defecto de producto**: la cabecera no se refrescaba tras `router.push` → `router.refresh()` |
| TC008 | Cancelar en pasarela y reintentar | functional | ✅ | — |
| TC009 | Tarjeta inválida rechazada | error handling | ✅ | — |
| TC010 | Sesión manipulada no confirma ni activa | security | ✅ | — |
| TC011 | Contrato de la API | api | ✅ | — |
| TC012 | Cancelar suscripción desde Mi cuenta | functional | ✅ | — |

## 4. Clasificación de los hallazgos
| Tipo | Casos | Acción |
|---|---|---|
| Defecto de producto | TC007 | Corregido en `components/ActivarButton.tsx` (refresco del layout RSC) |
| Expectativa incorrecta de la prueba | TC001, TC002, TC006 (moneda); TC001 (aserción de lista) | Se fijó un formato de moneda determinista y se corrigió la aserción |
| Localizador frágil / ambiguo | TC004 (`role=alert`) | Sustituido por `data-testid`; patrón documentado |
| Localizador obsoleto (simulado) | TC003, TC006 | Auto-curado por `tests/support/healing.ts`; registrado en `test-results/healing-log.json` |

## 5. Evidencia
- `ejecucion_1_fallos.log`, `ejecucion_2_final.log` — salida completa de Playwright.
- `../playwright-report/index.html` — reporte HTML; `../test-results/evidencia/*.png` — capturas de TC006/TC007; `healing-log.json`.
