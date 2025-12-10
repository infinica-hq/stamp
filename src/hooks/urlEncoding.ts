import { add0x, decode as decodeCodec, encode as encodeCodec, strip0x } from "proof-link-codec";

export type Claim = {
  text: string;
  signature: string;
  signer?: string;
  doi?: string;
};

export type ProofCompact = {
  t: string; // text
  s: string; // signature (no 0x)
  d?: number | string; // date of issue, unix seconds (pref) or legacy ISO string
  r?: string; // signer (no 0x)
  v: 1; // version
};

const toUnixSeconds = (value?: string | number): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  const date = new Date(value);
  const seconds = Math.floor(date.getTime() / 1000);
  return Number.isFinite(seconds) ? seconds : undefined;
};

const toCompact = (payload: Claim): ProofCompact => ({
  t: payload.text,
  s: strip0x(payload.signature),
  v: 1,
  ...(payload.doi ? { d: toUnixSeconds(payload.doi) } : {}),
  ...(payload.signer ? { r: strip0x(payload.signer) } : {}),
});

const fromCompact = (compact: ProofCompact): Claim => {
  const doi =
    typeof compact.d === "number"
      ? new Date(compact.d * 1000).toISOString()
      : typeof compact.d === "string"
        ? compact.d
        : undefined;
  return {
    text: compact.t,
    signature: add0x(compact.s),
    doi,
    signer: compact.r ? add0x(compact.r) : undefined,
  };
};

export const encodeSharedProof = async (payload: Claim): Promise<string> => {
  return encodeCodec(toCompact(payload));
};

export const decodeProofFromUrlParam = (data: string): Claim | null => {
  try {
    const parsed = decodeCodec(data) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const compact = parsed as Partial<ProofCompact>;
    if (compact.v !== 1 || typeof compact.t !== "string" || typeof compact.s !== "string") {
      return null;
    }

    return fromCompact(compact as ProofCompact);
  } catch {
    return null;
  }
};

export const decodeSharedProof = async (value: string | null): Promise<Claim | null> => {
  if (!value) return null;
  return decodeProofFromUrlParam(value);
};
