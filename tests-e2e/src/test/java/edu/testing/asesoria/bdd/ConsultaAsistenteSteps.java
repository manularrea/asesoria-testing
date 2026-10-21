package edu.testing.asesoria.bdd;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import edu.testing.asesoria.config.TestConfig;
import edu.testing.asesoria.pages.ChatPage;
import edu.testing.asesoria.pages.HistorialPage;
import edu.testing.asesoria.pages.LoginPage;
import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import io.cucumber.java.es.Cuando;
import io.cucumber.java.es.Dado;
import io.cucumber.java.es.Entonces;
import io.cucumber.java.es.Y;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Step definitions (glue) de la característica "Consulta asistida por IA".
 * Reutiliza los Page Objects del harness de la Unidad 1; cada escenario corre en un
 * contexto de navegador nuevo y deja captura y video como evidencia.
 */
public class ConsultaAsistenteSteps {

  private static Playwright playwright;
  private static Browser browser;

  private BrowserContext context;
  private Page page;
  private ChatPage chat;
  private Locator ultimaRespuesta;

  // ---------- hooks ----------
  @BeforeAll
  public static void abrirNavegador() {
    playwright = Playwright.create();
    browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
        .setHeadless(TestConfig.HEADLESS).setSlowMo(TestConfig.SLOW_MO_MS));
  }

  @AfterAll
  public static void cerrarNavegador() {
    if (browser != null) browser.close();
    if (playwright != null) playwright.close();
  }

  @Before
  public void nuevoContexto() {
    Browser.NewContextOptions options = new Browser.NewContextOptions().setViewportSize(1280, 800).setLocale("es-CR");
    if (TestConfig.RECORD_VIDEO) {
      options.setRecordVideoDir(TestConfig.EVIDENCE_DIR.resolve("videos-bdd")).setRecordVideoSize(1280, 800);
    }
    context = browser.newContext(options);
    context.setDefaultTimeout(TestConfig.DEFAULT_TIMEOUT_MS);
    page = context.newPage();
  }

  @After
  public void cerrarContexto(Scenario scenario) throws Exception {
    if (page != null && !page.isClosed()) {
      byte[] png = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
      scenario.attach(png, "image/png", scenario.getName());          // se incrusta en el reporte HTML
      Path dir = TestConfig.EVIDENCE_DIR.resolve("screenshots-bdd");
      Files.createDirectories(dir);
      Files.write(dir.resolve(nombreArchivo(scenario) + ".png"), png);
    }
    context.close();
  }

  // ---------- Antecedentes ----------
  @Dado("que el asesor {string} ha iniciado sesión en AsesorIA")
  public void elAsesorHaIniciadoSesion(String usuario) {
    if (!TestConfig.DEMO_USER.equals(usuario)) {
      throw new IllegalArgumentException("Usuario de prueba no configurado: " + usuario);
    }
    chat = new LoginPage(page).open().loginAs(usuario, TestConfig.DEMO_PASSWORD);
  }

  @Y("se encuentra en la pantalla de chat")
  public void seEncuentraEnLaPantallaDeChat() {
    assertThat(page).hasURL(Pattern.compile(".*/chat$"));
    assertThat(chat.greeting()).isVisible();
  }

  // ---------- Cuando ----------
  @Cuando("el asesor consulta {string}")
  public void elAsesorConsulta(String consulta) {
    ultimaRespuesta = chat.send(consulta);
  }

  // ---------- Entonces ----------
  @Entonces("el asistente responde con la intención {string}")
  public void elAsistenteRespondeConLaIntencion(String intencion) {
    assertThat(chat.intentOf(ultimaRespuesta)).hasText(intencion);
  }

  @Y("la respuesta contiene {string}")
  public void laRespuestaContiene(String fragmento) {
    assertThat(chat.answerOf(ultimaRespuesta)).containsText(fragmento);
  }

  @Y("el estado de la respuesta es {string}")
  public void elEstadoDeLaRespuestaEs(String estado) {
    assertThat(chat.statusOf(ultimaRespuesta)).hasText("estado: " + estado);
  }

  // Expresión regular en lugar de {double}: con "# language: es" Cucumber-JVM interpreta
  // {double} con la configuración regional española (coma decimal) y lee "0.40" como 40.0.
  // Se aceptan ambos separadores para que el mismo .feature sirva al glue Java y al de JS.
  @Y("^la confianza mostrada es mayor o igual a (\\d+[.,]\\d+)$")
  public void laConfianzaMostradaEsMayorOIgualA(String umbralTexto) {
    double umbral = Double.parseDouble(umbralTexto.replace(',', '.'));
    String texto = chat.confidenceOf(ultimaRespuesta).textContent();   // "confianza: 0.85"
    double confianza = Double.parseDouble(texto.replace("confianza:", "").trim());
    assertTrue(confianza >= umbral, "confianza " + confianza + " menor que " + umbral);
  }

  @Entonces("el asistente indica que no tiene información suficiente")
  public void elAsistenteIndicaQueNoTieneInformacionSuficiente() {
    assertThat(chat.answerOf(ultimaRespuesta)).containsText("No tengo información suficiente");
    assertThat(chat.intentOf(ultimaRespuesta)).hasText("fuera_de_dominio");
  }

  @Entonces("el asistente rechaza la consulta por contener datos sensibles")
  public void elAsistenteRechazaLaConsultaPorDatosSensibles() {
    assertThat(chat.answerOf(ultimaRespuesta)).containsText("Por seguridad");
    assertThat(chat.intentOf(ultimaRespuesta)).hasText("bloqueado_pii");
    assertThat(chat.confidenceOf(ultimaRespuesta)).hasCount(0);
  }

  @Y("el historial muestra la consulta con el número enmascarado como {string}")
  public void elHistorialMuestraLaConsultaEnmascarada(String mascara) {
    HistorialPage historial = chat.goToHistorial();
    Locator ultimaFila = historial.rows().last();
    assertThat(historial.messageOf(ultimaFila)).containsText(mascara);
    assertThat(historial.messageOf(ultimaFila)).not().containsText("4111 1111 1111 1111");
  }

  private static String nombreArchivo(Scenario scenario) {
    // Nombre ASCII: sin tildes para no depender de la codificación del sistema de archivos del agente CI.
    String ascii = java.text.Normalizer.normalize(scenario.getName(), java.text.Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "");
    return ascii.replaceAll("[^A-Za-z0-9]+", "_").replaceAll("^_|_$", "");
  }
}
