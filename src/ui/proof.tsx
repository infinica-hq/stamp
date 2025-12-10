import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMessage } from "viem";
import { useDisconnect } from "wagmi";
import { type Claim, decodeSharedProof, encodeSharedProof } from "../hooks/urlEncoding";
import { isMiniApp } from "../hooks/useMiniApp";
import { useEphemeralFlag } from "../hooks/useUtils";
import { useSignedProof } from "../state/signedProof";

export function Proof({ summary = false }) {
  const { proof, setProof } = useSignedProof();
  const { value: showShareToast, trigger: triggerShareToast } = useEphemeralFlag(2000);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sharedProof, setSharedProof] = useState<Claim | null>(null);

  const { disconnectAsync } = useDisconnect();
  const formatUtc = (isoString: string): string => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
  };

  useEffect(() => {
    let cancelled = false;
    const encoded = searchParams.get("data");

    if (!encoded) {
      setSharedProof(null);
      return undefined;
    }

    const parseSharedProof = async () => {
      const decoded = await decodeSharedProof(encoded);
      if (!cancelled) {
        setSharedProof(decoded);
      }
    };

    parseSharedProof();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verified" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!sharedProof?.signer) {
        setVerificationStatus("failed");
        return;
      }
      try {
        const result = await verifyMessage({
          address: sharedProof.signer as `0x${string}`,
          message: sharedProof.text,
          signature: sharedProof.signature as `0x${string}`,
        });
        if (!cancelled) {
          setVerificationStatus(result ? "verified" : "failed");
        }
      } catch {
        if (!cancelled) {
          setVerificationStatus("failed");
        }
      }
    }

    if (sharedProof) {
      setVerificationStatus("idle");
      verify();
    }

    return () => {
      cancelled = true;
    };
  }, [sharedProof]);

  const handleShare = async () => {
    if (!proof) {
      return;
    }

    const now = new Date();

    const url = new URL(window.location.href);
    url.search = "";
    const payload: Claim = {
      text: proof.message,
      signature: proof.signature,
      doi: now.toISOString(),
      signer: proof.signer,
    };
    url.searchParams.set("data", await encodeSharedProof(payload));
    const shareUrl = url.toString();
    const shareText = `${proof.message}
Proof link: ${shareUrl}`;
    const title = "Proof Stamp";

    const showToast = (message: string) => {
      setShareToastMessage(message);
      triggerShareToast();
    };

    if (await isMiniApp()) {
      try {
        const result = await sdk.actions.composeCast({
          text: shareText,
          embeds: [shareUrl],
        });
        showToast(result?.cast ? "Cast shared on Farcaster" : "Cast composer opened");
        return;
      } catch (error) {
        showToast(`Sorry, failed to compose a Cast! ${error}`);
      }
    }

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl, text: shareText });
        showToast("Sharing opened");
        return;
      }
    } catch {
      // fall through to clipboard
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        showToast("Proof copied");
      } else {
        window.prompt("Copy this link:", shareText);
      }
    } catch {
      window.prompt("Copy this link:", shareText);
    }
  };

  const handleDisconnect = async () => {
    await disconnectAsync();
    setProof(null);
    navigate("/", { replace: true });
  };

  const isValid = verificationStatus === "verified";
  const isChecking = verificationStatus === "idle";

  return (
    <section className="proof-view">
      {!sharedProof && (
        <>
          <div className="step-intro">
            <span>
              <p className="proof-label">Step 2</p>
              <h2>Publish your proof</h2>
            </span>
            <p>Share a link anyone can verify.</p>
            <div className="share-pill">Verifiable link</div>
          </div>

          <div className="proof-card proof-card--share">
            {!proof && <p className="proof-hint">Sign once, then share. Technical details are optional.</p>}

            <button className="proof-share-button" disabled={!proof} onClick={handleShare} type="button">
              {proof ? "Share" : "Sign first"}
            </button>

            {showShareToast && shareToastMessage && <p className="proof-toast">{shareToastMessage}</p>}

            {summary && proof && !showShareToast && (
              <div className="proof-signed-preview">
                <p>Proof message</p>
                <code>{proof.message}</code>
                <p>
                  Signer:
                  <br />
                  <code>{proof.signer}</code>
                </p>
                <p>
                  Signature:
                  <br />
                  <code>{proof.signature}</code>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {sharedProof && (
        <div className="shared-proof-wrap">
          <div className="status-banner">
            <div
              className={`status-pill ${isValid ? "status-pill--valid" : isChecking ? "status-pill--checking" : "status-pill--invalid"}`}
            >
              <span aria-hidden="true" className="status-icon">
                {isChecking ? "…" : isValid ? "✓" : "✕"}
              </span>
              <span className="status-text">
                {isChecking && "Checking proof"}
                {isValid && "Valid proof"}
                {!isValid && !isChecking && "Invalid proof"}
              </span>
            </div>
            <p className="status-subtext">
              {isChecking
                ? "Verifying the signature."
                : isValid
                  ? "Signature matches the claim."
                  : "Signature does not match the claim."}
            </p>
          </div>

          <div className="proof-card proof-card--shared">
            <p className="proof-label">Claim</p>
            <p className={`shared-proof-message ${isValid ? "valid" : isChecking ? "pending" : "invalid"}`}>
              {sharedProof.text}
            </p>

            <div className="shared-proof-grid">
              {sharedProof.signer && (
                <div className="shared-proof-tile">
                  <p className="proof-label">Claimed by</p>
                  <code className="shared-proof-mono">{sharedProof.signer}</code>
                </div>
              )}

              {sharedProof.doi && (
                <div className="shared-proof-tile">
                  <p className="proof-label">Shared at</p>
                  <code className="shared-proof-mono">{formatUtc(sharedProof.doi)}</code>
                </div>
              )}
            </div>

            <details className="tech-details">
              <summary className="proof-label">See technical details</summary>
              <p className="shared-proof-signature">
                Cryptographic Proof:
                <br />
                <code>{sharedProof.signature}</code>
              </p>
            </details>
          </div>
        </div>
      )}

      {proof && (
        <button className="proof-disconnect-button" onClick={handleDisconnect} type="button">
          Disconnect wallet
        </button>
      )}
    </section>
  );
}
