# AsesorIA · Estrategia de testing automatizado (Actividad Evaluativa Unidad 1)

Repositorio de la actividad **Diseño de una estrategia de testing automatizado**.
Contiene el sistema bajo prueba (SUT), el harness de pruebas automatizadas y la evidencia de ejecución.

```
asesoria-testing/
├── sut/            Sistema bajo prueba: AsesorIA (FastAPI + scikit-learn) + pruebas unitarias pytest
├── tests-e2e/      Harness de pruebas API y E2E: Java 17 · JUnit 5 · Playwright (patrón Page Object)
├── scripts/        run-all.sh: levanta el SUT, ejecuta la suite y guarda la evidencia
├── docs/           Plan de pruebas (docx), guion del video y evidencia (log, capturas, videos)
└── README.md
```

## 1. El sistema bajo prueba: AsesorIA

Asistente conversacional web para **asesores de una entidad financiera**: el asesor escribe la consulta
del cliente y el sistema devuelve la respuesta oficial del producto. Fue construido para esta actividad
tomando como referencia un asistente empresarial real (plataforma de chat con IA gobernada).

| Componente | Descripción |
|---|---|
| Autenticación (`/login`, `/logout`) | Sesión firmada (cookie), contraseñas con PBKDF2, usuarios en memoria. |
| Chat (`/chat`, `POST /api/chat`) | UI de conversación + API JSON. Devuelve `intent`, `answer`, `confidence`, `status`, `latency_ms`. |
| Motor NLU (`app/nlu.py`) | Clasificación de intención por recuperación: TF-IDF (n-gramas de caracteres) + similitud coseno sobre 10 intenciones / 50 ejemplos. Umbral de confianza 0.40 → *fallback* controlado. |
| Guardrails (`app/guardrails.py`) | Validación de longitud (1–500), detección de PAN de tarjeta (Luhn) e IBAN nacional → respuesta bloqueada y registro enmascarado. |
| Historial (`/historial`, `GET /api/history`) | Consultas de la sesión con intención, estado, confianza y latencia. |

Credenciales de demostración: `asesor.demo / Asesor2026*` (también `supervisor.demo / Super2026*`).

## 2. Requisitos previos

| Herramienta | Versión | Uso |
|---|---|---|
| Python | 3.11+ | SUT (FastAPI) y pruebas unitarias pytest |
| Java (JDK) | 17+ | Harness JUnit 5 + Playwright |
| Maven | 3.9+ | Construcción y ejecución de la suite (`mvn test`) |
| Navegador Chromium de Playwright | se instala una vez | `mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install chromium"` (ver §4) |

## 3. Levantar el SUT

```bash
cd sut
python3 -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q tests                                # 18 pruebas unitarias del NLU y guardrails
uvicorn app.main:app --port 8000                         # http://localhost:8000
```

## 4. Ejecutar la suite automatizada (JUnit 5 + Playwright)

```bash
cd tests-e2e
# solo la primera vez: descarga Chromium para Playwright
mvn -q exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install chromium"

mvn test                                # 32 pruebas: 19 de API (sin navegador) + 11 de UI (Chromium headless)
mvn test -Dgroups=api                   # solo nivel API
mvn test -Dgroups=ui -Dheadless=false -DslowMo=300   # ver el navegador (ideal para grabar el video)
mvn test -Dsut.baseUrl=http://otro-host:8000          # apuntar a otro despliegue del SUT
```

Evidencia generada en `tests-e2e/target/`:

| Ruta | Contenido |
|---|---|
| `surefire-reports/` | Reportes XML/TXT por clase (integrables en CI). |
| `evidence/screenshots/` | Captura final de cada prueba de UI + capturas de pasos clave (`CP-UI-xx_*.png`). |
| `evidence/videos/` | Un video `.webm` por prueba de UI (`Clase_metodo.webm`). |

Atajo (macOS/Linux): `scripts/run-all.sh` levanta el SUT, ejecuta `mvn test` y detiene el SUT.

## 5. Diseño de la suite

| Nivel | Clase | Casos | Técnica ISTQB |
|---|---|---|---|
| Unitario (SUT, pytest) | `sut/tests/test_nlu.py`, `test_guardrails.py` | 18 | Partición de equivalencia, valores límite |
| Integración / API | `api/ChatApiTest` | CP-API-01 … 09 (19 ejecuciones) | Partición de equivalencia, valores límite, pruebas basadas en datos (conjunto dorado) |
| Sistema / E2E (UI) | `ui/LoginTest`, `ui/ChatTest`, `ui/HistorialTest` | CP-UI-01 … 11 | Casos de uso, transición de estados, pruebas negativas |

Buenas prácticas aplicadas: patrón **Page Object** (`pages/`), selectores estables `data-testid`, aserciones con
auto-espera (`PlaywrightAssertions`), un contexto de navegador aislado por prueba (independencia), configuración
externa por `-D` (`sut.baseUrl`, `headless`, `slowMo`, `recordVideo`), IDs de caso en `@DisplayName` para trazabilidad,
etiquetas `@Tag("api")`/`@Tag("ui")` para ejecutar por nivel, y evidencia automática (video + captura) por prueba.

## 6. Unidad 2 · BDD con Cucumber (Gherkin en español)

| Artefacto | Ruta |
|---|---|
| Historia de usuario y escenarios Given–When–Then | `tests-e2e/src/test/resources/features/consulta_asistente.feature` |
| Step definitions (glue), reutilizan los Page Objects | `tests-e2e/src/test/java/edu/testing/asesoria/bdd/ConsultaAsistenteSteps.java` |
| Runner (JUnit Platform Suite + motor Cucumber) | `tests-e2e/src/test/java/edu/testing/asesoria/bdd/RunCucumberTest.java` |
| Documento de la actividad | `docs/Artefactos_BDD_AsesorIA_Unidad2.docx` |

```bash
# con el SUT levantado (sección 3)
cd tests-e2e
mvn test -Dtest=RunCucumberTest                                  # 7 escenarios (3 + esquema de 4 ejemplos)
mvn test -Dtest=RunCucumberTest -Dcucumber.filter.tags="@CA-03"  # solo el criterio de aceptación 3
mvn test -Dtest=RunCucumberTest -Dheadless=false -DslowMo=300    # ver el navegador
```

Evidencia: `target/cucumber/reporte.html` (reporte Cucumber con capturas incrustadas por escenario), `target/cucumber/reporte.json`,
`target/evidence/screenshots-bdd/` y `target/evidence/videos-bdd/`. `mvn test` sin filtros ejecuta la suite de la Unidad 1 y los escenarios BDD.
