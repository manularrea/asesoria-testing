package edu.testing.asesoria.guardrail;

import java.io.IOException;

/** Servicio HTTP del guardrail: GET /health, POST /guardrail/evaluate. */
public final class GuardrailServer {

  public static GuardrailServer start(int port) throws IOException {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }

  public int port() {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }

  public void stop() {
    throw new UnsupportedOperationException("pendiente (TDD: fase roja)");
  }

  public static void main(String[] args) throws IOException {
    start(Integer.parseInt(args.length > 0 ? args[0] : "8090"));
  }
}
