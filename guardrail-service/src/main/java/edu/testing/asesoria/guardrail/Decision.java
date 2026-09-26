package edu.testing.asesoria.guardrail;

import java.util.List;

/** Resultado de evaluar un mensaje contra la política del guardrail. */
public record Decision(Status status, String maskedMessage, List<Finding> findings, String reason) {

  public enum Status { ALLOWED, BLOCKED, INVALID }
}
