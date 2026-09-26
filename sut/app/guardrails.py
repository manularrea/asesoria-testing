"""Guardrails de entrada de AsesorIA.

Antes de que un mensaje llegue al motor NLU se valida su longitud y se detectan
datos sensibles (PAN de tarjeta con verificación Luhn e IBAN nacional). Un
mensaje con datos sensibles se bloquea y se registra enmascarado, nunca en claro.
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from dataclasses import dataclass
from urllib.error import URLError

MAX_MESSAGE_LENGTH = 500
BLOCKED_ANSWER = (
    "Por seguridad no puedo procesar números de tarjeta ni de cuenta. "
    "Elimina el dato sensible y vuelve a formular la consulta."
)

_CARD_RE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")
_IBAN_RE = re.compile(r"\bCR\d{2}(?:\s?\d{4}){4}\s?\d{2}\b", re.IGNORECASE)


@dataclass(frozen=True)
class Finding:
    kind: str      # "card" | "iban"
    original: str
    masked: str


def luhn_valid(digits: str) -> bool:
    total, parity = 0, len(digits) % 2
    for i, ch in enumerate(digits):
        d = int(ch)
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def detect_pii(text: str) -> list[Finding]:
    findings: list[Finding] = []
    for match in _CARD_RE.finditer(text):
        digits = re.sub(r"\D", "", match.group())
        if luhn_valid(digits):
            findings.append(Finding("card", match.group(), f"**** **** **** {digits[-4:]}"))
    for match in _IBAN_RE.finditer(text):
        findings.append(Finding("iban", match.group(), f"CR** **** **** {match.group()[-4:]}"))
    return findings


def mask(text: str, findings: list[Finding]) -> str:
    for finding in findings:
        text = text.replace(finding.original, finding.masked)
    return text


def validate_length(text: str) -> str | None:
    """Devuelve un mensaje de error o None si la longitud es válida."""
    if not text or not text.strip():
        return "El mensaje no puede estar vacío."
    if len(text) > MAX_MESSAGE_LENGTH:
        return f"El mensaje supera el máximo de {MAX_MESSAGE_LENGTH} caracteres."
    return None


# ---------------------------------------------------------------------------
# Unidad 3: la política puede delegarse al servicio Java guardrail-service
# (desarrollado con TDD). Si GUARDRAIL_URL no está definido, se evalúa localmente.
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Decision:
    status: str          # "allowed" | "blocked" | "invalid"
    masked_message: str
    reason: str
    source: str          # "local" | "service"


def _evaluate_local(text: str) -> Decision:
    error = validate_length(text)
    if error:
        return Decision("invalid", "", error, "local")
    findings = detect_pii(text)
    if findings:
        return Decision("blocked", mask(text, findings), BLOCKED_ANSWER, "local")
    return Decision("allowed", text, "", "local")


def _evaluate_remote(text: str, base_url: str, timeout: float = 2.0) -> Decision:
    payload = json.dumps({"message": text}).encode("utf-8")
    request = urllib.request.Request(f"{base_url.rstrip('/')}/guardrail/evaluate", data=payload,
                                     headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 (URL interna configurada)
        body = json.loads(response.read().decode("utf-8"))
    return Decision(body["status"], body["maskedMessage"], body["reason"], "service")


def evaluate(text: str) -> Decision:
    """Evalúa el mensaje con el servicio remoto si está configurado; si falla, degrada al control local."""
    base_url = os.getenv("GUARDRAIL_URL")
    if not base_url:
        return _evaluate_local(text)
    try:
        return _evaluate_remote(text, base_url)
    except (URLError, TimeoutError, ValueError, KeyError):
        return _evaluate_local(text)
