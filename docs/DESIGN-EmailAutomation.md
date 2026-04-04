# DESIGN: Email Automation (v1.0)

## Comprehensive Reference Document — Feature #22

---

## Table of Contents

1. Feature Overview
2. User Stories & Acceptance Criteria
3. Data Model
4. API Specification
5. Email Builder & Templates
6. Brevo Integration
7. Campaign Execution & Scheduling
8. Frontend Components
9. Testing Strategy
10. Deployment & Monitoring

---

## 1. Feature Overview

### Purpose

Enable marketing teams to design, schedule, and send personalized email campaigns using a visual builder. Support template variables, WYSIWYG + HTML modes, and reliable delivery with retry logic.

### Scope

- **v1.0**: WYSIWYG email builder, template variables (allowlist), Brevo REST + SMTP fallback, queue + exponential backoff
- **Future**: Campaign analytics, A/B testing, audience segmentation, dynamic content blocks

### Success Metrics

- Campaign delivery rate: >98%
- Email open rate: >20%
- Click-through rate: >5%
- Time from schedule to delivery: <2 minutes
- Template rendering time: <100ms

---

## 2. User Stories & Acceptance Criteria

### Story 1: Create Email Template with WYSIWYG Builder

```gherkin
As a marketing manager
I want to design email campaigns with drag-drop UI
So I don't need to write HTML

Scenario: Create email in WYSIWYG mode
  Given I'm in Email Campaign builder
  When I click "New Campaign"
  And I drag "Text Block" to canvas
  And I enter text: "Hi {{firstName}}, here's your discount!"
  Then:
    - Template shows: "Hi {{firstName}}, here's your discount!"
    - {{firstName}} recognized as template variable
    - I can add "Button" block with CTA link
    - I can add "Image" block (upload or URL)
  And I see preview pane on right (real-time)

Scenario: Switch to HTML mode
  Given I'm designing in WYSIWYG
  When I click "Edit HTML"
  Then I see raw HTML code
  And I can modify HTML directly
  And preview updates in real-time

Scenario: Validate template variables
  Given I enter text: "Hi {{firstName}}, your discount: {{unknownVariable}}"
  When I click "Validate"
  Then I see error: "Unknown variable: unknownVariable"
  And list of allowed variables:
    - {{firstName}}, {{lastName}}, {{email}}
    - {{referralCode}}, {{discountCode}}, {{expiresAt}}
  And prompt to fix or remove

Scenario: Save as template
  Given I designed a campaign
  When I click "Save as Template"
  And name it: "Weekly Discount Blast"
  Then template saved and reusable
  And appears in "Templates" library
```

### Story 2: Schedule & Send Campaign

```gherkin
As a marketing manager
I want to schedule campaigns to send at optimal times
So emails reach customers when they're most likely to engage

Scenario: Schedule immediate send
  Given I finished designing campaign
  When I click "Send Now"
  And select recipients: "All users" or specific segment
  Then:
    - Email queue created for each recipient
    - Campaign status: "sending"
    - Emails dispatched within 1 minute
    - Progress bar shows % sent

Scenario: Schedule future send
  Given I want to send on specific date/time
  When I click "Schedule"
  And set: "2026-04-10 at 2:00 PM EST"
  And select recipients
  Then:
    - Campaign saved with status: "scheduled"
    - Timestamp set for dispatch
    - At scheduled time, queue created automatically

Scenario: Send to user segment
  Given I want to target "High-Value Customers"
  When I select segment filter
  And preview: "2,345 recipients"
  Then emails only sent to matching users
  And stats show: "2,345 sent, 45 failed"

Scenario: Stop campaign mid-send
  Given campaign is sending
  When I click "Pause Campaign"
  Then:
    - No new emails queued
    - Already-sent: completed
    - Paused emails: discarded or queued for later
```

### Story 3: Track Email Delivery & Analytics

```gherkin
As a marketing manager
I want to see delivery status and engagement metrics
So I can measure campaign effectiveness

Scenario: View campaign progress
  Given campaign is sending
  When I view dashboard
  Then I see:
    - Total recipients: 1,000
    - Sent: 800
    - Failed: 50
    - Pending: 150
    - % delivered: 88%

Scenario: View individual email status
  Given I view campaign details
  When I click "View Logs"
  Then I see table:
    - Recipient email
    - Status: sent | failed | bounced | deferred
    - Sent timestamp
    - Error reason (if failed)
    - Open status (if tracked)
    - Click count (if tracked)

Scenario: Retry failed emails
  Given 50 emails failed
  When I click "Retry Failed"
  Then:
    - Exponential backoff: 1s → 2s → 4s → 8s → 16s
    - Max retries: 5
    - Status updated as they succeed/fail
```

### Story 4: Admin View — Campaign Dashboard

```gherkin
As an admin
I want to manage all campaigns
So I can monitor email activity

Scenario: View all campaigns
  Given I'm in Email Admin dashboard
  When I view "Active Campaigns" tab
  Then I see list:
    - Campaign name, sender, created date
    - Status: draft | scheduled | sending | completed | paused
    - Recipients count
    - Delivery rate
    - Open rate, CTR
    - Created by (admin name)

Scenario: View campaign details
  Given I click on a campaign
  When details panel opens
  Then I see:
    - Email preview (HTML)
    - Template variables used
    - Recipient list
    - Delivery timeline (graph)
    - Error summary (top failures)
    - Audit log (all actions)
```

---

## 3. Data Model

### Core Tables

#### email_templates

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL, -- Raw HTML from WYSIWYG builder
  wysiwyg_state JSONB DEFAULT '{}', -- Builder state for re-editing

  variables_used TEXT[] DEFAULT '{}', -- Array of {{var}} used

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL, -- Soft delete

  metadata JSONB DEFAULT '{}', -- tags, category, version

  CONSTRAINT name_not_empty CHECK (name != '')
);

CREATE INDEX idx_email_templates_created_by ON email_templates(created_by_user_id, created_at);
```

#### email_campaigns

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  email_template_id UUID NOT NULL REFERENCES email_templates(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft | scheduled | sending | completed | paused | failed

  -- Scheduling
  scheduled_for TIMESTAMP NULL, -- When to send (NULL = send now)
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  -- Recipient targeting
  recipient_segment VARCHAR(100), -- "all_users", "high_value", custom segment ID
  recipient_count INT DEFAULT 0,

  -- Delivery tracking
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  deferred_count INT DEFAULT 0,
  bounce_count INT DEFAULT 0,

  -- Engagement tracking (if enabled)
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  unsubscribe_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  metadata JSONB DEFAULT '{}', -- utm params, A/B test info

  CONSTRAINT status_valid CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed')),
  CONSTRAINT counts_non_negative CHECK (sent_count >= 0 AND failed_count >= 0)
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by_user_id, created_at);
```

#### campaign_recipients

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  email_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending | sent | failed | bounced | deferred | unsubscribed

  -- Tracking
  opened_at TIMESTAMP NULL,
  first_click_at TIMESTAMP NULL,
  click_count INT DEFAULT 0,

  -- Retry tracking
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP NULL,
  error_reason TEXT NULL,

  sent_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}' -- personalization data, UTM params
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id, status);
CREATE INDEX idx_campaign_recipients_user ON campaign_recipients(user_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status) WHERE status IN ('pending', 'failed');
```

#### email_queue

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id),
  campaign_recipient_id UUID NOT NULL REFERENCES campaign_recipients(id),
  user_id UUID NOT NULL REFERENCES users(id),
  email_address VARCHAR(255) NOT NULL,

  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL, -- Rendered with variables replaced

  status VARCHAR(20) DEFAULT 'pending', -- pending | processing | sent | failed | deferred

  -- Retry logic
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMP NULL,
  last_error TEXT NULL,

  -- Brevo tracking
  brevo_message_id VARCHAR(100) NULL,
  brevo_response JSONB DEFAULT NULL, -- Full Brevo response

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_email_queue_status_retry ON email_queue(status, next_retry_at)
  WHERE status IN ('pending', 'failed', 'deferred');
CREATE INDEX idx_email_queue_campaign ON email_queue(campaign_id);
```

#### email_campaign_logs

```sql
CREATE TABLE email_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id),
  campaign_recipient_id UUID REFERENCES campaign_recipients(id),

  event_type VARCHAR(50), -- created | sent | failed | bounced | opened | clicked | unsubscribed
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  details JSONB DEFAULT '{}', -- provider response, reason, metadata

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_campaign_logs_campaign ON email_campaign_logs(campaign_id, event_type);
CREATE INDEX idx_email_campaign_logs_recipient ON email_campaign_logs(campaign_recipient_id);
```

### Relationships Diagram

```
email_templates (1) ──→ (N) email_campaigns
                             │
                             ├─→ (N) campaign_recipients ──→ users
                             ├─→ (N) email_queue
                             └─→ (N) email_campaign_logs
```

---

## 4. API Specification

### Base URL

```
/api/v1/email-campaigns
```

### Endpoints

#### 1. Create Email Template

```http
POST /api/v1/email-templates
Authorization: Bearer {user_token}
Content-Type: application/json

Request Body:
{
  "name": "Weekly Newsletter",
  "subjectLine": "Hi {{firstName}}, here's this week's deals!",
  "htmlContent": "<html>...</html>",
  "wysiwygState": { /* builder state */ }
}

Response 201:
{
  "id": "template-uuid",
  "name": "Weekly Newsletter",
  "subjectLine": "Hi {{firstName}}, here's this week's deals!",
  "variablesUsed": ["firstName", "discountCode"],
  "createdAt": "2026-04-04T10:00:00Z"
}

Errors:
- 400: Invalid HTML or variables
- 401: Unauthorized
```

#### 2. Create Campaign

```http
POST /api/v1/email-campaigns
Authorization: Bearer {user_token}
Content-Type: application/json

Request Body:
{
  "name": "April Newsletter - Test",
  "emailTemplateId": "template-uuid",
  "recipientSegment": "all_users",
  "scheduledFor": "2026-04-10T14:00:00Z" // NULL = send now
}

Response 201:
{
  "id": "campaign-uuid",
  "name": "April Newsletter - Test",
  "status": "draft",
  "recipientCount": 5234,
  "createdAt": "2026-04-04T10:00:00Z"
}

Errors:
- 400: Invalid template or segment
- 401: Unauthorized
```

#### 3. Preview Campaign (Rendered Email)

```http
GET /api/v1/email-campaigns/{campaignId}/preview?userId=user-uuid
Authorization: Bearer {user_token}

Response 200:
{
  "subjectLine": "Hi John, here's this week's deals!",
  "htmlContent": "<html>{{ rendered HTML with variables replaced }}</html>",
  "previewFor": {
    "userId": "user-uuid",
    "firstName": "John",
    "email": "john@example.com"
  }
}
```

#### 4. Send Campaign (or Schedule)

```http
POST /api/v1/email-campaigns/{campaignId}/send
Authorization: Bearer {user_token}
Content-Type: application/json

Request Body:
{
  "sendNow": true // or false (uses scheduledFor)
}

Response 200:
{
  "id": "campaign-uuid",
  "status": "sending", // or "scheduled" if scheduled_for is future
  "recipientCount": 5234,
  "queuedCount": 5234,
  "message": "Campaign queued for delivery"
}

Errors:
- 400: Campaign already sent or invalid state
- 404: Campaign not found
```

#### 5. Get Campaign Status

```http
GET /api/v1/email-campaigns/{campaignId}
Authorization: Bearer {user_token}

Response 200:
{
  "id": "campaign-uuid",
  "name": "April Newsletter",
  "status": "sending",
  "recipientCount": 5234,
  "stats": {
    "sentCount": 3200,
    "failedCount": 50,
    "deferredCount": 1984,
    "bounceCount": 0,
    "openCount": 456,
    "clickCount": 89,
    "deliveryRate": "60.5%",
    "openRate": "14.2%",
    "clickRate": "2.8%"
  },
  "createdAt": "2026-04-04T10:00:00Z",
  "startedAt": "2026-04-04T10:05:00Z",
  "completedAt": null
}
```

#### 6. Get Campaign Logs (Detailed Delivery Status)

```http
GET /api/v1/email-campaigns/{campaignId}/logs?status=failed&limit=50&offset=0
Authorization: Bearer {user_token}

Response 200:
{
  "data": [
    {
      "recipientEmail": "user1@example.com",
      "status": "failed",
      "sentAt": "2026-04-04T10:06:00Z",
      "errorReason": "Permanent bounce: Invalid mailbox",
      "retryCount": 0
    },
    {
      "recipientEmail": "user2@example.com",
      "status": "deferred",
      "sentAt": "2026-04-04T10:07:00Z",
      "errorReason": "Temporary failure: Service temporarily unavailable",
      "retryCount": 2,
      "nextRetryAt": "2026-04-04T10:24:00Z"
    }
  ],
  "pagination": { "total": 50, "limit": 50, "offset": 0 }
}
```

#### 7. Retry Failed Emails

```http
POST /api/v1/email-campaigns/{campaignId}/retry-failed
Authorization: Bearer {admin_token}

Response 200:
{
  "retriedCount": 45,
  "message": "45 failed emails queued for retry"
}
```

---

## 5. Email Builder & Templates

### Template Variables (Allowlist)

```typescript
const ALLOWED_TEMPLATE_VARIABLES = {
  // System variables (always available)
  system: [
    '{{firstName}}', // User first name
    '{{lastName}}', // User last name
    '{{email}}', // User email address
    '{{referralCode}}', // User's referral code
    '{{discountCode}}', // Campaign-specific discount
    '{{expiresAt}}', // Code expiration date
  ],

  // Custom variables (per campaign, must be validated)
  custom: [
    // Defined per campaign instance
  ],
};

// Validation function
function validateTemplateVariables(htmlContent: string): ValidationResult {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const found = new Set<string>();
  let match;

  while ((match = variableRegex.exec(htmlContent))) {
    const varName = match[1];
    if (!ALLOWED_TEMPLATE_VARIABLES.system.includes(`{{${varName}}}`)) {
      return {
        valid: false,
        error: `Unknown variable: {{${varName}}}`,
        allowed: ALLOWED_TEMPLATE_VARIABLES.system,
      };
    }
    found.add(varName);
  }

  return { valid: true, variablesUsed: Array.from(found) };
}
```

### Template Rendering

```typescript
function renderEmailTemplate(htmlContent: string, variables: Record<string, string>): string {
  let rendered = htmlContent;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    if (htmlContent.includes(placeholder)) {
      rendered = rendered.replace(new RegExp(placeholder, 'g'), escapeHtml(value));
    }
  });

  return rendered;
}

// Example
const html = `<p>Hi {{firstName}}, here's your code: {{discountCode}}</p>`;
const variables = { firstName: 'John', discountCode: 'SAVE20' };
const rendered = renderEmailTemplate(html, variables);
// Result: <p>Hi John, here's your code: SAVE20</p>
```

### WYSIWYG Editor (TinyMCE Integration)

```typescript
import tinymce from 'tinymce';

interface EmailBuilderProps {
  onSave: (html: string, state: any) => void;
}

export const EmailBuilder: React.FC<EmailBuilderProps> = ({ onSave }) => {
  const editorRef = useRef<any>();

  const setupEditor = () => {
    tinymce.init({
      selector: '#email-editor',
      plugins: 'advlist autolink lists link image charmap preview anchor',
      toolbar: 'undo redo | bold italic | bullist numlist | link image',
      setup: (editor) => {
        // Add variable picker
        editor.ui.registry.addMenuButton('variables', {
          text: 'Variables',
          fetch: (callback) => {
            callback([
              {
                type: 'menuitem',
                text: '{{firstName}}',
                onAction: () => editor.insertContent('{{firstName}}')
              },
              // ... other variables
            ]);
          }
        });
      },
      templates: [
        { title: 'Simple Email', content: '<p>Hi {{firstName}},</p>' },
        { title: 'Promo Email', content: '<p>{{discountCode}}</p>' }
      ]
    });
  };

  return (
    <div>
      <textarea id="email-editor" />
      <button onClick={() => onSave(editorRef.current.getContent(), {})}>
        Save Template
      </button>
    </div>
  );
};
```

---

## 6. Brevo Integration

### Brevo API Client

```typescript
class BrevoEmailService {
  private apiKey: string;
  private apiBase = 'https://api.brevo.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Envía un email vía Brevo REST API (ES)
   * Sends email via Brevo REST API (EN)
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    htmlContent: string;
    fromName?: string;
    replyTo?: string;
  }): Promise<BrevoResponse> {
    try {
      const response = await fetch(`${this.apiBase}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [{ email: params.to }],
          sender: {
            name: params.fromName || 'MLM Platform',
            email: 'noreply@mlm-platform.com',
          },
          replyTo: params.replyTo ? { email: params.replyTo } : undefined,
          subject: params.subject,
          htmlContent: params.htmlContent,
          tags: ['email-campaign'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Brevo API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to SMTP if REST fails
      return this.sendViaSMTP(params);
    }
  }

  /**
   * SMTP fallback para Brevo (ES)
   * SMTP fallback for Brevo (EN)
   */
  private async sendViaSMTP(params: any): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `MLM Platform <noreply@mlm-platform.com>`,
      to: params.to,
      subject: params.subject,
      html: params.htmlContent,
    });
  }
}
```

---

## 7. Campaign Execution & Scheduling

### Email Queue Processor

```typescript
class EmailQueueService {
  /**
   * Procesa la cola de emails con reintentos (ES)
   * Processes email queue with retry logic (EN)
   */
  async processPendingEmails(): Promise<void> {
    // Get all pending emails
    const pending = await db.query(`
      SELECT * FROM email_queue 
      WHERE status IN ('pending', 'deferred')
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      LIMIT 100
    `);

    for (const queueItem of pending) {
      try {
        // Send via Brevo
        const response = await brevoService.sendEmail({
          to: queueItem.email_address,
          subject: queueItem.subject_line,
          htmlContent: queueItem.html_content,
        });

        // Mark as sent
        await db.query(
          `
          UPDATE email_queue SET status = 'sent', processed_at = NOW(), brevo_message_id = $1
          WHERE id = $2
        `,
          [response.messageId, queueItem.id]
        );

        // Log
        await logEvent('email_sent', queueItem.campaign_id, queueItem.campaign_recipient_id);
      } catch (error) {
        // Handle retry with exponential backoff
        await this.handleFailure(queueItem, error);
      }
    }
  }

  private async handleFailure(queueItem: any, error: Error): Promise<void> {
    const retryCount = queueItem.retry_count + 1;
    const maxRetries = 5;

    if (retryCount > maxRetries) {
      // Final failure
      await db.query(
        `
        UPDATE email_queue SET status = 'failed', last_error = $1
        WHERE id = $2
      `,
        [error.message, queueItem.id]
      );

      await logEvent('email_failed', queueItem.campaign_id, queueItem.campaign_recipient_id);
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const backoffSeconds = Math.pow(2, retryCount - 1);
    const nextRetryAt = addSeconds(new Date(), backoffSeconds);

    await db.query(
      `
      UPDATE email_queue 
      SET status = 'deferred', retry_count = $1, next_retry_at = $2, last_error = $3
      WHERE id = $4
    `,
      [retryCount, nextRetryAt, error.message, queueItem.id]
    );

    await logEvent('email_deferred', queueItem.campaign_id, queueItem.campaign_recipient_id, {
      retryCount,
      nextRetryAt,
    });
  }
}
```

### Campaign Scheduler

```typescript
class CampaignScheduler {
  /**
   * Ejecuta campañas programadas (ES)
   * Executes scheduled campaigns (EN)
   */
  async procesScheduledCampaigns(): Promise<void> {
    const campaigns = await db.query(`
      SELECT * FROM email_campaigns
      WHERE status = 'scheduled'
      AND scheduled_for <= NOW()
    `);

    for (const campaign of campaigns) {
      await this.launchCampaign(campaign.id);
    }
  }

  private async launchCampaign(campaignId: string): Promise<void> {
    // 1. Fetch campaign & template
    const campaign = await db.query(
      `
      SELECT ec.*, et.html_content
      FROM email_campaigns ec
      JOIN email_templates et ON ec.email_template_id = et.id
      WHERE ec.id = $1
    `,
      [campaignId]
    );

    // 2. Get recipients
    const recipients = await this.getRecipientsBySegment(campaign.recipient_segment);

    // 3. Create queue entries
    for (const recipient of recipients) {
      const rendered = renderEmailTemplate(campaign.html_content, {
        firstName: recipient.first_name,
        lastName: recipient.last_name,
        email: recipient.email,
        referralCode: recipient.referral_code,
        discountCode: campaign.discount_code,
        expiresAt: campaign.discount_expires_at,
      });

      await db.query(
        `
        INSERT INTO email_queue 
        (campaign_id, campaign_recipient_id, user_id, email_address, subject_line, html_content, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      `,
        [
          campaignId,
          recipient.campaign_recipient_id,
          recipient.user_id,
          recipient.email,
          campaign.subject_line,
          rendered,
        ]
      );
    }

    // 4. Update campaign status
    await db.query(
      `
      UPDATE email_campaigns 
      SET status = 'sending', started_at = NOW()
      WHERE id = $1
    `,
      [campaignId]
    );
  }
}
```

---

## 8. Frontend Components

### Component Tree

```
EmailCampaignPage (Admin)
├── CampaignTabs
│   ├── "Draft" tab → TemplatesList
│   ├── "Active" tab → CampaignList
│   └── "Completed" tab → ArchivedCampaigns
├── CreateCampaignButton
└── CampaignDetailsModal
    ├── EmailBuilder (WYSIWYG)
    ├── PreviewPane
    ├── RecipientSelector
    ├── ScheduleForm
    └── SendButton

EmailBuilder
├── EditorArea (TinyMCE)
├── VariablePicker
├── HTMLToggle (WYSIWYG ↔ HTML)
├── PreviewPane (real-time)
└── SaveButton

CampaignMonitor
├── ProgressBar (sent/failed/pending)
├── StatsCard (open rate, CTR, bounce)
└── LogsTable (detailed delivery status)
```

### Email Builder Component

```typescript
export const EmailBuilder: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [isWysiwyg, setIsWysiwyg] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [preview, setPreview] = useState('');

  const handleVariableInsert = (variable: string) => {
    // Insert {{variable}} into editor
    const editor = tinymce.get('email-editor');
    editor?.insertContent(`{{${variable}}}`);
  };

  const toggleMode = () => {
    setIsWysiwyg(!isWysiwyg);
  };

  const handleSave = async () => {
    const html = tinymce.get('email-editor')?.getContent() || '';

    // Validate variables
    const validation = validateTemplateVariables(html);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Save
    await emailAPI.updateCampaign(campaignId, { htmlContent: html });
    toast.success('Campaign saved');
  };

  return (
    <div className="email-builder">
      <div className="controls">
        <button onClick={toggleMode}>
          {isWysiwyg ? 'Edit HTML' : 'WYSIWYG'}
        </button>
        <VariablePicker onSelect={handleVariableInsert} />
        <button onClick={handleSave}>Save</button>
      </div>

      {isWysiwyg ? (
        <textarea id="email-editor" defaultValue={htmlContent} />
      ) : (
        <CodeEditor value={htmlContent} onChange={setHtmlContent} />
      )}

      <div className="preview">
        <iframe srcDoc={preview} />
      </div>
    </div>
  );
};
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
describe('EmailCampaignService', () => {
  describe('validateTemplateVariables', () => {
    it('should accept allowed variables', () => {
      const html = 'Hi {{firstName}}, your code: {{discountCode}}';
      const result = validateTemplateVariables(html);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown variables', () => {
      const html = 'Hi {{firstName}}, your {{unknownVar}}';
      const result = validateTemplateVariables(html);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unknownVar');
    });
  });

  describe('renderEmailTemplate', () => {
    it('should replace variables with values', () => {
      const html = 'Hi {{firstName}}, code: {{discountCode}}';
      const variables = { firstName: 'John', discountCode: 'SAVE20' };
      const result = renderEmailTemplate(html, variables);
      expect(result).toBe('Hi John, code: SAVE20');
    });

    it('should escape HTML in values', () => {
      const html = 'Hi {{firstName}}';
      const variables = { firstName: '<script>alert(1)</script>' };
      const result = renderEmailTemplate(html, variables);
      expect(result).not.toContain('<script>');
    });
  });
});
```

### Integration Tests

```typescript
describe('Email Campaign Flow (Integration)', () => {
  it('should create, schedule, and send campaign', async () => {
    // 1. Create template
    const template = await emailAPI.createTemplate({
      name: 'Test',
      subjectLine: 'Hi {{firstName}}',
      htmlContent: '<p>Welcome!</p>',
    });

    // 2. Create campaign
    const campaign = await emailAPI.createCampaign({
      name: 'Test Campaign',
      emailTemplateId: template.id,
      recipientSegment: 'all_users',
      scheduledFor: new Date(),
    });

    // 3. Send campaign
    await emailAPI.sendCampaign(campaign.id);

    // 4. Verify queue created
    const queueItems = await db.query(
      `
      SELECT * FROM email_queue WHERE campaign_id = $1
    `,
      [campaign.id]
    );
    expect(queueItems.length).toBeGreaterThan(0);

    // 5. Process queue
    await emailQueueService.processPendingEmails();

    // 6. Verify emails sent
    const sent = await db.query(
      `
      SELECT COUNT(*) FROM email_queue WHERE campaign_id = $1 AND status = 'sent'
    `,
      [campaign.id]
    );
    expect(sent.count).toBeGreaterThan(0);
  });
});
```

---

## 10. Deployment & Monitoring

### Environment Variables

```env
BREVO_API_KEY=your-api-key-here
BREVO_SMTP_USER=smtp-user
BREVO_SMTP_PASSWORD=smtp-password
EMAIL_QUEUE_BATCH_SIZE=100
EMAIL_SCHEDULER_INTERVAL_MINUTES=1
EMAIL_MAX_RETRIES=5
```

### Monitoring Metrics

```yaml
Key Metrics:
  - Campaign delivery rate (target: >98%)
  - Email open rate (target: >20%)
  - Click-through rate (target: >5%)
  - Time to delivery (target: <2 min)
  - Bounce rate (target: <1%)
  - Queue processing latency (target: <1 sec/email)

Alerts:
  - Delivery rate drops below 95%
  - Bounce rate exceeds 2%
  - Queue processing backlog >10,000
  - Brevo API failures (circuit breaker)
  - SMTP fallback usage >10%
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-04  
**Status**: Draft for Implementation
