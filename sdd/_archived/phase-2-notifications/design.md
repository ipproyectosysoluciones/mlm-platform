# Design: Phase 2 - Email & SMS Notifications

## Architecture Overview / Visión General de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐              │
│  │   EMAIL MODULE   │         │   SMS MODULE     │              │
│  │                  │         │                  │              │
│  │  ┌───────────┐  │         │  ┌───────────┐  │              │
│  │  │EmailService│  │         │  │ SMSService │  │              │
│  │  └───────────┘  │         │  └───────────┘  │              │
│  │         │        │         │         │        │              │
│  │         ▼        │         │         ▼        │              │
│  │  ┌───────────┐  │         │  ┌───────────┐  │              │
│  │  │  Templates │  │         │  │  2FA Flow │  │              │
│  │  └───────────┘  │         │  └───────────┘  │              │
│  └────────┬────────┘         └────────┬────────┘              │
│           │                             │                        │
│           ▼                             ▼                        │
│  ┌─────────────────────────────────────────────────┐            │
│  │              NOTIFICATION QUEUE                   │            │
│  │         (In-memory / Redis optional)              │            │
│  └──────────────────────┬──────────────────────────┘            │
│                         │                                          │
│           ┌─────────────┴─────────────┐                          │
│           ▼                           ▼                          │
│  ┌─────────────────┐       ┌─────────────────┐                 │
│  │   SENDGRID      │       │    TWILIO       │                 │
│  │   SMTP API      │       │    REST API     │                 │
│  └─────────────────┘       └─────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure / Estructura de Directorios

```
backend/src/
├── services/
│   ├── EmailService.ts        # SendGrid integration
│   ├── SMSService.ts          # Twilio integration
│   └── NotificationService.ts # Orchestrator
├── templates/
│   ├── email/
│   │   ├── welcome.ts         # Welcome email template
│   │   ├── commission.ts      # Commission earned template
│   │   ├── downline.ts        # Downline registration template
│   │   ├── passwordReset.ts  # Password reset template
│   │   └── weeklyDigest.ts   # Weekly digest template
│   └── sms/
│       └── verification.ts     # 2FA verification template
├── queue/
│   └── NotificationQueue.ts   # Simple queue implementation
├── routes/
│   ├── notification.routes.ts # Notification preferences API
│   └── auth.routes.ts         # Updated with 2FA endpoints
├── controllers/
│   ├── NotificationController.ts
│   └── AuthController.ts      # Updated with 2FA
├── middleware/
│   └── auth.middleware.ts     # Updated with 2FA validation
└── jobs/
    └── weeklyDigest.job.ts     # Cron job for weekly digest
```

---

## Service Implementations / Implementaciones de Servicios

### EmailService / Servicio de Email

```typescript
// src/services/EmailService.ts

/**
 * EmailService - SendGrid email delivery
 * EmailService - Envío de emails via SendGrid
 */

import sgMail from '@sendgrid/mail';
import { config } from '../config/env';
import { welcomeTemplate } from '../templates/email/welcome';
import { commissionTemplate } from '../templates/email/commission';
import { downlineTemplate } from '../templates/email/downline';
import { passwordResetTemplate } from '../templates/email/passwordReset';
import { weeklyDigestTemplate } from '../templates/email/weeklyDigest';

export class EmailService {
  private initialized = false;

  constructor() {
    if (config.sendgridApiKey) {
      sgMail.setApiKey(config.sendgridApiKey);
      this.initialized = true;
    }
  }

  /**
   * Send an email
   * Envía un email
   */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping send');
      return false;
    }

    try {
      await sgMail.send({
        to,
        from: {
          email: config.sendgridFromEmail,
          name: config.sendgridFromName,
        },
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   * Envía email de bienvenida
   */
  async sendWelcome(data: {
    email: string;
    firstName: string;
    referralCode: string;
    referralLink: string;
  }): Promise<boolean> {
    const { email, firstName, referralCode, referralLink } = data;
    const html = welcomeTemplate({ firstName, referralCode, referralLink });
    return this.send(email, 'Bienvenido a MLM Platform', html);
  }

  /**
   * Send commission earned notification
   * Envía notificación de comisión ganada
   */
  async sendCommission(data: {
    email: string;
    firstName: string;
    amount: number;
    currency: string;
    type: string;
    percentage: number;
    purchaseId: string;
    pendingBalance: number;
  }): Promise<boolean> {
    const { email, ...templateData } = data;
    const html = commissionTemplate(templateData);
    const subject = `💰 Nueva comisión ganada: $${data.amount} ${data.currency}`;
    return this.send(email, subject, html);
  }

  // ... other methods for downline, password reset, weekly digest
}

export const emailService = new EmailService();
```

### SMSService / Servicio de SMS

```typescript
// src/services/SMSService.ts

/**
 * SMSService - Twilio SMS delivery
 * SMSService - Envío de SMS via Twilio
 */

import twilio from 'twilio';
import { config } from '../config/env';
import { verificationTemplate } from '../templates/sms/verification';

interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory store (use Redis in production)
const verificationCodes = new Map<string, VerificationCode>();

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

export class SMSService {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      this.client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    }
  }

  /**
   * Send verification code
   * Envía código de verificación
   */
  async sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      console.warn('SMS service not initialized');
      return { success: false, error: 'SMS service not configured' };
    }

    const code = Math.random().toString().slice(2, 8);
    const message = verificationTemplate({ code });

    try {
      await this.client.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to: phone,
      });

      // Store code with expiry
      verificationCodes.set(phone, {
        code,
        expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
      });

      return { success: true };
    } catch (error: any) {
      console.error('SMS send failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify code
   * Verifica código
   */
  verifyCode(phone: string, code: string): { valid: boolean; error?: string } {
    const stored = verificationCodes.get(phone);

    if (!stored) {
      return { valid: false, error: 'No verification code found' };
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(phone);
      return { valid: false, error: 'Code expired' };
    }

    if (stored.attempts >= MAX_ATTEMPTS) {
      verificationCodes.delete(phone);
      return { valid: false, error: 'Max attempts exceeded' };
    }

    if (stored.code !== code) {
      stored.attempts++;
      verificationCodes.set(phone, stored);
      return { valid: false, error: 'Invalid code' };
    }

    verificationCodes.delete(phone);
    return { valid: true };
  }
}

export const smsService = new SMSService();
```

### NotificationService / Servicio de Notificaciones

```typescript
// src/services/NotificationService.ts

/**
 * NotificationService - Orchestrates all notifications
 * NotificationService - Orquestra todas las notificaciones
 */

import { emailService } from './EmailService';
import { smsService } from './SMSService';
import { User } from '../models';
import { config } from '../config/env';

export class NotificationService {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    if (!user.notificationPreferences?.emailNotifications) return;

    await emailService.sendWelcome({
      email: user.email,
      firstName: this.getFirstName(user.email),
      referralCode: user.referralCode,
      referralLink: `${config.frontendUrl}/register?ref=${user.referralCode}`,
    });
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionEmail(data: {
    userId: string;
    amount: number;
    currency: string;
    type: string;
    percentage: number;
    purchaseId: string;
    pendingBalance: number;
  }): Promise<void> {
    const user = await User.findByPk(data.userId);
    if (!user || !user.notificationPreferences?.emailNotifications) return;

    await emailService.sendCommission({
      email: user.email,
      firstName: this.getFirstName(user.email),
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      percentage: data.percentage,
      purchaseId: data.purchaseId,
      pendingBalance: data.pendingBalance,
    });
  }

  /**
   * Send downline registration notification to sponsor
   */
  async sendDownlineEmail(sponsorId: string, newUser: User): Promise<void> {
    const sponsor = await User.findByPk(sponsorId);
    if (!sponsor || !sponsor.notificationPreferences?.emailNotifications) return;

    await emailService.sendDownline({
      email: sponsor.email,
      firstName: this.getFirstName(sponsor.email),
      newUserEmail: newUser.email,
      registrationDate: new Date().toISOString(),
      position: newUser.position,
      totalReferrals: await User.count({ where: { sponsorId } }),
    });
  }

  /**
   * Send 2FA verification code
   */
  async send2FACode(phone: string): Promise<{ success: boolean; error?: string }> {
    return smsService.sendVerificationCode(phone);
  }

  private getFirstName(email: string): string {
    return email.split('@')[0];
  }
}

export const notificationService = new NotificationService();
```

---

## Email Templates / Plantillas de Email

```typescript
// src/templates/email/welcome.ts

/**
 * Welcome email template
 * Plantilla de email de bienvenida
 */

interface WelcomeData {
  firstName: string;
  referralCode: string;
  referralLink: string;
}

export function welcomeTemplate(data: WelcomeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .code { background: #e5e7eb; padding: 10px 20px; font-family: monospace; font-size: 18px; }
        .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ¡Bienvenido!</h1>
        </div>
        <div class="content">
          <p>Hola ${data.firstName},</p>
          <p>¡Bienvenido a <strong>MLM Platform</strong>! Tu cuenta ha sido creada exitosamente.</p>
          
          <p><strong>📊 Tu código de afiliado:</strong></p>
          <div class="code">${data.referralCode}</div>
          
          <p style="margin-top: 20px;"><strong>🔗 Tu enlace de registro:</strong></p>
          <p><a href="${data.referralLink}">${data.referralLink}</a></p>
          
          <p style="margin-top: 20px;"><strong>Próximos pasos:</strong></p>
          <ol>
            <li>Explora tu dashboard</li>
            <li>Comparte tu código con amigos</li>
            <li>¡Empieza a construir tu red!</li>
          </ol>
        </div>
        <div class="footer">
          <p>El equipo de MLM Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

---

## API Routes / Rutas de API

### Notification Routes

```typescript
// src/routes/notification.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  enable2FA,
  verify2FA,
  disable2FA,
} from '../controllers/NotificationController';

const router = Router();

router.use(authenticateToken);

// Get notification preferences
router.get('/', asyncHandler(getNotificationPreferences));

// Update notification preferences
router.patch('/', asyncHandler(updateNotificationPreferences));

// 2FA management
router.post('/2fa/enable', asyncHandler(enable2FA));
router.post('/2fa/verify', asyncHandler(verify2FA));
router.post('/2fa/disable', asyncHandler(disable2FA));

export default router;
```

### Updated Auth Routes

```typescript
// POST /api/auth/2fa/verify - Verify 2FA code during login
// POST /api/auth/2fa/resend - Resend verification code
```

---

## Database Changes / Cambios en Base de Datos

### User Model Update

```typescript
// Add to User model

notificationPreferences: {
  type: DataTypes.JSON,
  defaultValue: {
    emailNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    twoFactorPhone: null,
    weeklyDigest: true,
  },
},
```

---

## Environment Variables

```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=noreply@mlm-platform.com
SENDGRID_FROM_NAME=MLM Platform

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# App
FRONTEND_URL=http://localhost:5173
```

---

## Cron Job / Trabajo Programado

```typescript
// src/jobs/weeklyDigest.job.ts

/**
 * Weekly Digest Cron Job
 * Envía resumen semanal cada domingo a las 9:00 AM UTC
 */

import cron from 'node-cron';
import { notificationService } from '../services/NotificationService';
import { User } from '../models';

export function startWeeklyDigestJob(): void {
  // Every Sunday at 9:00 AM UTC
  cron.schedule('0 9 * * 0', async () => {
    console.log('Running weekly digest job...');

    const users = await User.findAll({
      where: {
        status: 'active',
        '$notificationPreferences.weeklyDigest$': true,
      },
    });

    for (const user of users) {
      try {
        // Calculate stats for the week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const stats = await calculateWeeklyStats(user.id, weekStart);

        await notificationService.sendWeeklyDigest({
          email: user.email,
          firstName: user.email.split('@')[0],
          ...stats,
        });
      } catch (error) {
        console.error(`Failed to send weekly digest to ${user.email}:`, error);
      }
    }

    console.log(`Weekly digest sent to ${users.length} users`);
  });
}
```

---

## Error Handling / Manejo de Errores

| Scenario                    | Handling                                   |
| --------------------------- | ------------------------------------------ |
| SendGrid API key invalid    | Log error, skip email sending, admin alert |
| Twilio invalid phone        | Return 400 to user with clear message      |
| Email template render error | Fallback to plain text                     |
| Rate limit exceeded         | Queue and retry with backoff               |
| Service unavailable         | Log, alert, queue for retry                |

---

## Security Considerations / Consideraciones de Seguridad

1. **Phone number validation**: Validate international format
2. **Rate limiting**: Max 5 SMS per phone per hour
3. **Code expiry**: 10-minute TTL for verification codes
4. **Code attempts**: Max 3 attempts per code
5. **HTTPS only**: All notification URLs must use HTTPS
6. **Token security**: Password reset tokens are single-use and time-limited
