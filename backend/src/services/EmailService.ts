/**
 * @fileoverview Email Service - Brevo SMTP Relay implementation
 * @description Service for sending transactional emails via Brevo SMTP relay
 * @module services/EmailService
 * @author MLM Development Team
 *
 * @example
 * // English: Import and use EmailService
 * const emailService = new EmailService();
 * await emailService.sendWelcome({ email: 'user@example.com', firstName: 'John', referralCode: 'REF123', referralLink: 'https://...' });
 *
 * // Español: Importar y usar EmailService
 * const emailService = new EmailService();
 * await emailService.sendWelcome({ email: 'usuario@ejemplo.com', firstName: 'Juan', referralCode: 'REF123', referralLink: 'https://...' });
 */
import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * EmailService - Brevo SMTP email delivery
 * Servicio de Email - Envío de emails via Brevo SMTP relay
 */
export class EmailService {
  private transporter;

  constructor() {
    // Brevo SMTP Relay configuration
    this.transporter = nodemailer.createTransport({
      host: config.brevo.smtpHost,
      port: config.brevo.smtpPort,
      secure: false, // 587 uses STARTTLS
      auth: {
        user: config.brevo.smtpUser,
        pass: config.brevo.smtpPass,
      },
    });
  }

  /**
   * Send an email
   * Envía un email
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param html - HTML content
   * @returns Promise<boolean> - True if sent successfully
   */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${config.brevo.senderName}" <${config.brevo.senderEmail}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      logger.error({ service: 'EmailService', err: error }, 'Email send failed (Brevo SMTP)');
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
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Nexo Real</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">¡Bienvenido a Nexo Real, ${data.firstName}!</h1>
        <p>Gracias por registrarte en nuestra plataforma.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Tu código de referido:</strong></p>
          <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">${data.referralCode}</p>
        </div>
        <p>Comparte este código con tus amigos y ganarás comisiones por cada registro.</p>
        <a href="${data.referralLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Ver mi dashboard</a>
      </body>
      </html>
    `;
    return this.send(data.email, 'Bienvenido a Nexo Real', html);
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
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nueva Comisión Ganada</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">¡Felicidades, ${data.firstName}!</h1>
        <p>Has ganado una nueva comisión.</p>
        <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 0;">$${data.amount} ${data.currency}</p>
        </div>
        <p>Revisa tu dashboard para más detalles.</p>
      </body>
      </html>
    `;
    return this.send(data.email, 'Nueva comisión ganada - Nexo Real', html);
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
    position: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nuevo Downline</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">¡Nuevo miembro en tu red, ${data.firstName}!</h1>
        <p>Un nuevo usuario se ha registrado bajo tu patrocinio.</p>
        <ul>
          <li><strong>Email:</strong> ${data.newUserEmail}</li>
          <li><strong>Posición:</strong> ${data.position}</li>
        </ul>
        <p>¡Sigue creciendo tu red de distribuidores!</p>
      </body>
      </html>
    `;
    return this.send(data.email, `Nuevo downline registrado: ${data.newUserEmail}`, html);
  }

  /**
   * Send password reset email
   * Envía email de restablecimiento de contraseña
   * @param data - Password reset email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendPasswordReset(data: { email: string; resetLink: string }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Restablecer Contraseña</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Restablecer tu contraseña</h1>
        <p>Haz clic en el botón para crear una nueva contraseña:</p>
        <a href="${data.resetLink}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Restablecer contraseña</a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">Este enlace expira en 1 hora.</p>
      </body>
      </html>
    `;
    return this.send(data.email, 'Restablecimiento de contraseña - Nexo Real', html);
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
    newReferrals: number;
    commissionsEarned: number;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Resumen Semanal</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Resumen Semanal, ${data.firstName}!</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280;">Nuevos Referidos</p>
            <p style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0;">${data.newReferrals}</p>
          </div>
          <div style="background: #d1fae5; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280;">Ganancias</p>
            <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0;">$${data.commissionsEarned}</p>
          </div>
        </div>
        <p>¡Sigue el progreso de tu red esta semana!</p>
      </body>
      </html>
    `;
    return this.send(data.email, '📊 Tu resumen semanal de Nexo Real', html);
  }

  /**
   * Send withdrawal approved notification
   * Envía notificación de retiro aprobado
   * @param data - Withdrawal approved email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendWithdrawalApproved(data: {
    email: string;
    firstName: string;
    amount: number;
    currency: string;
    withdrawalId: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Retiro Aprobado</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">¡Retiro aprobado, ${data.firstName}!</h1>
        <p>Tu solicitud de retiro ha sido procesada exitosamente.</p>
        <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #6b7280;">Monto aprobado</p>
          <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0;">$${data.amount} ${data.currency}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">ID de retiro: ${data.withdrawalId}</p>
        <p>El monto será acreditado en tu cuenta según el método de pago utilizado.</p>
      </body>
      </html>
    `;
    return this.send(data.email, 'Retiro aprobado - Nexo Real', html);
  }

  /**
   * Send withdrawal rejected notification
   * Envía notificación de retiro rechazado
   * @param data - Withdrawal rejected email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendWithdrawalRejected(data: {
    email: string;
    firstName: string;
    amount: number;
    currency: string;
    withdrawalId: string;
    reason: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Retiro Rechazado</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Retiro rechazado, ${data.firstName}</h1>
        <p>Tu solicitud de retiro ha sido rechazada.</p>
        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280;">Monto solicitado</p>
          <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 10px 0;">$${data.amount} ${data.currency}</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Motivo del rechazo:</p>
          <p style="margin: 10px 0 0 0;">${data.reason}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">ID de retiro: ${data.withdrawalId}</p>
        <p>Si tienes alguna duda, contacta al soporte.</p>
      </body>
      </html>
    `;
    return this.send(data.email, 'Retiro rechazado - Nexo Real', html);
  }

  /**
   * Send level achieved notification
   * Envía notificación de nivel alcanzado
   * @param data - Level achieved email data
   * @returns Promise<boolean> - True if sent successfully
   */
  async sendLevelAchieved(data: {
    email: string;
    firstName: string;
    newLevel: number;
    levelName: string;
    benefits: string[];
  }): Promise<boolean> {
    const benefitsList = data.benefits.map((b) => `<li>${b}</li>`).join('');
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nivel Alcanzado</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #7c3aed;">¡Felicitaciones, ${data.firstName}!</h1>
        <p>Has alcanzado un nuevo nivel en Nexo Real.</p>
        <div style="background: #ede9fe; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #6b7280;">Nuevo nivel</p>
          <p style="font-size: 36px; font-weight: bold; color: #7c3aed; margin: 10px 0;">Nivel ${data.newLevel}</p>
          <p style="font-size: 20px; color: #7c3aed; margin: 0;">${data.levelName}</p>
        </div>
        <h2 style="color: #059669;">Beneficios desbloqueados:</h2>
        <ul style="line-height: 1.8;">
          ${benefitsList}
        </ul>
        <p>¡Sigue creciendo tu red para alcanzar el siguiente nivel!</p>
      </body>
      </html>
    `;
    return this.send(
      data.email,
      `🎉 Has alcanzado el nivel ${data.newLevel} - ${data.levelName}!`,
      html
    );
  }
}

// Export singleton instance
export const emailService = new EmailService();
