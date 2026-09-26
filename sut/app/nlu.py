"""Motor NLU de AsesorIA.

Clasificación de intención por recuperación: cada consulta se vectoriza con
TF-IDF sobre n-gramas de caracteres (robusto a flexiones del español) y se
compara por similitud coseno contra los ejemplos de la base de conocimiento.
La mejor coincidencia define la intención; su similitud actúa como *confianza*.
Si la confianza no supera el umbral, el motor responde con un *fallback*
controlado en lugar de inventar una respuesta (comportamiento verificable).
"""
from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DEFAULT_THRESHOLD = 0.40
FALLBACK_INTENT = "fuera_de_dominio"
KB_PATH = Path(__file__).with_name("knowledge_base.json")


def normalize(text: str) -> str:
    """Minúsculas, sin tildes ni signos de puntuación, espacios colapsados."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9ñ\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


@dataclass(frozen=True)
class Prediction:
    intent: str
    answer: str
    confidence: float
    status: str  # "ok" | "fallback"

    def as_dict(self) -> dict:
        return {
            "intent": self.intent,
            "answer": self.answer,
            "confidence": round(self.confidence, 3),
            "status": self.status,
        }


class IntentClassifier:
    def __init__(self, kb_path: Path = KB_PATH, threshold: float = DEFAULT_THRESHOLD):
        data = json.loads(Path(kb_path).read_text(encoding="utf-8"))
        self.threshold = threshold
        self.fallback_answer: str = data["fallback_answer"]
        self._answers: dict[str, str] = {}
        corpus: list[str] = []
        self._labels: list[str] = []
        for entry in data["intents"]:
            self._answers[entry["intent"]] = entry["answer"]
            for utterance in entry["utterances"]:
                corpus.append(utterance)
                self._labels.append(entry["intent"])
        self._vectorizer = TfidfVectorizer(
            preprocessor=normalize, analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True
        )
        self._matrix = self._vectorizer.fit_transform(corpus)

    @property
    def intents(self) -> list[str]:
        return list(self._answers)

    def predict(self, text: str) -> Prediction:
        if not normalize(text):
            return Prediction(FALLBACK_INTENT, self.fallback_answer, 0.0, "fallback")
        query = self._vectorizer.transform([text])
        similarities = cosine_similarity(query, self._matrix)[0]
        best = int(similarities.argmax())
        confidence = float(similarities[best])
        if confidence < self.threshold:
            return Prediction(FALLBACK_INTENT, self.fallback_answer, confidence, "fallback")
        intent = self._labels[best]
        return Prediction(intent, self._answers[intent], confidence, "ok")
