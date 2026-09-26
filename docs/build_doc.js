// Genera el documento de planificación de pruebas (docx) - Actividad Evaluativa Unidad 1
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, BorderStyle, ShadingType, ImageRun, Footer, Header, PageNumber, LevelFormat,
  VerticalAlign, PageBreak,
} = require("docx");

// ---------- estilos base ----------
const FONT = "Calibri";
const BODY = 19;      // 9.5 pt (half-points)
const SMALL = 15;     // 7.5 pt
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

// ---------- contenido ----------
const meta = table(
  ["Estudiante", "Fecha", "Sistema bajo prueba", "Herramientas"],
  [["Manuela Larrea", "26 de septiembre de 2026", "AsesorIA v0.1.0 – asistente de IA para asesores financieros",
    "Java 17 · JUnit 5.11 · Playwright 1.56 · FastAPI · scikit-learn · pytest"]],
  W(18, 18, 32, 32), { size: SMALL });

const contexto = [
  p("AsesorIA es una aplicación web conversacional construida para esta actividad, inspirada en los asistentes corporativos con IA que se despliegan en entidades financieras (chat gobernado sobre una base de conocimiento): el asesor escribe la consulta del cliente y el sistema devuelve la respuesta oficial del producto, la intención detectada y una medida de confianza. Se eligió porque concentra los retos de prueba propios de la IA en banca: paráfrasis del lenguaje natural, riesgo de respuestas inventadas y manejo de datos sensibles bajo exigencia regulatoria."),
  table(["Dimensión", "Descripción"], [
    ["Tipo y usuarios", "Web monolítica: páginas de login, chat e historial + API JSON (/api/chat, /api/history, /api/health). Usuarios: asesores de servicio y supervisores (credenciales demo asesor.demo / Asesor2026*)."],
    ["Motor de IA (NLU)", "Clasificación por recuperación: TF-IDF sobre n-gramas de caracteres + similitud coseno contra 50 ejemplos de 10 intenciones (horarios, cuentas, crédito, CDP, tarjetas, transferencias, clave, estado de cuenta, cajeros, fraude). Umbral de confianza 0,40; por debajo responde con un fallback controlado."],
    ["Controles de seguridad", "Sesión firmada, contraseñas con PBKDF2, rutas protegidas; guardrail de entrada: longitud 1–500, detección de PAN (Luhn) e IBAN → respuesta bloqueada y registro enmascarado."],
    ["Entorno tecnológico", "SUT: Python 3.11, FastAPI, scikit-learn, uvicorn en localhost:8000. Harness: Java 17, Maven, JUnit 5.11, Playwright 1.56 (Chromium headless), Page Objects; unitarias con pytest; reportes XML para CI."],
  ], W(18, 82)),
];

const objetivos = bullets([
  "Verificar que autenticación, consulta al asistente, historial y cierre de sesión cumplen los requisitos RF-01 a RF-08, detectando defectos antes de la entrega (las pruebas muestran la presencia de defectos, no su ausencia).",
  "Validar el componente de IA con un conjunto dorado versionado: intención correcta con confianza ≥ 0,40 y fallback controlado fuera de dominio, mitigando el riesgo de respuestas inventadas.",
  "Comprobar los controles de seguridad de datos (rutas protegidas, bloqueo y enmascaramiento de PAN/IBAN) acordes con el contexto financiero.",
  "Construir una base de regresión automatizada en tres niveles (unitario, API, E2E), ejecutable en segundos e integrable en CI, con evidencia reproducible y métricas de línea base (cobertura, éxito, latencia, defectos, esfuerzo).",
]);

const escenarios = table(["ID", "Escenario", "Nivel (ISTQB)", "Técnicas de diseño", "Casos"], [
  ["E-00", "Motor NLU y guardrails (lógica interna)", "Componente (pytest)", "Partición de equivalencia, valores límite", "18 pruebas unitarias"],
  ["E-01", "Autenticación y control de sesión", "Sistema / E2E", "Casos de uso, transición de estados, pruebas negativas", "CP-UI-01 … 04"],
  ["E-02", "Consulta al asistente de IA", "Sistema / E2E", "Casos de uso, partición de equivalencia (dominio / fuera de dominio / PII)", "CP-UI-05 … 09"],
  ["E-03", "Historial de consultas de la sesión", "Sistema / E2E", "Casos de uso, verificación de enmascaramiento", "CP-UI-10 … 11"],
  ["E-04", "Contrato de la API del asistente", "Integración / API", "Valores límite, basadas en datos, negativas, no funcional (latencia)", "CP-API-01 … 09"],
], W(7, 27, 15, 37, 14), { boldFirst: true });

const casos = table(["ID", "Caso de prueba", "Técnica", "Datos / precondición", "Resultado esperado", "Pr."], [
  ["CP-API-01", "Salud del servicio", "Contrato", "GET /api/health", "200; status ok; 10 intenciones; umbral 0,40", "M"],
  ["CP-API-02", "Chat sin sesión", "Negativa / seguridad", "POST /api/chat sin cookie", "HTTP 401 «No autenticado.»", "A"],
  ["CP-API-03", "Mensaje vacío o en blanco", "Part. de equivalencia", "«» y «   » con sesión", "422 «no puede estar vacío»", "M"],
  ["CP-API-04", "Longitud máxima", "Valores límite", "500 y 501 caracteres", "500 → 200; 501 → 422", "M"],
  ["CP-API-05", "Conjunto dorado", "Basada en datos (10 filas)", "10 paráfrasis, una por intención", "Intención esperada; status ok; confianza ≥ 0,40", "A"],
  ["CP-API-06", "Fuera de dominio", "Part. de equivalencia (3 filas)", "«lasaña», «partido», «hola»", "status fallback; fuera_de_dominio; confianza < 0,40", "A"],
  ["CP-API-07", "Guardrail de datos sensibles", "Negativa / seguridad", "PAN válido (Luhn)", "status blocked; confianza nula; almacenado «**** 1111»", "A"],
  ["CP-API-08", "Latencia de inferencia", "No funcional", "1 consulta en dominio", "latency_ms < 200; ida y vuelta < 2 s", "M"],
  ["CP-API-09", "Historial vía API", "Contrato", "n consultas + 1 nueva", "Tamaño n+1; última = cambio_clave", "M"],
  ["CP-UI-01", "Login válido", "Caso de uso", "asesor.demo / Asesor2026*", "URL /chat; saludo y nombre del asesor", "A"],
  ["CP-UI-02", "Login inválido", "Negativa", "asesor.demo / clave-incorrecta", "Error visible; sigue en /login; usuario conservado", "A"],
  ["CP-UI-03", "Ruta protegida sin sesión", "Transición de estados", "GET /chat sin autenticar", "Redirección a /login", "A"],
  ["CP-UI-04", "Cierre de sesión", "Transición de estados", "Sesión activa → «Salir»", "/login; /chat vuelve a redirigir", "M"],
  ["CP-UI-05", "Botón Enviar", "Part. de equivalencia (UI)", "«», «hola», «   »", "Deshabilitado / habilitado / deshabilitado", "B"],
  ["CP-UI-06", "Consulta en dominio (horario)", "Caso de uso", "«¿Cuál es el horario de atención…?»", "Respuesta con «8:30»; horario_sucursales; ok; confianza visible", "A"],
  ["CP-UI-07", "Consulta fuera de dominio", "Part. de equivalencia", "«¿Cómo preparo una lasaña?»", "Estado fallback; mensaje de derivación", "A"],
  ["CP-UI-08", "Bloqueo de PII en la UI", "Seguridad", "Mensaje con PAN válido (Luhn)", "Estado blocked; bloqueado_pii; sin confianza", "A"],
  ["CP-UI-09", "Conversación multi-turno", "Caso de uso", "2 consultas consecutivas", "2 turnos usuario / 2 bot, intenciones correctas", "M"],
  ["CP-UI-10", "Historial vacío", "Caso de uso", "Login sin consultas", "Estado vacío visible; 0 filas", "B"],
  ["CP-UI-11", "Historial enmascarado", "Caso de uso / seguridad", "1 consulta válida + 1 con PAN", "2 filas; intención correcta; PAN enmascarado", "A"],
], W(9, 18, 18, 23, 28, 4));

const rtm = table(["Req.", "Descripción", "Unitario (pytest)", "API (JUnit + Playwright)", "E2E UI (JUnit + Playwright)", "Cub."], [
  ["RF-01", "Inicio de sesión con credenciales válidas", "—", "login en setUp (precondición)", "CP-UI-01", "✓"],
  ["RF-02", "Credenciales inválidas y rutas protegidas", "—", "CP-API-02", "CP-UI-02, CP-UI-03", "✓"],
  ["RF-03", "Intención correcta con respuesta oficial", "test_clasifica_intencion (6)", "CP-API-05 (10)", "CP-UI-06, CP-UI-09", "✓"],
  ["RF-04", "Fallback controlado por baja confianza", "test_fuera_de_dominio (4)", "CP-API-06 (3)", "CP-UI-07", "✓"],
  ["RF-05", "Guardrail PII: bloqueo y enmascaramiento", "test_guardrails (4)", "CP-API-07", "CP-UI-08, CP-UI-11", "✓"],
  ["RF-06", "Validación de entrada (vacío, máx. 500)", "test_longitud (3)", "CP-API-03, CP-API-04", "CP-UI-05", "✓"],
  ["RF-07", "Historial de consultas de la sesión", "—", "CP-API-09", "CP-UI-10, CP-UI-11", "✓"],
  ["RF-08", "Cierre de sesión", "—", "—", "CP-UI-04", "✓"],
  ["RNF-01", "Latencia de inferencia < 200 ms", "—", "CP-API-08", "—", "✓"],
  ["RNF-02", "PII nunca en claro; contraseñas con hash", "test_detecta_tarjeta", "CP-API-07", "CP-UI-11", "✓"],
  ["RNF-03", "Contrato y observabilidad de la API", "—", "CP-API-01, CP-API-09", "—", "✓"],
], W(7, 29, 21, 20, 18, 5), { boldFirst: true });

const riesgos = table(["ID", "Riesgo (producto / proyecto)", "P", "I", "Nivel", "Mitigación / casos que lo cubren   (P = probabilidad, I = impacto: B bajo, M medio, A alto, MA muy alto)"], [
  ["R-01", "Intención incorrecta con confianza alta (falso positivo del clasificador)", "M", "A", "Alto", "Conjunto dorado y fuera de dominio (CP-API-05/06, CP-UI-06/07); recalibración del umbral; revisión de la base de conocimiento por iteración"],
  ["R-02", "Fuga de datos sensibles (PAN/IBAN) en historial o registros", "B", "MA", "Alto", "CP-API-07, CP-UI-08/11 y unitarias; enmascaramiento antes de persistir"],
  ["R-03", "Acceso a funciones sin autenticación", "B", "A", "Medio", "CP-UI-03, CP-API-02; sesión firmada"],
  ["R-04", "Pruebas E2E inestables (flaky) por sincronización o selectores", "M", "M", "Medio", "Selectores data-testid, aserciones con auto-espera, contexto aislado por prueba"],
  ["R-05", "Regresión del modelo al ampliar la base de conocimiento", "M", "M", "Medio", "Suite de regresión en CI; base de conocimiento versionada"],
  ["R-07", "Paráfrasis reales no cubiertas por los 50 ejemplos", "A", "M", "Medio", "Ampliar el dataset con consultas reales; pruebas exploratorias"],
], W(6, 30, 4, 4, 8, 48));

const metricas = table(["Métrica", "Meta inicial", "Resultado de la primera iteración"], [
  ["Cobertura de requisitos (con ≥ 1 caso automatizado)", "100 %", "11/11 (100 %); 7/11 cubiertos en dos o más niveles"],
  ["Casos diseñados / automatizados", "≥ 15 / 100 %", "20 casos (32 ejecuciones JUnit) + 18 unitarias; 100 % automatizados"],
  ["Tasa de éxito de la suite", "≥ 95 %", "50/50 (100 %)"],
  ["Precisión conjunto dorado / tasa de fallback fuera de dominio", "≥ 90 % / 100 %", "10/10 / 3/3"],
  ["Latencia de inferencia (máx. observada)", "< 200 ms", "0,1 – 12 ms"],
  ["Tiempo de ejecución de la suite", "< 2 min", "8,7 s headless (25,8 s con slowMo para video); 1 s unitarias"],
  ["Defectos esperados / encontrados", "3 – 5", "1: el umbral inicial 0,30 admitía falsos positivos (confianza 0,32–0,36) fuera de dominio → ajustado a 0,40"],
  ["Esfuerzo estimado", "≈ 20 h", "Plan 4 h · SUT 6 h · automatización 6 h · ejecución y documentación 3 h"],
], W(34, 14, 52));

const autoIntro = p("El harness es un proyecto Maven (tests-e2e) con cuatro paquetes: config (parámetros -Dsut.baseUrl, -Dheadless, -DslowMo, -DrecordVideo), pages (Page Objects con selectores data-testid), ui (pruebas E2E) y api (contrato con APIRequestContext, sin navegador). BaseUiTest concentra el ciclo de vida: un Chromium por clase, un contexto aislado por prueba con grabación de video, verificación previa de /api/health y captura + video guardados con el nombre del caso; las etiquetas @Tag permiten ejecutar por nivel (mvn test -Dgroups=ui).");

const flujo = bullets([
  [run("Caso funcional CP-UI-01 (inicio de sesión): ", { bold: true }), run("tras uvicorn app.main:app --port 8000 y mvn test, Playwright abre /login, completa credenciales, pulsa «Ingresar» y las aserciones con auto-espera verifican la URL /chat, el saludo y el nombre del asesor; el mismo patrón se reutiliza en CP-UI-06 para enviar una consulta y validar intención, estado y confianza.")],
  [run("Evidencia: ", { bold: true }), run("target/surefire-reports (XML), 17 capturas y 11 videos .webm en target/evidence, consolidados en docs/evidencia junto con un video de 1:49 min.")],
]);

const snippet = code([
  "@Test @DisplayName(\"CP-UI-01 Login válido redirige al chat y muestra el nombre del asesor\")",
  "void loginValidoRedirigeAlChat() {",
  "  ChatPage chat = new LoginPage(page).open().loginAs(TestConfig.DEMO_USER, TestConfig.DEMO_PASSWORD);",
  "  assertThat(page).hasURL(Pattern.compile(\".*/chat$\"));",
  "  assertThat(chat.greeting()).containsText(TestConfig.DEMO_DISPLAY_NAME);   // auto-espera",
  "}",
]);

const resultados = table(["Nivel", "Herramienta", "Casos", "Resultado", "Duración"], [
  ["Componente", "pytest 8 (sut/tests)", "18", "18 exitosas", "1,0 s"],
  ["Integración / API", "JUnit 5 + Playwright APIRequestContext", "9 casos · 19 ejecuciones", "19 exitosas", "≈ 1 s"],
  ["Sistema / E2E", "JUnit 5 + Playwright · Chromium 141 headless", "11 casos", "11 exitosas", "8,7 s"],
], W(18, 34, 18, 14, 16));

const dificultades = bullets([
  [run("Oráculo para IA: ", { bold: true }), run("no hay respuesta «exacta» para una paráfrasis; el oráculo se definió como intención esperada + umbral, y diseñar las pruebas negativas (CP-API-06) reveló el único defecto (umbral 0,30 demasiado permisivo) antes de escribir la interfaz: testing temprano en la práctica.")],
  [run("Sincronización, evidencia e independencia: ", { bold: true }), run("el chat responde por fetch asíncrono, resuelto contando los mensajes previos y esperando el n-ésimo con aserciones de Playwright, sin esperas fijas; el video .webm solo se materializa al cerrar el contexto, por lo que se guarda en @AfterEach tras context.close(); y como JUnit no garantiza el orden, cada prueba de UI crea su propio contexto y CP-API-09 se expresó en términos relativos (n+1).")],
]);

const reflexion = p("La actividad confirma principios ISTQB: las pruebas dependen del contexto (en banca el foco está en datos sensibles y trazabilidad), la ausencia de fallos no equivale a calidad (el conjunto dorado es una muestra de un espacio de lenguaje mucho mayor) y la paradoja del pesticida exige ampliar los datos de prueba en cada iteración. El enfoque ágil se refleja en una suite en pirámide que corre en segundos y en entregas incrementales sobre un sistema ejecutable. Próximos pasos: integrar la suite en GitHub Actions, medir la precisión del clasificador con un dataset externo y añadir pruebas de robustez frente a inyección de instrucciones.");

// ---------- anexo ----------
const anexoImgs = new Table({
  width: { size: USABLE, type: WidthType.DXA }, columnWidths: [USABLE / 2, USABLE / 2],
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: USABLE / 2, type: WidthType.DXA }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [img("/tmp/CP-UI-06_respuesta_horario_crop.png", 340, 149)] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run("CP-UI-06 · respuesta con intención, estado y confianza", { size: TINY, color: GREY })] })] }),
    new TableCell({ width: { size: USABLE / 2, type: WidthType.DXA }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [img("/tmp/CP-UI-11_historial_crop.png", 340, 149)] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run("CP-UI-11 · historial con el PAN enmascarado", { size: TINY, color: GREY })] })] }),
  ] })],
});

const logLines = fs.readFileSync("evidencia/ejecucion_junit_playwright.log", "utf8").split("\n");
const treeStart = logLines.findIndex(l => l.includes("JUnit Jupiter"));
const summaryStart = logLines.findIndex(l => l.startsWith("Test run finished"));
const tree = logLines.slice(treeStart, summaryStart).filter(l => l.trim()).filter(l => !/CP-API-05 \[|CP-API-06 \[|CP-API-03 Mensaje vacío '|JUnit Vintage/.test(l)).map(l => l.replace(/[│├└─╷]/g, m => ({ "│": "|", "├": "+", "└": "+", "─": "-", "╷": "" }[m])).replace(/✔/g, "[OK]"));
const summary = logLines.slice(summaryStart, summaryStart + 13).filter(l => l.startsWith("Test run") || / tests /.test(l));

const doc = new Document({
  creator: "Manuela Larrea",
  title: "Plan de pruebas – AsesorIA",
  styles: { default: { document: { run: { font: FONT, size: BODY } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: 820, bottom: 720, left: MARGIN, right: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 2 } },
      children: [run("Actividad Evaluativa Unidad 1 · Diseño de una estrategia de testing automatizado · Manuela Larrea", { size: TINY, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run("Página ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: TINY, color: GREY }),
        run(" de ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: TINY, color: GREY })] })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 60 }, children: [run("Plan de pruebas · AsesorIA  ", { size: 30, bold: true, color: BLUE }), run("Diseño de una estrategia de testing automatizado (ISTQB · ágil · JUnit 5 + Playwright)", { size: 18, color: GREY, italics: true })] }),
      meta, spacer(60),

      h1("1. Contexto del sistema bajo prueba"), ...contexto, spacer(40),
      h1("2. Objetivos del proceso de pruebas"), ...objetivos,
      h1("3. Escenarios y casos de prueba (principios ISTQB)"),
      p("Casos diseñados desde los requisitos antes de codificar la interfaz (testing temprano), priorizados por riesgo (A alto, M medio, B bajo), independientes entre sí y con un identificador que viaja hasta el reporte de ejecución."),
      escenarios, spacer(40), casos, spacer(30),

      h1("4. Matriz de trazabilidad entre requisitos y casos de prueba"),
      rtm,
      p("Cobertura inicial: 11 de 11 requisitos con al menos un caso automatizado; los de mayor riesgo (RF-03 a RF-06, RNF-02) se verifican en dos o tres niveles. La trazabilidad vive también en el código (IDs en @DisplayName, escenarios como clases, etiquetas por nivel), de modo que el reporte XML enlaza cada resultado con su requisito.", { after: 30 }),

      h1("5. Identificación inicial de riesgos y métricas básicas"),
      riesgos, spacer(40), metricas, spacer(30),

      h1("6. Primer flujo de prueba automatizado (JUnit 5 + Playwright)"),
      autoIntro, ...flujo, ...snippet, spacer(40),

      h1("7. Resultados, dificultades y reflexión"),
      resultados, spacer(40), ...dificultades, reflexion,

      new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 0, after: 40 }, keepNext: true,
        children: [new TextRun({ text: "Anexo A. Evidencia de ejecución", font: FONT, size: 22, bold: true, color: BLUE })] }),
      p("Capturas generadas automáticamente por la suite (tests-e2e/target/evidence/screenshots) y resumen del log de ejecución. El video consolidado (docs/evidencia/video_evidencia_junit_playwright.mp4, 1:49 min) muestra los 11 casos de UI grabados por Playwright; los reportes XML están en docs/evidencia/reportes-junit.", { after: 60 }),
      anexoImgs, spacer(60),
      p("Extracto del log de ejecución (JUnit Platform, Chromium headless):", { bold: true, after: 40 }),
      ...code([...tree, "...", ...summary]),
      spacer(40),
      p("Reproducción: cd sut && uvicorn app.main:app --port 8000 · cd tests-e2e && mvn test (ver README.md para los requisitos previos y la instalación de Chromium para Playwright).", { size: SMALL, color: GREY }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("Plan_de_pruebas_AsesorIA_Unidad1.docx", buf);
  console.log("docx generado");
});
