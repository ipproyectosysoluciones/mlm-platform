/**
 * @fileoverview EmailService and SMSService Unit Tests
 * @description Tests for notification services
 * @module __tests__/EmailService
 */

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

// Mock axios for SMS
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { messageId: 'sms-test-id' } }),
}));

// Mock config
jest.mock('../config/env', () => ({
  config: {
    brevo: {
      smtpHost: 'smtp.brevo.com',
      smtpPort: 587,
      smtpUser: 'test@test.com',
      smtpPass: 'testpass',
      senderEmail: 'noreply@test.com',
      senderName: 'MLM Platform',
      apiKey: 'test-api-key',
      smsSender: 'MLM',
    },
  },
}));

import { EmailService } from '../services/EmailService';
import { SMSService } from '../services/SMSService';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('send', () => {
    it('should send email successfully', async () => {
      const result = await emailService.send('test@example.com', 'Test Subject', '<p>Test</p>');
      expect(result).toBe(true);
    });
  });

  describe('sendWelcome', () => {
    it('should send welcome email with correct data', async () => {
      const result = await emailService.sendWelcome({
        email: 'user@example.com',
        firstName: 'John',
        referralCode: 'REF123',
        referralLink: 'https://example.com/register?ref=REF123',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendCommission', () => {
    it('should send commission email with correct data', async () => {
      const result = await emailService.sendCommission({
        email: 'user@example.com',
        firstName: 'John',
        amount: 100,
        currency: 'USD',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendDownline', () => {
    it('should send downline notification email', async () => {
      const result = await emailService.sendDownline({
        email: 'sponsor@example.com',
        firstName: 'Sponsor',
        newUserEmail: 'new@example.com',
        position: 'left',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordReset({
        email: 'user@example.com',
        resetLink: 'https://example.com/reset?token=abc123',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendWeeklyDigest', () => {
    it('should send weekly digest email', async () => {
      const result = await emailService.sendWeeklyDigest({
        email: 'user@example.com',
        firstName: 'John',
        newReferrals: 5,
        commissionsEarned: 250,
      });

      expect(result).toBe(true);
    });
  });
});

describe('SMSService', () => {
  let smsService: SMSService;

  beforeEach(() => {
    smsService = new SMSService();
  });

  describe('sendVerificationCode', () => {
    it('should send verification code to valid phone', async () => {
      const result = await smsService.sendVerificationCode('+1234567890');

      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', async () => {
      const result = await smsService.sendVerificationCode('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should reject phone without country code', async () => {
      const result = await smsService.sendVerificationCode('1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });
  });

  describe('verifyCode', () => {
    it('should verify valid code', () => {
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const result = smsService.verifyCode('123456', '123456', expiry);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid code', () => {
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      const result = smsService.verifyCode('123456', '000000', expiry);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid code');
    });

    it('should reject expired code', () => {
      const expiry = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const result = smsService.verifyCode('123456', '123456', expiry);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Code expired');
    });
  });
});
