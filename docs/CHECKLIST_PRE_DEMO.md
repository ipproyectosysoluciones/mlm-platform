# Checklist Pre-Demo -- Nexo Real Bot v2.4.0

> **Sprint 8 | Issue #98 -- Bot Stability: Demo Ready**
> Ejecutar este checklist completo antes de cada demo con clientes o stakeholders.
> Run this checklist in full before every demo with clients or stakeholders.

---

## 1. Infraestructura / Infrastructure

- [ ] Docker Compose levantado sin errores: docker compose up -d
- [ ] Backend responde en http://localhost:3000/api/health
- [ ] Bot responde en http://localhost:3002
- [ ] PostgreSQL accesible (revisar logs de migrations)
- [ ] n8n corriendo y webhooks activos en http://localhost:5678

---

## 2. Variables de entorno / Environment Variables

- [ ] BOT_SECRET definido y coincide en .env del backend y del bot
- [ ] OPENAI_API_KEY valida y con creditos disponibles
- [ ] MLM_BACKEND_URL apunta al backend correcto
  - Docker: http://backend:3000/api
  - Local: http://localhost:3000/api
- [ ] N8N_WEBHOOK_URL configurada y activa
- [ ] BOT_LOG_LEVEL = info (o debug para troubleshooting)

---

## 3. Health Check del Backend

Ejecutar manualmente:

    curl -s -H "x-bot-secret: $BOT_SECRET" http://localhost:3000/api/bot/health | jq

Checkboxes:

- [ ] data.status = "ok" (no "degraded")
- [ ] data.config.openai = true
- [ ] data.config.botSecret = true
- [ ] data.config.n8n = true
- [ ] data.db.status = "ok"
- [ ] data.db.activeUsers > 0 (hay datos de prueba cargados)

---

## 4. WhatsApp / Sesion QR

- [ ] QR escaneado exitosamente (sesion activa en bot_sessions volume)
- [ ] Numero de demo conectado y visible en WhatsApp > Dispositivos vinculados
- [ ] Test de mensaje simple: enviar "hola" y recibir respuesta del bot

---

## 5. Flujos criticos -- verificacion manual

Enviar cada keyword al numero de demo y verificar respuesta correcta:

hola -> welcomeFlow -- saludo + menu
saldo -> balanceFlow -- wallet balance
mi red -> networkFlow -- red + comisiones
propiedades -> propertiesFlow -- listado propiedades
tours -> toursFlow -- listado tours
mis reservas -> reservationsFlow -- reservas del usuario [NUEVO v2.4.0]
agendar -> scheduleFlow -- flujo de 3 pasos
hablar con alguien -> handoffFlow -- escalado humano
ayuda -> supportFlow -- menu de ayuda

- [ ] welcomeFlow responde con saludo y menu
- [ ] balanceFlow muestra saldo correctamente
- [ ] networkFlow muestra red y comisiones
- [ ] propertiesFlow lista propiedades
- [ ] toursFlow lista tours
- [ ] reservationsFlow muestra reservas del usuario
- [ ] scheduleFlow completa los 3 pasos y dispara webhook
- [ ] handoffFlow envia notificacion y marca handedOff = true
- [ ] supportFlow muestra menu de ayuda

---

## 6. Datos de prueba / Test Data

- [ ] Al menos 1 usuario activo con numero WhatsApp vinculado en twoFactorPhone
- [ ] Wallet con saldo > 0 para el usuario de demo
- [ ] Al menos 1 comision registrada
- [ ] Al menos 1 referido en la red
- [ ] Al menos 2 propiedades con status = available
- [ ] Al menos 2 tours con status = active
- [ ] Al menos 1 reserva activa para el usuario de demo

---

## 7. Logging estructurado / Structured Logging

- [ ] Logs del bot emiten JSON estructurado (docker logs nexo-bot -f)
- [ ] No hay errores de nivel error en los logs al iniciar
- [ ] schedule.visit.success aparece en logs al completar scheduleFlow
- [ ] handoff.webhook.success aparece en logs al completar handoffFlow

---

## 8. Reconexion / Reconnection Resilience

- [ ] BOT_MAX_RECONNECT definido en .env (recomendado: 5)
- [ ] Si el bot se desconecta, reconecta automaticamente
  - Test: docker compose restart bot y verificar que vuelve a conectar

---

## 9. Post-demo

- [ ] Limpiar estado de conversaciones de prueba (reiniciar bot si usa MemoryDB)
- [ ] Revocar acceso al dispositivo WhatsApp de demo si no se reutiliza
- [ ] Registrar feedback de stakeholders en el issue #98

---

## Comandos utiles / Useful Commands

    # Ver logs del bot en tiempo real
    docker logs nexo-bot -f

    # Ver logs del backend
    docker logs nexo-backend -f

    # Reiniciar solo el bot (preserva sesion WA si el volumen persiste)
    docker compose restart bot

    # Health check completo
    curl -s -H "x-bot-secret: $BOT_SECRET" http://localhost:3000/api/bot/health | jq .data

    # Verificar que reservationsFlow este registrado
    grep reservationsFlow bot/src/app.ts

    # Ver todos los flows activos
    ls bot/src/flows/

---

_Sprint 8 v2.4.0 -- Issue #98 | Nexo Real_
