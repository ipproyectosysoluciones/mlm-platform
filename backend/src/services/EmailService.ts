/**
 * @fileoverview Email Service - Brevo SMTP Relay implementation
 * @description Service for sending transactional emails via Brevo SMTP relay
 * @module services/EmailService
 */
import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { welcomeTemplate } from '../templates/email/welcome';
import { commissionTemplate } from '../templates/email/commission';
import { downlineTemplate } from '../templates/email/downline';
import { passwordResetTemplate } from '../templates/email/passwordReset';
import { weeklyDigestTemplate } from '../templates/email/weeklyDigest';

/**
 * EmailService - Brevo SMTP email delivery
 * Servicio de Email - Envío de emails via Brevo SMTP relay
 */
export class EmailService {
  private transporter;

  constructor() {
    // Brevo SMTP Relay works exactly like a standard SMTP server
    this.transporter = nodemailer.createTransport({
      host: config.brevoSmtpHost,
      port: Number(config.brevoSmtpPort),
      secure: false, // 587 uses STARTTLS
      auth: {
        user: config.brevoSmtpUser,
        pass: config.brevoSmtpPass,
      },
    });
  }

  /**
   * Send an email
   * Envía un email
   * @param to - Recipient email
   * @param subject - Email subject
   * @param html - HTML content
   * @returns Promise<boolean> - True if sent successfully
   */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${config.brevoSenderName}" <${config.brevoSenderEmail}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Email send failed (Brevo SMTP):', error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   * Envía email de bienvenida a nuevo usuario
   * @param data - Welcome email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendWelcome(data: {
    email: string;
    firstName: string;
    referralCode: string;
    referralLink: string;
  }): Promise<boolean> {
    const html = welcomeTemplate({
      firstName: data.firstName,
      referralCode: data.referralCode,
      referralLink: data.referralLink,
    });
    return this.send(data.email, 'Bienvenido a MLM Platform', html);
  }

  /**
   * Send commission earned notification
   * Envía notificación de comisión ganada
   * @param data - Commission email data
   * @returns Promise<boolean> - True if sent successfully
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
    const html = commissionTemplate({
      firstName: data.firstName,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      percentage: data.percentage,
      purchaseId: data.purchaseId,
      pendingBalance: data.pendingBalance,
    });
    return this.send(
      data.email,
      `💰 Nueva comisión ganada: $${data.amount} ${data.currency}`,
      html
    );
  }

  /**
   * Send downline registration notification to sponsor
   * Envía notificación de registro de downline al patrocinador
   * @param data - Downline email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendDownline(data: {
    email: string;
    firstName: string;
    newUserEmail: string;
    registrationDate: string;
    position: string;
    totalReferrals: number;
  }): Promise<boolean> {
    const html = downlineTemplate({
      firstName: data.firstName,
      newUserEmail: data.newUserEmail,
      registrationDate: data.registrationDate,
      position: data.position,
      totalReferrals: data.totalReferrals,
    });
    return this.send(data.email, `👥 Nuevo downline registrado: ${data.newUserEmail}`, html);
  }

  /**
   * Send password reset email
   * Envía email de restablecimiento de contraseña
   * @param data - Password reset email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendPasswordReset(data: {
    email: string;
    resetToken: string;
    resetLink: string;
  }): Promise<boolean> {
    const html = passwordResetTemplate({
      resetLink: data.resetLink,
    });
    return this.send(data.email, 'Restablecimiento de contraseña', html);
  }

  /**
   * Send weekly digest email
   * Envía email de resumen semanal
   * @param data - Weekly digest email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendWeeklyDigest(data: {
    email: string;
    firstName: string;
    weekStart: string;
    weekEnd: string;
    newReferrals: number;
    commissionsEarned: number;
    pendingCommissions: number;
    totalDownline: number;
  }): Promise<boolean> {
    const html = weeklyDigestTemplate({
      firstName: data.firstName,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      newReferrals: data.newReferrals,
      commissionsEarned: data.commissionsEarned,
      pendingCommissions: data.pendingCommissions,
      totalDownline: data.totalDownline,
    });
    return this.send(
      data.email,
      `📊 Tu resumen semanal: ${data.weekStart} al ${data.weekEnd}`,
      html
    );
  }
}

export const emailService = new EmailService();
