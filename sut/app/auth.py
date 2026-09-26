"""Autenticación mínima de AsesorIA (usuarios en memoria, contraseñas con PBKDF2)."""
from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass

_ITERATIONS = 100_000


@dataclass(frozen=True)
class User:
    username: str
    display_name: str
    role: str
    salt: bytes
    password_hash: bytes


def _hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)


def _make_user(username: str, display_name: str, role: str, password: str) -> User:
    salt = os.urandom(16)
    return User(username, display_name, role, salt, _hash(password, salt))


# Credenciales de demostración (documentadas en el README y en el plan de pruebas).
USERS: dict[str, User] = {
    u.username: u
    for u in (
        _make_user("asesor.demo", "Asesora Demo", "asesor", "Asesor2026*"),
        _make_user("supervisor.demo", "Supervisor Demo", "supervisor", "Super2026*"),
    )
}


def authenticate(username: str, password: str) -> User | None:
    user = USERS.get(username.strip().lower())
    if user is None:
        # Comparación ficticia para no revelar por tiempo si el usuario existe.
        _hash(password, b"0" * 16)
        return None
    if hmac.compare_digest(_hash(password, user.salt), user.password_hash):
        return user
    return None
