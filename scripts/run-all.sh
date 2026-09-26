#!/usr/bin/env bash
# Levanta el SUT, ejecuta la suite JUnit 5 + Playwright y detiene el SUT.
# Uso: scripts/run-all.sh [argumentos extra para mvn, p. ej. -Dgroups=ui -Dheadless=false -DslowMo=300]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${SUT_PORT:-8000}"

cd "$ROOT/sut"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
.venv/bin/uvicorn app.main:app --port "$PORT" > "$ROOT/sut.log" 2>&1 &
SUT_PID=$!
trap 'kill $SUT_PID 2>/dev/null || true' EXIT

echo "Esperando al SUT en http://localhost:$PORT ..."
for _ in $(seq 1 30); do
  if curl -fs "http://localhost:$PORT/api/health" > /dev/null; then break; fi
  sleep 1
done
curl -fs "http://localhost:$PORT/api/health" || { echo "El SUT no arrancó (ver sut.log)"; exit 1; }
echo

cd "$ROOT/tests-e2e"
mvn test -Dsut.baseUrl="http://localhost:$PORT" "$@"
