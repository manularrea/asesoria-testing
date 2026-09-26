package edu.testing.asesoria.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import edu.testing.asesoria.config.TestConfig;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

/** Page Object de la pantalla de chat del asistente. */
public class ChatPage {

  public static final String PATH = "/chat";

  private final Page page;
  private final Locator greeting;
  private final Locator input;
  private final Locator send;
  private final Locator botMessages;
  private final Locator userMessages;

  public ChatPage(Page page) {
    this.page = page;
    this.greeting = page.getByTestId("chat-greeting");
    this.input = page.getByTestId("chat-input");
    this.send = page.getByTestId("chat-send");
    this.botMessages = page.getByTestId("msg-bot");
    this.userMessages = page.getByTestId("msg-user");
  }

  public ChatPage open() {
    page.navigate(TestConfig.BASE_URL + PATH);
    return this;
  }

  /** Escribe la consulta, la envía y espera la respuesta del asistente. Devuelve el mensaje del bot. */
  public Locator send(String message) {
    int before = botMessages.count();
    input.fill(message);
    send.click();
    Locator reply = botMessages.nth(before);
    assertThat(reply).isVisible();
    return reply;
  }

  public Locator greeting() { return greeting; }
  public Locator input() { return input; }
  public Locator sendButton() { return send; }
  public Locator botMessages() { return botMessages; }
  public Locator userMessages() { return userMessages; }
  public Locator userName() { return page.getByTestId("user-name"); }

  public Locator answerOf(Locator botMessage) { return botMessage.getByTestId("bot-answer"); }
  public Locator intentOf(Locator botMessage) { return botMessage.getByTestId("intent-badge"); }
  public Locator statusOf(Locator botMessage) { return botMessage.getByTestId("status-badge"); }
  public Locator confidenceOf(Locator botMessage) { return botMessage.getByTestId("confidence-badge"); }

  public HistorialPage goToHistorial() {
    page.getByTestId("nav-historial").click();
    return new HistorialPage(page);
  }

  public LoginPage logout() {
    page.getByTestId("btn-logout").click();
    return new LoginPage(page);
  }
}
