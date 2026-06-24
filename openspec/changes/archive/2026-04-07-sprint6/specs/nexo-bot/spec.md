# Nexo Bot Specification

## Purpose

Bot WhatsApp para Nexo Real con agentes duales (Sophia/Max), flows de propiedades y tours, agenda de visitas vía Google Calendar a través de n8n, y endpoints backend dedicados. El bot MUST operar de forma confiable sin alucinaciones.

---

## Requirements

### Requirement: Agentes Duales Sophia/Max con Detección de Género

El sistema MUST detectar automáticamente el género del contacto a partir del nombre recibido en el mensaje inicial. Si el contacto es hombre, el agente MUST presentarse como "Sophia". Si es mujer, MUST presentarse como "Max". Si el género no puede determinarse, MUST usar el nombre "Nexo" como fallback.

#### Scenario: Contacto masculino detectado

- GIVEN el bot recibe el primer mensaje de "Carlos"
- WHEN procesa el nombre del contacto
- THEN responde presentándose como "Sophia, tu asesora de Nexo Real"

#### Scenario: Contacto femenino detectado

- GIVEN el bot recibe el primer mensaje de "María"
- WHEN procesa el nombre del contacto
- THEN responde presentándose como "Max, tu asesor de Nexo Real"

#### Scenario: Género ambiguo — fallback a Nexo

- GIVEN el nombre del contacto no puede clasificarse por género (ej. "Alex", nombre extranjero)
- WHEN el bot procesa el nombre
- THEN responde presentándose como "Nexo, tu asesor de Nexo Real"

---

### Requirement: Integración Google Calendar vía n8n para Agendado de Visitas

El sistema MUST enviar a un webhook n8n los datos necesarios para agendar una visita en Google Calendar: nombre del contacto, teléfono, fecha/hora solicitada y tipo de visita.

#### Scenario: Agendado exitoso de visita

- GIVEN el usuario confirma nombre, teléfono, fecha/hora y tipo de visita
- WHEN el bot envía los datos al webhook n8n
- THEN n8n agenda el evento en Google Calendar y retorna confirmación
- AND el bot responde al usuario con la confirmación de la cita

#### Scenario: Webhook n8n no disponible

- GIVEN el webhook n8n retorna error o timeout
- WHEN el bot intenta agendar
- THEN el bot informa al usuario que ocurrió un problema y escala a humano
- AND NO crea un evento incompleto ni parcial

#### Scenario: Datos de visita incompletos

- GIVEN el usuario no proporciona algún campo obligatorio (fecha, teléfono, tipo)
- WHEN el bot intenta procesar el agendado
- THEN solicita los datos faltantes antes de enviar al webhook

---

### Requirement: Flow de Propiedades

El sistema MUST permitir al usuario listar propiedades disponibles (máximo 5 resultados), filtrar por tipo (arriendo/venta) y ver el detalle de una propiedad individual.

#### Scenario: Usuario solicita listado de propiedades

- GIVEN el usuario envía intención de ver propiedades
- WHEN el flow consulta `GET /api/bot/properties`
- THEN el bot presenta hasta 5 propiedades con nombre, tipo y precio
- AND ofrece opción de ver detalle o filtrar

#### Scenario: Usuario filtra propiedades por tipo

- GIVEN el usuario indica "arriendo" o "venta" como filtro
- WHEN el flow consulta `GET /api/bot/properties?tipo=arriendo`
- THEN el bot presenta solo propiedades del tipo solicitado (máx 5)

#### Scenario: Usuario solicita detalle de una propiedad

- GIVEN el bot mostró el listado y el usuario selecciona una propiedad
- WHEN el flow consulta el detalle de esa propiedad
- THEN el bot presenta nombre, descripción, precio, ubicación y tipo de la propiedad

#### Scenario: No hay propiedades disponibles

- GIVEN el endpoint retorna 0 resultados con el filtro aplicado
- WHEN el bot recibe la respuesta
- THEN informa al usuario que no hay propiedades disponibles con ese criterio
- AND NO alucina datos de propiedades inexistentes

---

### Requirement: Flow de Tours

El sistema MUST permitir al usuario listar tours disponibles (máximo 5 resultados) y ver el detalle de un tour.

#### Scenario: Usuario solicita listado de tours

- GIVEN el usuario envía intención de ver tours
- WHEN el flow consulta `GET /api/bot/tours`
- THEN el bot presenta hasta 5 tours con nombre y descripción breve

#### Scenario: Usuario solicita detalle de un tour

- GIVEN el bot mostró el listado y el usuario selecciona un tour
- WHEN el flow consulta el detalle
- THEN el bot presenta nombre, descripción completa, precio e itinerario del tour

#### Scenario: No hay tours disponibles

- GIVEN el endpoint retorna 0 resultados
- WHEN el bot recibe la respuesta vacía
- THEN informa que no hay tours disponibles actualmente sin inventar datos

---

### Requirement: Endpoints Backend del Bot

El sistema MUST exponer `GET /api/bot/properties` y `GET /api/bot/tours`. Ambos endpoints MUST estar autenticados con `BOT_SECRET` (header o query param). Ambos MUST retornar máximo 5 resultados por defecto.

#### Scenario: Solicitud autenticada a /api/bot/properties

- GIVEN la solicitud incluye `BOT_SECRET` válido
- WHEN el endpoint recibe la solicitud con filtros opcionales
- THEN retorna array de propiedades activas (máx 5) con campos necesarios para el bot

#### Scenario: Solicitud sin autenticación rechazada

- GIVEN la solicitud no incluye `BOT_SECRET` o es inválido
- WHEN llega al endpoint
- THEN retorna 401 Unauthorized

#### Scenario: Filtro por tipo en /api/bot/properties

- GIVEN la solicitud incluye `?tipo=venta` con `BOT_SECRET` válido
- WHEN el endpoint procesa la consulta
- THEN retorna solo propiedades de tipo "venta" (máx 5)

---

### Requirement: Política Anti-Alucinación y Escalado a Humano

El bot MUST NOT inventar información. Si no puede responder con datos reales, MUST escalar a un operador humano.

#### Scenario: Bot no tiene respuesta para la consulta del usuario

- GIVEN el usuario pregunta algo fuera del scope del bot (precios futuros, legales, etc.)
- WHEN el bot no tiene datos para responder
- THEN responde indicando que transferirá la consulta a un asesor humano
- AND NO genera respuestas inventadas o estimadas sin base de datos

---

### Requirement: Dockerización del Bot

El bot MUST tener un `Dockerfile` optimizado en `bot/Dockerfile` y MUST estar definido como servicio en `docker-compose.prod.yml`.

#### Scenario: Build de imagen del bot

- GIVEN el `bot/Dockerfile` existe y está correctamente configurado
- WHEN se ejecuta `docker build` en el directorio bot
- THEN la imagen se construye sin errores con todas las dependencias incluidas

#### Scenario: Bot disponible en docker-compose.prod.yml

- GIVEN `docker-compose.prod.yml` incluye el servicio `nexo-bot`
- WHEN se ejecuta `docker-compose up`
- THEN el contenedor del bot inicia y conecta con WhatsApp Business API
