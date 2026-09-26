package edu.testing.asesoria.guardrail;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Detecta y enmascara números de tarjeta (PAN) e IBAN nacionales dentro de texto libre. */
public final class SensitiveDataDetector {

  /** 13 a 19 dígitos con separadores opcionales (espacio o guion); se confirma con Luhn. */
  private static final Pattern CARD = Pattern.compile("(?<!\\d)(?:\\d[ -]?){12,18}\\d(?!\\d)");
  /** IBAN de Costa Rica: CR + 2 dígitos de control + 18 dígitos, con o sin espacios. */
  private static final Pattern IBAN = Pattern.compile("\\bCR\\d{2}(?:\\s?\\d{4}){4}\\s?\\d{2}\\b", Pattern.CASE_INSENSITIVE);

  public List<Finding> detect(String text) {
    List<Finding> findings = new ArrayList<>();
    if (text == null || text.isBlank()) {
      return findings;
    }
    Matcher card = CARD.matcher(text);
    while (card.find()) {
      String digits = card.group().replaceAll("\\D", "");
      if (Luhn.isValid(digits)) {
        findings.add(new Finding(Finding.Type.CARD, card.group(), "**** **** **** " + digits.substring(digits.length() - 4)));
      }
    }
    Matcher iban = IBAN.matcher(text);
    while (iban.find()) {
      String digits = iban.group().replaceAll("\\D", "");
      findings.add(new Finding(Finding.Type.IBAN, iban.group(), "CR** **** **** " + digits.substring(digits.length() - 4)));
    }
    return findings;
  }

  public String mask(String text, List<Finding> findings) {
    String result = text;
    for (Finding finding : findings) {
      result = result.replace(finding.original(), finding.masked());
    }
    return result;
  }
}
