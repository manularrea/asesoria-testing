# Guion del video de evidencia (2–3 minutos)

Grabar la pantalla (QuickTime / OBS) con dos ventanas visibles: la terminal y el navegador Chromium que abre Playwright.
Preparación previa: SUT levantado (`uvicorn app.main:app --port 8000`) y `mvn test` ejecutado al menos una vez
(para que Maven ya tenga las dependencias y Chromium descargados).

| Tiempo | En pantalla | Narración (guía) |
|---|---|---|
| 0:00–0:20 | Título / README abierto | «Esta es la evidencia técnica de la actividad de la Unidad 1. El sistema bajo prueba es AsesorIA, un asistente conversacional con IA para asesores financieros que construí para la actividad: clasifica la intención de la consulta con TF-IDF y similitud coseno, aplica un umbral de confianza y bloquea datos sensibles.» |
| 0:20–0:45 | Navegador en `http://localhost:8000` — login manual y una consulta | «El flujo funcional a automatizar es el inicio de sesión y la consulta al asistente. La interfaz expone atributos `data-testid` para que las pruebas usen selectores estables.» |
| 0:45–1:15 | VS Code: `LoginTest.java` y `LoginPage.java` | «El harness está en Java 17 con JUnit 5 y Playwright. Uso el patrón Page Object: la clase `LoginPage` encapsula la pantalla y `LoginTest` contiene el caso CP-UI-01: abrir /login, ingresar credenciales y verificar con aserciones de auto-espera que se llega a /chat con el saludo del asesor. Cada caso lleva su identificador en `@DisplayName`, que enlaza con la matriz de trazabilidad.» |
| 1:15–1:35 | VS Code: `ChatApiTest.java` (conjunto dorado) | «En el nivel de API uso el cliente HTTP de Playwright sin navegador: una prueba parametrizada valida el conjunto dorado de diez intenciones, otra verifica el fallback fuera de dominio y otra el bloqueo de un número de tarjeta.» |
| 1:35–2:20 | Terminal: `mvn test -Dgroups=ui -Dheadless=false -DslowMo=300` (Chromium visible) | «Ejecuto la suite de interfaz en modo visible y lento para que se aprecie: Playwright abre Chromium, inicia sesión, envía las consultas, comprueba intención, estado y confianza, y revisa el historial con el dato enmascarado.» (Dejar correr; comentar los casos a medida que aparecen.) |
| 2:20–2:45 | Terminal: resumen de Surefire (`Tests run: 32, Failures: 0`) y carpeta `target/evidence` | «Al terminar, Surefire reporta 32 pruebas exitosas (19 de API y 11 de UI) más 18 unitarias en pytest. Por cada prueba de UI quedan una captura y un video como evidencia, y los reportes XML permiten integrar la suite en CI.» |
| 2:45–3:00 | Documento (matriz de trazabilidad) | «La matriz de trazabilidad muestra que los 11 requisitos quedan cubiertos por al menos un caso automatizado. Gracias.» |

Consejos: grabar a 1280×800 o superior, cerrar notificaciones, y si `mvn test` tarda por la descarga inicial, cortar ese tramo en la edición.
Alternativa sin narración: el archivo `docs/evidencia/video_evidencia_junit_playwright.mp4` (1:49 min) ya contiene la grabación automática de los 11 casos de UI.
