package edu.testing.asesoria.guardrail;

import java.util.List;

/** Detecta y enmascara números de tarjeta (PAN) e IBAN nacionales dentro de texto libre. */
public final class SensitiveDataDetector {

  public List<Finding> detect(String text) {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }

  public String mask(String text, List<Finding> findings) {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }
}
