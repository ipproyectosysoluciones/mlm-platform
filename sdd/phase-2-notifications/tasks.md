# Tasks: Phase 2 - Email & SMS Notifications

## Implementation Checklist

### Phase 1: Infrastructure Setup

- [ ] **T2.1.1** Install dependencies: `@sendgrid/mail`, `twilio`, `node-cron`
- [ ] **T2.1.2** Add environment variables to `.env.example`
- [ ] **T2.1.3** Create `EmailService.ts` in `/services/`
- [ ] **T2.1.4** Create `SMSService.ts` in `/services/`
- [ ] **T2.1.5** Create `NotificationService.ts` in `/services/`
- [ ] **T2.1.6** Update User model with `notificationPreferences` field

### Phase 2: Email Templates

- [ ] **T2.2.1** Create `/templates/email/welcome.ts`
- [ ] **T2.2.2** Create `/templates/email/commission.ts`
- [ ] **T2.2.3** Create `/templates/email/downline.ts`
- [ ] **T2.2.4** Create `/templates/email/passwordReset.ts`
- [ ] **T2.2.5** Create `/templates/email/weeklyDigest.ts`
- [ ] **T2.2.6** Create `/templates/sms/verification.ts`

### Phase 3: Email Integration

- [ ] **T2.3.1** Integrate welcome email in `AuthController.register()`
- [ ] **T2.3.2** Integrate commission email in `CommissionService`
- [ ] **T2.3.3** Integrate downline email in `AuthController.register()`
- [ ] **T2.3.4** Add password reset endpoint and email template
- [ ] **T2.3.5** Create weekly digest cron job

### Phase 4: SMS & 2FA

- [ ] **T2.4.1** Add `2faEnabled`, `2faPhone` fields to User model
- [ ] **T2.4.2** Create `NotificationController.ts` with preferences endpoints
- [ ] **T2.4.3** Add `/api/users/me/notifications` route
- [ ] **T2.4.4** Add `/api/users/me/2fa/enable` endpoint
- [ ] **T2.4.5** Add `/api/users/me/2fa/verify` endpoint
- [ ] **T2.4.6** Add `/api/users/me/2fa/disable` endpoint
- [ ] **T2.4.7** Update login flow to check 2FA requirement
- [ ] **T2.4.8** Add `/api/auth/2fa/verify` for login verification

### Phase 5: Testing

- [ ] **T2.5.1** Write unit tests for `EmailService`
- [ ] **T2.5.2** Write unit tests for `SMSService`
- [ ] **T2.5.3** Write unit tests for `NotificationService`
- [ ] **T2.5.4** Write integration tests for notification preferences API
- [ ] **T2.5.5** Write integration tests for 2FA flow
- [ ] **T2.5.6** Run all tests and fix failures

### Phase 6: Documentation

- [ ] **T2.6.1** Update `SPEC.md` with notification endpoints
- [ ] **T2.6.2** Update `docs/API.md` with new endpoints
- [ ] **T2.6.3** Add JSDoc comments (bilingual ES/EN) to all new files
- [ ] **T2.6.4** Update `.env.example` with notification variables

---

## Detailed Task Descriptions

### T2.1.1: Install Dependencies

```bash
cd backend
pnpm add @sendgrid/mail twilio node-cron
pnpm add -D @types/node-cron
```

**Verification**: `pnpm list | grep -E "sendgrid|twilio|node-cron"`

---

### T2.1.3: Create EmailService

**File**: `src/services/EmailService.ts`

**Methods**:

- `send(to, subject, html)` - Core send method
- `sendWelcome(data)` - Welcome email
- `sendCommission(data)` - Commission earned email
- `sendDownline(data)` - Downline registration email
- `sendPasswordReset(data)` - Password reset email
- `sendWeeklyDigest(data)` - Weekly digest email

**Error Handling**:

- Log errors, don't throw
- Return boolean for success/failure

---

### T2.1.4: Create SMSService

**File**: `src/services/SMSService.ts`

**Methods**:

- `sendVerificationCode(phone)` - Send 2FA code
- `verifyCode(phone, code)` - Verify entered code
- `isInitialized()` - Check if Twilio configured

**Validation**:

- Phone must be in E.164 format
- Rate limit: 5 codes per phone per hour

---

### T2.2.1-5: Create Email Templates

**Directory**: `src/templates/email/`

Each template:

- Returns HTML string
- Uses responsive email design
- Includes inline CSS
- Supports dark mode (optional)

---

### T2.3.1: Integrate Welcome Email

**Location**: `src/controllers/AuthController.ts`

```typescript
// After successful user creation
await notificationService.sendWelcomeEmail(user);
```

---

### T2.3.2: Integrate Commission Email

**Location**: `src/services/CommissionService.ts`

```typescript
// After commission calculation
await notificationService.sendCommissionEmail({
  userId: userId,
  amount: commissionAmount,
  currency: 'USD',
  type: 'direct',
  percentage: 10,
  purchaseId: purchase.id,
  pendingBalance: await getPendingBalance(userId),
});
```

---

### T2.4.2: Create NotificationController

**File**: `src/controllers/NotificationController.ts`

**Endpoints**:

```typescript
// GET /api/users/me/notifications
export async function getNotificationPreferences(req, res) { ... }

// PATCH /api/users/me/notifications
export async function updateNotificationPreferences(req, res) { ... }

// POST /api/users/me/2fa/enable
export async function enable2FA(req, res) { ... }

// POST /api/users/me/2fa/verify
export async function verify2FA(req, res) { ... }

// POST /api/users/me/2fa/disable
export async function disable2FA(req, res) { ... }
```

---

### T2.5: Testing Requirements

**Test Coverage Targets**:

- `EmailService`: 90%+
- `SMSService`: 90%+
- `NotificationService`: 80%+

**Integration Tests**:

- Registration → welcome email queued
- Commission creation → commission email queued
- 2FA enable → SMS sent
- Login with 2FA → token returned after code verify

---

## Time Estimates

| Phase     | Tasks             | Hours   |
| --------- | ----------------- | ------- |
| 1         | Infrastructure    | 3h      |
| 2         | Email Templates   | 3h      |
| 3         | Email Integration | 3h      |
| 4         | SMS & 2FA         | 6h      |
| 5         | Testing           | 5h      |
| 6         | Documentation     | 2h      |
| **Total** |                   | **22h** |

---

## Dependencies

- SendGrid API key (user provides)
- Twilio credentials (user provides)

---

## Risks & Mitigations

| Risk               | Mitigation                   |
| ------------------ | ---------------------------- |
| Email goes to spam | Set up SPF/DKIM/DMARC        |
| SMS delivery delay | Retry logic, fallback        |
| 2FA code guessing  | Rate limiting, max attempts  |
| Service outage     | Queue with retry, monitoring |
