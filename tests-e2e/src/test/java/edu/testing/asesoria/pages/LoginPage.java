package edu.testing.asesoria.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import edu.testing.asesoria.config.TestConfig;

/** Page Object de la pantalla de inicio de sesión. */
public class LoginPage {

  public static final String PATH = "/login";

  private final Page page;
  private final Locator username;
  private final Locator password;
  private final Locator submit;
  private final Locator error;

  public LoginPage(Page page) {
    this.page = page;
    this.username = page.getByTestId("login-username");
    this.password = page.getByTestId("login-password");
    this.submit = page.getByTestId("login-submit");
    this.error = page.getByTestId("login-error");
  }

  public LoginPage open() {
    page.navigate(TestConfig.BASE_URL + PATH);
    return this;
  }

  /** Envía credenciales y devuelve la página de chat (no valida el resultado). */
  public ChatPage loginAs(String user, String pass) {
    username.fill(user);
    password.fill(pass);
    submit.click();
    return new ChatPage(page);
  }

  public Locator usernameField() { return username; }
  public Locator submitButton() { return submit; }
  public Locator errorMessage() { return error; }
}
