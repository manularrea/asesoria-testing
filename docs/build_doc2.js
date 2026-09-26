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

// ---------- contenido Unidad 2 ----------
const feature = fs.readFileSync("../tests-e2e/src/test/resources/features/consulta_asistente.feature", "utf8")
  .split("\n").filter(l => !l.startsWith("# HU-01") && !l.startsWith("# Trazabilidad"));

function gherkin(lines) {
  const kw = /^(\s*)(Característica|Antecedentes|Escenario|Esquema del escenario|Ejemplos|Dado|Cuando|Entonces|Y)(:?)(\s|$)/;
  return lines.map(l => {
    const m = l.match(kw);
    const children = [];
    if (l.trim().startsWith("@")) children.push(new TextRun({ text: l, font: "Consolas", size: 15, color: "7A5C00" }));
    else if (l.trim().startsWith("#")) children.push(new TextRun({ text: l, font: "Consolas", size: 15, color: GREY, italics: true }));
    else if (m) children.push(new TextRun({ text: m[1] + m[2] + m[3], font: "Consolas", size: 15, bold: true, color: BLUE }),
                              new TextRun({ text: l.slice(m[0].length - m[4].length), font: "Consolas", size: 15 }));
    else children.push(new TextRun({ text: l, font: "Consolas", size: 15 }));
    return new Paragraph({ spacing: { after: 0, line: 225 }, shading: { type: ShadingType.CLEAR, fill: "F3F5F9", color: "auto" },
      indent: { left: 120 }, children });
  });
}

const meta = table(
  ["Estudiante", "Fecha", "Sistema / historia", "Herramientas"],
  [["Manuela Larrea", "26 de septiembre de 2026", "AsesorIA (proyecto de la Unidad 1) · HU-01 Consulta asistida por IA con protección de datos sensibles",
    "Cucumber-JVM 7.20 · Gherkin (es) · JUnit Platform Suite · Playwright 1.56 · Java 17 · Maven"]],
  W(16, 17, 37, 30), { size: SMALL });

const historia = [
  p("La historia proviene del mismo sistema de la Unidad 1, AsesorIA, un asistente conversacional con IA para asesores de servicio de una entidad financiera, inspirado en los asistentes corporativos gobernados que se despliegan en banca. Es la historia central del producto: la que justifica su existencia y la que concentra el riesgo de negocio (respuestas inventadas, fuga de datos sensibles)."),
  table(["Campo", "Contenido"], [
    ["ID · Título", "HU-01 · Consulta asistida por IA con protección de datos sensibles"],
    ["Historia", "Como asesor de servicio al cliente de la entidad financiera, quiero consultar a AsesorIA la respuesta oficial de un producto en lenguaje natural, para responder al cliente con rapidez y sin exponer datos sensibles."],
    ["CA-01", "Si la consulta corresponde a una intención del catálogo (10 productos/servicios), el asistente devuelve la respuesta oficial, muestra la intención detectada y una confianza ≥ 0,40, incluso ante paráfrasis."],
    ["CA-02", "Si la consulta está fuera del dominio, el asistente no inventa una respuesta: indica que no tiene información suficiente y deriva al supervisor (estado fallback)."],
    ["CA-03", "Si la consulta contiene un número de tarjeta válido, el asistente la rechaza, no la procesa con el motor de IA y el historial la registra con el número enmascarado (estado blocked)."],
    ["Definición de terminado", "Los tres criterios tienen al menos un escenario Gherkin automatizado y en verde en el entorno local; el reporte Cucumber (HTML) con capturas queda como evidencia."],
  ], W(18, 82)),
];

const gwtIntro = p("Los criterios se redactaron primero en lenguaje de negocio y después como escenarios en Gherkin (español), siguiendo las buenas prácticas de especificación: un comportamiento por escenario, pasos declarativos (qué hace el asesor, no qué botón pulsa), datos concretos en los ejemplos, Antecedentes para el contexto compartido y un Esquema del escenario para las paráfrasis. La trazabilidad se materializa con etiquetas: @HU-01 en la característica y @CA-xx en cada escenario, de modo que puede ejecutarse un criterio aislado (mvn test -Dtest=RunCucumberTest -Dcucumber.filter.tags=\"@CA-03\") y el reporte agrupa los resultados por criterio.");

const rtm = table(["Criterio", "Escenario(s) Gherkin", "Pasos verificadores (glue)", "Evidencia observable"], [
  ["CA-01", "«Una consulta del dominio recibe la respuesta oficial…» + esquema «Las intenciones del catálogo se reconocen ante paráfrasis» (4 ejemplos)", "el asistente responde con la intención {string}; la respuesta contiene {string}; el estado de la respuesta es \"ok\"; la confianza mostrada es mayor o igual a {double}", "Badge de intención, texto de respuesta, badge de confianza en la UI"],
  ["CA-02", "«Una consulta fuera del dominio recibe una respuesta de derivación, no una inventada»", "el asistente indica que no tiene información suficiente; el estado de la respuesta es \"fallback\"", "Mensaje de derivación e intención fuera_de_dominio"],
  ["CA-03", "«Una consulta con número de tarjeta se bloquea y se registra enmascarada»", "el asistente rechaza la consulta por contener datos sensibles; el estado es \"blocked\"; el historial muestra la consulta con el número enmascarado como {string}", "Respuesta bloqueada sin confianza y fila del historial con «**** **** **** 1111»"],
], W(9, 33, 36, 22));

const autoIntro = p("Los escenarios se automatizaron en el mismo proyecto Maven de la Unidad 1 (tests-e2e), de forma que conviven con la suite JUnit/Playwright y comparten los Page Objects. Cucumber se ejecuta sobre JUnit Platform, por lo que Surefire, los reportes XML y los parámetros -D existentes aplican sin cambios.");

const arquitectura = table(["Componente", "Archivo", "Responsabilidad"], [
  ["Especificación", "src/test/resources/features/consulta_asistente.feature", "Historia, antecedentes y 4 escenarios (7 ejecuciones) en Gherkin español, con etiquetas de trazabilidad."],
  ["Glue (step definitions)", "bdd/ConsultaAsistenteSteps.java", "Traduce cada paso a acciones sobre los Page Objects (LoginPage, ChatPage, HistorialPage) y aserciones con auto-espera; hooks @Before/@After crean un contexto de navegador por escenario, adjuntan la captura al reporte y graban video."],
  ["Runner", "bdd/RunCucumberTest.java", "@Suite + @IncludeEngines(\"cucumber\"): descubre las features, fija el paquete glue, el filtro de etiquetas y los plugins (pretty, html, json)."],
  ["Dependencias", "pom.xml", "cucumber-java, cucumber-junit-platform-engine 7.20.1 y junit-platform-suite (versión gestionada por el BOM de JUnit 5.11)."],
], W(18, 34, 48));

const integracion = bullets([
  [run("Levantar el SUT: ", { bold: true }), run("cd sut && source .venv/bin/activate && uvicorn app.main:app --port 8000.")],
  [run("Ejecutar los escenarios: ", { bold: true }), run("cd tests-e2e && mvn test -Dtest=RunCucumberTest (o mvn test para toda la suite: 32 pruebas de la Unidad 1 + 7 escenarios BDD). Con -Dheadless=false -DslowMo=300 se ve el navegador.")],
  [run("Resultado esperado: ", { bold: true }), run("7 scenarios (7 passed), 38 steps (38 passed) en la consola; reporte navegable en target/cucumber/reporte.html con una captura por escenario, JSON en target/cucumber/reporte.json (integrable en CI) y videos en target/evidence/videos-bdd.")],
]);

const snippet = code([
  "@Cuando(\"el asesor consulta {string}\")",
  "public void elAsesorConsulta(String consulta) { ultimaRespuesta = chat.send(consulta); }",
  "",
  "@Entonces(\"el asistente responde con la intención {string}\")",
  "public void elAsistenteRespondeConLaIntencion(String intencion) {",
  "  assertThat(chat.intentOf(ultimaRespuesta)).hasText(intencion);        // aserción con auto-espera",
  "}",
]);

const reflexion = [
  p("Escribir la historia en Given–When–Then obligó a decidir, antes de tocar código, qué significa «funciona» para el negocio: no bastaba con que el asistente respondiera, sino que respondiera lo oficial, reconociera que no sabe y protegiera los datos del cliente. Esos tres verbos se convirtieron en los criterios CA-01 a CA-03 y, sin traducción intermedia, en escenarios ejecutables. Ahí está el primer valor de BDD: el mismo texto sirve a la persona de producto para validar el alcance, al desarrollador para saber qué construir y al tester para saber qué automatizar; desaparece la brecha entre el criterio de aceptación escrito en una tarjeta y el caso de prueba escrito en otra herramienta."),
  p("El segundo valor es la conversación que provoca. Al redactar CA-02 surgió la pregunta de qué debe hacer el asistente cuando no está seguro, y la respuesta (derivar, no inventar) es una decisión de negocio que en un proyecto de IA suele quedar implícita en un umbral técnico. En un contexto bancario regulado, escenarios como CA-03 documentan de forma legible para auditoría cómo se protege la información del cliente, algo que un test unitario no comunica. En la Unidad 1 el defecto del umbral se encontró diseñando pruebas negativas; en BDD ese caso se habría discutido con negocio en la sesión de refinamiento, antes de escribir una línea."),
  p("También aparecen sus límites: Gherkin no reemplaza a la pirámide de pruebas (los escenarios son lentos y de alto nivel; la precisión del clasificador se sigue midiendo con pruebas unitarias y datasets), exige disciplina para no degradar en scripts de interfaz («hago clic en…») y solo aporta valor si las tres perspectivas participan realmente en su redacción. Con esas condiciones, BDD alinea negocio, pruebas automatizadas y calidad del producto porque convierte los criterios de aceptación en una especificación viva que se ejecuta en cada cambio y documenta el comportamiento vigente del sistema."),
];

const doc = new Document({
  creator: "Manuela Larrea",
  title: "Artefactos BDD – AsesorIA",
  styles: { default: { document: { run: { font: FONT, size: BODY } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: 900, bottom: 800, left: MARGIN, right: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 2 } },
      children: [run("Actividad Evaluativa Unidad 2 · Construcción de artefactos de prueba y reflexión técnica · Manuela Larrea", { size: TINY, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [run("Página ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: TINY, color: GREY }),
        run(" de ", { size: TINY, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: TINY, color: GREY })] })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 60 }, children: [run("Artefactos BDD · AsesorIA  ", { size: 30, bold: true, color: BLUE }), run("Historia de usuario en Gherkin, automatización con Cucumber y reflexión", { size: 18, color: GREY, italics: true })] }),
      meta, spacer(60),
      h1("1. Historia de usuario y criterios de aceptación"), ...historia, spacer(40),
      h1("2. Especificación Given–When–Then (Gherkin, español)"), gwtIntro, ...gherkin(feature), spacer(60),
      p("Trazabilidad entre criterios de aceptación, escenarios y pasos verificadores:", { bold: true, after: 40 }), rtm, spacer(40),
      h1("3. Automatización con Cucumber e integración en el entorno local"), autoIntro, arquitectura, spacer(40), ...snippet, spacer(40), ...integracion,
      h1("4. Reflexión: BDD como herramienta de comunicación y validación colaborativa"), ...reflexion,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("Artefactos_BDD_AsesorIA_Unidad2.docx", buf);
  console.log("docx generado");
});
