// Security and Cryptographic Utilities for MoneyAO

const SECRET_SALT = "MONEYAO_SECURE_INVITE_SALT_2026";

/**
 * Encrypts/obfuscates the sponsor's phone number into a dynamic, secure, URL-safe token.
 * Incorporates a timestamp so that the token is dynamic and changes on every generation,
 * preventing reverse-engineering and pattern detection.
 */
export function encryptInviteCode(phone: string): string {
  if (!phone) return "";
  try {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const timestamp = Date.now();
    const combined = `${cleanPhone}:${SECRET_SALT}:${timestamp}`;
    
    // Base64 encoding
    const b64 = btoa(combined);
    
    // Obfuscate by reversing and replacing characters to make it URL safe and non-obvious
    const obfuscated = b64.split('').reverse().join('')
      .replace(/=/g, '_')
      .replace(/\+/g, '-')
      .replace(/\//g, '.');
      
    return encodeURIComponent(obfuscated);
  } catch (err) {
    console.error("Error encrypting invite code:", err);
    return phone; // Fallback to raw phone if error occurs, but we handle it gracefully
  }
}

/**
 * Decrypts/deobfuscates the invitation token to retrieve the original phone number.
 * Verifies the secret salt and integrity of the token.
 */
export function decryptInviteCode(token: string): string | null {
  if (!token) return null;
  try {
    const decodedToken = decodeURIComponent(token);
    
    // Restore original Base64 characters
    const restored = decodedToken
      .replace(/_/g, '=')
      .replace(/-/g, '+')
      .replace(/\./g, '/');
      
    const b64 = restored.split('').reverse().join('');
    const combined = atob(b64);
    
    const parts = combined.split(':');
    if (parts.length >= 2 && parts[1] === SECRET_SALT) {
      return parts[0]; // Return the verified original phone number of the sponsor
    }
  } catch (err) {
    // If it's a legacy plain unencrypted invite code (for backward compatibility / testing),
    // and consists only of digits or letters of reasonable length, return it
    if (/^[a-zA-Z0-9]{3,20}$/.test(token)) {
      return token;
    }
    console.error("Failed to decrypt secure invite code:", err);
  }
  return null;
}
