package edu.testing.asesoria.guardrail;

/** Dato sensible encontrado en un texto, con su versión enmascarada. */
public record Finding(Type type, String original, String masked) {

  public enum Type { CARD, IBAN }
}
