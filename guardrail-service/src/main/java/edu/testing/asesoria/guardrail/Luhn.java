package edu.testing.asesoria.guardrail;

/** Verificación de dígito de control (ISO/IEC 7812) para números de tarjeta. */
public final class Luhn {

  private Luhn() {}

  /** @return true si {@code digits} contiene solo dígitos y su suma de Luhn es múltiplo de 10. */
  public static boolean isValid(String digits) {
    if (digits == null || digits.isEmpty() || !digits.chars().allMatch(Character::isDigit)) {
      return false;
    }
    int sum = 0;
    boolean doubleIt = false;
    for (int i = digits.length() - 1; i >= 0; i--) {
      int d = digits.charAt(i) - '0';
      if (doubleIt) {
        d *= 2;
        if (d > 9) {
          d -= 9;
        }
      }
      sum += d;
      doubleIt = !doubleIt;
    }
    return sum % 10 == 0;
  }
}
