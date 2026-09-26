"""AsesorIA - aplicación web (SUT).

Rutas web (HTML) y API JSON. Ejecutar con:
    uvicorn app.main:app --port 8000
"""
from __future__ import annotations

import os
import time
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware

from . import __version__
from .auth import authenticate
from .guardrails import evaluate
from .nlu import DEFAULT_THRESHOLD, IntentClassifier

BASE_DIR = Path(__file__).parent

app = FastAPI(title="AsesorIA", version=__version__, docs_url="/api/docs")
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("ASESORIA_SECRET", "dev-secret-cambiar-en-produccion"),
    same_site="lax",
)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

classifier = IntentClassifier(threshold=float(os.getenv("NLU_THRESHOLD", DEFAULT_THRESHOLD)))
HISTORY: dict[str, list[dict]] = {}  # historial de consultas por sesión (en memoria)


# ---------- utilidades ----------
def current_user(request: Request) -> dict | None:
    return request.session.get("user")


def render(request: Request, template: str, status_code: int = 200, **context) -> HTMLResponse:
    context.update({"request": request, "user": current_user(request), "version": __version__})
    return templates.TemplateResponse(request, template, context, status_code=status_code)


# ---------- páginas ----------
@app.get("/", include_in_schema=False)
def index(request: Request):
    return RedirectResponse("/chat" if current_user(request) else "/login", status_code=303)


@app.get("/login", response_class=HTMLResponse, include_in_schema=False)
def login_form(request: Request):
    if current_user(request):
        return RedirectResponse("/chat", status_code=303)
    return render(request, "login.html")


@app.post("/login", include_in_schema=False)
def login_submit(request: Request, username: str = Form(""), password: str = Form("")):
    user = authenticate(username, password)
    if user is None:
        return render(request, "login.html", status_code=401,
                      error="Usuario o contraseña incorrectos.", username=username)
    sid = uuid.uuid4().hex
    request.session["user"] = {"username": user.username, "display_name": user.display_name, "role": user.role}
    request.session["sid"] = sid
    HISTORY[sid] = []
    return RedirectResponse("/chat", status_code=303)


@app.post("/logout", include_in_schema=False)
def logout(request: Request):
    HISTORY.pop(request.session.get("sid", ""), None)
    request.session.clear()
    return RedirectResponse("/login", status_code=303)


@app.get("/chat", response_class=HTMLResponse, include_in_schema=False)
def chat_page(request: Request):
    if not current_user(request):
        return RedirectResponse("/login", status_code=303)
    return render(request, "chat.html", threshold=classifier.threshold)


@app.get("/historial", response_class=HTMLResponse, include_in_schema=False)
def history_page(request: Request):
    if not current_user(request):
        return RedirectResponse("/login", status_code=303)
    items = HISTORY.get(request.session.get("sid", ""), [])
    return render(request, "historial.html", items=items)


# ---------- API ----------
class ChatRequest(BaseModel):
    message: str = ""


@app.get("/api/health")
def health():
    return {"status": "ok", "version": __version__, "intents": len(classifier.intents),
            "threshold": classifier.threshold, "guardrail": "service" if os.getenv("GUARDRAIL_URL") else "local"}


@app.post("/api/chat")
def chat(request: Request, payload: ChatRequest):
    if not current_user(request):
        return JSONResponse({"detail": "No autenticado."}, status_code=401)
    started = time.perf_counter()
    decision = evaluate(payload.message)
    if decision.status == "invalid":
        return JSONResponse({"detail": decision.reason}, status_code=422)
    if decision.status == "blocked":
        stored_message = decision.masked_message
        result = {"intent": "bloqueado_pii", "answer": decision.reason, "confidence": None, "status": "blocked",
                  "guardrail": decision.source}
    else:
        stored_message = payload.message
        result = {**classifier.predict(payload.message).as_dict(), "guardrail": decision.source}
    latency_ms = round((time.perf_counter() - started) * 1000, 1)

    record = {
        "id": len(HISTORY.setdefault(request.session.get("sid", ""), [])) + 1,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "message": stored_message,
        "latency_ms": latency_ms,
        **result,
    }
    HISTORY[request.session["sid"]].append(record)
    return record


@app.get("/api/history")
def history(request: Request):
    if not current_user(request):
        return JSONResponse({"detail": "No autenticado."}, status_code=401)
    return HISTORY.get(request.session.get("sid", ""), [])
