export type Claim = {
  text: string;
  signature: string;
  signer?: string;
  doi?: string;
};

const encodeBase64 = (value: string) =>
  btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number(`0x${hex}`)),
    ),
  );

const decodeBase64 = (value: string) =>
  decodeURIComponent(
    atob(value)
      .split("")
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );

export const encodeSharedProof = (payload: Claim): string =>
  encodeBase64(JSON.stringify(payload));

export const decodeSharedProof = (value: string | null): Claim | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeBase64(value)) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const message = record.text;
    const signature = record.signature;

    if (typeof message !== "string" || typeof signature !== "string") {
      return null;
    }

    const dateOfIssue =
      typeof record.dio === "string" ? record.dio : undefined;
    const signer =
      typeof record.signer === "string" ? record.signer : undefined;

    return {
      text: message,
      signature,
      doi: dateOfIssue,
      signer,
    };
  } catch {
    return null;
  }
};
