"""Pruebas de la capa web/API con TestClient (nivel de componente, sin navegador)."""
import pytest
from fastapi.testclient import TestClient

from app.auth import authenticate
from app.main import app

USER, PASSWORD = "asesor.demo", "Asesor2026*"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("GUARDRAIL_URL", raising=False)
    return TestClient(app)


@pytest.fixture
def session(client):
    response = client.post("/login", data={"username": USER, "password": PASSWORD}, follow_redirects=False)
    assert response.status_code == 303 and response.headers["location"] == "/chat"
    return client


def test_authenticate_acepta_credenciales_validas_y_rechaza_invalidas():
    assert authenticate(USER, PASSWORD).role == "asesor"
    assert authenticate(USER, "otra") is None
    assert authenticate("nadie", PASSWORD) is None


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["intents"] == 10 and body["guardrail"] == "local"


def test_paginas_protegidas_redirigen_sin_sesion(client):
    for path in ("/", "/chat", "/historial"):
        assert client.get(path, follow_redirects=False).headers["location"] == "/login"
    assert client.get("/login").status_code == 200


def test_login_invalido_muestra_error(client):
    response = client.post("/login", data={"username": USER, "password": "mala"})
    assert response.status_code == 401 and "incorrectos" in response.text


def test_chat_sin_sesion_401(client):
    assert client.post("/api/chat", json={"message": "hola"}).status_code == 401


def test_chat_flujo_completo(session):
    ok = session.post("/api/chat", json={"message": "horario de las sucursales"}).json()
    assert ok["intent"] == "horario_sucursales" and ok["status"] == "ok"
    blocked = session.post("/api/chat", json={"message": "tarjeta 4111 1111 1111 1111"}).json()
    assert blocked["status"] == "blocked" and "**** **** **** 1111" in blocked["message"]
    assert session.post("/api/chat", json={"message": " "}).status_code == 422
    history = session.get("/api/history").json()
    assert [h["intent"] for h in history] == ["horario_sucursales", "bloqueado_pii"]
    assert "**** **** **** 1111" in session.get("/historial").text
    assert session.get("/chat").status_code == 200


def test_logout_limpia_sesion(session):
    assert session.post("/logout", follow_redirects=False).headers["location"] == "/login"
    assert session.get("/api/history").status_code == 401
