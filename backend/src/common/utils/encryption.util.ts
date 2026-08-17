import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function keyFromSecret(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function encrypt(text: string, masterKey: string): string {
  if (!masterKey?.trim()) {
    throw new Error('MASTER_ENCRYPTION_KEY is not configured');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, keyFromSecret(masterKey), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(payload: string, masterKey: string): string {
  if (!masterKey?.trim()) {
    throw new Error('MASTER_ENCRYPTION_KEY is not configured');
  }
  const [ivHex, tagHex, dataHex] = String(payload || '').split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted payload');
  }
  const decipher = createDecipheriv(ALGO, keyFromSecret(masterKey), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

export function lastFour(value: string): string {
  const trimmed = String(value || '');
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(-4);
}
