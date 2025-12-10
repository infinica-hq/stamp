import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hashMessage } from "viem";
import { useSignMessage } from "wagmi";

type SignButtonProps = {
  message: string;
  buttonLabel?: string;
  disabled?: boolean;
  showHash?: boolean;
  onSigned?: (signature: string, payload: string) => void;
};

export function SignButton({
  message,
  buttonLabel = "Sign",
  disabled = false,
  showHash = false,
  onSigned,
}: SignButtonProps) {
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const actualMessage = message;
  const isMessageBlank = actualMessage.trim().length === 0;
  const navigate = useNavigate();

  const hashedMessage = useMemo(() => {
    if (isMessageBlank) {
      return "";
    }

    return hashMessage(actualMessage);
  }, [actualMessage, isMessageBlank]);

  const { signMessage, isPending, data, error } = useSignMessage({
    mutation: {
      onSuccess(signature, variables) {
        const payload = typeof variables?.message === "string" ? variables.message : actualMessage;
        setLastPayload(payload);
        onSigned?.(signature, payload);
        navigate("/proof", { replace: true });
      },
    },
  });

  const handleSign = () => {
    if (isMessageBlank) {
      return;
    }

    signMessage({ message: actualMessage });
  };

  const isButtonDisabled = disabled || isPending || isMessageBlank;

  return (
    <div className="sign-message-panel">
      {showHash && (
        <>
          <p className="sign-message-label">Statement hash:</p>
          <code className="sign-message-hash">
            {isMessageBlank ? "Enter a message to see its hash" : hashedMessage}
          </code>
        </>
      )}

      <button disabled={isButtonDisabled} onClick={handleSign} type="button">
        {isPending ? "Signing…" : disabled ? "Already Signed" : buttonLabel}
      </button>

      {data && lastPayload && (
        <p className="sign-message-status success">
          ✅ Signed payload:
          <br />
          <code>{lastPayload}</code>
          <br />
          Signature:
          <br />
          <code>{data}</code>
        </p>
      )}

      {error && <p className="sign-message-status error">❌ {error.message}</p>}
    </div>
  );
}
