import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConnection } from "wagmi";
import { SignButton } from "./components/sign_button";

type SignedMoment = {
  message: string;
  signature: string;
};

export function Moment() {
  const { isConnected } = useConnection();
  const [now, setNow] = useState(() => new Date());
  const [justCopied, setJustCopied] = useState(false);
  const [signedMoment, setSignedMoment] = useState<SignedMoment | null>(null);
  const [searchParams] = useSearchParams();

  const sharedMoment = useMemo(() => {
    const message = searchParams.get("message");
    const signature = searchParams.get("signature");
    if (!message || !signature) {
      return null;
    }

    return { message, signature } satisfies SignedMoment;
  }, [searchParams]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const momentMessage = useMemo(() => {
    return `Moment captured on ${dateFormatter.format(now)} at ${timeFormatter.format(now)} (${now.toISOString()})`;
  }, [dateFormatter, now, timeFormatter]);

  const handleShare = async () => {
    if (!signedMoment) {
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("message", signedMoment.message);
    url.searchParams.set("signature", signedMoment.signature);
    const shareUrl = url.toString();
    const title = "The Moment in a MiniApp";

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl, text: signedMoment.message });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
      } else {
        window.prompt("Copy this link:", shareUrl);
      }
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  return (
    <section className="moment-view">
      <div className="moment-card">
        <p className="moment-label">Now is</p>
        <h2 className="moment-date">{dateFormatter.format(now)}</h2>
        <p className="moment-time">{timeFormatter.format(now)}</p>

        <SignButton
          message={momentMessage}
          buttonLabel={isConnected ? "Sign this moment" : "Connect to sign"}
          disabled={!isConnected}
          showHash={false}
          onSigned={(signature, payload) => setSignedMoment({ signature, message: payload })}
        />

        {!isConnected && (
          <p className="moment-hint">
            Connect your wallet on the Sign tab to capture a signature for this moment.
          </p>
        )}

        <button
          type="button"
          className="moment-share-button"
          onClick={handleShare}
          disabled={!signedMoment}
        >
          {signedMoment ? "Share signed moment" : "Sign a moment to share"}
        </button>

        {justCopied && <p className="moment-toast">Link copied to clipboard</p>}

        {signedMoment && !justCopied && (
          <p className="moment-signed-preview">
            Signed payload ready to share:
            <br />
            <code>{signedMoment.message}</code>
            <br />
            Signature:
            <br />
            <code>{signedMoment.signature}</code>
          </p>
        )}
      </div>

      {sharedMoment && (
        <div className="moment-card moment-card--shared">
          <p className="moment-label">Shared with you</p>
          <h3>Signed moment</h3>
          <p className="shared-moment-message">{sharedMoment.message}</p>
          <p className="shared-moment-signature">
            Signature:
            <br />
            <code>{sharedMoment.signature}</code>
          </p>
        </div>
      )}
    </section>
  );
}
