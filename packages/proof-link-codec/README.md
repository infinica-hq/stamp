# proof-link-codec

Tiny helper to CBOR+DEFLATE and base64url encode/decode JSON-safe objects for URLs, casts, and QR codes. No backend required.

TODO: to be published.

## Install
```bash
npm install proof-link-codec
# or pnpm add proof-link-codec
```

## Usage
```ts
import { encode, decode, strip0x, add0x } from "proof-link-codec";

type Proof = { t: string; s: string; v: 1 };

const compact: Proof = { t: "hello", s: strip0x("0xabc123"), v: 1 };

const b64url = encode(compact);   // -> "H4sIAAAAA..."
const back = decode<Proof>(b64url); // -> { t: "hello", s: "abc123", v: 1 }
```

## What it does
- CBOR-encodes your object.
- DEFLATE-compresses the bytes.
- Base64url-encodes for safe use in query params.
- Works in browsers and Node (falls back to Buffer if atob/btoa are missing).

## Optional encryption hooks
You can plug in your own encryption layer (synchronous) on top of compression:

```ts
import { encode, decode } from "proof-link-codec";
import { encryptBytes, decryptBytes } from "./crypto"; // your functions

const token = encode(payload, { encrypt: encryptBytes });
const payloadBack = decode(token, { decrypt: decryptBytes });
```

The `encrypt` hook receives the compressed `Uint8Array` and should return another `Uint8Array`. The matching `decrypt` hook reverses it before inflating and decoding CBOR.

## Notes
- Input must be JSON-safe.
- Keep payloads versioned if you expect to evolve the format.
- If you work with hex strings, use `strip0x` / `add0x` to save a few bytes.
