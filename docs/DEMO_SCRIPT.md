# DEMO_SCRIPT.md — Nexo Real v2.3.0

> **Audiencia**: Inversores y equipo de ventas  
> **Duración estimada**: 15–20 minutos  
> **Fecha**: Mayo 2026  
> **Presenter**: [Nombre del presentador]

---

## 🎯 Objetivo de la demo

Mostrar el flujo completo de Nexo Real: plataforma MLM + bot de WhatsApp con IA para captación y cierre de oportunidades inmobiliarias y de turismo.

---

## 🛠️ Setup previo (checklist antes de empezar)

- [ ] Backend corriendo (`pnpm dev` en `/backend`)
- [ ] Bot corriendo (`pnpm dev` en `/bot`), QR escaneado y conectado
- [ ] Frontend corriendo (`pnpm dev` en `/frontend`)
- [ ] Celular con WhatsApp listo para escanear o número de test disponible
- [ ] Verificar salud del bot:
  ```bash
  curl -H "x-bot-secret: $BOT_SECRET" http://localhost:3000/api/bot/health
  # Esperado: { "success": true, "data": { "status": "ok", ... } }
  ```
- [ ] Al menos 2 propiedades y 2 tours cargados en la BD

---

## 📋 Guión paso a paso

### Parte 1 — Plataforma Web (5 min)

**[Abrir el frontend en el browser]**

> "Esta es la plataforma Nexo Real. Un sistema MLM completo con módulo inmobiliario y de turismo integrado."

1. **Landing page** — mostrar hero, propuesta de valor, CTA de registro
2. **Propiedades** (`/properties`) — grid de cards, filtros por ciudad/tipo/precio
   - Hacer click en una propiedad → detalle con galería
3. **Tours** (`/tours`) — similar, mostrar tipos (adventure, cultural, beach)
   - Destacar el precio, capacidad y duración
4. **Dashboard** (logeado como usuario demo) — balance, red MLM, comisiones

> "Todo esto se sincroniza en tiempo real con el bot de WhatsApp."

---

### Parte 2 — Bot WhatsApp con IA (10 min)

**[Tener el celular a mano o pantalla compartida del WhatsApp Web]**

#### 2.1 — Primer contacto y selección de idioma

**Escribir al número del bot:**

```
Hola
```

**El bot responde:**

```
🌎 Nexo Real — Bienvenido / Welcome!

Por favor elegí tu idioma / Please choose your language:

1️⃣  Español
2️⃣  English
```

> "El bot detecta si es un usuario nuevo y arranca el onboarding."

**Escribir:**

```
1
```

**El bot pide el nombre.**

**Escribir:**

```
Carlos
```

#### 2.2 — Asignación de agente IA

> "Aquí ocurre algo interesante — el bot asigna un agente IA personalizado según el nombre."

**El bot responde con intro de Sophia o Max (según el nombre):**

- **Sophia** — perfil femenino, warm, enfocada en propiedades y lifestyle
- **Max** — perfil masculino, directo, enfocado en inversión y rentabilidad

> "Cada agente tiene personalidad propia, mantiene contexto de la conversación y usa datos en tiempo real de la plataforma."

#### 2.3 — Consulta de propiedades

**Escribir:**

```
Me interesa invertir en una propiedad, ¿qué tienen disponible?
```

**El bot responde** con las últimas 5 propiedades del sistema (datos en vivo), incluyendo precio, tipo y ciudad.

> "No es contenido estático — está consultando la base de datos en este momento."

#### 2.4 — Consulta de tours

**Escribir:**

```
¿Tienen paquetes de turismo?
```

**El bot responde** con los tours disponibles.

#### 2.5 — Consulta de balance / red MLM

**Escribir:**

```
saldo
```

**El bot responde** con el balance actual del usuario (requiere estar registrado y vinculado).

> "El bot conoce tu posición en la red MLM y puede consultarla en tiempo real."

#### 2.6 — Resiliencia: retry automático en errores de OpenAI

> "Un punto técnico importante para el equipo: si la API de OpenAI tiene un spike de latencia o devuelve un 429, el bot reintenta automáticamente con backoff exponencial — 3 intentos, duplicando el delay cada vez. El usuario no ve nada, la experiencia es fluida."

#### 2.7 — Handoff a agente humano

**Escribir:**

```
quiero hablar con un asesor
```

**El bot transfiere** y notifica al equipo de ventas.

---

### Parte 3 — Estabilidad operativa (2 min)

> "Para el equipo técnico: agregamos monitoreo de conexión a nivel de aplicación."

- **Health endpoint**: `GET /api/bot/health` — el bot lo llama al arrancar para confirmar que el backend está disponible antes de aceptar conexiones de WhatsApp.
- **Disconnect handler**: si WhatsApp desconecta el bot (corte de red, sesión expirada), el proceso loguea la razón, reintenta hasta 5 veces (configurable via `BOT_MAX_RECONNECT`), y en el peor caso sale limpiamente para que el contenedor/supervisor lo reinicie.
- **Sesión invalidada (401)**: si WhatsApp revoca la sesión, el bot sale inmediatamente con mensaje claro — no se queda en loop.

---

## ❓ Q&A anticipadas

| Pregunta                                      | Respuesta                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ¿Los datos de propiedades son en tiempo real? | Sí — el bot consulta `/api/bot/properties` y `/api/bot/tours` en cada conversación.                       |
| ¿Qué pasa si OpenAI se cae?                   | withRetry() reintenta 3 veces con backoff. Si falla igual, el bot responde con mensaje de error amigable. |
| ¿Puede el bot cerrar una venta?               | En v2.3 deriva a asesor humano. En Sprint 8 se integra el flujo completo de reserva.                      |
| ¿Multi-idioma?                                | Sí — español e inglés, configurable por usuario.                                                          |
| ¿Escala a múltiples números?                  | Con BaileysProvider actual, 1 número por instancia. Arquitectura multi-tenant en el roadmap post-demo.    |
| ¿Los comisiones se calculan en tiempo real?   | Sí — el backend MLM calcula y el bot puede consultarlas.                                                  |

---

## 🚨 Plan B (si algo falla en vivo)

| Problema                   | Solución                                                           |
| -------------------------- | ------------------------------------------------------------------ |
| Bot no conecta / QR expiró | Reiniciar `pnpm dev` en `/bot`, escanear nuevo QR                  |
| OpenAI no responde         | Mostrar la UI web solamente, explicar que el bot usa la misma data |
| Backend caído              | Levantar con `pnpm dev` en `/backend`, verificar `.env`            |
| WhatsApp bloqueó el número | Usar número de backup (tener uno preparado)                        |

---

## 📎 Links útiles durante la demo

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3000/api/health`
- Bot health: `http://localhost:3000/api/bot/health` (con header `x-bot-secret`)
- Bot HTTP server: `http://localhost:3002`
