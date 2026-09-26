package edu.testing.asesoria.guardrail;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** JSON mínimo para el contrato del servicio (evita dependencias de runtime). */
final class Json {

  private Json() {}

  /** Devuelve el valor string del campo {@code field} de un objeto JSON plano, o null si no existe. */
  static String stringField(String json, String field) {
    if (json == null) {
      return null;
    }
    Pattern p = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
    Matcher m = p.matcher(json);
    return m.find() ? unescape(m.group(1)) : null;
  }

  static String toJson(Decision d) {
    StringBuilder sb = new StringBuilder("{\"status\":\"").append(d.status().name().toLowerCase())
        .append("\",\"maskedMessage\":\"").append(escape(d.maskedMessage())).append("\",\"findings\":[");
    for (int i = 0; i < d.findings().size(); i++) {
      Finding f = d.findings().get(i);
      if (i > 0) {
        sb.append(',');
      }
      sb.append("{\"type\":\"").append(f.type().name().toLowerCase()).append("\",\"masked\":\"").append(escape(f.masked())).append("\"}");
    }
    return sb.append("],\"reason\":\"").append(escape(d.reason())).append("\"}").toString();
  }

  static String escape(String s) {
    StringBuilder sb = new StringBuilder();
    for (char c : s.toCharArray()) {
      switch (c) {
        case '"' -> sb.append("\\\"");
        case '\\' -> sb.append("\\\\");
        case '\n' -> sb.append("\\n");
        case '\r' -> sb.append("\\r");
        case '\t' -> sb.append("\\t");
        default -> sb.append(c);
      }
    }
    return sb.toString();
  }

  private static String unescape(String s) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      if (c == '\\' && i + 1 < s.length()) {
        char n = s.charAt(++i);
        switch (n) {
          case 'n' -> sb.append('\n');
          case 'r' -> sb.append('\r');
          case 't' -> sb.append('\t');
          case 'u' -> {
            sb.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16));
            i += 4;
          }
          default -> sb.append(n);   // \" \\ \/
        }
      } else {
        sb.append(c);
      }
    }
    return sb.toString();
  }
}
