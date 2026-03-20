import QRCode from 'qrcode';
import { config } from '../config/env';

export class QRService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.app.frontendUrl;
  }

  getReferralLink(referralCode: string): string {
    return `${this.baseUrl}/register?ref=${referralCode}`;
  }

  async generateQRDataUrl(referralCode: string): Promise<string> {
    const link = this.getReferralLink(referralCode);

    return QRCode.toDataURL(link, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  async generateQRBuffer(referralCode: string): Promise<Buffer> {
    const link = this.getReferralLink(referralCode);

    return QRCode.toBuffer(link, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  async generateQRFile(referralCode: string, filePath: string): Promise<void> {
    const link = this.getReferralLink(referralCode);

    await QRCode.toFile(filePath, link, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 300,
    });
  }
}
