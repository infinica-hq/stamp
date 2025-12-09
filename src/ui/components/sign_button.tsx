import { useMemo, useState } from "react";
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
  buttonLabel = "Sign message",
  disabled = false,
  showHash = true,
  onSigned,
}: SignButtonProps) {
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const actualMessage = message;
  const isMessageBlank = actualMessage.trim().length === 0;

  const hashedMessage = useMemo(() => {
    if (isMessageBlank) {
      return "";
    }

    return hashMessage(actualMessage);
  }, [actualMessage, isMessageBlank]);

  const { signMessage, isPending, data, error } = useSignMessage({
    mutation: {
      onSuccess(signature, variables) {
        const payload =
          typeof variables?.message === "string"
            ? variables.message
            : actualMessage;
        setLastPayload(payload);
        onSigned?.(signature, payload);
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
          <p className="sign-message-label">Message hash:</p>
          <code className="sign-message-hash">
            {isMessageBlank ? "Enter a message to see its hash" : hashedMessage}
          </code>
        </>
      )}

      <button type="button" onClick={handleSign} disabled={isButtonDisabled}>
        {isPending ? "Signing…" : buttonLabel}
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

      {error && (
        <p className="sign-message-status error">
          ❌ {error.message}
        </p>
      )}
    </div>
  );
}
