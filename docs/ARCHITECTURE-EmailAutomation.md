# ARCHITECTURE: Email Automation (v1.0)

## Technical Design for Implementation — #22

---

## 1. Service Architecture & Boundaries

### EmailCampaignService — Core Service

**Responsibility**: Create, validate, and execute email campaigns with template variable replacement and retry logic.

```typescript
class EmailCampaignService {
  // Campaign management
  async createCampaign(params: CreateCampaignDto): Promise<EmailCampaign>;
  async getCampaign(campaignId: string): Promise<EmailCampaign>;
  async updateCampaign(campaignId: string, updates: any): Promise<EmailCampaign>;

  // Template & variable handling
  async validateTemplate(htmlContent: string): Promise<ValidationResult>;
  async renderTemplate(htmlContent: string, variables: Record<string, string>): Promise<string>;

  // Campaign execution
  async sendCampaign(campaignId: string): Promise<void>;
  async scheduleCampaign(campaignId: string, scheduledFor: Date): Promise<void>;
  async pauseCampaign(campaignId: string): Promise<void>;

  // Retry logic
  async retryFailedEmails(campaignId: string): Promise<number>;
}
```

**Dependencies**:

```
EmailCampaignService
├─ BrevoEmailService (REST API + SMTP fallback)
├─ EmailQueueService (queue management, retry logic)
├─ SchedulerService (async processing)
└─ Database (PostgreSQL)
```

**State Management**:

- **Mutable**: `emailCampaigns`, `emailQueue` (status, retry count)
- **Immutable**: `emailTemplates` (versioning on update)
- **Logging**: `emailCampaignLogs` (audit trail)

**Failure Modes**:
| Failure | Impact | Mitigation |
|---------|--------|-----------|
| Brevo API down | Cannot send via REST | Fallback to SMTP relay |
| SMTP unavailable | Email delivery fails | Queue + retry with exponential backoff |
| Template var injection | Security vulnerability | Allowlist + validation before rendering |
| Race condition on campaign send | Double-send possible | Atomic status check (SELECT ... FOR UPDATE) |

---

## 2. Data Flow Diagrams

### Happy Path: Create & Send Campaign

```
Admin → POST /api/email-campaigns
  ├─ Request: name, emailTemplateId, recipientSegment, scheduledFor (optional)
  ├─ Validation:
  │   ├─ emailTemplateId exists ✓
  │   ├─ recipientSegment valid ✓
  │   └─ scheduledFor in future (if set) ✓
  ├─ INSERT into email_campaigns (status='draft')
  └─ Response 201

Admin → POST /api/email-campaigns/{id}/send
  ├─ Fetch campaign (SELECT ... FOR UPDATE to lock)
  ├─ Check status != 'sending' ✓
  ├─ GET recipients by segment
  ├─ FOR EACH recipient:
  │   ├─ Fetch user (firstName, email, etc.)
  │   ├─ Render template HTML with variables
  │   ├─ INSERT into campaign_recipients (status='pending')
  │   ├─ INSERT into email_queue (status='pending')
  │   └─ Count: +1 queued
  ├─ UPDATE email_campaigns SET status='sending', started_at=NOW()
  ├─ Response 200
  │   {
  │     "campaignId": "uuid",
  │     "status": "sending",
  │     "queuedCount": 5234,
  │     "message": "5234 emails queued for delivery"
  │   }
  └─ Meanwhile: SchedulerService picks up queue items

Timeline: <2 seconds for 5000 recipients (batch INSERT)
```

### Template Variable Validation Flow

```
Admin enters: "Hi {{firstName}}, your code is {{discountCode}}"
  ↓
Frontend calls validateTemplate()
  ├─ Regex: /\{\{(\w+)\}\}/g
  ├─ Find: ["firstName", "discountCode"]
  ├─ Check allowlist: ALLOWED = ["firstName", "lastName", "email", "referralCode", "discountCode", "expiresAt"]
  ├─ "firstName" ✓ allowed
  ├─ "discountCode" ✓ allowed
  └─ Response 200: { valid: true, variablesUsed: [...] }

Admin enters: "Hi {{firstName}}, your {{unknownVariable}}"
  ↓
Frontend calls validateTemplate()
  ├─ Find: ["firstName", "unknownVariable"]
  ├─ Check: "unknownVariable" NOT in allowlist ✗
  └─ Response 400: { valid: false, error: "Unknown variable: unknownVariable", allowed: [...] }
```

### Queue Processing with Exponential Backoff

```
SchedulerService.emailQueueJob() runs every 1 minute
  ├─ Query: SELECT * FROM email_queue WHERE status IN ('pending', 'deferred') LIMIT 100
  ├─ For each queue item:
  │   ├─ Try send via Brevo REST API
  │   │   ├─ POST https://api.brevo.com/v3/smtp/email
  │   │   ├─ Success: status='sent', brevo_message_id=response.id
  │   │   └─ Response logged
  │   │
  │   └─ On failure:
  │       ├─ retryCount++
  │       ├─ IF retryCount >= 5: status='failed', log final error
  │       ├─ ELSE: Calculate backoff
  │       │   ├─ 1st retry: 1 second → nextRetryAt = NOW() + 1s
  │       │   ├─ 2nd retry: 2 seconds → nextRetryAt = NOW() + 2s
  │       │   ├─ 3rd retry: 4 seconds
  │       │   ├─ 4th retry: 8 seconds
  │       │   ├─ 5th retry: 16 seconds
  │       │   └─ backoff = 2^(retryCount-1) seconds
  │       ├─ status='deferred'
  │       └─ Log: email_campaign_logs (event='deferred', details={retryCount, nextRetryAt})
  │
  ├─ Update campaign summary:
  │   ├─ sentCount++
  │   ├─ failedCount++
  │   └─ deferredCount=COUNT(status='deferred')
  │
  └─ Repeat every 1 minute until queue empty

Expected throughput: ~100 emails/minute (1-2 sec latency per email via Brevo)
```

### SMTP Fallback Trigger

```
Primary: Brevo REST API
  ├─ Timeout > 5 seconds → Fallback to SMTP
  ├─ HTTP 5xx error → Fallback to SMTP
  ├─ Circuit breaker: >10 consecutive failures → Switch to SMTP
  └─ Rate limit (429) → Exponential backoff, then try SMTP

Fallback: SMTP Relay
  ├─ Host: smtp-relay.brevo.com
  ├─ Port: 587 (TLS)
  ├─ Auth: BREVO_SMTP_USER / BREVO_SMTP_PASSWORD
  ├─ Send via nodemailer
  └─ Slower but reliable (fallback to fallback: local sendmail)
```

---

## 3. State Machines

### Campaign Lifecycle

```
        ┌─────────┐
        │ DRAFT   │ (Being composed)
        └────┬────┘
             │
             ├─→ (Save template)
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐   ┌──────────┐
│SCHEDULED │   │SENDING   │ (Active dispatch)
│(wait for │   │(emails   │
│time)     │   │queued)   │
└─┬────────┘   └─┬────────┘
  │             │
  │    (cron)   ├─→ PROCESSING (emails being sent)
  │             │
  └─────┐       ├─→ COMPLETED (all sent)
        ↓       │
        ┌───────┴─────┐
        ↓             ↓
    ┌──────────┐ ┌──────────┐
    │ PAUSED   │ │ FAILED   │
    │ (stopped)│ │ (errors) │
    └──────────┘ └──────────┘
```

**Transitions**:

- `DRAFT` → `SCHEDULED` (when scheduled future send)
- `DRAFT` → `SENDING` (when send now clicked)
- `SCHEDULED` → `SENDING` (when scheduled time arrives)
- `SENDING` → `COMPLETED` (when queue empty & all processed)
- `SENDING` → `PAUSED` (when manually paused)
- `SENDING` → `FAILED` (when >50% of recipients failed)

**Properties**:

- Cannot edit campaign after SENDING starts
- Pause stops new emails but doesn't retry already queued
- Completed campaigns archived after 90 days

---

## 4. Database Schema & Indexing

### Tables

```sql
-- Email templates (WYSIWYG builder output)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL, -- Raw HTML from TinyMCE
  wysiwyg_state JSONB DEFAULT '{}', -- Builder state for re-editing
  variables_used TEXT[] DEFAULT '{}', -- ["firstName", "discountCode"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_email_templates_created_by ON email_templates(created_by_user_id, created_at);

-- Email campaigns
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  email_template_id UUID NOT NULL REFERENCES email_templates(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed')),

  -- Scheduling
  scheduled_for TIMESTAMP NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  -- Targeting
  recipient_segment VARCHAR(100), -- "all_users", "high_value", segment_id
  recipient_count INT DEFAULT 0,

  -- Stats (denormalized for dashboard)
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  deferred_count INT DEFAULT 0,
  bounce_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_for) WHERE status = 'scheduled';

-- Campaign recipients (who is receiving this campaign)
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  email_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'deferred')),

  -- Tracking
  opened_at TIMESTAMP NULL,
  first_click_at TIMESTAMP NULL,
  click_count INT DEFAULT 0,
  sent_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id, status);

-- Email queue (transactional, cleared after sent)
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id),
  campaign_recipient_id UUID NOT NULL REFERENCES campaign_recipients(id),
  user_id UUID NOT NULL REFERENCES users(id),
  email_address VARCHAR(255) NOT NULL,

  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL, -- Rendered with variables replaced

  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'deferred')),

  -- Retry tracking
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMP NULL,
  last_error TEXT NULL,

  -- Brevo tracking
  brevo_message_id VARCHAR(100) NULL,
  brevo_response JSONB DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL
);

CREATE INDEX idx_email_queue_status_retry ON email_queue(status, next_retry_at)
  WHERE status IN ('pending', 'deferred');
CREATE INDEX idx_email_queue_campaign ON email_queue(campaign_id);

-- Audit log
CREATE TABLE email_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id),
  campaign_recipient_id UUID REFERENCES campaign_recipients(id),
  event_type VARCHAR(50), -- created | sent | failed | bounced | opened | clicked | paused | completed
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_campaign_logs_campaign ON email_campaign_logs(campaign_id, event_type);
```

---

## 5. Service Layer Implementation

### EmailCampaignService

```typescript
class EmailCampaignService {
  async validateTemplate(htmlContent: string): Promise<ValidationResult> {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const allowed = ['firstName', 'lastName', 'email', 'referralCode', 'discountCode', 'expiresAt'];
    const found = new Set<string>();
    let match;

    while ((match = variableRegex.exec(htmlContent))) {
      const varName = match[1];
      if (!allowed.includes(varName)) {
        return {
          valid: false,
          error: `Unknown variable: {{${varName}}}`,
          allowed,
        };
      }
      found.add(varName);
    }

    return { valid: true, variablesUsed: Array.from(found) };
  }

  /**
   * Renderiza template con variables (ES)
   * Renders template with variables (EN)
   */
  async renderTemplate(htmlContent: string, variables: Record<string, string>): Promise<string> {
    let rendered = htmlContent;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (rendered.includes(placeholder)) {
        // Escape HTML to prevent injection
        const escaped = escapeHtml(String(value));
        rendered = rendered.replace(new RegExp(placeholder, 'g'), escaped);
      }
    });

    return rendered;
  }

  async sendCampaign(campaignId: string): Promise<void> {
    // Lock campaign (prevent concurrent sends)
    const campaign = await db.query(
      `
      SELECT * FROM email_campaigns WHERE id = $1 FOR UPDATE
    `,
      [campaignId]
    );

    if (campaign.status === 'sending') {
      throw new Error('Campaign already sending');
    }

    // Get recipients
    const recipients = await this.getRecipientsBySegment(campaign.recipient_segment);

    // Get template
    const template = await db.query(
      `
      SELECT * FROM email_templates WHERE id = $1
    `,
      [campaign.email_template_id]
    );

    // Queue all emails (batch INSERT)
    const queueItems = recipients.map((recipient) => [
      campaignId,
      recipient.campaign_recipient_id,
      recipient.user_id,
      recipient.email,
      template.subject_line,
      this.renderTemplate(template.html_content, {
        firstName: recipient.first_name,
        lastName: recipient.last_name,
        email: recipient.email,
        referralCode: recipient.referral_code,
        discountCode: campaign.discount_code,
        expiresAt: campaign.discount_expires_at,
      }),
    ]);

    // Batch insert
    await db.query(
      `
      INSERT INTO email_queue 
      (campaign_id, campaign_recipient_id, user_id, email_address, subject_line, html_content)
      VALUES ${queueItems.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(',')}
    `,
      queueItems.flat()
    );

    // Update campaign
    await db.query(
      `
      UPDATE email_campaigns SET status = 'sending', started_at = NOW()
      WHERE id = $1
    `,
      [campaignId]
    );
  }
}
```

### BrevoEmailService

```typescript
class BrevoEmailService {
  private apiKey: string;
  private circuitBreaker = { failures: 0, threshold: 10, fallbackToSMTP: false };

  async sendEmail(params: {
    to: string;
    subject: string;
    htmlContent: string;
  }): Promise<{ messageId: string }> {
    try {
      if (this.circuitBreaker.fallbackToSMTP) {
        return this.sendViaSMTP(params);
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': this.apiKey },
        body: JSON.stringify({
          to: [{ email: params.to }],
          sender: { email: 'noreply@mlm.com', name: 'MLM Platform' },
          subject: params.subject,
          htmlContent: params.htmlContent,
        }),
        timeout: 5000, // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Brevo: ${response.statusText}`);
      }

      const data = await response.json();
      this.circuitBreaker.failures = 0; // Reset on success
      return { messageId: data.messageId };
    } catch (error) {
      this.circuitBreaker.failures++;
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.fallbackToSMTP = true;
      }

      // Fallback to SMTP
      return this.sendViaSMTP(params);
    }
  }

  private async sendViaSMTP(params: any): Promise<{ messageId: string }> {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: 'noreply@mlm.com',
      to: params.to,
      subject: params.subject,
      html: params.htmlContent,
    });

    return { messageId: info.messageId };
  }
}
```

---

## 6. Frontend — Email Builder (WYSIWYG)

### Component Structure

```typescript
export const EmailBuilder: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [isWysiwyg, setIsWysiwyg] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef<any>();

  const handleVariableInsert = (variable: string) => {
    const editor = tinymce.get('email-editor');
    editor?.insertContent(`{{${variable}}}`);
  };

  const handleSave = async () => {
    const html = tinymce.get('email-editor')?.getContent() || '';

    // Validate
    const validation = await emailAPI.validateTemplate(html);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Save
    await emailAPI.updateCampaign(campaignId, { htmlContent: html });
    toast.success('Saved');
  };

  return (
    <div className="email-builder">
      <div className="toolbar">
        <button onClick={() => setIsWysiwyg(!isWysiwyg)}>
          {isWysiwyg ? 'Edit HTML' : 'WYSIWYG'}
        </button>

        <VariablePicker allowed={['firstName', 'lastName', 'discountCode', 'expiresAt']}
          onSelect={handleVariableInsert} />

        <button onClick={handleSave}>Save</button>
      </div>

      {isWysiwyg ? (
        <TinyMCEEditor editorRef={editorRef} />
      ) : (
        <CodeEditor value={htmlContent} onChange={setHtmlContent} />
      )}

      <PreviewPane html={htmlContent} />
    </div>
  );
};
```

---

## 7. Testing Strategy

### Unit Tests

```typescript
describe('EmailCampaignService', () => {
  describe('validateTemplate', () => {
    it('should accept allowed variables', async () => {
      const html = 'Hi {{firstName}}, code: {{discountCode}}';
      const result = await service.validateTemplate(html);
      expect(result.valid).toBe(true);
      expect(result.variablesUsed).toEqual(['firstName', 'discountCode']);
    });

    it('should reject unknown variables', async () => {
      const html = 'Hi {{firstName}}, {{unknownVar}}';
      const result = await service.validateTemplate(html);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unknownVar');
    });
  });

  describe('renderTemplate', () => {
    it('should escape HTML in variable values', async () => {
      const html = 'Hi {{firstName}}';
      const variables = { firstName: '<script>alert(1)</script>' };
      const result = await service.renderTemplate(html, variables);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });
});
```

### Integration Tests

```typescript
describe('Email Campaign E2E', () => {
  it('should create, send, and track campaign', async () => {
    // 1. Create template
    const template = await createTemplate({
      name: 'Test',
      subjectLine: 'Hi {{firstName}}',
      htmlContent: '<p>Welcome</p>',
    });

    // 2. Create campaign
    const campaign = await createCampaign({
      name: 'Test Campaign',
      emailTemplateId: template.id,
      recipientSegment: 'all_users',
    });

    // 3. Send
    await emailAPI.sendCampaign(campaign.id);

    // 4. Verify queue
    const queue = await db.query(`SELECT COUNT(*) FROM email_queue WHERE campaign_id = $1`, [
      campaign.id,
    ]);
    expect(queue[0].count).toBeGreaterThan(0);

    // 5. Process queue
    await emailQueueService.processPendingEmails();

    // 6. Verify sent
    const sent = await db.query(
      `SELECT COUNT(*) FROM email_queue WHERE campaign_id = $1 AND status = 'sent'`,
      [campaign.id]
    );
    expect(sent[0].count).toBeGreaterThan(0);
  });
});
```

---

## 8. Deployment & Monitoring

### Environment Variables

```env
BREVO_API_KEY=your-key
BREVO_SMTP_USER=user
BREVO_SMTP_PASSWORD=pass
EMAIL_BATCH_SIZE=100
EMAIL_SCHEDULER_INTERVAL_MINUTES=1
EMAIL_MAX_RETRIES=5
BACKOFF_BASE_SECONDS=1
```

### Monitoring

```yaml
Key Metrics:
  - Delivery rate (target: >98%)
  - P99 email latency (target: <1s)
  - Queue backlog (target: <1000)
  - Brevo API success rate (target: >99%)
  - SMTP fallback usage (target: <5%)

Alerts:
  - Delivery rate < 95%
  - Queue backlog > 10,000
  - Brevo API failures (circuit breaker triggered)
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-04  
**Status**: Draft for Implementation
