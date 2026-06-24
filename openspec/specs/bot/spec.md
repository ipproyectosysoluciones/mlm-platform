# Spec: Nexo Bot — WhatsApp MVP

## Overview

Especificaciones del bot WhatsApp de Nexo Real (Nexo Bot). Implementado en Sprint 4 como MVP con
BuilderBot + Baileys, agentes IA GPT-4o, e integración con n8n para automatización.

**Versión origen**: v2.0.0 (sprint4-complete)

---

## 1. Bootstrap y Configuración

**REQ-BOT-001**: El bot MUST arrancar con BuilderBot + Baileys en el puerto 3002.

**REQ-BOT-002**: El bot MUST persistir la sesión de WhatsApp usando `experimentalStore=true` con
`timeRelease=10800000` (3 horas).

**REQ-BOT-003**: El bot MUST exponer endpoints HTTP para recibir notificaciones proactivas del
backend (protegidos por `x-bot-secret`).

**REQ-BOT-004**: El bot MUST estar dockerizado con su propio `Dockerfile` y conectado a
`mlm-network`.

---

## 2. Flujo de Bienvenida y Menú

**REQ-BOT-010**: El bot MUST responder al primer mensaje del usuario con un saludo y mostrar el menú
principal con opciones numeradas.

**REQ-BOT-011**: El menú principal MUST incluir al menos: consultar saldo, ver red/comisiones,
soporte, agendar visita y cambiar idioma.

**REQ-BOT-012**: El bot MUST detectar el idioma del primer mensaje del usuario (ES / EN) y
responder en el idioma detectado.

**Scenario 2-A: Primer mensaje del usuario**
```
Given: Un usuario envía cualquier mensaje por primera vez
When: El bot recibe el mensaje
Then: El bot responde con el menú principal en el idioma detectado
And: El usuario puede seleccionar una opción por número
```

---

## 3. Consulta de Balance

**REQ-BOT-020**: El bot MUST obtener el saldo del wallet del usuario llamando a la API REST del
backend (`GET /api/wallets/:userId`).

**REQ-BOT-021**: El bot MUST mostrar el saldo en USD con 2 decimales.

**REQ-BOT-022**: Si la API del backend no responde, el bot MUST informar al usuario del error sin
exponer detalles técnicos.

**Scenario 3-A: Consulta de saldo exitosa (ES)**
```
Given: El usuario tiene saldo en su wallet
When: El usuario selecciona la opción "saldo"
Then: El bot responde con "Tu saldo disponible es: $X.XX USD"
And: Ofrece regresar al menú principal
```

**Scenario 3-B: Consulta de saldo exitosa (EN)**
```
Given: El usuario ha seleccionado idioma inglés
When: The user selects "balance"
Then: The bot responds with "Your available balance is: $X.XX USD"
```

**Scenario 3-C: Error de API**
```
Given: El backend no está disponible
When: El usuario consulta su saldo
Then: El bot responde con un mensaje amigable de error
And: No expone stack traces ni mensajes técnicos
```

---

## 4. Consulta de Red y Comisiones

**REQ-BOT-030**: El bot MUST mostrar el número de downlines directos e indirectos del usuario.

**REQ-BOT-031**: El bot MUST mostrar las comisiones pendientes y aprobadas del usuario.

**Scenario 4-A: Consulta de red**
```
Given: El usuario tiene una red MLM configurada
When: El usuario selecciona "ver mi red"
Then: El bot muestra número de referidos directos e indirectos
And: Muestra total de comisiones acumuladas
```

---

## 5. Soporte y FAQ

**REQ-BOT-040**: El bot MUST responder preguntas frecuentes usando la knowledge base privada
(`prompt_kb/knowledge-base.md`).

**REQ-BOT-041**: El bot MUST ofrecer escalación a agente humano si el usuario lo solicita o si el
bot no puede resolver la consulta.

**Scenario 5-A: Pregunta con respuesta en KB**
```
Given: El usuario hace una pregunta sobre el sistema MLM
When: La respuesta está en la knowledge base
Then: El bot responde con información precisa de la KB
And: No inventa información no contenida en la KB
```

**Scenario 5-B: Escalación solicitada**
```
Given: El usuario solicita hablar con un humano
When: El bot procesa la solicitud
Then: El bot envía webhook a n8n (/webhook/human-handoff)
And: n8n crea registro en Notion CRM
And: n8n notifica al agente asignado
And: El bot confirma al usuario que un agente se comunicará pronto
```

---

## 6. Agendamiento de Visitas

**REQ-BOT-050**: El bot MUST guiar al usuario para agendar una visita a una propiedad recolectando:
nombre, email, propiedad de interés, fecha y hora.

**REQ-BOT-051**: Al confirmar, el bot MUST enviar un webhook a n8n (`POST /webhook/schedule-visit`).

**REQ-BOT-052**: n8n MUST crear el evento en Google Calendar y el lead en Notion CRM.

**Scenario 6-A: Agendamiento exitoso**
```
Given: El usuario quiere agendar una visita
When: El usuario completa el formulario conversacional (nombre, email, propiedad, fecha)
And: Confirma los datos
Then: El bot envía los datos a n8n via webhook
And: n8n crea evento en Google Calendar con los datos de la visita
And: n8n crea/actualiza lead en Notion CRM
And: El bot confirma al usuario: "Tu visita ha sido agendada"
```

**Scenario 6-B: Error en agendamiento**
```
Given: n8n no está disponible
When: El bot intenta enviar el webhook
Then: El bot informa al usuario del error
And: Sugiere intentar nuevamente o contactar soporte
```

---

## 7. Escalación Humana (Handoff)

**REQ-BOT-060**: El flujo de escalación MUST enviarse a n8n via `POST /webhook/human-handoff`.

**REQ-BOT-061**: El webhook MUST incluir: userId/número de WhatsApp, motivo de escalación, historial
resumido de la conversación.

**REQ-BOT-062**: Siempre MUST confirmar al usuario que recibirá atención humana.

---

## 8. Idiomas

**REQ-BOT-070**: El bot MUST soportar español (ES) e inglés (EN).

**REQ-BOT-071**: El usuario MUST poder cambiar el idioma en cualquier momento del flujo.

**REQ-BOT-072**: El idioma seleccionado MUST persistir durante toda la sesión (3 horas).

**Scenario 8-A: Cambio de idioma mid-session**
```
Given: El usuario está en una conversación en español
When: El usuario selecciona "cambiar idioma" y elige inglés
Then: Todos los mensajes subsiguientes son en inglés
And: El idioma se mantiene hasta el fin de la sesión
```

---

## 9. Agente IA (GPT-4o)

**REQ-BOT-080**: Si ningún flujo temático captura la intención del usuario, el bot MUST activar el
agente IA.

**REQ-BOT-081**: El agente IA MUST usar la knowledge base privada como única fuente de verdad. MUST
NOT inventar información.

**REQ-BOT-082**: El agente Sophia MUST usarse para usuarios masculinos en español. El agente Max
MUST usarse para usuarios femeninos en inglés.

**Scenario 9-A: Pregunta fuera de flujo**
```
Given: El usuario escribe una pregunta no mapeada en flujos
When: Ningún keyword trigger hace match
Then: El agente GPT-4o responde usando el system prompt + KB
And: La respuesta es coherente y no contiene información inventada
```

---

**Fuente**: openspec/changes/archive/2026-04-06-sprint4-complete/spec.md (Feature 1)
**Versión**: v2.0.0
**Archived**: 2026-04-06

---

## Sprint 6: Nexo Bot — Properties & Tours Flows + Dual Agents (v2.2.0)

**Versión origen**: v2.2.0 (sprint6)

### Requirement: Agentes Duales Sophia/Max con Detección de Género

El sistema MUST detectar automáticamente el género del contacto a partir del nombre recibido en el mensaje inicial. Si el contacto es hombre, el agente MUST presentarse como "Sophia". Si es mujer, MUST presentarse como "Max". Si el género no puede determinarse, MUST usar el nombre "Nexo" como fallback.

**Scenario: Contacto masculino detectado**
```
Given el bot recibe el primer mensaje de "Carlos"
When procesa el nombre del contacto
Then responde presentándose como "Sophia, tu asesora de Nexo Real"
```

**Scenario: Contacto femenino detectado**
```
Given el bot recibe el primer mensaje de "María"
When procesa el nombre del contacto
Then responde presentándose como "Max, tu asesor de Nexo Real"
```

**Scenario: Género ambiguo — fallback a Nexo**
```
Given el nombre del contacto no puede clasificarse por género (ej. "Alex")
When el bot procesa el nombre
Then responde presentándose como "Nexo, tu asesor de Nexo Real"
```

**REQ-BOT-610**: MUST replace REQ-BOT-082 — Sophia MUST be used for male contacts; Max MUST be used for female contacts; Nexo MUST be used as fallback for ambiguous names.

### Requirement: Flow de Propiedades

El sistema MUST permitir al usuario listar propiedades disponibles (máximo 5 resultados), filtrar por tipo (arriendo/venta) y ver el detalle de una propiedad individual.

**REQ-BOT-620**: Bot MUST expose a properties flow triggered by PROPERTIES_KEYWORDS.

**REQ-BOT-621**: Properties flow MUST call `GET /api/bot/properties` and return up to 5 results.

**REQ-BOT-622**: Bot MUST NOT hallucinate property data — only real data from API endpoint is shown.

**Scenario: No hay propiedades disponibles**
```
Given el endpoint retorna 0 resultados con el filtro aplicado
When el bot recibe la respuesta
Then informa al usuario que no hay propiedades disponibles con ese criterio
And NO alucina datos de propiedades inexistentes
```

### Requirement: Flow de Tours

El sistema MUST permitir al usuario listar tours disponibles (máximo 5 resultados) y ver el detalle de un tour.

**REQ-BOT-630**: Bot MUST expose a tours flow triggered by TOURS_KEYWORDS.

**REQ-BOT-631**: Tours flow MUST call `GET /api/bot/tours` and return up to 5 results.

**REQ-BOT-632**: Bot MUST NOT hallucinate tour data.

### Requirement: Política Anti-Alucinación y Escalado a Humano

**REQ-BOT-640**: El bot MUST NOT inventar información. Si no puede responder con datos reales, MUST escalar a un operador humano.

**Scenario: Bot no tiene respuesta para la consulta del usuario**
```
Given el usuario pregunta algo fuera del scope del bot
When el bot no tiene datos para responder
Then responde indicando que transferirá la consulta a un asesor humano
And NO genera respuestas inventadas o estimadas sin base de datos
```

### Requirement: Dockerización del Bot (Sprint 6 Update)

**REQ-BOT-650**: El bot MUST estar definido como servicio `nexo-bot` en `docker-compose.prod.yml`.

**REQ-BOT-651**: `bot/Dockerfile` MUST produce a working image with all dependencies.

### Requirement: Integración Google Calendar vía n8n para Agendado de Visitas (Sprint 6 Update)

El sistema MUST enviar a un webhook n8n los datos necesarios para agendar una visita en Google Calendar: nombre del contacto, teléfono, fecha/hora solicitada y tipo de visita.

**REQ-BOT-660**: Replaces REQ-BOT-051 — webhook payload MUST include: contact name, phone, requested date/time, and visit type.

**Scenario: Webhook n8n no disponible**
```
Given el webhook n8n retorna error o timeout
When el bot intenta agendar
Then el bot informa al usuario que ocurrió un problema y escala a humano
And NO crea un evento incompleto ni parcial
```

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint6/specs/nexo-bot/spec.md
**Versión**: v2.2.0
**Archived**: 2026-04-07

---

## Sprint 7: Nexo Bot — Stability & Health (v2.3.0)

**Versión origen**: v2.3.0 (sprint7)
**Fecha**: 2026-04-08

### Requirement: Health Endpoint del Backend para el Bot

El backend MUST exponer un endpoint `GET /api/bot/health` protegido por el middleware `authenticateBot` (header `x-bot-secret`). El endpoint MUST retornar el estado del servicio, timestamp actual y flags de configuración clave.

**REQ-BOT-710**: El endpoint `GET /api/bot/health` MUST estar protegido por el middleware `authenticateBot` via header `x-bot-secret`.

**REQ-BOT-711**: La response exitosa MUST incluir `status`, `timestamp`, `service` y `config` con flags booleanos de `openai` y `botSecret`.

**REQ-BOT-712**: Si el header `x-bot-secret` está ausente o es inválido, el endpoint MUST retornar HTTP 401 con `{ "error": "Unauthorized" }`.

**Scenario 7-A: Health check exitoso**
```
Given el bot tiene configurado el header x-bot-secret correcto
When GET /api/bot/health
Then responde HTTP 200 con:
  {
    "success": true,
    "data": {
      "status": "ok",
      "timestamp": "<ISO timestamp>",
      "service": "nexo-bot-backend",
      "config": {
        "openai": true,
        "botSecret": true
      }
    }
  }
```

**Scenario 7-B: Health check sin autenticación**
```
Given el request no incluye el header x-bot-secret
When GET /api/bot/health
Then responde HTTP 401 con { "error": "Unauthorized" }
And no expone información interna del servicio
```

**Scenario 7-C: Health check con secret inválido**
```
Given el request incluye un x-bot-secret incorrecto
When GET /api/bot/health
Then responde HTTP 401 con { "error": "Unauthorized" }
```

---

### Requirement: withRetry<T>() — Reintentos con Backoff Exponencial

El bot MUST implementar una función utilitaria `withRetry<T>()` para reintentar operaciones asíncronas fallidas (llamadas a API, webhooks) con backoff exponencial.

**REQ-BOT-720**: `withRetry<T>()` MUST aceptar: función async, número máximo de intentos, y delay base en ms.

**REQ-BOT-721**: Entre cada intento MUST esperar `baseDelay * 2^(attempt-1)` ms (backoff exponencial).

**REQ-BOT-722**: Si todos los intentos fallan, MUST propagar el último error capturado.

**REQ-BOT-723**: `withRetry<T>()` MUST ser genérica — typesafe con el tipo de retorno de la función envuelta.

**Scenario 7-D: Reintento exitoso en segundo intento**
```
Given una función que falla en el intento 1 y tiene éxito en el intento 2
When withRetry(fn, maxAttempts=3, baseDelay=500) es invocada
Then el resultado es el retorno exitoso del intento 2
And se esperó ~500ms entre intento 1 e intento 2
```

**Scenario 7-E: Todos los intentos fallan**
```
Given una función que siempre lanza error
When withRetry(fn, maxAttempts=3, baseDelay=200) es invocada
Then propaga el último error lanzado
And se realizaron exactamente 3 intentos
```

---

### Requirement: Disconnect Handler — Resiliencia ante Desconexiones de WhatsApp

El bot MUST manejar el evento de desconexión de Baileys (`connection.update` con `connection: 'close'`) de forma resiliente: reconectar automáticamente si es recuperable, o notificar y detener si el código de cierre indica logout permanente.

**REQ-BOT-730**: Si el bot recibe un `DisconnectReason` recuperable (ej. `connectionReset`, `connectionClosed`, `timedOut`), MUST intentar reconectar automáticamente con backoff exponencial usando `withRetry`.

**REQ-BOT-731**: Si el `DisconnectReason` es `loggedOut` (código 401), el bot MUST detenerse sin reintentar y MUST registrar el evento en el log con nivel `error`.

**REQ-BOT-732**: El número máximo de intentos de reconexión automática MUST ser configurable (default: 5).

**REQ-BOT-733**: Al reconectarse exitosamente, el contador de intentos MUST resetearse a 0.

**REQ-BOT-734**: Si se agota el máximo de intentos de reconexión, el bot MUST notificar al sistema (log `fatal`) y detenerse.

**Scenario 7-F: Desconexión recuperable — reconexión exitosa**
```
Given el bot está conectado a WhatsApp
When Baileys emite connection: 'close' con reason recuperable (ej. connectionReset)
Then el bot intenta reconectarse con backoff exponencial
And al reconectarse exitosamente resetea el contador de intentos a 0
And registra el evento de reconexión en el log
```

**Scenario 7-G: Desconexión por logout (401)**
```
Given el bot está conectado a WhatsApp
When Baileys emite connection: 'close' con DisconnectReason.loggedOut (401)
Then el bot NO reintenta reconectarse
And registra error fatal: "WhatsApp session logged out — manual re-auth required"
And el proceso del bot se detiene
```

**Scenario 7-H: Máximo de reconexiones agotado**
```
Given el bot ha intentado reconectarse maxReconnectAttempts veces sin éxito
When falla el último intento
Then registra error fatal: "Max reconnect attempts reached"
And el proceso del bot se detiene
And el contador de intentos NO se resetea
```

---

**Fuente**: openspec/changes/sprint7-v2.3.0/specs/bot/spec.md
**Versión**: v2.3.0
**Fecha**: 2026-04-08

---

## Sprint 8: Nexo Bot — Bot Production-Ready + Knowledge Base + Lead Capture + Onboarding (v2.4.0)

**Versión origen**: v2.4.0 (sprint8-bot-complete)
**Fecha**: 2026-04-09/10

### MODIFIED Requirement: Welcome Flow Data Capture

`welcomeFlow` MUST capture the following user data in sequence:
1. Language selection (ES / EN) — already implemented
2. Full name (`contactName`) — already implemented
3. Email address (`contactEmail`) — **ADDED in Sprint 8**
4. Area of interest (`areaOfInterest`: Propiedades / Tours / Afiliados) — **ADDED in Sprint 8**
5. Agent assignment (Sophia for male, Max for female) — already implemented

**REQ-BOT-010-DELTA**: Replaces REQ-BOT-010 — `welcomeFlow` MUST now capture email and area of interest in addition to language, name, and agent assignment.

**Scenario: Full Welcome Flow — ES**

- GIVEN a new user sends any message to the bot
- WHEN `welcomeFlow` starts
- THEN the bot greets in Spanish and asks for language preference
- WHEN the user selects ES
- THEN the bot asks for the user's name
- WHEN the name is received
- THEN the bot asks for the user's email
- WHEN a valid email is received
- THEN the bot presents area-of-interest options (1. Propiedades | 2. Tours | 3. Afiliados)
- WHEN the user selects an option
- THEN agent assignment runs and the main menu is presented

**Scenario: Full Welcome Flow — EN**

- GIVEN a new user sends any message to the bot
- WHEN the user selects EN
- THEN all subsequent prompts in welcomeFlow are in English
- AND area-of-interest options read: "1. Properties | 2. Tours | 3. Affiliates"

**Scenario: Lead Persisted After Welcome Flow**

- GIVEN all welcome flow steps completed (name, email, area of interest)
- WHEN `welcomeFlow` finalizes the session data
- THEN `LeadPersistenceService.save()` is called with the captured data
- AND the call is non-blocking (conversation continues regardless of API result)

---

### ADDED Requirement: AI Service Knowledge Base Loading

`ai.service.ts` MUST load the knowledge base from `bot/src/prompt_kb/` at module initialization (not per-request) and inject it into every GPT-4o system prompt. The previously used hardcoded/empty system prompt MUST be replaced with the KB-assembled prompt.

**REQ-BOT-800**: `ai.service.ts` MUST load KB files (`base-system-prompt.md`, `knowledge-base.md`, agent prompts) at module init.

**REQ-BOT-801**: Loaded KB content MUST be cached in module scope with no per-request file I/O.

**REQ-BOT-802**: Every GPT-4o system prompt MUST include the loaded KB injected at placeholder `{KNOWLEDGE_BASE}`.

**REQ-BOT-803**: Agent-specific prompts (Sophia/Max) MUST be selected based on `agent` parameter and combined with base prompt + KB.

**REQ-BOT-804**: Total assembled prompt MUST NOT exceed 1,500 tokens. If KB + base exceeds limit, truncate with marker `...` + warning logged.

**REQ-BOT-805**: If KB files missing at startup, log warning per file and degrade to minimal hardcoded prompt (bot continues, no crash).

**Scenario: ai.service.ts Loads KB on Init**

- GIVEN the bot process starts
- WHEN `ai.service.ts` is initialized
- THEN it calls the KB loader to read all four prompt files from `bot/src/prompt_kb/`
- AND the loaded content is cached in module scope
- AND no file I/O occurs on subsequent GPT-4o calls

**Scenario: ai.service.ts Uses Agent-Specific Prompt**

- GIVEN an incoming GPT-4o request specifies `agent: "sophia"` or `agent: "max"`
- WHEN `ai.service.ts` assembles the system message
- THEN it uses the agent-specific personality prompt combined with the base prompt and KB
- AND the combined prompt does NOT exceed 1,500 tokens

**Scenario: KB Unavailable at Init — Graceful Degradation**

- GIVEN one or more KB files are missing at startup
- WHEN `ai.service.ts` tries to load them
- THEN it logs a warning per missing file
- AND falls back to a hardcoded minimal system prompt
- AND GPT-4o calls continue to function (bot does not crash)

---

**Fuente**: openspec/changes/sprint8-bot-complete/specs/bot/spec.md
**Versión**: v2.4.0
**Fecha**: 2026-04-09/10
