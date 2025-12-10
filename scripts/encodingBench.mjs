import { deflateSync } from "node:zlib";
import { encode as encodeCodec, strip0x } from "proof-link-codec";

const toBase64Url = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const sample = {
  text: "This is my message.",
  signature:
    "0xd98f53bc52e3f4e01530412f5c0ad3c55d54b6b671799e6df326c52afabcad0f23c0820098a511cf873a025f89fcd46453844079512ead86aab7463c8561ffdd91c",
  doi: "2025-12-09T19:45:30.255Z",
  signer: "0x6A9AeE50B363025E25137195f04295bDF14a4bcE",
};

const toCompact = (payload) => ({
  t: payload.text,
  s: strip0x(payload.signature),
  v: 1,
  d: payload.doi,
  r: strip0x(payload.signer),
});

const encodeJsonDeflate = (payload) => {
  const compact = toCompact(payload);
  const compressed = deflateSync(JSON.stringify(compact));
  return toBase64Url(compressed);
};

const encodeCborDeflate = (payload) => encodeCodec(toCompact(payload));

const jsonEncoded = encodeJsonDeflate(sample);
const cborEncoded = encodeCborDeflate(sample);

console.log("Baseline JSON+deflate+base64url length:", jsonEncoded.length);
console.log("CBOR   +deflate+base64url length:", cborEncoded.length);
console.log("Delta:", jsonEncoded.length - cborEncoded.length, "chars");
