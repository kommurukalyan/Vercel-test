import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { isEmpty } from 'lodash';

/**
 * Generate an authentication token for a user
 * @export
 * @param {Object} user - A User object
 * @param {boolean} isConsumer - Flag to check if this is for consumer
 * @returns
 */
export function generateToken(user: any) {
  const payload = {
    id: user.id,
    user: {
      id: user.id,
    },
  };
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string, {
    expiresIn: '30 days',
    algorithm: 'HS256',
  });
}

/**
 * Generate a random clientId or API key.
 * @param length The length of the key. Default is 22.
 * @param includePrefx Flag to include prefix or not
 * @returns A random key.
 */
export function generateUniqueKey(
  length: number = 22,
  includePrefx: boolean = true,
): string {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const key = Array.from(crypto.randomFillSync(Buffer.alloc(length)))
    .map((byte) => characters[byte % characters.length])
    .join('');
  if (!includePrefx) {
    return key;
  }
  const keyWithPrefix = `${
    process.env.CLIENT_ID_PREFIX || 'diyinspectbkp_'
  }${key}`;
  return keyWithPrefix;
}

/**
 * Generate a random clientSecret.
 * @param length The length of the clientSecret. Default is 24.
 * @returns A random clientSecret.
 */
export function generateClientSecret(
  length: number = 24,
  testKey: boolean = false,
): string {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_+.';
  const key = Array.from(crypto.randomFillSync(Buffer.alloc(length)))
    .map((byte) => characters[byte % characters.length])
    .join('');
  if (testKey) {
    return `${process.env.TEST_KEY_PREFIX}${key}`;
  }
  return `${process.env.LIVE_KEY_PREFIX}${key}`;
}

// Exclude keys from user
export function exclude(
  incomingData: Record<string, any>,
  keys: string[],
): Record<string, any> {
  if (isEmpty(incomingData)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(incomingData).filter(([key]) => !keys.includes(key)),
  );
}
