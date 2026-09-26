"""Pruebas unitarias del punto de integración con guardrail-service (Unidad 3)."""
import io
import json

import pytest

from app import guardrails


def test_sin_url_evalua_localmente(monkeypatch):
    monkeypatch.delenv("GUARDRAIL_URL", raising=False)
    decision = guardrails.evaluate("tarjeta 4111 1111 1111 1111")
    assert decision.status == "blocked" and decision.source == "local"
    assert "**** **** **** 1111" in decision.masked_message


def test_con_url_usa_el_servicio(monkeypatch):
    monkeypatch.setenv("GUARDRAIL_URL", "http://guardrail:8090")
    captured = {}

    class FakeResponse(io.BytesIO):
        def __enter__(self): return self
        def __exit__(self, *a): return False

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["body"] = json.loads(request.data)
        return FakeResponse(json.dumps({"status": "blocked", "maskedMessage": "t **** **** **** 1111",
                                        "findings": [], "reason": "bloqueado"}).encode())

    monkeypatch.setattr(guardrails.urllib.request, "urlopen", fake_urlopen)
    decision = guardrails.evaluate("t 4111 1111 1111 1111")
    assert captured["url"] == "http://guardrail:8090/guardrail/evaluate"
    assert captured["body"] == {"message": "t 4111 1111 1111 1111"}
    assert decision == guardrails.Decision("blocked", "t **** **** **** 1111", "bloqueado", "service")


def test_si_el_servicio_falla_degrada_a_local(monkeypatch):
    monkeypatch.setenv("GUARDRAIL_URL", "http://127.0.0.1:1")   # puerto cerrado
    decision = guardrails.evaluate("horario de sucursales")
    assert decision.status == "allowed" and decision.source == "local"


@pytest.mark.parametrize("texto, status", [("", "invalid"), ("a" * 501, "invalid"), ("hola", "allowed")])
def test_evaluacion_local_valida_longitud(monkeypatch, texto, status):
    monkeypatch.delenv("GUARDRAIL_URL", raising=False)
    assert guardrails.evaluate(texto).status == status
