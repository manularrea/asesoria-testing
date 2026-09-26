package edu.testing.asesoria.guardrail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** TDD ciclo 4a: (de)serialización JSON mínima del contrato del servicio, sin dependencias externas. */
@DisplayName("Json")
class JsonTest {

  @Test
  @DisplayName("extrae el campo message de un objeto JSON, con escapes")
  void extraeCampoMessage() {
    assertEquals("hola \"mundo\"\n", Json.stringField("{\"message\": \"hola \\\"mundo\\\"\\n\"}", "message"));
    assertEquals("¿Cuál es el horario?", Json.stringField("{ \"message\" : \"¿Cuál es el horario?\" }", "message"));
  }

  @Test
  @DisplayName("devuelve null si el campo no existe o el JSON no es un objeto")
  void campoAusente() {
    assertNull(Json.stringField("{\"otro\": \"x\"}", "message"));
    assertNull(Json.stringField("no es json", "message"));
  }

  @Test
  @DisplayName("serializa una decisión con hallazgos y escapa caracteres especiales")
  void serializaDecision() {
    Decision d = new Decision(Decision.Status.BLOCKED, "tarjeta **** **** **** 1111",
        List.of(new Finding(Finding.Type.CARD, "4111 1111 1111 1111", "**** **** **** 1111")), "motivo \"x\"");
    String json = Json.toJson(d);
    assertEquals("{\"status\":\"blocked\",\"maskedMessage\":\"tarjeta **** **** **** 1111\","
        + "\"findings\":[{\"type\":\"card\",\"masked\":\"**** **** **** 1111\"}],\"reason\":\"motivo \\\"x\\\"\"}", json);
  }
}
