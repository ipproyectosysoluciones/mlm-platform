# Delta Spec: Phase 2 - Email & SMS Notifications

## Purpose / Propósito

Este documento especifica los requisitos funcionales para el sistema de notificaciones por email y SMS 2FA.

This document specifies functional requirements for email notifications and SMS 2FA system.

---

## 1. Email Service / Servicio de Email

### 1.1 SendGrid Integration

**Requirements**:

- Use `@sendgrid/mail` SDK
- Support HTML and plain-text emails
- Track delivery status (optional)
- Retry failed sends up to 3 times

**Environment Variables**:

```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@mlm-platform.com
SENDGRID_FROM_NAME=MLM Platform
```

### 1.2 Email Templates / Plantillas de Email

#### 1.2.1 Welcome Email / Email de Bienvenida

**Trigger**: User completes registration

**Subject**: `Bienvenido a MLM Platform - Tu viaje comienza aquí`

**Content**:

```
Hola {firstName},

¡Bienvenido a MLM Platform! 🎉

Tu cuenta ha sido creada exitosamente.

📊 Tu código de afiliado: {referralCode}
🔗 Tu enlace de registro: {referralLink}

Próximos pasos:
1. Explora tu dashboard
2. Comparte tu código con amigos
3. ¡Empieza a construir tu red!

Saludos,
El equipo de MLM Platform
```

**Data Required**:

- `firstName`: User's first name (or email prefix)
- `referralCode`: User's unique referral code
- `referralLink`: Full URL with referral param

#### 1.2.2 Commission Earned / Comisión Ganada

**Trigger**: Commission created for user

**Subject**: `💰 Nueva comisión ganada: ${amount} {currency}`

**Content**:

```
Hola {firstName},

¡Buenas noticias! Has recibido una nueva comisión.

💵 Monto: {amount} {currency}
📊 Tipo: {commissionType} ({percentage}%)
📦 Compra origen: {purchaseId}

Tu saldo pendiente ahora es: {pendingBalance}

¡Sigue así! Sigue creciendo tu red para ganar más comisiones.

Saludos,
El equipo de MLM Platform
```

**Data Required**:

- `firstName`: Distributor's name
- `amount`: Commission amount
- `currency`: Currency code (USD, COP, MXN)
- `commissionType`: direct, level_1, level_2, etc.
- `percentage`: Commission percentage
- `purchaseId`: Purchase that triggered commission
- `pendingBalance`: User's pending commission balance

#### 1.2.3 Downline Registration / Registro de Downline

**Trigger**: New user registers with this user's referral code

**Subject**: `👥 Nuevo miembro en tu red: {newUserEmail}`

**Content**:

```
Hola {firstName},

¡Un nuevo miembro se ha unido a tu red!

📧 Email: {newUserEmail}
📅 Fecha: {registrationDate}
🌳 Posición: {position} ({left/right})

Tu red ahora tiene {totalReferrals} miembros.

¡Sigue invitando para hacer crecer tu negocio!

Saludos,
El equipo de MLM Platform
```

**Data Required**:

- `firstName`: Sponsor's name
- `newUserEmail`: New user's email
- `registrationDate`: Registration date
- `position`: left or right
- `totalReferrals`: Sponsor's total referral count

#### 1.2.4 Password Reset / Recuperar Contraseña

**Trigger**: User requests password reset

**Subject**: `🔐 Restablecer tu contraseña - MLM Platform`

**Content**:

```
Hola {firstName},

Hemos recibido una solicitud para restablecer tu contraseña.

🔗 Haz clic en el siguiente enlace para crear una nueva contraseña:
{resetLink}

Este enlace expira en 1 hora.

Si no solicitaste este cambio, ignora este email.

Saludos,
El equipo de MLM Platform
```

**Data Required**:

- `firstName`: User's name
- `resetLink`: Password reset URL with token

#### 1.2.5 Weekly Digest / Resumen Semanal

**Trigger**: Every Sunday at 9:00 AM (user timezone)

**Subject**: `📈 Tu resumen semanal MLM - Semana del {startDate} al {endDate}`

**Content**:

```
Hola {firstName},

Aquí está tu resumen semanal de MLM Platform:

📊 TU RED
   Nuevos miembros: {newReferrals}
   Total red: {totalReferrals}

💰 COMISIONES
   Ganadas esta semana: {weeklyEarnings} {currency}
   Total ganancias: {totalEarnings} {currency}
   Pendiente: {pendingEarnings} {currency}

🌳 ÁRBOL BINARIO
   Izquierda: {leftCount} miembros
   Derecha: {rightCount} miembros

¡Sigue creciendo tu red!

Saludos,
El equipo de MLM Platform
```

**Data Required**:

- `firstName`: User's name
- `startDate`: Week start date
- `endDate`: Week end date
- `newReferrals`: New referrals this week
- `totalReferrals`: Total referrals
- `weeklyEarnings`: Earnings this week
- `totalEarnings`: Total earnings
- `pendingEarnings`: Pending earnings
- `currency`: Currency
- `leftCount`: Left leg count
- `rightCount`: Right leg count

### 1.3 Email Queue / Cola de Emails

**Requirements**:

- Emails queued for async sending
- Use in-memory queue (Redis optional for MVP)
- Retry failed emails 3 times with exponential backoff
- Log all sent/failed emails

---

## 2. SMS Service / Servicio de SMS

### 2.1 Twilio Integration

**Requirements**:

- Use `twilio` SDK
- Support verification codes
- International phone number support
- Rate limiting: max 5 SMS per user per hour

**Environment Variables**:

```env
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2.2 SMS Templates / Plantillas de SMS

#### 2.2.1 2FA Verification Code / Código de Verificación

**Trigger**: User with 2FA enabled attempts login

**Message**:

```
MLM Platform: Tu código de verificación es {code}. Expira en 10 minutos. No compartas este código con nadie.
```

**Requirements**:

- 6-digit random code
- Expires in 10 minutes
- Stored in Redis/memory with TTL
- Max 3 verification attempts per code

### 2.3 2FA Flow / Flujo 2FA

```
1. User enters email + password
2. Server checks if 2FA enabled for user
3. If enabled → Generate code → Send SMS → Return {requires2FA: true, maskedPhone: "+1****7890"}
4. User enters code
5. Server validates code
6. If valid → Complete login → Return token
```

---

## 3. User Preferences / Preferencias de Usuario

### 3.1 Notification Settings / Configuración de Notificaciones

**New User Model Fields**:

```typescript
interface NotificationPreferences {
  emailNotifications: boolean; // Default: true
  smsNotifications: boolean; // Default: false
  twoFactorEnabled: boolean; // Default: false
  twoFactorPhone: string | null; // Phone number for 2FA
  weeklyDigest: boolean; // Default: true
}
```

### 3.2 API Endpoints / Endpoints de API

#### GET /api/users/me/notifications

Get notification preferences.

**Response**:

```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "smsNotifications": false,
    "twoFactorEnabled": false,
    "twoFactorPhone": null,
    "weeklyDigest": true
  }
}
```

#### PATCH /api/users/me/notifications

Update notification preferences.

**Request**:

```json
{
  "emailNotifications": true,
  "weeklyDigest": false
}
```

#### POST /api/users/me/2fa/enable

Enable 2FA with phone number.

**Request**:

```json
{
  "phone": "+573001234567"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Verification code sent"
}
```

#### POST /api/users/me/2fa/verify

Verify 2FA setup.

**Request**:

```json
{
  "code": "123456"
}
```

#### POST /api/users/me/2fa/disable

Disable 2FA.

**Request**:

```json
{
  "code": "123456"
}
```

#### POST /api/auth/2fa/resend

Resend 2FA verification code.

**Response**:

```json
{
  "success": true,
  "message": "Code resent"
}
```

---

## 4. Notification Triggers / Disparadores de Notificaciones

### 4.1 Commission Created

**Location**: `CommissionService.calculateCommissions()`

**Action**: Send email to user

```typescript
await notificationService.sendCommissionEmail({
  userId: commission.userId,
  amount: commission.amount,
  currency: commission.currency,
  type: commission.type,
  purchaseId: commission.purchaseId,
});
```

### 4.2 User Registered (with sponsor)

**Location**: `AuthController.register()`

**Action**:

1. Send welcome email to new user
2. If has sponsor → Send downline registration email

```typescript
// In register controller
await notificationService.sendWelcomeEmail(newUser);
if (sponsor) {
  await notificationService.sendDownlineEmail(sponsor.id, newUser);
}
```

### 4.3 Password Reset Request

**Location**: `AuthController.forgotPassword()` (new endpoint)

**Action**: Send password reset email with token

### 4.4 Weekly Digest (Cron Job)

**Schedule**: Every Sunday at 9:00 AM UTC

**Action**: Query all users with `weeklyDigest: true` and active in last 7 days → Send digest email

---

## 5. Error Handling / Manejo de Errores

### 5.1 Email Failures

| Error           | Action                              |
| --------------- | ----------------------------------- |
| Invalid API key | Log error, disable notifications    |
| Rate limit      | Queue and retry with backoff        |
| Invalid email   | Log and skip                        |
| Template error  | Log error, send plain text fallback |

### 5.2 SMS Failures

| Error                | Action                         |
| -------------------- | ------------------------------ |
| Invalid phone number | Return 400 error to user       |
| Rate limit exceeded  | Return 429 error               |
| Twilio error         | Log error, retry up to 3 times |
| Network error        | Retry with backoff             |

---

## 6. Testing Requirements / Requisitos de Testing

### 6.1 Unit Tests

- EmailService: Mock SendGrid, test all templates
- SMSService: Mock Twilio, test 2FA flow
- Notification triggers: Test correct calls

### 6.2 Integration Tests

- Create user → Verify welcome email queued
- Create commission → Verify commission email queued
- 2FA enable → Verify SMS sent
- 2FA verify → Verify login completes

### 6.3 Test Coverage

| Component             | Target Coverage |
| --------------------- | --------------- |
| EmailService          | >= 90%          |
| SMSService            | >= 90%          |
| Notification triggers | >= 80%          |

---

## 7. Implementation Priority / Prioridad de Implementación

| Step      | Feature                           | Estimated Time |
| --------- | --------------------------------- | -------------- |
| 1         | SendGrid setup + EmailService     | 2h             |
| 2         | Welcome email integration         | 1h             |
| 3         | Commission email integration      | 1h             |
| 4         | Downline registration email       | 1h             |
| 5         | Password reset email              | 2h             |
| 6         | User notification preferences API | 2h             |
| 7         | Twilio setup + SMSService         | 2h             |
| 8         | 2FA enable/disable flow           | 3h             |
| 9         | 2FA login flow                    | 2h             |
| 10        | Weekly digest (cron)              | 3h             |
| 11        | Tests                             | 4h             |
| **Total** |                                   | **23 hours**   |
