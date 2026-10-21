// Genera el documento de planificación de pruebas (docx) - Actividad Evaluativa Unidad 1
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, BorderStyle, ShadingType, ImageRun, Footer, Header, PageNumber, LevelFormat,
  VerticalAlign, PageBreak,
} = require("docx");

// ---------- estilos base ----------
const FONT = "Calibri";
const BODY = 20;      // 9.5 pt (half-points)
const SMALL = 16;     // 7.5 pt
const TINY = 14;      // 7 pt
const BLUE = "0B5CAD";
const GREY = "5B6675";
const LINE = "C9D2DE";
const HEAD_FILL = "E3ECF7";
const ALT_FILL = "F6F8FB";
const PAGE_W = 12240, MARGIN = 1000; // carta, 1.76 cm
const USABLE = PAGE_W - 2 * MARGIN;   // 10080 DXA

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || BODY, bold: opts.bold, italics: opts.italics,
    color: opts.color, ...opts });
}
function p(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [run(text, opts)];
  return new Paragraph({ children: runs, spacing: { after: opts.after ?? 50, line: opts.line ?? 236 },
    alignment: opts.align || AlignmentType.JUSTIFIED, keepNext: opts.keepNext });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 120, after: 40 }, keepNext: true,
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: BLUE })] });
}
function bullets(items) {
  return items.map(t => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 30, line: 240 },
    alignment: AlignmentType.JUSTIFIED,
    children: Array.isArray(t) ? t : [run(t)] }));
}
function cell(content, width, opts = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(c =>
    typeof c === "string"
      ? new Paragraph({ spacing: { after: 0, line: 240 }, alignment: opts.align || AlignmentType.LEFT,
          children: [run(c, { size: opts.size || SMALL, bold: opts.bold, color: opts.color })] })
      : c);
  return new TableCell({ children: paras, width: { size: width, type: WidthType.DXA }, borders,
    verticalAlign: VerticalAlign.CENTER, margins: { top: 15, bottom: 15, left: 55, right: 55 },
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined });
}
function table(headers, rows, widths, opts = {}) {
  const size = opts.size || SMALL;
  const headRow = new TableRow({ tableHeader: true, children: headers.map((h, i) =>
    cell(h, widths[i], { bold: true, fill: HEAD_FILL, size })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) =>
    cell(c, widths[i], { size, fill: ri % 2 ? ALT_FILL : undefined, bold: opts.boldFirst && i === 0 })) }));
  return new Table({ rows: [headRow, ...body], width: { size: USABLE, type: WidthType.DXA }, columnWidths: widths,
    layout: "fixed" });
}
function spacer(after = 60) { return new Paragraph({ spacing: { after }, children: [] }); }
function code(lines) {
  return lines.map(l => new Paragraph({ spacing: { after: 0, line: 220 },
    shading: { type: ShadingType.CLEAR, fill: "F3F5F9", color: "auto" }, indent: { left: 120 },
    children: [new TextRun({ text: l, font: "Consolas", size: 14 })] }));
}
function img(path, w, h) {
  return new ImageRun({ type: "png", data: fs.readFileSync(path), transformation: { width: w, height: h } });
}

const W = (...pct) => pct.map(x => Math.round(USABLE * x / 100));

// ---------- contenido Unidad 4 ----------
function figure(file, caption, widthPx) {
  const im = require("child_process").execSync(`python3 -c "from PIL import Image; im=Image.open('evidencia-u4/${file}'); print(im.size[0], im.size[1])"`).toString().trim().split(" ").map(Number);
  const w = widthPx, h = Math.round(im[1] * w / im[0]);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 20 }, keepNext: true,
      children: [new ImageRun({ type: "png", data: fs.readFileSync(`evidencia-u4/${file}`), transformation: { width: w, height: h } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [run(caption, { size: TINY, color: GREY, italics: true })] }),
  ];
}
const FIGW = 620;
const plan = JSON.parse(fs.readFileSync("../asesoria-planes/testsprite_tests/testsprite_frontend_test_plan.json", "utf8"));

const meta = table(["Estudiante", "Fecha", "Caso de estudio", "Herramientas"],
  [["Manuela Larrea", "20 de octubre de 2026", "AsesorIA Planes · portal de suscripción con pasarela de pagos (MVP propio, continuación del proyecto del curso)",
    "Cursor + agente de IA · Next.js 15 · Stripe Checkout (test) · Vercel · GitHub Actions · TestSprite (MCP) · Playwright 1.56"]],
  W(15, 16, 36, 33), { size: SMALL });

const s1 = [
  p("El caso analizado es propio: AsesorIA, el asistente de IA para asesores financieros desarrollado durante el curso, necesita un canal de venta por suscripción. El flujo de pago es el escenario E2E más exigente de una aplicación web porque atraviesa tres dominios de confianza (la aplicación, la página alojada de la pasarela y el servidor que verifica el pago) y porque los fallos tienen costo económico y regulatorio. Por eso se eligió para evaluar la automatización de pruebas E2E con agentes de IA: un agente debe ser capaz de leer la aplicación, derivar un plan de pruebas a partir de los requisitos, ejecutarlo contra un entorno real y explicar los fallos sin intervención manual."),
  p("La estrategia se diseñó en dos capas. La capa determinista corre en cualquier entorno sin cuentas externas: la app expone un proveedor de pagos simulado (mock) con sesiones firmadas que reproduce la página alojada de Stripe, de modo que el plan de pruebas completo se ejecuta en CI en 14 segundos. La capa real usa Stripe en modo test sobre el despliegue de Vercel, donde TestSprite ejecuta el mismo plan desde la nube. Esta separación es una buena práctica de testabilidad: las pruebas de IA se vuelven reproducibles y no dependen de la disponibilidad ni del coste de la pasarela."),
];

const mvpTable = table(["Capa", "Implementación", "Decisión de diseño"], [
  ["Frontend / páginas", "Next.js 15 App Router (TypeScript, React 19): /, /planes, /checkout, /checkout/mock, /exito, /cancelado, /cuenta", "Server Components para datos sensibles; estado del cliente mínimo; data-testid y nombres accesibles en todo elemento interactivo"],
  ["Pasarela de pagos", "lib/payments.ts: interfaz PaymentProvider con StripeProvider (Checkout en modo suscripción, success/cancel URL, metadata del plan, webhook firmado) y MockProvider (sesión HMAC stateless, página simulada con tarjeta 4242…)", "La app nunca ve datos de tarjeta; la confirmación se verifica en el servidor con retrieve antes de mostrar éxito o activar"],
  ["Activación y cuenta", "POST /api/activar valida paymentStatus=paid y emite una cookie firmada (HMAC) con plan, correo y referencia; /cuenta la lee; DELETE la revoca", "Sin base de datos en el MVP: el estado viaja firmado; un intento de activar sin pago responde 402"],
  ["API y observabilidad", "/api/health (proveedor, commit), /api/session/{id}, /api/webhook (Stripe), /api/mock/complete", "Contrato estable para pruebas de API y smoke tras el despliegue"],
  ["Generación con IA", "Código generado por un agente de IA y refinado en Cursor con reglas de proyecto (.cursor/rules) que fijan convenciones de testabilidad y seguridad", "Las reglas evitan que una regeneración rompa los testids del plan de pruebas"],
  ["Despliegue automatizado", "Vercel (Root Directory asesoria-planes) + workflow deploy-planes.yml: E2E con mock → vercel deploy --prod → smoke contra la URL pública", "El despliegue solo ocurre si el plan de pruebas pasa; el smoke valida salud, catálogo y API en producción"],
], W(16, 48, 36));

const s3intro = p("TestSprite es una plataforma de pruebas con agentes de IA que se integra en el IDE mediante un servidor MCP (@testsprite/testsprite-mcp): a partir del código y de un PRD genera un plan de pruebas, escribe y ejecuta los casos en su nube contra la aplicación (local por túnel o URL pública), y devuelve un reporte con causa raíz y sugerencias de corrección que el propio agente del IDE puede aplicar. La integración se preparó en tres artefactos del repositorio: la configuración del MCP (.cursor/mcp.json), el PRD estándar (testsprite_tests/standard_prd.json: visión, seis funcionalidades, flujos de usuario y criterios de validación) y el plan de pruebas en el formato de TestSprite (testsprite_frontend_test_plan.json). Cada caso se implementó además en Playwright (tests/e2e) para poder ejecutarlo en CI y comparar los resultados de ambos ejecutores sobre el mismo plan.");

const planTable = table(["ID", "Caso", "Categoría", "Prioridad", "Qué valida"], plan.map((t) => [t.id, t.title, t.category, t.priority, t.description]), W(7, 34, 12, 9, 38));

const tsFlow = table(["Paso", "Acción en Cursor + TestSprite", "Resultado"], [
  ["1", "Configurar el MCP con la API key y levantar la app (PAYMENTS_PROVIDER=mock, puerto 3000)", "Servidor MCP disponible en el chat de Cursor"],
  ["2", "Prompt: «Help me test this project with TestSprite» → frontend, puerto 3000, alcance codebase", "Bootstrap: TestSprite lee el código y pide/genera el PRD"],
  ["3", "Revisar standard_prd.json y testsprite_frontend_test_plan.json (comparar con los del repositorio)", "Plan de 12 casos aprobado"],
  ["4", "Ejecutar el plan desde el chat", "Casos ejecutados en la nube con video; testsprite-mcp-test-report.md"],
  ["5", "Pedir al agente que corrija los fallos reportados y re-ejecutar", "Ciclo de auto-corrección (self-healing asistido por IA)"],
  ["6", "Repetir contra la URL de Vercel con Stripe en modo test", "Validación del flujo real hasta la página de Stripe Checkout"],
], W(6, 56, 38));

const revisionTable = table(["ID", "Resultado 1.ª ejecución", "Causa raíz", "Corrección", "Final"], [
  ["TC001", "✘", "Aserción toContainText con lista sobre un solo elemento; formato de moneda $19 vs USD 19", "Aserción por tarjeta; formato explícito USD", "✓"],
  ["TC002", "✘", "Formato de moneda (Intl es-CR produce «USD 19», la prueba esperaba «$19»)", "formatUsd determinista «USD 19»", "✓"],
  ["TC003", "✓ (curado)", "testid primario obsoleto (btn-subscribe-pro, simulado)", "heal() resolvió por rol+nombre y lo registró", "✓"],
  ["TC004", "✘", "getByRole('alert') ambiguo: Next.js inyecta <next-route-announcer role=alert>", "Localizador por data-testid; patrón documentado", "✓"],
  ["TC005", "✓", "—", "—", "✓"],
  ["TC006", "✘", "Formato de moneda en la pasarela; testid btn-pay obsoleto (curado)", "Formato USD; curación por rol «Pagar»", "✓"],
  ["TC007", "✘", "Defecto de producto: tras activar, router.push no refresca el layout y la cabecera no muestra el plan", "router.refresh() en ActivarButton", "✓"],
  ["TC008–TC012", "✓", "—", "—", "✓"],
  ["TS · Cancelar y reintentar", "✘ (TestSprite)", "Defecto real: la pasarela mock redirigía a /cancelado sin plan y «Reintentar» caía en /planes; TC008 propio lo toleraba (expectativa laxa)", "MockGateway conserva el plan; TC008 exige /checkout?plan=…; re-run en TestSprite", "✓"],
  ["TS · Activar sin pago", "⊘ bloqueada", "Limitación del agente UI: el control vive en la API (POST /api/activar → 402); el agente hizo GET → 405. Su sugerencia (exponer activación en /exito) se descartó por seguridad", "Cubierto por TC010/TC011 a nivel API; falso positivo documentado", "⊘"],
], W(10, 14, 40, 28, 8));

const metricsTable = table(["Métrica", "Valor"], [
  ["Casos del plan / implementados / automatizados", "12 / 12 / 100 %"],
  ["Primera ejecución", "7 pasaron · 5 fallaron (45,3 s, con reintentos y trazas)"],
  ["Ejecución final", "12 pasaron · 0 fallaron (14,0 s)"],
  ["Hallazgos", "2 defectos de producto (TC007 cabecera; cancelación sin plan, hallado por TestSprite) · 3 expectativas incorrectas · 1 expectativa laxa (TC008) · 1 localizador ambiguo · 2 localizadores obsoletos auto-curados"],
  ["Falsos positivos", "4 de 5 fallos iniciales fueron falsos positivos del plan (no del producto): 80 %"],
  ["Cobertura funcional", "6/6 funcionalidades del PRD · categorías: 7 functional, 3 error handling, 1 security, 1 api"],
  ["TestSprite (nube, sobre Vercel)", "Plan generado: 43 casos / 6 casos de uso (redundante) → 11 únicos ejecutados · 1.ª ejecución 9/11 pasan, 1 falla (defecto real), 1 bloqueada · re-run tras el fix: 1/1 pasa + 1 bloqueada por diseño"],
  ["Evidencia por caso", "Reporte HTML, traza y video en fallo, capturas de TC006/TC007, registro de curaciones; videos y reporte de TestSprite (testsprite_tests/testsprite-report-ejecucion-cloud.md)"],
], W(36, 64));

const healingTable = table(["Problema observado", "Práctica / herramienta de auto-curación", "Aplicación en el MVP"], [
  ["Localizadores que dejan de existir tras un refactor o una regeneración con IA", "Localizadores con estrategias alternativas ordenadas por estabilidad (testid → rol accesible → etiqueta → texto → CSS) y registro de cada curación", "tests/support/healing.ts: heal() probó la estrategia primaria, falló y resolvió por rol+nombre en TC003 y TC006; healing-log.json alimenta el mantenimiento"],
  ["Localizadores ambiguos (strict mode)", "Preferir data-testid y roles con nombre; evitar role genérico; usar .first() solo con justificación", "TC004 pasó de role=alert a data-testid"],
  ["Esperas y condiciones de carrera", "Aserciones con auto-espera (expect.toBeVisible/toHaveURL), sin sleeps; retries solo en CI; trace y video en fallo", "playwright.config.ts: retries=1 en CI, trace retain-on-failure"],
  ["Dependencia de servicios externos (pasarela)", "Proveedor intercambiable y sesiones firmadas; pruebas de contrato de la API; smoke en producción con datos de prueba", "MockProvider en CI; Stripe test en Vercel; TC011 contrato"],
  ["Expectativas desalineadas con el producto (moneda, textos)", "Fuente única de verdad: el plan de pruebas cita literales del catálogo; formato determinista en el código", "formatUsd explícito; plan y pruebas actualizados juntos"],
  ["Regeneración de código por IA que rompe la testabilidad", "Reglas del IDE (.cursor/rules) que protegen testids, roles y el proveedor mock; CI bloquea el despliegue si el plan falla", "Workflow deploy-planes: e2e → deploy → smoke"],
  ["Mantenimiento de la suite", "Agentes de auto-corrección: TestSprite (reporte con causa raíz y fix sugerido), Healenium (curación por similitud del DOM para Selenium), Playwright MCP/Codegen para regenerar pasos, cuarentena de pruebas inestables", "Siguiente paso: abrir un PR automático cuando healing-log registre curaciones repetidas"],
], W(26, 40, 34));

const s7 = [
  p("El ejercicio confirma que la automatización E2E con agentes de IA funciona mejor cuando el producto se construye para ser probado: identificadores estables, nombres accesibles, un proveedor de pagos simulado y una API de contrato convirtieron un flujo de pago, normalmente frágil, en una suite determinista de 14 segundos que corre antes de cada despliegue. El agente generó un plan completo (funcional, errores, seguridad, API) a partir del PRD, pero la primera ejecución mostró que el 80 % de los fallos eran falsos positivos: expectativas de formato y localizadores ambiguos. Ese es el riesgo principal de las pruebas generadas por IA y la razón de revisar cada caso antes de darlo por válido; a cambio, el mismo plan encontró un defecto real de la aplicación (la cabecera no reflejaba la suscripción) que una revisión manual habría pasado por alto."),
  p("Las técnicas de auto-curación reducen el mantenimiento, pero deben ser auditables: el helper registra cada curación y la CI la publica, de modo que una curación no oculte un cambio funcional. En un contexto bancario esto importa tanto como la cobertura: una prueba que «se cura sola» sin dejar rastro es un control que ya no verifica lo que decía verificar. La ejecución de TestSprite contra el despliegue en Vercel confirmó el valor complementario de un agente exploratorio: generó un plan amplio pero redundante (43 casos que se depuraron a 11), encontró un defecto real que la suite propia toleraba (el reintento tras cancelar perdía el plan) y propuso un fix prompt que se aplicó y verificó con un re-run; a la vez, su diagnóstico del caso bloqueado proponía exponer la activación sin pago, una sugerencia que habría introducido una vulnerabilidad y que la revisión humana descartó. La combinación recomendada es usar el agente para descubrir y la suite determinista como compuerta del despliegue."),
];

const anexo = bullets([
  "Hecho: proyecto generado y refinado en Cursor (Figuras 3, 4, 6, 11); despliegue en Vercel con proveedor mock en https://asesoria-planes.vercel.app (Figura 5).",
  "Stripe en modo test: implementado (StripeProvider) y documentado en la guía §2–3; la validación E2E de este informe se realizó con el proveedor simulado para no depender de credenciales externas.",
  "Hecho: secretos VERCEL_* en GitHub; deploy-planes #4 completo (e2e → deploy → smoke) en verde (Figura 13); pipeline ci #7 con SonarCloud quality gate Passed.",
  "Hecho: TestSprite ejecutado desde su portal contra https://asesoria-planes.vercel.app (proyecto «AsesorIA Planes (Unidad 4)», PRD cargado): exploración, plan de 43 casos depurado a 11, dos ejecuciones y fix prompt (Figuras 7 y 7b; detalle en testsprite_tests/testsprite-report-ejecucion-cloud.md).",
]);

const doc = new Document({
  creator: "Manuela Larrea", title: "Informe técnico – Pruebas E2E con IA · AsesorIA Planes",
  styles: { default: { document: { run: { font: FONT, size: BODY } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: 900, bottom: 800, left: MARGIN, right: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 2 } },
      children: [run("Actividad Evaluativa Unidad 4 · Estudio de caso: pruebas E2E automatizadas con IA · Manuela Larrea", { size: TINY, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run("Página ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: TINY, color: GREY }),
        run(" de ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: TINY, color: GREY })] })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 60 }, children: [run("Informe técnico · AsesorIA Planes  ", { size: 30, bold: true, color: BLUE }), run("Pruebas E2E automatizadas con un agente de IA y TestSprite sobre un MVP con pasarela de pagos", { size: 18, color: GREY, italics: true })] }),
      meta, spacer(60),
      h1("1. Caso de estudio y enfoque"), ...s1,
      h1("2. La aplicación (MVP): flujo, pasarela y despliegue"), mvpTable,
      ...figure("app_collage.png", "Figura 1. Flujo del MVP en modo de pruebas: landing, catálogo, checkout, pasarela simulada, confirmación verificada y cuenta con plan activo.", FIGW),
      ...figure("e2e_00_api_smoke.png", "Figura 2. Build de producción y smoke del contrato de la API: creación de sesión, confirmación, verificación, activación y validación de correo.", FIGW),
      ...figure("code_collage_a.png", "Figura 3. Código generado y refinado con IA: lib/payments.ts (interfaz PaymentProvider con Stripe y mock) y tests/support/healing.ts (localizadores auto-curables).", FIGW),
      ...figure("cursor_01_agente_app_local.png", "Figura 4. Agente de Cursor (Grok 4.6) sobre el repositorio asesoria-testing: clona, instala dependencias, crea .env.local con el proveedor mock y levanta la app en localhost:3001 (navegador integrado a la derecha).", FIGW),
      ...figure("vercel_collage.png", "Figura 5. Despliegue en Vercel: proyecto asesoria-planes (Root Directory asesoria-planes, rama main, commit 3e2cf21) en estado Ready en https://asesoria-planes.vercel.app y respuesta de /api/health en producción.", 470),
      h1("3. Plan de pruebas generado con IA e integración con TestSprite"), s3intro, planTable, spacer(40),
      p("Flujo de integración con TestSprite desde Cursor:", { bold: true, after: 30 }), tsFlow,
      ...figure("code_collage_c.png", "Figura 6. Integración con TestSprite: .cursor/mcp.json (servidor MCP), reglas del proyecto .cursor/rules y plan de pruebas testsprite_frontend_test_plan.json generado a partir del PRD.", 400),
      ...figure("testsprite_collage.png", "Figura 7. TestSprite sobre el despliegue: exploración autónoma (3 páginas, 53 s) y resultados de la ejecución en la nube (11 pruebas: 9 pasan, 1 falla, 1 bloqueada; pass rate 82 %).", FIGW),
      ...figure("testsprite_09_test_report.png", "Figura 7b. Test Report de TestSprite: 4 casos de uso, 11 pruebas (9 pasan, 1 falla, 1 bloqueada), resumen generado por IA y «Fix prompt for your coding agent» (self-healing asistido por IA).", 440),
      h1("4. Revisión y validación de cada caso"),
      p("Cada caso generado se revisó contra el PRD antes de ejecutarlo y, tras la primera ejecución, se clasificó la causa de cada fallo como defecto del producto, expectativa incorrecta de la prueba o fragilidad del localizador. La tabla resume el ciclo; los logs completos están en testsprite_tests/ejecucion_1_fallos.log y ejecucion_2_final.log.", { after: 40 }),
      revisionTable,
      ...figure("e2e_01_primera_ejecucion.png", "Figura 8. Primera ejecución del plan: 7 casos pasan, 5 fallan; se muestran las aserciones y errores de localización que originaron la revisión.", FIGW),
      ...figure("e2e_02_ejecucion_final.png", "Figura 9. Ejecución final: 12/12 en 14 s y registro de las dos curaciones de localizadores (TC003 y TC006).", FIGW),
      ...figure("pw_report.png", "Figura 10. Reporte HTML de Playwright de la ejecución final (por archivo y caso, con duración).", 560),
      h1("5. Análisis de resultados"), metricsTable,
      p("Lectura de los resultados. El plan generado cubrió las seis funcionalidades del PRD y las tres rutas críticas del pago (éxito, cancelación, rechazo), más dos controles de seguridad que un plan manual suele omitir (sesión manipulada y activación sin pago). La tasa de falsos positivos inicial (80 %) no invalida el enfoque: todos se resolvieron en una iteración y dejaron la suite más robusta; el defecto real detectado (TC007) justifica por sí solo el ejercicio porque afectaba la primera impresión del cliente tras pagar. El tiempo de ejecución (14 s) permite usar la suite como compuerta de despliegue, que es el uso que hace el workflow de Vercel.", { after: 40 }),
      h1("6. Soluciones técnicas y auto-curación"), healingTable,
      ...figure("code_collage_b.png", "Figura 11. Implementación del plan y del despliegue: tests/e2e/checkout.spec.ts (TC006–TC008 con heal()) y .github/workflows/deploy-planes.yml (job e2e como compuerta del deploy).", FIGW),
      ...figure("app_04_pasarela_mock.png", "Figura 12. Pasarela de pago sobre el despliegue: página simulada equivalente a Stripe Checkout (tarjeta de prueba 4242…, pagar o cancelar). La integración real con Stripe (Checkout en modo suscripción, success/cancel URL y webhook firmado) está implementada en lib/payments.ts (Figura 3) y se activa con PAYMENTS_PROVIDER=stripe.", 420),
      ...figure("actions_deploy_04_crop.png", "Figura 13. Pipeline deploy-planes #4 en GitHub Actions: Build + E2E (12/12, 1m 21s) → Deploy a Vercel (47 s) → Smoke en producción contra asesoria-planes.vercel.app (46 s). Status: Success.", FIGW),
      h1("7. Conclusiones"), ...s7,
      h1("Anexo A. Trazabilidad de la ejecución con cuentas propias"), ...anexo,
      h1("Anexo B. Galería de evidencia (capturas tomadas durante la ejecución)"),
      p("Capturas adicionales del proceso, en orden cronológico; complementan las figuras del cuerpo del informe.", { after: 40 }),
      ...figure("anexo_vercel_cursor.png", "Figura B1. Vercel: proyecto recién desplegado, Production Deployment en estado Ready, checklist y observabilidad, /api/health en producción, URL del despliegue generado por el workflow; agente de Cursor clonando el repositorio y haciendo push.", FIGW),
      ...figure("anexo_testsprite.png", "Figura B2. TestSprite: inicio y transcurso de la exploración autónoma, exploración finalizada (3 páginas), ejecución en vivo de las 11 pruebas, resumen con diagnóstico del fallo, lista de resultados, re-run de las 2 pruebas y resultado del re-run (Cancelar y reintentar pasa tras el fix).", FIGW),
      ...figure("anexo_actions.png", "Figura B3. GitHub Actions y SonarCloud: historial de deploy-planes, run #3 en curso, run #4 completo, job de smoke en producción, pipeline ci #7 (TDD, Sonar, BDD) y quality gate Passed en SonarCloud (cobertura 96,1 %, 0 issues).", FIGW),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync("Informe_E2E_IA_TestSprite_AsesorIA_Unidad4.docx", buf); console.log("docx generado"); });
