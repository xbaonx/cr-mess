const te = new TextEncoder();
const td = new TextDecoder();

function getRandomBytes(length: number) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

async function getKeyMaterial(pin: string) {
  return crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  // Create a true ArrayBuffer copy to satisfy TS BufferSource typing
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

async function deriveKey(pin: string, salt: ArrayBuffer) {
  const keyMaterial = await getKeyMaterial(pin);
  return crypto.subtle.deriveKey(
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isValidPin(pin: string) {
  return /^\d{4,12}$/.test(pin);
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

export async function encryptMnemonic(mnemonic: string, pin: string): Promise<string> {
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const key = await deriveKey(pin, toArrayBuffer(salt));
  const ciphertext = await crypto.subtle.encrypt(
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

  // Base64-encode the JSON string to keep it compact
  return bytesToBase64(te.encode(JSON.stringify(payload)));
}

export async function decryptMnemonic(base64Payload: string, pin: string): Promise<string> {
  const json = td.decode(base64ToBytes(base64Payload));
  const payload = JSON.parse(json) as EncryptedPayload;
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const key = await deriveKey(pin, toArrayBuffer(salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(base64ToBytes(payload.ciphertext))
  );
  return td.decode(new Uint8Array(plaintext));
}
