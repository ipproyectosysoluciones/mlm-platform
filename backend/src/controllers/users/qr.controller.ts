/**
 * @fileoverview QR Controller - QR code generation endpoints
 * @description Handles QR code generation for user referral codes
 * @module controllers/users/qr
 */
import { Response } from 'express';
import { userService } from '../../services/UserService';
import { QRService } from '../../services/QRService';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

const qrService = new QRService();

/**
 * Get user QR code as PNG image
 */
export async function getQR(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const qrBuffer = await qrService.generateQRBuffer(user.referralCode);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${user.referralCode}.png"`);
  res.send(qrBuffer);
}

/**
 * Get user QR code as data URL
 */
export async function getQRUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.id || req.user!.id;
  const user = await userService.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const dataUrl = await qrService.generateQRDataUrl(user.referralCode);
  const referralLink = qrService.getReferralLink(user.referralCode);

  const response: ApiResponse<{
    dataUrl: string;
    referralLink: string;
    referralCode: string;
  }> = {
    success: true,
    data: {
      dataUrl,
      referralLink,
      referralCode: user.referralCode,
    },
  };

  res.json(response);
}
