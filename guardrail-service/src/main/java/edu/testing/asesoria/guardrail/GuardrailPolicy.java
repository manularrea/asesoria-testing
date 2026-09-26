package edu.testing.asesoria.guardrail;

import java.util.List;

/** Política de entrada: valida la longitud y bloquea mensajes con datos sensibles. */
public final class GuardrailPolicy {

  public static final int MAX_LENGTH = 500;
  public static final String BLOCKED_REASON =
      "Por seguridad no puedo procesar números de tarjeta ni de cuenta. Elimina el dato sensible y vuelve a formular la consulta.";
  static final String EMPTY_REASON = "El mensaje no puede estar vacío.";
  static final String TOO_LONG_REASON = "El mensaje supera el máximo de " + MAX_LENGTH + " caracteres.";

  private final SensitiveDataDetector detector = new SensitiveDataDetector();

  public Decision evaluate(String message) {
    if (message == null || message.isBlank()) {
      return new Decision(Decision.Status.INVALID, "", List.of(), EMPTY_REASON);
    }
    if (message.length() > MAX_LENGTH) {
      return new Decision(Decision.Status.INVALID, "", List.of(), TOO_LONG_REASON);
    }
    List<Finding> findings = detector.detect(message);
    if (findings.isEmpty()) {
      return new Decision(Decision.Status.ALLOWED, message, findings, "");
    }
    return new Decision(Decision.Status.BLOCKED, detector.mask(message, findings), findings, BLOCKED_REASON);
  }
}
