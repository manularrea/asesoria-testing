package edu.testing.asesoria.ui;

import edu.testing.asesoria.BaseUiTest;
import edu.testing.asesoria.pages.ChatPage;
import edu.testing.asesoria.pages.HistorialPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

/** Escenario E-03: consulta del historial de la sesión (RF-07, RNF-02). */
@Tag("ui")
@DisplayName("E-03 Historial de consultas")
class HistorialTest extends BaseUiTest {

  @Test
  @DisplayName("CP-UI-10 Sesión nueva muestra historial vacío")
  void historialVacioEnSesionNueva() {
    ChatPage chat = loginAsDemo();
    HistorialPage historial = chat.goToHistorial();

    assertThat(historial.emptyState()).isVisible();
    assertThat(historial.rows()).hasCount(0);
  }

  @Test
  @DisplayName("CP-UI-11 El historial registra las consultas con su intención y enmascara datos sensibles")
  void historialRegistraConsultasYEnmascara() {
    ChatPage chat = loginAsDemo();
    step("Realizar dos consultas: una válida y una con número de tarjeta");
    chat.send("¿Cuál es el horario de las sucursales?");
    chat.send("mi tarjeta 4111 1111 1111 1111 fue clonada");

    step("Abrir historial y verificar filas, intención y enmascaramiento");
    HistorialPage historial = chat.goToHistorial();
    assertThat(historial.rows()).hasCount(2);
    assertThat(historial.intentOf(historial.rows().nth(0))).hasText("horario_sucursales");
    assertThat(historial.messageOf(historial.rows().nth(1))).containsText("**** **** **** 1111");
    assertThat(historial.messageOf(historial.rows().nth(1))).not().containsText("4111 1111 1111 1111");
    capture("CP-UI-11_historial");
  }
}
