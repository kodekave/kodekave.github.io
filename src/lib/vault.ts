import { toBase64 } from "@/lib/github";

/**
 * Username and password sign-in for a site that has no server.
 *
 * Publishing needs a GitHub token, and a static site cannot keep a secret. So
 * the token is kept in the repository, encrypted: the key is derived from the
 * username and password with PBKDF2 (a deliberately slow function) and the
 * token is sealed with AES-GCM. Signing in is the browser unlocking that file.
 * Nothing is sent anywhere and no one else ever holds the token.
 *
 * The honest limit: the file is public, so the password is the only lock, and
 * anyone can try guesses against it on their own computer. A long passphrase
 * makes that impractical; a short or common password does not. Setup refuses
 * anything under 12 characters. The token itself can only change this one
 * repository and can be revoked on GitHub at any time.
 */

export const VAULT_PATH = "public/admin-vault.json";
/** Where the deployed site serves the vault from. */
const VAULT_URL = "/admin-vault.json";
const ITERATIONS = 600_000;
export const MIN_PASSWORD = 12;

export type Vault = {
  v: 1;
  kdf: "PBKDF2-SHA256";
  iter: number;
  salt: string;
  iv: string;
  data: string;
};

const enc = new TextEncoder();
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(
  username: string,
  password: string,
  salt: Uint8Array,
  iter: number
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(`${username.trim().toLowerCase()}\u0000${password}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Seal a token under a username and password. */
export async function createVault(
  token: string,
  username: string,
  password: string
): Promise<Vault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(username, password, salt, ITERATIONS);
  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(JSON.stringify({ token }))
  );
  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iter: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(sealed)),
  };
}

/** The token, or null when the username or password is wrong. */
export async function openVault(
  vault: Vault,
  username: string,
  password: string
): Promise<string | null> {
  try {
    const key = await deriveKey(username, password, fromB64(vault.salt), vault.iter);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(vault.iv) as BufferSource },
      key,
      fromB64(vault.data) as BufferSource
    );
    const { token } = JSON.parse(new TextDecoder().decode(plain)) as { token?: string };
    return token || null;
  } catch {
    // AES-GCM refuses to decrypt under the wrong key; that is the "wrong password" case.
    return null;
  }
}

/** The deployed vault, or null if none has been set up (or the site has not rebuilt yet). */
export async function fetchVault(): Promise<Vault | null> {
  let res: Response;
  try {
    res = await fetch(VAULT_URL, { cache: "no-store" });
  } catch {
    throw new Error("Could not reach the site. Check the connection and try again.");
  }
  if (!res.ok) return null;
  try {
    const v = (await res.json()) as Vault;
    return v && v.v === 1 && v.data && v.salt && v.iv ? v : null;
  } catch {
    return null;
  }
}
