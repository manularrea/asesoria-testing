"""Pruebas unitarias de los guardrails de entrada (pytest)."""
import pytest

from app.guardrails import MAX_MESSAGE_LENGTH, detect_pii, luhn_valid, mask, validate_length


def test_luhn_acepta_pan_valido_y_rechaza_invalido():
    assert luhn_valid("4111111111111111") is True
    assert luhn_valid("4111111111111112") is False


def test_detecta_tarjeta_y_enmascara():
    texto = "el cliente dice que su tarjeta 4111 1111 1111 1111 fue clonada"
    findings = detect_pii(texto)
    assert [f.kind for f in findings] == ["card"]
    assert mask(texto, findings) == "el cliente dice que su tarjeta **** **** **** 1111 fue clonada"


def test_numero_largo_sin_luhn_no_es_tarjeta():
    assert detect_pii("el expediente 1234567890123 sigue abierto") == []


def test_detecta_iban_nacional():
    assert [f.kind for f in detect_pii("transferir a CR05 0152 0200 1026 2840 66")] == ["iban"]


@pytest.mark.parametrize("texto", ["", "   "])
def test_longitud_rechaza_vacio(texto):
    assert validate_length(texto) is not None


def test_longitud_limites():
    assert validate_length("a" * MAX_MESSAGE_LENGTH) is None          # valor límite válido
    assert validate_length("a" * (MAX_MESSAGE_LENGTH + 1)) is not None  # primer valor inválido
