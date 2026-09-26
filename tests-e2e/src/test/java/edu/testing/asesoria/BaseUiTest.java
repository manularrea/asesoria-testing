package edu.testing.asesoria;

import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.Video;
import edu.testing.asesoria.config.TestConfig;
import edu.testing.asesoria.pages.ChatPage;
import edu.testing.asesoria.pages.LoginPage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Ciclo de vida compartido por las pruebas de interfaz (E2E):
 * un navegador por clase, un contexto aislado por prueba (cookies/estado limpios),
 * grabación de video y captura de pantalla final como evidencia.
 */
public abstract class BaseUiTest {

  protected static Playwright playwright;
  protected static Browser browser;

  protected BrowserContext context;
  protected Page page;

  @BeforeAll
  static void launchBrowser() {
    playwright = Playwright.create();
    verifySutIsRunning();
    browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
        .setHeadless(TestConfig.HEADLESS)
        .setSlowMo(TestConfig.SLOW_MO_MS));
  }

  @AfterAll
  static void closeBrowser() {
    if (browser != null) browser.close();
    if (playwright != null) playwright.close();
  }

  @BeforeEach
  void createContext(TestInfo info) {
    Browser.NewContextOptions options = new Browser.NewContextOptions()
        .setViewportSize(1280, 800)
        .setLocale("es-CR");
    if (TestConfig.RECORD_VIDEO) {
      options.setRecordVideoDir(TestConfig.EVIDENCE_DIR.resolve("videos"))
             .setRecordVideoSize(1280, 800);
    }
    context = browser.newContext(options);
    context.setDefaultTimeout(TestConfig.DEFAULT_TIMEOUT_MS);
    page = context.newPage();
    System.out.println("[INICIO] " + info.getDisplayName());
  }

  @AfterEach
  void closeContext(TestInfo info) throws IOException {
    String name = evidenceName(info);
    Path screenshots = TestConfig.EVIDENCE_DIR.resolve("screenshots");
    Files.createDirectories(screenshots);
    if (page != null && !page.isClosed()) {
      page.screenshot(new Page.ScreenshotOptions().setPath(screenshots.resolve(name + ".png")).setFullPage(true));
    }
    Video video = page == null ? null : page.video();
    context.close();
    if (video != null) {
      Path target = TestConfig.EVIDENCE_DIR.resolve("videos").resolve(name + ".webm");
      video.saveAs(target);
      video.delete();
    }
    System.out.println("[FIN]    " + info.getDisplayName());
  }

  /** Inicia sesión con el usuario de demostración y devuelve la página de chat. */
  protected ChatPage loginAsDemo() {
    return new LoginPage(page).open().loginAs(TestConfig.DEMO_USER, TestConfig.DEMO_PASSWORD);
  }

  /** Captura intermedia con nombre explícito (evidencia de un paso concreto). */
  protected void capture(String label) {
    try {
      Path dir = TestConfig.EVIDENCE_DIR.resolve("screenshots");
      Files.createDirectories(dir);
      page.screenshot(new Page.ScreenshotOptions().setPath(dir.resolve(label + ".png")).setFullPage(true));
    } catch (IOException e) {
      throw new IllegalStateException("No se pudo guardar la captura " + label, e);
    }
  }

  protected static void step(String description) {
    System.out.println("   -> " + description);
  }

  private static void verifySutIsRunning() {
    APIRequestContext request = playwright.request().newContext();
    try {
      APIResponse health = request.get(TestConfig.BASE_URL + "/api/health");
      if (!health.ok()) {
        throw new IllegalStateException("El SUT respondió " + health.status() + " en /api/health");
      }
    } catch (RuntimeException e) {
      throw new IllegalStateException("SUT no disponible en " + TestConfig.BASE_URL
          + ". Inicia AsesorIA con: uvicorn app.main:app --port 8000 (ver README). Causa: " + e.getMessage(), e);
    } finally {
      request.dispose();
    }
  }

  private static String evidenceName(TestInfo info) {
    String cls = info.getTestClass().map(Class::getSimpleName).orElse("Test");
    String method = info.getTestMethod().map(m -> m.getName()).orElse("test");
    return cls + "_" + method;
  }
}
