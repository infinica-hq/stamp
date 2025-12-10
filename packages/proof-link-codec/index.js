import { decode as decodeCbor, encode as encodeCbor } from "cbor-x";
import { deflate, inflate } from "pako";

const toBase64 = (bytes) => {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Node.js fallback
  return Buffer.from(bytes).toString("base64");
};

const fromBase64 = (value) => {
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(value, "base64"));
};

const toBase64Url = (bytes) => toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value) => {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return fromBase64(base64);
};

/**
 * Encode any JSON-safe object into a compact base64url string using CBOR + DEFLATE.
 * @template T
 * @param {T} payload
 * @param {{ encrypt?: (bytes: Uint8Array) => Uint8Array }} [options]
 * @returns {string}
 */
export const encode = (payload, options) => {
  const encoded = encodeCbor(payload);
  const compressed = deflate(encoded);
  const maybeEncrypted = options?.encrypt ? options.encrypt(compressed) : compressed;
  return toBase64Url(maybeEncrypted);
};

/**
 * Decode a base64url string produced by `encode` back into an object.
 * @template T
 * @param {string} value
 * @param {{ decrypt?: (bytes: Uint8Array) => Uint8Array }} [options]
 * @returns {T}
 */
export const decode = (value, options) => {
  const compressed = fromBase64Url(value);
  const maybeDecrypted = options?.decrypt ? options.decrypt(compressed) : compressed;
  const decompressed = inflate(maybeDecrypted);
  return decodeCbor(decompressed);
};

/**
 * Utility to strip a 0x prefix from hex strings.
 * @param {string} hex
 * @returns {string}
 */
export const strip0x = (hex) => (hex.startsWith("0x") ? hex.slice(2) : hex);

/**
 * Utility to add a 0x prefix to hex strings.
 * @param {string} hex
 * @returns {string}
 */
export const add0x = (hex) => (hex.startsWith("0x") ? hex : `0x${hex}`);
