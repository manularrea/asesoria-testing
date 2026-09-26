package edu.testing.asesoria.ui;

import edu.testing.asesoria.BaseUiTest;
import edu.testing.asesoria.config.TestConfig;
import edu.testing.asesoria.pages.ChatPage;
import edu.testing.asesoria.pages.LoginPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

/** Escenario E-01: autenticación del asesor (RF-01, RF-02). */
@Tag("ui")
@DisplayName("E-01 Autenticación")
class LoginTest extends BaseUiTest {

  @Test
  @DisplayName("CP-UI-01 Login válido redirige al chat y muestra el nombre del asesor")
  void loginValidoRedirigeAlChat() {
    step("Abrir /login e ingresar credenciales válidas");
    ChatPage chat = new LoginPage(page).open().loginAs(TestConfig.DEMO_USER, TestConfig.DEMO_PASSWORD);

    step("Verificar redirección a /chat y saludo personalizado");
    assertThat(page).hasURL(Pattern.compile(".*/chat$"));
    assertThat(chat.greeting()).containsText(TestConfig.DEMO_DISPLAY_NAME);
    assertThat(chat.userName()).hasText(TestConfig.DEMO_DISPLAY_NAME);
    capture("CP-UI-01_chat_tras_login");
  }

  @Test
  @DisplayName("CP-UI-02 Credenciales inválidas muestran error y no crean sesión")
  void credencialesInvalidasMuestranError() {
    step("Intentar login con contraseña incorrecta");
    LoginPage login = new LoginPage(page).open();
    login.loginAs(TestConfig.DEMO_USER, "clave-incorrecta");

    step("Verificar mensaje de error, permanencia en /login y usuario conservado");
    assertThat(login.errorMessage()).isVisible();
    assertThat(login.errorMessage()).containsText("incorrectos");
    assertThat(page).hasURL(Pattern.compile(".*/login$"));
    assertThat(login.usernameField()).hasValue(TestConfig.DEMO_USER);
    capture("CP-UI-02_login_error");
  }

  @Test
  @DisplayName("CP-UI-03 Acceso directo a /chat sin sesión redirige a /login")
  void accesoSinSesionRedirigeALogin() {
    step("Navegar directamente a /chat sin autenticarse");
    new ChatPage(page).open();

    assertThat(page).hasURL(Pattern.compile(".*/login$"));
    assertThat(new LoginPage(page).submitButton()).isVisible();
  }

  @Test
  @DisplayName("CP-UI-04 Cerrar sesión invalida el acceso al chat")
  void logoutInvalidaLaSesion() {
    step("Iniciar sesión y luego cerrar sesión");
    ChatPage chat = loginAsDemo();
    chat.logout();
    assertThat(page).hasURL(Pattern.compile(".*/login$"));

    step("Verificar que /chat vuelve a exigir autenticación");
    chat.open();
    assertThat(page).hasURL(Pattern.compile(".*/login$"));
  }
}
