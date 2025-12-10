import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export type SignedProof = {
  message: string;
  signature: string;
  signer: string;
  signedAt?: string;
};

type SignedProofContextValue = {
  proof: SignedProof | null;
  setProof: (value: SignedProof | null) => void;
};

const SignedProofContext = createContext<SignedProofContextValue | undefined>(undefined);
const STORAGE_KEY = "miniapp:signed-proof";

function loadInitialProof(): SignedProof | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SignedProof) : null;
  } catch {
    return null;
  }
}

export function SignedProofProvider({ children }: { children: ReactNode }) {
  const [proof, setProof] = useState<SignedProof | null>(() => loadInitialProof());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (proof) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proof));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [proof]);

  return <SignedProofContext.Provider value={{ proof, setProof }}>{children}</SignedProofContext.Provider>;
}

export function useSignedProof() {
  const context = useContext(SignedProofContext);
  if (!context) {
    throw new Error("useSignedProof must be used inside SignedProofProvider");
  }

  return context;
}
