# Spec: Sprint 4 — Nexo Bot MVP + Backend Hardening + v2.0.0

## Overview

Especificaciones para el MVP del bot WhatsApp (Nexo Bot), las rutas backend faltantes de Sprint 3,
y la cobertura de tests del frontend. Todo implementado y verificado en v2.0.0.

---

## Feature 1: Nexo Bot — WhatsApp

### 1.1 Bootstrap y Configuración

**REQ-BOT-001**: El bot MUST arrancar con BuilderBot + Baileys en el puerto 3002.

**REQ-BOT-002**: El bot MUST persistir la sesión de WhatsApp usando `experimentalStore=true` con
`timeRelease=10800000` (3 horas).

**REQ-BOT-003**: El bot MUST exponer endpoints HTTP para recibir notificaciones proactivas del
backend (protegidos por `x-bot-secret`).

**REQ-BOT-004**: El bot MUST estar dockerizado con su propio `Dockerfile` y conectado a
`mlm-network`.

### 1.2 Flujo de Bienvenida y Menú

**REQ-BOT-010**: El bot MUST responder al primer mensaje del usuario con un saludo y mostrar el menú
principal con opciones numeradas.

**REQ-BOT-011**: El menú principal MUST incluir al menos: consultar saldo, ver red/comisiones,
soporte, agendar visita y cambiar idioma.

**REQ-BOT-012**: El bot MUST detectar el idioma del primer mensaje del usuario (ES / EN) y
responder en el idioma detectado.

**Scenario 1.2-A: Primer mensaje del usuario**
```
Given: Un usuario envía cualquier mensaje por primera vez
When: El bot recibe el mensaje
Then: El bot responde con el menú principal en el idioma detectado
And: El usuario puede seleccionar una opción por número
```

### 1.3 Consulta de Balance

**REQ-BOT-020**: El bot MUST obtener el saldo del wallet del usuario llamando a la API REST del
backend (`GET /api/wallets/:userId`).

**REQ-BOT-021**: El bot MUST mostrar el saldo en USD con 2 decimales.

**REQ-BOT-022**: Si la API del backend no responde, el bot MUST informar al usuario del error sin
exponer detalles técnicos.

**Scenario 1.3-A: Consulta de saldo exitosa (ES)**
```
Given: El usuario tiene saldo en su wallet
When: El usuario selecciona la opción "saldo"
Then: El bot responde con "Tu saldo disponible es: $X.XX USD"
And: Ofrece regresar al menú principal
```

**Scenario 1.3-B: Consulta de saldo exitosa (EN)**
```
Given: El usuario ha seleccionado idioma inglés
When: The user selects "balance"
Then: The bot responds with "Your available balance is: $X.XX USD"
```

**Scenario 1.3-C: Error de API**
```
Given: El backend no está disponible
When: El usuario consulta su saldo
Then: El bot responde con un mensaje amigable de error
And: No expone stack traces ni mensajes técnicos
```

### 1.4 Consulta de Red y Comisiones

**REQ-BOT-030**: El bot MUST mostrar el número de downlines directos e indirectos del usuario.

**REQ-BOT-031**: El bot MUST mostrar las comisiones pendientes y aprobadas del usuario.

**Scenario 1.4-A: Consulta de red**
```
Given: El usuario tiene una red MLM configurada
When: El usuario selecciona "ver mi red"
Then: El bot muestra número de referidos directos e indirectos
And: Muestra total de comisiones acumuladas
```

### 1.5 Soporte y FAQ

**REQ-BOT-040**: El bot MUST responder preguntas frecuentes usando la knowledge base privada
(`prompt_kb/knowledge-base.md`).

**REQ-BOT-041**: El bot MUST ofrecer escalación a agente humano si el usuario lo solicita o si el
bot no puede resolver la consulta.

**Scenario 1.5-A: Pregunta con respuesta en KB**
```
Given: El usuario hace una pregunta sobre el sistema MLM
When: La respuesta está en la knowledge base
Then: El bot responde con información precisa de la KB
And: No inventa información no contenida en la KB
```

**Scenario 1.5-B: Escalación solicitada**
```
Given: El usuario solicita hablar con un humano
When: El bot procesa la solicitud
Then: El bot envía webhook a n8n (/webhook/human-handoff)
And: n8n crea registro en Notion CRM
And: n8n notifica al agente asignado
And: El bot confirma al usuario que un agente se comunicará pronto
```

### 1.6 Agendamiento de Visitas

**REQ-BOT-050**: El bot MUST guiar al usuario para agendar una visita a una propiedad recolectando:
nombre, email, propiedad de interés, fecha y hora.

**REQ-BOT-051**: Al confirmar, el bot MUST enviar un webhook a n8n (`POST /webhook/schedule-visit`).

**REQ-BOT-052**: n8n MUST crear el evento en Google Calendar y el lead en Notion CRM.

**Scenario 1.6-A: Agendamiento exitoso**
```
Given: El usuario quiere agendar una visita
When: El usuario completa el formulario conversacional (nombre, email, propiedad, fecha)
And: Confirma los datos
Then: El bot envía los datos a n8n via webhook
And: n8n crea evento en Google Calendar con los datos de la visita
And: n8n crea/actualiza lead en Notion CRM
And: El bot confirma al usuario: "Tu visita ha sido agendada"
```

**Scenario 1.6-B: Error en agendamiento**
```
Given: n8n no está disponible
When: El bot intenta enviar el webhook
Then: El bot informa al usuario del error
And: Sugiere intentar nuevamente o contactar soporte
```

### 1.7 Escalación Humana (Handoff)

**REQ-BOT-060**: El flujo de escalación MUST enviarse a n8n via `POST /webhook/human-handoff`.

**REQ-BOT-061**: El webhook MUST incluir: userId/número de WhatsApp, motivo de escalación, historial
resumido de la conversación.

**REQ-BOT-062**: Siempre MUST confirmar al usuario que recibirá atención humana.

### 1.8 Idiomas

**REQ-BOT-070**: El bot MUST soportar español (ES) e inglés (EN).

**REQ-BOT-071**: El usuario MUST poder cambiar el idioma en cualquier momento del flujo.

**REQ-BOT-072**: El idioma seleccionado MUST persistir durante toda la sesión (3 horas).

**Scenario 1.8-A: Cambio de idioma mid-session**
```
Given: El usuario está en una conversación en español
When: El usuario selecciona "cambiar idioma" y elige inglés
Then: Todos los mensajes subsiguientes son en inglés
And: El idioma se mantiene hasta el fin de la sesión
```

### 1.9 Agente IA (GPT-4o)

**REQ-BOT-080**: Si ningún flujo temático captura la intención del usuario, el bot MUST activar el
agente IA.

**REQ-BOT-081**: El agente IA MUST usar la knowledge base privada como única fuente de verdad. MUST
NOT inventar información.

**REQ-BOT-082**: El agente Sophia MUST usarse para usuarios masculinos en español. El agente Max
MUST usarse para usuarios femeninos en inglés.

**Scenario 1.9-A: Pregunta fuera de flujo**
```
Given: El usuario escribe una pregunta no mapeada en flujos
When: Ningún keyword trigger hace match
Then: El agente GPT-4o responde usando el system prompt + KB
And: La respuesta es coherente y no contiene información inventada
```

---

## Feature 2: Backend — Rutas Faltantes

### 2.1 Achievements Endpoints

**REQ-BACK-010**: `GET /api/achievements` MUST retornar la lista de achievements del sistema.

**REQ-BACK-011**: `GET /api/achievements/:userId` MUST retornar los achievements desbloqueados del
usuario.

**Scenario 2.1-A: Listar achievements**
```
Given: El sistema tiene achievements configurados
When: Se hace GET /api/achievements con token JWT válido
Then: Responde 200 con array de achievement objects
And: Cada achievement tiene id, name, description, badge
```

### 2.2 Leaderboard Endpoints

**REQ-BACK-020**: `GET /api/leaderboard` MUST retornar el ranking de usuarios por puntos/comisiones.

**REQ-BACK-021**: El endpoint MUST soportar paginación.

**Scenario 2.2-A: Obtener leaderboard**
```
Given: Existen usuarios con actividad en el sistema
When: Se hace GET /api/leaderboard con token JWT válido
Then: Responde 200 con array ordenado de usuarios con su ranking
And: Incluye posición, nombre, avatar, puntos
```

### 2.3 Bot Endpoints

**REQ-BACK-030**: `POST /api/bot/notify` MUST enviar notificación proactiva via el bot a un usuario.

**REQ-BACK-031**: Todos los endpoints `/api/bot/*` MUST requerir header `x-bot-secret` válido.

**REQ-BACK-032**: Requests sin `x-bot-secret` válido MUST retornar 401.

**Scenario 2.3-A: Notificación proactiva autenticada**
```
Given: El backend quiere notificar a un usuario via WhatsApp
When: POST /api/bot/notify con x-bot-secret correcto y { userId, message }
Then: Responde 200 y el bot envía el mensaje al usuario
```

**Scenario 2.3-B: Request sin autenticación**
```
Given: Una request a /api/bot/* sin x-bot-secret
When: El middleware procesa la request
Then: Responde 401 Unauthorized
```

### 2.4 Asociaciones de Modelos

**REQ-BACK-040**: Achievement MUST tener asociación `hasMany` con UserAchievement.

**REQ-BACK-041**: Badge MUST tener asociación con Achievement.

**REQ-BACK-042**: User MUST tener asociación `hasMany` con UserAchievement.

---

## Feature 3: Frontend Tests

### 3.1 Componentes Leaderboard

**REQ-TEST-010**: El componente `Podium` MUST tener al menos 12 tests cubriendo: renderizado del
podio, posiciones top 3, casos con menos de 3 usuarios, avatares, scores.

**REQ-TEST-011**: El componente `RankingTable` MUST tener al menos 12 tests cubriendo: renderizado
de filas, paginación, ranking del usuario actual resaltado, columnas.

**REQ-TEST-012**: El componente `UserRankBanner` MUST tener al menos 8 tests cubriendo: datos del
usuario, posición, cambio respecto al período anterior.

### 3.2 AchievementsPage

**REQ-TEST-020**: `AchievementsPage` MUST tener al menos 12 tests cubriendo: renderizado de la
página, lista de achievements, achievements desbloqueados vs bloqueados, badges, loading state.

### 3.3 Services

**REQ-TEST-030**: `services.test.ts` MUST cubrir los nuevos endpoints de achievements y leaderboard
(al menos 9 tests adicionales).

### 3.4 Configuración Vitest

**REQ-TEST-040**: `vitest.config.ts` MUST incluir `singleFork: true` para compatibilidad con
Vitest 4 en el entorno de CI.

**Scenario 3.4-A: Todos los tests pasan**
```
Given: 210 tests definidos en el frontend
When: Se ejecuta `pnpm test` en el workspace frontend
Then: Todos los 210 tests pasan sin errores
And: No hay tests en estado "skipped" por problemas de configuración
```

---

## Feature 4: Architecture Docs + Release

**REQ-DOCS-010**: `docs/ARCHITECTURE.md` MUST incluir una sección de Sprint 4 documentando el bot,
las integraciones n8n, y los cambios de versión.

**REQ-DOCS-020**: La versión en la documentación MUST reflejar v2.0.0.

**REQ-RELEASE-010**: El tag `v2.0.0` MUST estar creado en el branch `main` con un GitHub Release
publicado.

---

**Change**: sprint4-complete
**Registrado retroactivamente**: 2026-04-06
