package edu.testing.asesoria.guardrail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * TDD ciclo 3 · RF-05 y RF-06: la política decide si un mensaje puede pasar al motor de IA.
 * Es la misma regla de negocio que verifica el escenario BDD @CA-03 de extremo a extremo.
 */
@DisplayName("GuardrailPolicy")
class GuardrailPolicyTest {

  private final GuardrailPolicy policy = new GuardrailPolicy();

  @Test
  @DisplayName("un mensaje limpio se permite sin cambios")
  void mensajeLimpioSePermite() {
    Decision d = policy.evaluate("¿cuál es el horario de las sucursales?");
    assertEquals(Decision.Status.ALLOWED, d.status());
    assertEquals("¿cuál es el horario de las sucursales?", d.maskedMessage());
    assertTrue(d.findings().isEmpty());
  }

  @Test
  @DisplayName("un mensaje con PAN válido se bloquea y se devuelve enmascarado")
  void mensajeConPanSeBloquea() {
    Decision d = policy.evaluate("El cliente indica que su tarjeta 4111 1111 1111 1111 fue clonada");
    assertEquals(Decision.Status.BLOCKED, d.status());
    assertEquals("El cliente indica que su tarjeta **** **** **** 1111 fue clonada", d.maskedMessage());
    assertEquals(1, d.findings().size());
    assertEquals(GuardrailPolicy.BLOCKED_REASON, d.reason());
  }

  @ParameterizedTest(name = "mensaje vacío ''{0}'' es inválido")
  @ValueSource(strings = {"", "   "})
  void mensajeVacioEsInvalido(String message) {
    Decision d = policy.evaluate(message);
    assertEquals(Decision.Status.INVALID, d.status());
    assertEquals("El mensaje no puede estar vacío.", d.reason());
  }

  @Test
  @DisplayName("análisis de valores límite: 500 caracteres se permite, 501 es inválido")
  void limiteDeLongitud() {
    assertEquals(Decision.Status.ALLOWED, policy.evaluate("a".repeat(GuardrailPolicy.MAX_LENGTH)).status());
    Decision tooLong = policy.evaluate("a".repeat(GuardrailPolicy.MAX_LENGTH + 1));
    assertEquals(Decision.Status.INVALID, tooLong.status());
    assertTrue(tooLong.reason().contains("500"));
  }

  @Test
  @DisplayName("un mensaje nulo se trata como inválido, no como error")
  void mensajeNuloEsInvalido() {
    assertEquals(Decision.Status.INVALID, policy.evaluate(null).status());
  }
}
