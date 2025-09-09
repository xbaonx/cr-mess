import { webcrypto as nodeCrypto } from 'crypto';

const subtle = nodeCrypto.subtle;
const te = new TextEncoder();
const td = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

async function getKeyMaterial(pin: string) {
  return subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
}

async function deriveKey(pin: string, salt: ArrayBuffer) {
  const keyMaterial = await getKeyMaterial(pin);
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export type EncryptedPayload = {
  alg: 'PBKDF2-AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  hash: 'SHA-256';
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
};

export async function encryptMnemonicServer(mnemonic: string, pin: string): Promise<string> {
  const salt = nodeCrypto.getRandomValues(new Uint8Array(16));
  const iv = nodeCrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, toArrayBuffer(salt));
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(te.encode(mnemonic))
  );
  const payload: EncryptedPayload = {
    alg: 'PBKDF2-AES-GCM',
    kdf: 'PBKDF2',
    iterations: 100000,
    hash: 'SHA-256',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
  // Return base64 of JSON string (same as client format)
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export async function decryptMnemonicServer(base64Payload: string, pin: string): Promise<string> {
  const json = Buffer.from(base64Payload, 'base64').toString('utf8');
  const payload = JSON.parse(json) as EncryptedPayload;
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const key = await deriveKey(pin, toArrayBuffer(salt));
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(base64ToBytes(payload.ciphertext))
  );
  return td.decode(new Uint8Array(plaintext));
}
