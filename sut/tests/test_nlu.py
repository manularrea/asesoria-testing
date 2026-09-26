"""Pruebas unitarias del motor NLU (nivel de componente, ejecutadas con pytest)."""
import pytest

from app.nlu import FALLBACK_INTENT, IntentClassifier, normalize


@pytest.fixture(scope="module")
def clf() -> IntentClassifier:
    return IntentClassifier()


def test_normalize_quita_tildes_y_puntuacion():
    assert normalize("¿Cuál es el HORARIO de atención?") == "cual es el horario de atencion"


@pytest.mark.parametrize(
    "consulta, intencion",
    [
        ("¿Cuál es el horario de atención de las sucursales?", "horario_sucursales"),
        ("qué necesito para pedir un préstamo personal", "credito_personal"),
        ("perdí mi tarjeta de débito, ¿cómo la bloqueo?", "bloqueo_tarjeta"),
        ("cuánto puedo retirar del cajero por día", "limites_cajero"),
        ("olvidé la contraseña de la banca en línea", "cambio_clave"),
        ("hay un cargo que no reconozco en mi tarjeta", "reporte_fraude"),
    ],
)
def test_clasifica_intencion_esperada(clf, consulta, intencion):
    pred = clf.predict(consulta)
    assert pred.intent == intencion
    assert pred.status == "ok"
    assert pred.confidence >= clf.threshold


@pytest.mark.parametrize("consulta", ["cómo preparo una lasaña", "resultado del partido de anoche", "xyz qwe"])
def test_fuera_de_dominio_produce_fallback(clf, consulta):
    pred = clf.predict(consulta)
    assert pred.status == "fallback"
    assert pred.intent == FALLBACK_INTENT
    assert pred.confidence < clf.threshold


def test_mensaje_vacio_produce_fallback_con_confianza_cero(clf):
    pred = clf.predict("   ")
    assert pred.status == "fallback" and pred.confidence == 0.0
