import * as OTPAuth from 'otpauth';

export interface TOTPResult {
  code: string;
  secondsRemaining: number;
  period: number;
}

/**
 * Generate a TOTP code for a given base32 secret.
 *
 * @param secret Base32 or spaced secret string.
 * @param period Time-step period in seconds (default 30).
 * @param digits Number of digits to return (default 6).
 * @returns TOTPResult containing the code, seconds remaining, and period.
 */
export function generateTOTP(secret: string, period = 30, digits = 6): TOTPResult {
  try {
    // Clean whitespace
    const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
    const totp = new OTPAuth.TOTP({
      issuer: 'Authenticator',
      label: 'Account',
      algorithm: 'SHA1',
      digits,
      period,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });

    const code = totp.generate();
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = period - (now % period);

    return {
      code,
      secondsRemaining,
      period,
    };
  } catch (err) {
    return {
      code: '------',
      secondsRemaining: 30,
      period: 30,
    };
  }
}

/**
 * Generate a random TOTP secret (base32).
 *
 * @returns A base32 encoded secret string suitable for provisioning.
 */
export function generateRandomSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}
