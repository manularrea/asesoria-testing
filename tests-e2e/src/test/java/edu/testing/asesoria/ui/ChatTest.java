package edu.testing.asesoria.ui;

import com.microsoft.playwright.Locator;
import edu.testing.asesoria.BaseUiTest;
import edu.testing.asesoria.pages.ChatPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

/** Escenario E-02: consulta al asistente de IA (RF-03, RF-04, RF-05, RF-06). */
@Tag("ui")
@DisplayName("E-02 Consulta al asistente")
class ChatTest extends BaseUiTest {

  @Test
  @DisplayName("CP-UI-05 El botón Enviar solo se habilita con texto en la entrada")
  void botonEnviarSoloConTexto() {
    ChatPage chat = loginAsDemo();
    step("Verificar estado inicial deshabilitado y transición al escribir");
    assertThat(chat.sendButton()).isDisabled();
    chat.input().fill("hola");
    assertThat(chat.sendButton()).isEnabled();
    chat.input().fill("   ");
    assertThat(chat.sendButton()).isDisabled();
  }

  @Test
  @DisplayName("CP-UI-06 Consulta de horario devuelve la intención horario_sucursales con respuesta oficial")
  void consultaHorarioRespondeIntencionCorrecta() {
    ChatPage chat = loginAsDemo();
    step("Enviar consulta dentro del dominio");
    Locator reply = chat.send("¿Cuál es el horario de atención de las sucursales?");

    step("Verificar respuesta, intención, estado y confianza visible");
    assertThat(chat.answerOf(reply)).containsText("8:30");
    assertThat(chat.intentOf(reply)).hasText("horario_sucursales");
    assertThat(chat.statusOf(reply)).hasText("estado: ok");
    assertThat(chat.confidenceOf(reply)).isVisible();
    assertThat(chat.userMessages()).hasCount(1);
    capture("CP-UI-06_respuesta_horario");
  }

  @Test
  @DisplayName("CP-UI-07 Consulta fuera de dominio produce fallback controlado")
  void consultaFueraDeDominioProduceFallback() {
    ChatPage chat = loginAsDemo();
    step("Enviar consulta ajena al dominio financiero");
    Locator reply = chat.send("¿Cómo preparo una lasaña?");

    assertThat(chat.statusOf(reply)).hasText("estado: fallback");
    assertThat(chat.intentOf(reply)).hasText("fuera_de_dominio");
    assertThat(chat.answerOf(reply)).containsText("No tengo información suficiente");
    capture("CP-UI-07_fallback");
  }

  @Test
  @DisplayName("CP-UI-08 Mensaje con número de tarjeta es bloqueado por el guardrail")
  void mensajeConTarjetaEsBloqueado() {
    ChatPage chat = loginAsDemo();
    step("Enviar mensaje con PAN válido (Luhn)");
    Locator reply = chat.send("El cliente dice que su tarjeta 4111 1111 1111 1111 fue clonada");

    assertThat(chat.statusOf(reply)).hasText("estado: blocked");
    assertThat(chat.intentOf(reply)).hasText("bloqueado_pii");
    assertThat(chat.answerOf(reply)).containsText("Por seguridad");
    assertThat(chat.confidenceOf(reply)).hasCount(0);
    capture("CP-UI-08_bloqueo_pii");
  }

  @Test
  @DisplayName("CP-UI-09 La conversación conserva los turnos previos")
  void conversacionConservaTurnos() {
    ChatPage chat = loginAsDemo();
    chat.send("requisitos para un crédito personal");
    chat.send("cómo bloqueo mi tarjeta");

    assertThat(chat.userMessages()).hasCount(2);
    assertThat(chat.botMessages()).hasCount(2);
    assertThat(chat.intentOf(chat.botMessages().nth(0))).hasText("credito_personal");
    assertThat(chat.intentOf(chat.botMessages().nth(1))).hasText("bloqueo_tarjeta");
  }
}
