package edu.testing.asesoria.guardrail;

/** Política de entrada: valida la longitud y bloquea mensajes con datos sensibles. */
public final class GuardrailPolicy {

  public static final int MAX_LENGTH = 500;
  public static final String BLOCKED_REASON =
      "Por seguridad no puedo procesar números de tarjeta ni de cuenta. Elimina el dato sensible y vuelve a formular la consulta.";

  public Decision evaluate(String message) {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }
}
