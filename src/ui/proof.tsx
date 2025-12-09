import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMessage } from "viem";
import { useSignedProof } from "../state/signedProof";
import { useDisconnect } from "wagmi";
import { useEphemeralFlag } from "../hooks/useUtils";
import { isMiniApp } from "../hooks/useMiniApp";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  Claim,
  encodeSharedProof,
  decodeSharedProof,
} from "../hooks/urlEncoding";

export function Proof({ summary = false }) {
  const { proof, setProof } = useSignedProof();
  const { value: showShareToast, trigger: triggerShareToast } = useEphemeralFlag(2000);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { disconnectAsync } = useDisconnect();

  const sharedProof = useMemo(() => {
    const encoded = searchParams.get("data");
    return encoded ? decodeSharedProof(encoded) : null;
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

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

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
    url.searchParams.set("data", encodeSharedProof(payload));
    const shareUrl = url.toString();
    const timestamp = `${dateFormatter.format(now)} ${timeFormatter.format(now)}`;
    const shareText = `${proof.message}
Proof Stamp
Timestamp: ${timestamp}
Signer: ${proof.signer}
Signature: ${proof.signature}
Link: ${shareUrl}`;
    const title = "Proof Ping";

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
      {!sharedProof &&
        <>
          <div className="share-hero">
            <p className="proof-label">Step 2</p>
            <h2 className="share-title">Publish your proof</h2>
            <p className="share-lead">
              Share a link anyone can verify.
            </p>
            <div className="share-pill">Verifiable link</div>

          </div>

          <div className="proof-card proof-card--share">

            {!proof && (
              <p className="proof-hint">
                Sign once, then share. Technical details are optional.
              </p>
            )}

            <button
              type="button"
              className="proof-share-button"
              onClick={handleShare}
              disabled={!proof}
            >
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
      }

      {sharedProof && (
        <div className="shared-proof-wrap">
          <div className="status-banner">
            <div className={`status-pill ${isValid ? "status-pill--valid" : isChecking ? "status-pill--checking" : "status-pill--invalid"}`}>
              <span className="status-icon" aria-hidden="true">
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
                  <code className="shared-proof-mono">{sharedProof.doi}</code>
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


      {proof &&
        <button
          type="button"
          className="proof-disconnect-button"
          onClick={handleDisconnect}
        >
          Disconnect wallet
        </button>
      }
    </section>
  );
}
