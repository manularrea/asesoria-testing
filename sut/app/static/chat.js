(function () {
  const form = document.querySelector('[data-testid="chat-form"]');
  const input = document.querySelector('[data-testid="chat-input"]');
  const send = document.querySelector('[data-testid="chat-send"]');
  const list = document.querySelector('[data-testid="chat-messages"]');

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function scroll() { list.scrollTop = list.scrollHeight; }

  function appendUser(text) {
    list.appendChild(el('div', { class: 'msg msg-user', 'data-testid': 'msg-user' }, text));
    scroll();
  }

  function appendBot(data) {
    const box = el('article', { class: 'msg msg-bot', 'data-testid': 'msg-bot', 'data-status': data.status });
    box.appendChild(el('p', { 'data-testid': 'bot-answer' }, data.answer));
    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'badge badge-' + data.status, 'data-testid': 'intent-badge' }, data.intent));
    meta.appendChild(el('span', { class: 'badge', 'data-testid': 'status-badge' }, 'estado: ' + data.status));
    if (data.confidence !== null && data.confidence !== undefined) {
      meta.appendChild(el('span', { class: 'badge', 'data-testid': 'confidence-badge' }, 'confianza: ' + data.confidence.toFixed(2)));
    }
    meta.appendChild(el('span', { class: 'badge', 'data-testid': 'latency-badge' }, data.latency_ms + ' ms'));
    box.appendChild(meta);
    list.appendChild(box);
    scroll();
  }

  function appendError(text) {
    list.appendChild(el('div', { class: 'msg msg-error', 'data-testid': 'msg-error', role: 'alert' }, text));
    scroll();
  }

  input.addEventListener('input', () => { send.disabled = input.value.trim().length === 0; });
  // Señal de testabilidad: los manejadores ya están registrados (evita carreras en pruebas E2E).
  form.setAttribute('data-ready', 'true');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendUser(text);
    input.value = '';
    send.disabled = true;
    form.setAttribute('data-busy', 'true');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { window.location.href = '/login'; return; }
        appendError(typeof data.detail === 'string' ? data.detail : 'Solicitud inválida.');
      } else {
        appendBot(data);
      }
    } catch (err) {
      appendError('No fue posible contactar al asistente. Intenta de nuevo.');
    } finally {
      form.removeAttribute('data-busy');
      input.focus();
    }
  });
})();
