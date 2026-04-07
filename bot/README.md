# Nexo Real — Bot (Nexo Bot)

> **Versión actual: v2.2.0** — Sprint 6 completado (2026-04-07)

Chatbot de WhatsApp para la plataforma Nexo Real, construido con **BuilderBot** + **Baileys**. Responde consultas de propiedades y tours en español e inglés, y facilita la comunicación con el equipo comercial.

## 🛠️ Stack

- **Node.js 24+** + TypeScript
- **BuilderBot** (`@builderbot/bot`)
- **Baileys** (`@builderbot/provider-baileys`) — Proveedor de WhatsApp
- **Docker** (despliegue)

## 📦 Instalación

```bash
cd bot
pnpm install
```

## 🚀 Ejecución

```bash
# Desarrollo
pnpm dev

# Producción (compilado)
pnpm build && pnpm start
```

## 🐳 Docker

```bash
docker build -t nexo-bot .
docker run -d --name nexo-bot nexo-bot
```

## 🔌 Conexión con Backend

El bot se comunica con el backend Nexo Real a través de la **Bot API** con autenticación por header `X-Bot-Secret`:

| Endpoint                  | Descripción                         |
| ------------------------- | ----------------------------------- |
| `GET /api/bot/properties` | Obtiene hasta 5 propiedades activas |
| `GET /api/bot/tours`      | Obtiene hasta 5 tours activos       |

Configurar `BOT_SECRET` y `BACKEND_URL` en las variables de entorno.

## 🌊 Flows / Flujos

### Flujos principales

| Flow              | Archivo              | Descripción                                 |
| ----------------- | -------------------- | ------------------------------------------- |
| `welcomeFlow`     | `welcome.flow.ts`    | Bienvenida inicial y menú de opciones       |
| `languageFlow`    | `language.flow.ts`   | Selección de idioma (ES/EN)                 |
| `propertiesFlow`  | `properties.flow.ts` | Consulta de propiedades (v2.2.0)            |
| `toursFlow`       | `tours.flow.ts`      | Consulta de paquetes turísticos (v2.2.0)    |
| `reservationFlow` | `schedule.flow.ts`   | Agendamiento de visitas/consultas           |
| `networkFlow`     | `network.flow.ts`    | Información sobre la red de afiliados       |
| `balanceFlow`     | `balance.flow.ts`    | Consulta de balance (usa `network_balance`) |
| `supportFlow`     | `support.flow.ts`    | Soporte y contacto humano                   |
| `handoffFlow`     | `handoff.flow.ts`    | Transferencia a agente humano               |
| `agentFlow`       | `agent.flow.ts`      | Modo agente para respuestas manuales        |

### `propertiesFlow` (v2.2.0)

Responde a keywords de propiedades en **español e inglés**.

**Keywords ES:** `propiedad`, `propiedades`, `casa`, `departamento`, `alquiler`, `venta`, `inmueble`

**Keywords EN:** `property`, `properties`, `house`, `apartment`, `rent`, `sale`, `real estate`

**Comportamiento:**

1. Detecta el idioma del usuario
2. Llama a `GET /api/bot/properties` con `X-Bot-Secret`
3. Formatea y envía una lista de hasta 5 propiedades con:
   - Nombre / título
   - Precio (con moneda)
   - Ciudad
   - Tipo (venta / alquiler / gestión)
4. Ofrece link al portal para ver más detalles

### `toursFlow` (v2.2.0)

Responde a keywords de tours en **español e inglés**.

**Keywords ES:** `tour`, `tours`, `paquete`, `paquetes`, `viaje`, `turismo`, `excursión`, `destino`

**Keywords EN:** `tour`, `tours`, `package`, `packages`, `trip`, `travel`, `excursion`, `destination`

**Comportamiento:**

1. Detecta el idioma del usuario
2. Llama a `GET /api/bot/tours` con `X-Bot-Secret`
3. Formatea y envía una lista de hasta 5 tours con:
   - Nombre del paquete
   - Precio (con moneda)
   - Destino
   - Duración (días/noches)
4. Ofrece link al portal para reservar

## 🌐 i18n

Los flows `propertiesFlow` y `toursFlow` detectan automáticamente el idioma configurado por el usuario en `languageFlow` y responden en el idioma correspondiente (ES/EN).

## ⚙️ Variables de Entorno

| Variable      | Descripción                       | Ejemplo                    |
| ------------- | --------------------------------- | -------------------------- |
| `BACKEND_URL` | URL base del backend              | `https://api.nexoreal.com` |
| `BOT_SECRET`  | Secret para autenticación Bot API | `...`                      |
| `PORT`        | Puerto del servidor del bot       | `3001`                     |

## 📁 Estructura

```
bot/src/
├── app.ts               # Entry point, registro de flows
├── flows/               # Flujos conversacionales
│   ├── welcome.flow.ts
│   ├── language.flow.ts
│   ├── properties.flow.ts   # v2.2.0
│   ├── tours.flow.ts        # v2.2.0
│   ├── schedule.flow.ts
│   ├── network.flow.ts
│   ├── balance.flow.ts
│   ├── support.flow.ts
│   ├── handoff.flow.ts
│   └── agent.flow.ts
└── services/            # Servicios (llamadas al backend, formatters)
```
