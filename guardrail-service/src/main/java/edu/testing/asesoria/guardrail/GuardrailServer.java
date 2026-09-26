package edu.testing.asesoria.guardrail;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * Servicio HTTP del guardrail de datos sensibles (solo JDK, sin dependencias):
 * GET /health · POST /guardrail/evaluate {"message": "..."}.
 * Es el componente que el SUT AsesorIA invoca antes de la inferencia cuando GUARDRAIL_URL está definido.
 */
public final class GuardrailServer {

  private static final String VERSION = "1.0.0";
  private final HttpServer server;
  private final GuardrailPolicy policy = new GuardrailPolicy();

  private GuardrailServer(HttpServer server) {
    this.server = server;
  }

  public static GuardrailServer start(int port) throws IOException {
    HttpServer http = HttpServer.create(new InetSocketAddress(port), 0);
    GuardrailServer instance = new GuardrailServer(http);
    http.createContext("/health", instance::health);
    http.createContext("/guardrail/evaluate", instance::evaluate);
    http.start();
    return instance;
  }

  public int port() {
    return server.getAddress().getPort();
  }

  public void stop() {
    server.stop(0);
  }

  private void health(HttpExchange exchange) throws IOException {
    respond(exchange, 200, "{\"status\":\"ok\",\"service\":\"guardrail\",\"version\":\"" + VERSION + "\"}");
  }

  private void evaluate(HttpExchange exchange) throws IOException {
    if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
      respond(exchange, 405, "{\"error\":\"método no permitido\"}");
      return;
    }
    String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    String message = Json.stringField(body, "message");
    if (message == null) {
      respond(exchange, 400, "{\"error\":\"se requiere el campo message\"}");
      return;
    }
    respond(exchange, 200, Json.toJson(policy.evaluate(message)));
  }

  private static void respond(HttpExchange exchange, int status, String json) throws IOException {
    byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream out = exchange.getResponseBody()) {
      out.write(bytes);
    }
  }

  public static void main(String[] args) throws IOException {
    int port = Integer.parseInt(args.length > 0 ? args[0] : System.getenv().getOrDefault("GUARDRAIL_PORT", "8090"));
    GuardrailServer instance = start(port);
    System.out.println("guardrail-service " + VERSION + " escuchando en http://localhost:" + instance.port());
  }
}
