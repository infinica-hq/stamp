import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMessage } from "viem";
import { useSignedProof } from "../state/signedProof";
import { useDisconnect } from "wagmi";


type SharedPing = {
  message: string;
  signature: string;
  sharedAt?: string;
  signer?: string;
};

export function Proof({ summary = false }) {
  const { proof, setProof } = useSignedProof();
  const [now, setNow] = useState(() => new Date());
  const [justCopied, setJustCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { disconnectAsync } = useDisconnect();

  const sharedProof = useMemo(() => {
    const message = searchParams.get("message");
    const signature = searchParams.get("signature");
    const sharedAt = searchParams.get("sharedAt") || undefined;
    const signer = searchParams.get("signer") || undefined;
    if (!message || !signature) {
      return null;
    }

    return { message, signature, sharedAt, signer } satisfies SharedPing;
  }, [searchParams]);

  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verified" | "failed">("idle");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
          message: sharedProof.message,
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

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("message", proof.message);
    url.searchParams.set("signature", proof.signature);
    url.searchParams.set("sharedAt", now.toISOString());
    url.searchParams.set("signer", proof.signer);
    const shareUrl = url.toString();
    const timestamp = `${dateFormatter.format(now)} ${timeFormatter.format(now)}`;
    const shareText = `${proof.message}

Timestamp: ${timestamp}
Signer: ${proof.signer}
Signature: ${proof.signature}
Link: ${shareUrl}`;
    const title = "Proof Ping";

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl, text: shareText });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
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

  return (
    <section className="proof-view">
      {!sharedProof &&
        <>
          <h2>2. Share!</h2>
          <p>Cast a timestamped proof.</p>
          <div className="proof-card">
            <p className="proof-label">Current Timestamp</p>
            <h2 className="proof-date">{dateFormatter.format(now)}</h2>
            <p className="proof-time">{timeFormatter.format(now)}</p>

            {!proof && (
              <p className="proof-hint">Sign first to unlock sharing.</p>
            )}

            <button
              type="button"
              className="proof-share-button"
              onClick={handleShare}
              disabled={!proof}
            >
              {proof ? "Share" : "Sign first"}
            </button>

            {justCopied && <p className="proof-toast">Link copied to clipboard</p>}

            {summary && proof && !justCopied && (
              <div className="proof-signed-preview">
                <p>Proof message</p>
                <code>{proof.message}</code>
                <p className="proof-signed-preview-timestamp">
                  Next ping timestamp:
                  <br />
                  <code>{now.toISOString()}</code>
                </p>
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
        <div className="proof-card proof-card--shared">
          <p className="proof-label">Shared with you</p>
          <h3>Verified ping</h3>
          <p className="shared-proof-message">{sharedProof.message}</p>
          {sharedProof.signer && (
            <p className="shared-proof-signer">
              Claimed signer:
              <br />
              <code>{sharedProof.signer}</code>
            </p>
          )}
          {verificationStatus === "verified" && (
            <p className="shared-proof-status success">Verified ✅</p>
          )}
          {verificationStatus === "failed" && (
            <p className="shared-proof-status error">Signature mismatch</p>
          )}
          {sharedProof.sharedAt && (
            <p className="shared-proof-timestamp">
              Timestamp:
              <br />
              <code>{sharedProof.sharedAt}</code>
            </p>
          )}
          <p className="shared-proof-signature">
            Signature (check with your preferred verifier):
            <br />
            <code>{sharedProof.signature}</code>
          </p>
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
