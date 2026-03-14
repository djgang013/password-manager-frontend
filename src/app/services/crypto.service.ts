import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  // RAM-only Session Key for the Vault
  private sessionKey: CryptoKey | null = null;

  setSessionKey(key: CryptoKey) { this.sessionKey = key; }
  getSessionKey(): CryptoKey | null { return this.sessionKey; }

  // ==========================================
  // 1. HASHING & SALT (For Authentication)
  // ==========================================

  generateSalt(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return this.bufferToBase64(array.buffer);
  }

  async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const saltBuffer = this.base64ToBuffer(salt);
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return this.bufferToBase64(derivedBits);
  }

  // ==========================================
  // 2. AES-GCM ENCRYPTION (For Vault Data)
  // ==========================================

  async deriveAesKey(masterHash: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(masterHash),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('vault-encryption-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plainText: string, key: CryptoKey): Promise<{ cipherText: string, iv: string }> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(plainText)
    );

    return {
      cipherText: this.bufferToBase64(encryptedBuffer),
      iv: this.bufferToBase64(iv)
    };
  }

  async decrypt(cipherTextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
    const decoder = new TextDecoder();
    const iv = this.base64ToBuffer(ivBase64);
    const cipherText = this.base64ToBuffer(cipherTextBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      cipherText
    );

    return decoder.decode(decryptedBuffer);
  }

  // ==========================================
  // 3. BYTE CONVERSION HELPERS
  // ==========================================

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
