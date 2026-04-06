/**
 * @fileoverview CartRecoveryEmailService - Recovery email composition and dispatch for abandoned carts
 * @description Composes personalized HTML recovery emails with cart summary and one-time links,
 *              then dispatches via EmailService (Brevo SMTP). Handles error recovery gracefully.
 *              Compone emails HTML personalizados de recuperación con resumen de carrito y links
 *              de un solo uso, luego envía via EmailService (Brevo SMTP). Maneja errores gracefully.
 * @module services/CartRecoveryEmailService
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Send a recovery email for an abandoned cart
 * await cartRecoveryEmailService.sendRecoveryEmail(cartId, tokenPlain);
 *
 * // ES: Enviar email de recuperación para un carrito abandonado
 * await cartRecoveryEmailService.sendRecoveryEmail(cartId, tokenPlain);
 */
import { Cart, CartItem, CartRecoveryToken, Product, User } from '../models';
import { emailService } from './EmailService';
import { config } from '../config/env';

/**
 * CartRecoveryEmailService - Composes and sends abandoned cart recovery emails
 * Servicio de Email de Recuperación de Carrito - Compone y envía emails de recuperación
 */
export class CartRecoveryEmailService {
  /**
   * Send a recovery email for an abandoned cart
   * Enviar email de recuperación para un carrito abandonado
   *
   * @param cartId - Cart UUID / UUID del carrito
   * @param tokenPlain - Plaintext recovery token for the link / Token de recuperación en texto plano para el link
   * @throws Error if cart not found, user not found, or email dispatch fails
   */
  async sendRecoveryEmail(cartId: string, tokenPlain: string): Promise<void> {
    // 1. Fetch cart with items
    const cart = await Cart.findByPk(cartId, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'platform', 'isActive'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName'],
        },
      ],
    });

    if (!cart) {
      throw new Error(`Cart not found: ${cartId}`);
    }

    const user = (cart as any).user;
    if (!user || !user.email) {
      throw new Error(`User not found for cart: ${cartId}`);
    }

    const items = ((cart as any).items || []) as Array<
      CartItem & { product?: { name: string; price: number; platform: string } }
    >;

    // 2. Build recovery link
    const frontendUrl = config.app.frontendUrl || 'http://localhost:5173';
    const recoveryLink = `${frontendUrl}/recover-cart?token=${encodeURIComponent(tokenPlain)}`;

    // 3. Calculate expiry display
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const expiresDisplay = expiresAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // 4. Compose email HTML
    const html = this.composeHtml({
      firstName: user.firstName || 'there',
      itemCount: cart.itemCount || items.length,
      totalAmount: Number(cart.totalAmount || 0).toFixed(2),
      items: items.map((item) => ({
        productName: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        subtotal: (item.quantity * Number(item.unitPrice)).toFixed(2),
      })),
      recoveryLink,
      expiresDisplay,
    });

    // 5. Send via EmailService (Brevo SMTP)
    const subject = `Hi ${user.firstName || 'there'}, your cart is waiting!`;
    const sent = await emailService.send(user.email, subject, html);

    if (!sent) {
      throw new Error(`Failed to send recovery email to ${user.email} for cart ${cartId}`);
    }

    // 6. Update recovery token with email_sent_at
    await CartRecoveryToken.update(
      { emailSentAt: new Date() },
      { where: { cartId, usedAt: null } }
    );

    console.log(`[CartRecoveryEmail] Sent recovery email to ${user.email} for cart ${cartId}`);
  }

  /**
   * Compose the HTML email template for cart recovery
   * Componer la plantilla HTML del email de recuperación de carrito
   *
   * @param data - Template data / Datos de la plantilla
   * @returns HTML string / String HTML
   */
  private composeHtml(data: {
    firstName: string;
    itemCount: number;
    totalAmount: string;
    items: Array<{ productName: string; quantity: number; subtotal: string }>;
    recoveryLink: string;
    expiresDisplay: string;
  }): string {
    const itemRows = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.subtotal}</td>
          </tr>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Cart is Waiting!</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="color: #1f2937; margin-top: 0;">Hi ${data.firstName},</h1>
    <p style="color: #4b5563; font-size: 16px;">
      You left <strong>${data.itemCount} item${data.itemCount !== 1 ? 's' : ''}</strong> in your cart
      worth <strong style="color: #059669;">$${data.totalAmount}</strong>.
    </p>

    <h2 style="color: #374151; font-size: 18px; margin-top: 24px;">Your Items:</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px 12px; text-align: left; font-size: 14px; color: #6b7280;">Product</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 14px; color: #6b7280;">Qty</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 14px; color: #6b7280;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; font-weight: bold; text-align: right;">Total:</td>
          <td style="padding: 12px; font-weight: bold; text-align: right; color: #059669;">$${data.totalAmount}</td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.recoveryLink}"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Resume Shopping
      </a>
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center;">
      This link expires on <strong>${data.expiresDisplay}</strong> (7 days).
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

    <p style="font-size: 11px; color: #d1d5db; text-align: center; margin-top: 16px;">
      Nexo Real &bull; You received this email because you have items in your cart.
    </p>
  </div>
</body>
</html>`;
  }
}

// Export singleton instance
export const cartRecoveryEmailService = new CartRecoveryEmailService();
