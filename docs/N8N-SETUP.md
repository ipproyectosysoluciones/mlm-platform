# n8n Setup Guide — Nexo Real

> Guía completa para configurar n8n desde cero en el stack de Nexo Real.
> Incluye workflows de `schedule-visit` y `human-handoff`.
>
> **Última actualización:** 2026-04-06
> **n8n version:** 2.14.2 (Self Hosted)

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Levantar n8n](#levantar-n8n)
3. [Primer acceso — Owner Account](#primer-acceso--owner-account)
4. [Credencial Google Calendar](#credencial-google-calendar)
5. [Credencial Notion](#credencial-notion)
6. [Workflow: schedule-visit](#workflow-schedule-visit)
7. [Workflow: human-handoff](#workflow-human-handoff)
8. [Verificación end-to-end](#verificación-end-to-end)
9. [Variables de entorno](#variables-de-entorno)
10. [Troubleshooting](#troubleshooting)

---

## Arquitectura

```
WhatsApp
   │
   ▼
Nexo Bot (builderbot)
   │
   ├── POST /webhook/schedule-visit ──► n8n ──► Google Calendar (crear evento)
   │                                       └──► Notion CRM (Status: Visit Scheduled)
   │
   └── POST /webhook/human-handoff ───► n8n ──► Notion CRM (Status: Needs Human)
```

- n8n corre en Docker en la red interna `mlm-network`
- Los webhooks NO son públicos — solo accesibles desde otros containers
- Base de datos: SQLite (MVP) en volumen `mlm_n8n_data`
- UI: `http://localhost:5678` (solo acceso local)

---

## Levantar n8n

```bash
cd /media/bladimir/Datos1/Datos/MLM

# Primera vez (o si se perdió el volumen)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d n8n

# Verificar que esté healthy (~30 segundos)
docker ps --format "table {{.Names}}\t{{.Status}}" | grep n8n

# Ver logs
docker logs mlm-n8n-1 --tail 20
```

### ⚠️ IMPORTANTE — Si se pierde el volumen

Si borrás el volumen `mlm_n8n_data`, **todos los workflows y credenciales se pierden**.
Hay que reconfigurar todo desde cero siguiendo esta guía.

Para hacer backup del volumen antes de cualquier operación destructiva:

```bash
docker run --rm \
  -v mlm_n8n_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/n8n_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

---

## Primer acceso — Owner Account

n8n v1+ usa un sistema de owner account con email/password.
**No usa basic auth** (deprecado).

1. Abrí `http://localhost:5678`
2. Completá el formulario **"Set up owner account"**:
   - **Email**: `admin@nexoreal.xyz`
   - **First Name**: `Nexo`
   - **Last Name**: `Admin`
   - **Password**: ver `.env.production` → `N8N_USER_PASSWORD`
3. Click **"Next"** → omitir pasos opcionales

> **Nota:** Las variables `N8N_USER_EMAIL` / `N8N_USER_PASSWORD` en el docker-compose
> solo crean el owner automáticamente en el **primer arranque con DB vacía**.
> Si la DB ya existe, se ignoran y hay que crear el owner manualmente por la UI.

---

## Credencial Google Calendar

### 1. Google Cloud Console

1. Ir a https://console.cloud.google.com
2. Seleccionar o crear proyecto `Nexo Real`
3. Habilitar **Google Calendar API**:
   - APIs & Services → Library → buscar "Google Calendar API" → Enable
4. Configurar OAuth Consent Screen:
   - APIs & Services → OAuth consent screen
   - User Type: **External**
   - App name: `Nexo Real n8n`
   - Support email: `ipproyectossoluciones@gmail.com`
   - Developer contact: mismo email
   - Scopes: agregar `https://www.googleapis.com/auth/calendar`
   - Test users: agregar `ipproyectossoluciones@gmail.com`
5. Crear credencial OAuth:
   - APIs & Services → Credentials → + Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: `n8n Google Calendar`
   - Authorized redirect URIs: `http://localhost:5678/rest/oauth2-credential/callback`
   - Guardar **Client ID** y **Client Secret**

### 2. En n8n

1. Credentials → + Add credential → **Google Calendar**
2. Pegar Client ID y Client Secret
3. Click **"Sign in with Google"**
4. Autorizar con `ipproyectossoluciones@gmail.com`

> **Error 403 access_denied**: la app está en modo Testing y el usuario no está en la lista de testers.
> Solución: Google Cloud Console → OAuth consent screen → Test users → agregar el email.

---

## Credencial Notion

### 1. Crear base de datos en Notion

Crear página **"Nexo Real CRM"** con una tabla con estas columnas:

| Columna        | Tipo   | Opciones                                                       |
| -------------- | ------ | -------------------------------------------------------------- |
| Nombre         | Text   | —                                                              |
| Phone          | Phone  | —                                                              |
| Interest       | Text   | —                                                              |
| Preferred Date | Text   | —                                                              |
| Language       | Select | `es`, `en`                                                     |
| Status         | Select | `New`, `Visit Scheduled`, `Needs Human`, `Converted`, `Closed` |
| Source         | Select | `WhatsApp Bot`                                                 |
| Created At     | Date   | —                                                              |

**Database ID** actual: `33a293bfbcf08050b983ed786679c415`
(extraído de la URL de la página en Notion)

### 2. Crear integración en Notion

1. Ir a https://www.notion.so/profile/integrations
2. - New integration:
   * Name: `n8n Nexo Real`
   * Associated workspace: `Espacio de Ip Proyectos y Soluciones`
   * Type: Internal
3. Copiar el **Internal Integration Secret** (`ntn_...`)

### 3. Conectar integración a la base de datos

1. Abrir la página **"Nexo Real CRM"** en Notion
2. Click en "..." (tres puntos) arriba a la derecha
3. Connections → buscar **"n8n Nexo Real"** → conectar

### 4. En n8n

1. Credentials → + Add credential → **Notion API**
2. Pegar el Internal Integration Secret
3. Save → verificar tilde verde ✅

---

## Workflow: schedule-visit

**Función:** Recibe datos de agendamiento desde el bot, crea un evento en Google Calendar y registra el lead en Notion CRM.

**Webhook URL (producción):** `http://n8n:5678/webhook/schedule-visit`

### Payload esperado

```json
{
  "phone": "5491122334455",
  "name": "Juan Pérez",
  "preferredDate": "martes 15 a las 10am",
  "interest": "apartamento en Bogotá",
  "language": "es"
}
```

### Nodos

#### 1. Webhook

- HTTP Method: `POST`
- Path: `schedule-visit`
- Authentication: None
- Respond: Immediately

#### 2. Code — Parse date

```javascript
// MVP: usa mañana a las 10am como placeholder
// El asesor ajusta la fecha real en Google Calendar
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const end = new Date(tomorrow);
end.setHours(11, 0, 0, 0);

return {
  ...items[0].json,
  startDateTime: tomorrow.toISOString(),
  endDateTime: end.toISOString(),
  preferredDateText: items[0].json.body.preferredDate,
};
```

#### 3. Google Calendar — Create Event

- Credential: Google Calendar (ipproyectossoluciones)
- Calendar: Nexo Real
- Summary: `Visita - {{ $('Webhook').item.json.body.name }} ({{ $('Webhook').item.json.body.interest }})`
- Start: `{{ $json.startDateTime }}`
- End: `{{ $json.endDateTime }}`
- Description:
  ```
  📱 WhatsApp: {{ $('Webhook').item.json.body.phone }}
  👤 Nombre: {{ $('Webhook').item.json.body.name }}
  🏠 Interés: {{ $('Webhook').item.json.body.interest }}
  🌐 Idioma: {{ $('Webhook').item.json.body.language }}
  📅 Fecha preferida por el usuario: {{ $json.preferredDateText }}
  ```

#### 4. Notion — Create Database Page

- Credential: Notion API (n8n Nexo Real)
- Database: Nexo Real CRM
- Nombre: `{{ $('Webhook').item.json.body.name }}`
- Phone: `{{ $('Webhook').item.json.body.phone }}`
- Interest: `{{ $('Webhook').item.json.body.interest }}`
- Preferred Date: `{{ $('Webhook').item.json.body.preferredDate }}`
- Language: `{{ $('Webhook').item.json.body.language }}`
- Status: `Visit Scheduled`
- Source: `WhatsApp Bot`
- Created At: `{{ $now }}`

---

## Workflow: human-handoff

**Función:** Recibe datos de escalación desde el bot y registra el lead en Notion CRM con status "Needs Human".

**Webhook URL (producción):** `http://n8n:5678/webhook/human-handoff`

### Payload esperado

```json
{
  "phone": "5491122334455",
  "name": "Carlos López",
  "reason": "Quiere hablar con un asesor sobre financiamiento",
  "agent": "sophia",
  "language": "es",
  "escalatedAt": "2026-04-06T12:00:00.000Z"
}
```

### Nodos

#### 1. Webhook

- HTTP Method: `POST`
- Path: `human-handoff`
- Authentication: None
- Respond: Immediately

#### 2. Notion — Create Database Page

- Credential: Notion API (n8n Nexo Real)
- Database: Nexo Real CRM
- Nombre: `{{ $json.body.name }}`
- Phone: `{{ $json.body.phone }}`
- Interest: `Handoff — {{ $json.body.reason }}`
- Language: `{{ $json.body.language }}`
- Status: `Needs Human`
- Source: `WhatsApp Bot`
- Created At: `{{ $now }}`

---

## Verificación end-to-end

Desde la terminal del servidor, con los workflows publicados y activos:

```bash
# Test schedule-visit
curl -s -X POST http://localhost:5678/webhook/schedule-visit \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5731234567890",
    "name": "Test Producción",
    "preferredDate": "miércoles a las 11am",
    "interest": "apartamento en Bogotá",
    "language": "es"
  }'
# Esperado: {"message":"Workflow was started"}

# Test human-handoff
curl -s -X POST http://localhost:5678/webhook/human-handoff \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5731234567891",
    "name": "Test Handoff",
    "reason": "Consulta sobre crédito hipotecario",
    "agent": "max",
    "language": "en",
    "escalatedAt": "2026-04-06T12:00:00.000Z"
  }'
# Esperado: {"message":"Workflow was started"}
```

Verificar en:

- **Google Calendar** (ipproyectossoluciones): evento creado para mañana a las 10am
- **Notion CRM**: registro con Status `Visit Scheduled` y `Needs Human`

---

## Variables de entorno

En `.env.production`:

```bash
# n8n — Workflow Automation
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678/

# Owner account (n8n v1+ — basic auth deprecado)
N8N_USER_EMAIL=admin@nexoreal.xyz
N8N_USER_PASSWORD=<ver secrets>
N8N_USER_FIRST_NAME=Nexo
N8N_USER_LAST_NAME=Admin

# Timezone
TZ=America/Bogota
```

En `bot/.env` / docker-compose:

```bash
# URL interna Docker para que el bot llame a n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook
```

---

## Troubleshooting

### n8n no arranca

```bash
docker logs mlm-n8n-1 --tail 30
# Verificar que el volumen existe
docker volume ls | grep n8n
```

### Webhook 404 "not registered"

- En modo test: el workflow debe estar en modo "Test workflow" (escuchando activamente)
- En producción: el workflow debe estar **publicado y activo** (toggle Active = ON)

### Error 403 Google Calendar

- El usuario no está en la lista de testers del OAuth consent screen
- Solución: Google Cloud Console → OAuth consent screen → Test users → agregar email

### Credenciales perdidas (volumen borrado)

Seguir esta guía desde [Credencial Google Calendar](#credencial-google-calendar).
Los workflows deben recrearse manualmente — no hay export automático configurado.

### Bot no puede llegar al webhook

```bash
# Verificar que bot y n8n están en la misma red
docker network inspect mlm_mlm-network | grep -E "Name|IPv4"
# El bot usa http://n8n:5678/webhook (nombre del servicio Docker)
```

---

## Backlog / Mejoras futuras

- [ ] Exportar workflows como JSON y commitearlos al repo (evita pérdida de config)
- [ ] Parseo real de fechas en lenguaje natural (ej: usar Luxon o Chrono)
- [ ] Notificación al asesor vía email/WhatsApp cuando hay un `human-handoff`
- [ ] Migrar SQLite → PostgreSQL para producción robusta
- [ ] Agregar autenticación en los webhooks (header `X-Nexo-Secret`)
