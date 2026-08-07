import crypto from 'crypto';
import { logSecurityAudit } from './audit';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

let runtimeDevKeyBuffer: Buffer | null = null;

/**
 * Derives a 256-bit Key from the environment variable or runtime ephemeral key
 */
function getMasterKey(): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  const envKey = process.env.MASTER_ENCRYPTION_KEY;

  if (isProduction && (!envKey || envKey.trim().length === 0)) {
    logSecurityAudit('ENCRYPTION_FAILED', { path: 'src/lib/encryption.ts' }, { error: 'CRITICAL: MASTER_ENCRYPTION_KEY is missing in production environment.' });
    throw new Error('FATAL SECURITY ERROR: MASTER_ENCRYPTION_KEY environment variable is required in production mode.');
  }

  if (envKey && envKey.trim().length > 0) {
    return crypto.pbkdf2Sync(envKey, 'oprox_os_salt_v2', 100000, 32, 'sha256');
  }

  // Non-production fallback: generate a process-runtime ephemeral key (never hardcoded/committed)
  if (!runtimeDevKeyBuffer) {
    runtimeDevKeyBuffer = crypto.randomBytes(32);
  }
  return runtimeDevKeyBuffer;
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * Format: aes256gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // Prevent double encryption

  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const ivHex = iv.toString('hex');

    return `aes256gcm:${ivHex}:${authTag}:${encrypted}`;
  } catch (err: any) {
    logSecurityAudit('ENCRYPTION_FAILED', { path: 'src/lib/encryption.ts' }, { error: err?.message || err });
    if (err?.message?.includes('FATAL SECURITY ERROR')) {
      throw err;
    }
    throw new Error('Failed to encrypt secret key.');
  }
}

/**
 * Decrypts an AES-256-GCM formatted ciphertext.
 */
export function decryptSecret(encryptedString: string): string {
  if (!encryptedString) return encryptedString;
  if (!isEncrypted(encryptedString)) return encryptedString; // Return plaintext if not encrypted format

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 4 || parts[0] !== 'aes256gcm') {
      throw new Error('Invalid ciphertext format.');
    }

    const [, ivHex, authTagHex, ciphertextHex] = parts;

    const masterKey = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err: any) {
    logSecurityAudit('DECRYPTION_FAILED', { path: 'src/lib/encryption.ts' }, { error: err?.message || err });
    if (err?.message?.includes('FATAL SECURITY ERROR')) {
      throw err;
    }
    throw new Error('Decryption failed: Ciphertext may be corrupted, tampered with, or key mismatch.');
  }
}

/**
 * Helper to check if a string matches the encrypted format.
 */
export function isEncrypted(value: string): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('aes256gcm:');
}

/**
 * Safely encrypts a string if it's plaintext, or returns as-is if already encrypted.
 */
export function encryptIfPlaintext(value: string): string {
  if (!value) return value;
  if (isEncrypted(value)) return value;
  return encryptSecret(value);
}

/**
 * Safely decrypts a string if it's encrypted, or returns as-is if plaintext.
 */
export function decryptIfEncrypted(value: string): string {
  if (!value) return value;
  if (!isEncrypted(value)) return value;
  return decryptSecret(value);
}
