package edu.testing.asesoria.guardrail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TDD ciclo 2 · RF-05: detección y enmascaramiento de PAN (con Luhn) e IBAN nacional en texto libre. */
@DisplayName("SensitiveDataDetector")
class SensitiveDataDetectorTest {

  private final SensitiveDataDetector detector = new SensitiveDataDetector();

  @Test
  @DisplayName("detecta un PAN con espacios y lo enmascara dejando los últimos 4 dígitos")
  void detectaPanConEspacios() {
    String texto = "el cliente dice que su tarjeta 4111 1111 1111 1111 fue clonada";
    List<Finding> findings = detector.detect(texto);
    assertEquals(1, findings.size());
    assertEquals(Finding.Type.CARD, findings.get(0).type());
    assertEquals("**** **** **** 1111", findings.get(0).masked());
    assertEquals("el cliente dice que su tarjeta **** **** **** 1111 fue clonada", detector.mask(texto, findings));
  }

  @Test
  @DisplayName("detecta un PAN con guiones")
  void detectaPanConGuiones() {
    assertEquals(1, detector.detect("tarjeta 4111-1111-1111-1111 extraviada").size());
  }

  @Test
  @DisplayName("un número largo que no cumple Luhn no es tarjeta (evita falsos positivos)")
  void numeroSinLuhnNoEsTarjeta() {
    assertTrue(detector.detect("el expediente 1234567890123 sigue abierto").isEmpty());
    assertTrue(detector.detect("ticket 4111111111111112").isEmpty());
  }

  @Test
  @DisplayName("detecta un IBAN de Costa Rica y lo enmascara")
  void detectaIbanNacional() {
    String texto = "transferir a CR05 0152 0200 1026 2840 66 mañana";
    List<Finding> findings = detector.detect(texto);
    assertEquals(1, findings.size());
    assertEquals(Finding.Type.IBAN, findings.get(0).type());
    assertEquals("CR** **** **** 4066", findings.get(0).masked());
    assertEquals("transferir a CR** **** **** 4066 mañana", detector.mask(texto, findings));
  }

  @Test
  @DisplayName("detecta varios hallazgos en un mismo mensaje")
  void detectaVariosHallazgos() {
    List<Finding> findings = detector.detect("tarjeta 5500 0000 0000 0004 y cuenta CR05015202001026284066");
    assertEquals(2, findings.size());
  }

  @Test
  @DisplayName("texto sin datos sensibles no produce hallazgos ni cambios")
  void textoLimpio() {
    String texto = "¿cuál es el horario de las sucursales?";
    List<Finding> findings = detector.detect(texto);
    assertTrue(findings.isEmpty());
    assertEquals(texto, detector.mask(texto, findings));
  }
}
