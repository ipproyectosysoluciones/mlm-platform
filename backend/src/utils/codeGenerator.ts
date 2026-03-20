import { v4 as uuidv4 } from 'uuid';
import { User } from '../models';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(): string {
  const parts: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    parts.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
  }
  parts.push('-');
  for (let i = 0; i < 4; i++) {
    parts.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
  }
  
  return 'MLM-' + parts.join('');
}

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateReferralCode();
    const exists = await User.findOne({ where: { referralCode: code } });
    if (!exists) return code;
  }
  
  return 'MLM-' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function generateUUID(): string {
  return uuidv4();
}
