package edu.testing.asesoria.guardrail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TDD ciclo 1 · RF-05: un número solo se considera PAN si supera el algoritmo de Luhn. */
@DisplayName("Luhn")
class LuhnTest {

  @ParameterizedTest(name = "acepta PAN válido {0}")
  @ValueSource(strings = {"4111111111111111", "5500000000000004", "340000000000009", "6011000000000004"})
  void aceptaNumerosValidos(String pan) {
    assertTrue(Luhn.isValid(pan));
  }

  @ParameterizedTest(name = "rechaza {0}")
  @ValueSource(strings = {"4111111111111112", "1234567890123", "0000000000000001"})
  void rechazaNumerosInvalidos(String digits) {
    assertFalse(Luhn.isValid(digits));
  }

  @Test
  @DisplayName("rechaza entradas vacías o con caracteres no numéricos")
  void rechazaEntradasNoNumericas() {
    assertFalse(Luhn.isValid(""));
    assertFalse(Luhn.isValid("4111 1111 1111 1111"));
    assertFalse(Luhn.isValid(null));
  }
}
