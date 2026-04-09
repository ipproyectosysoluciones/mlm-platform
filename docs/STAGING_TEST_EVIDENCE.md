# Staging Test Evidence — Bot Stability (Sprint 7 / Issue #98)

> **Template de evidencia para pruebas en staging antes de demo.**
> Complete cada sección con capturas, logs y observaciones reales del ambiente de staging.
>
> **Evidence template for staging tests before demo.**
> Fill in each section with actual screenshots, logs, and observations from the staging environment.

---

## Información del Entorno / Environment Info

| Campo / Field          | Valor / Value                   |
| ---------------------- | ------------------------------- |
| Fecha de prueba / Date | `YYYY-MM-DD`                    |
| Tester                 |                                 |
| Branch                 | `feature/sprint7-bot-stability` |
| Commit                 | `git rev-parse --short HEAD`    |
| Docker Compose profile | `staging`                       |
| Bot number (WhatsApp)  |                                 |

---

## Checklist de Staging

Marcar cada ítem con ✅ (pasó), ❌ (falló) o ⚠️ (parcial).

### 1. Arranque del bot

- [ ] `docker compose -f docker-compose.staging.yml up -d` sin errores
- [ ] Health endpoint responde `200 OK`

```bash
curl -s http://localhost:3001/api/bot/health | jq .
```

**Respuesta esperada (fragmento):**

```json
{
  "status": "ok",
  "uptimeSeconds": ...,
  "config": { "n8n": true },
  "db": { "status": "connected", "activeUsers": ..., "reservationsLast24h": ... }
}
```

**Captura / Screenshot:** _(pegar aquí o adjuntar imagen)_

---

### 2. Flujo de bienvenida y selección de idioma

| Paso | Mensaje enviado                 | Respuesta esperada                            | ✅/❌ |
| ---- | ------------------------------- | --------------------------------------------- | ----- |
| 1    | (primer mensaje vacío o "hola") | Menú ES/EN con opciones 1 y 2                 |       |
| 2    | `1`                             | Confirmación en español + solicitud de nombre |       |
| 3    | `Ana`                           | Intro de agente Sophia o Max                  |       |
| 4    | `2` (reinicio)                  | Menú ES/EN                                    |       |
| 5    | `2`                             | Confirmación en inglés + nombre request       |       |

**Log esperado en stderr:**

```
(ninguno en flujo normal — solo stdout con eventos info)
```

---

### 3. Conversación con IA (welcomeFlow)

| Escenario              | Input                                     | Resultado esperado                                         | ✅/❌ |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------- | ----- |
| Consulta normal        | "¿Cuáles son los planes de inversión?"    | Respuesta coherente del agente                             |       |
| Retry en error OpenAI  | (forzar con clave inválida temporalmente) | Mensaje de error amigable + log `openai.failed` en stderr  |       |
| Alert en error crítico | (misma condición)                         | POST a Slack webhook (si `BOT_ALERT_WEBHOOK_URL` está set) |       |

**Log de error esperado (stderr):**

```json
{
  "timestamp": "...",
  "level": "error",
  "event": "openai.failed",
  "service": "nexo-bot",
  "context": { "phone": "...", "agent": "sophia", "error": "..." }
}
```

**Captura Slack / Screenshot alert:** _(adjuntar si BOT_ALERT_WEBHOOK_URL configurada)_

---

### 4. Flujo de saldo (`balanceFlow`)

| Escenario             | Input                                  | Resultado esperado                                                       | ✅/❌ |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------ | ----- |
| Usuario registrado    | `saldo`                                | Mensaje con saldo, retiros pendientes y total ganado                     |       |
| Usuario no registrado | `balance` (desde número sin cuenta)    | Mensaje de "no encontré cuenta" + log `balance.user.not-found` en stderr |       |
| API caída             | (apagar backend temporalmente) `saldo` | Mensaje de error amigable + log `balance.wallet.unavailable`             |       |

---

### 5. Flujo de reservas (`reservationsFlow`)

| Escenario            | Input                             | Resultado esperado                         | ✅/❌ |
| -------------------- | --------------------------------- | ------------------------------------------ | ----- |
| Usuario con reservas | `mis reservas`                    | Lista de reservas activas                  |       |
| Sin reservas         | `bookings` (usuario sin reservas) | Mensaje informativo de "no tenés reservas" |       |

---

### 6. Flujo de agendar visita (`scheduleFlow`)

| Paso | Acción           | Esperado                                                                     | ✅/❌ |
| ---- | ---------------- | ---------------------------------------------------------------------------- | ----- |
| 1    | `agendar visita` | Solicita fecha y propiedad de interés                                        |       |
| 2    | Completar datos  | Confirmación + disparo a n8n                                                 |       |
| 3    | n8n caído        | Mensaje de error amigable + log `n8n.webhook.failed` en stderr + alert Slack |       |

**Log n8n esperado (stderr):**

```json
{
  "timestamp": "...",
  "level": "error",
  "event": "n8n.webhook.failed",
  "service": "nexo-bot",
  "context": { "path": "schedule-visit", "status": 502 }
}
```

---

### 7. Flujo de transferencia a humano (`handoffFlow`)

| Paso | Acción              | Esperado                                                  | ✅/❌ |
| ---- | ------------------- | --------------------------------------------------------- | ----- |
| 1    | `hablar con agente` | Solicita confirmación                                     |       |
| 2    | Confirmar           | Mensaje de transferencia + disparo a n8n                  |       |
| 3    | n8n caído           | Mensaje de error + log `n8n.webhook.failed` + alert Slack |       |

---

### 8. Logging estructurado — revisión de logs

Ejecutar durante las pruebas:

```bash
docker compose logs -f nexo-bot 2>&1 | grep -v '^$'
```

Verificar que **TODOS** los logs sean JSON válido:

```bash
docker compose logs nexo-bot 2>&1 | jq -c . > /dev/null && echo "✅ JSON válido" || echo "❌ Hay logs no estructurados"
```

**Resultado:** _(pegar output aquí)_

---

### 9. Alertas críticas (BOT_ALERT_WEBHOOK_URL)

Configurar en `.env.staging`:

```
BOT_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

Forzar un error crítico (ej: deshabilitar OpenAI key) y verificar que llega la notificación a Slack.

**Captura del mensaje en Slack / Slack alert screenshot:**

_(adjuntar aquí)_

---

## Resultados Globales / Overall Results

| Sección                 | Estado |
| ----------------------- | ------ |
| 1. Arranque             |        |
| 2. Bienvenida           |        |
| 3. Conversación IA      |        |
| 4. Saldo                |        |
| 5. Reservas             |        |
| 6. Agendar visita       |        |
| 7. Transferencia humano |        |
| 8. Logging estructurado |        |
| 9. Alertas críticas     |        |

---

## Issues Encontrados / Issues Found

> Documentar cualquier comportamiento inesperado aquí.

| #   | Descripción | Severidad | Resuelto |
| --- | ----------- | --------- | -------- |
| 1   |             |           |          |

---

## Sign-off

- **Aprobado para demo:** ☐ Sí / ☐ No
- **Firmado por:**
- **Fecha:**
