import { useMemo, useState } from "react";

export const useTruncatedSignature = (signature: string | undefined): string =>
  useMemo(() => {
    if (!signature) {
      return "";
    }
    return `${signature.slice(0, 10)}…${signature.slice(-10)}`;
  }, [signature]);

export const useTruncatedAddress = (address: string | undefined): string =>
  useMemo(() => {
    if (!address) {
      return "";
    }
    if (address.length <= 8) {
      return address;
    }
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
  }, [address]);

export function useEphemeralFlag(durationMs: number) {
  const [value, setValue] = useState(false);

  const trigger = () => {
    setValue(true);
    setTimeout(() => setValue(false), durationMs);
  };

  return { value, trigger };
}
