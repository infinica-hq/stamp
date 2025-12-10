import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useConnect, useConnection, useConnectors } from "wagmi";
import { useEphemeralFlag, useTruncatedAddress, useTruncatedSignature } from "../../hooks/useUtils";
import { useSignedProof } from "../../state/signedProof";
import { SignButton } from "./sign_button";

export function ConnectMenu() {
  const { isConnected, address } = useConnection();
  const { connect, isPending, error, status } = useConnect();
  const connectors = useConnectors();
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const { proof, setProof } = useSignedProof();
  const [showAddressTooltip, setShowAddressTooltip] = useState(false);
  const defaultMessage = "I control this wallet and my Farcaster account.";
  const [message, setMessage] = useState(() => proof?.message ?? defaultMessage);
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    if (proof && !hasTyped) {
      setMessage(proof.message);
    }
  }, [proof, hasTyped]);

  useEffect(() => {
    if (selectedConnectorId === null && connectors.length > 0) {
      setSelectedConnectorId(connectors[0]?.uid ?? connectors[0]?.id ?? null);
    }
  }, [connectors, selectedConnectorId]);

  useEffect(() => {
    setShowAddressTooltip(false);
  }, []);

  const selectedConnector = useMemo(() => {
    if (!selectedConnectorId) {
      return null;
    }

    return (
      connectors.find((connector) => connector.uid === selectedConnectorId || connector.id === selectedConnectorId) ??
      null
    );
  }, [connectors, selectedConnectorId]);

  const handleConnect = () => {
    if (selectedConnector) {
      connect({ connector: selectedConnector });
    }
  };

  const { value: proofCopied, trigger: triggerProofCopied } = useEphemeralFlag(500);
  const truncatedAddress = useTruncatedAddress(address);

  const truncatedSignature = useTruncatedSignature(proof?.signature);

  const handleAddressClick = () => {
    if (!address) {
      return;
    }
    navigator.clipboard.writeText(address);
    setShowAddressTooltip((previous) => !previous);
  };

  const handleAddressKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleAddressClick();
    }
  };

  if (!isConnected) {
    return (
      <div className="connect-wallet-panel">
        <h3>Connect wallet</h3>
        <label className="connector-select">
          Choose wallet
          <select
            disabled={!connectors.length || isPending}
            onChange={(event) => setSelectedConnectorId(event.target.value)}
            value={selectedConnectorId ?? ""}
          >
            {connectors.map((connector) => {
              const optionValue = connector.uid ?? connector.id;
              return (
                <option key={optionValue} value={optionValue}>
                  {connector.name}
                </option>
              );
            })}
          </select>
        </label>

        <button disabled={!selectedConnector || isPending} onClick={handleConnect} type="button">
          {isPending ? "Connecting…" : "Connect"}
        </button>

        <div className="align-center">
          <p className="connector-status">Connection: {status}</p>
          {(error?.message?.includes("undefined") && <p className="connector-error">❌ No Wallet?</p>) ||
            (error?.message?.includes("rejected") && <p className="connector-error">❌ Why Rejected?</p>) ||
            (error && <p className="connector-error">❌ {error?.message}</p>)}
        </div>
      </div>
    );
  }

  const copyProofToClipboard = () => {
    if (!proof) return;
    navigator.clipboard.writeText(proof.signature);
    triggerProofCopied();
  };

  return (
    <div className="connected-wallet-panel">
      <div className="center-wrap">
        <span className="wallet-address-display">
          <code
            onBlur={() => setShowAddressTooltip(false)}
            onClick={handleAddressClick}
            onKeyDown={handleAddressKeyDown}
            tabIndex={0}
          >
            {truncatedAddress}
          </code>
          {showAddressTooltip && address && <span className="wallet-address-tooltip">{address}</span>}
        </span>
      </div>
      <label className="sign-message-input">
        your Statement
        <textarea
          onChange={(event) => {
            setHasTyped(true);
            setMessage(event.target.value);
          }}
          placeholder="Short claim others can verify"
          rows={3}
          value={message}
        />
      </label>

      <SignButton
        disabled={!!proof && message === proof.message}
        message={message}
        onSigned={(signature, payload) => {
          if (!address) {
            return;
          }
          setProof({
            signature,
            message: payload,
            signer: address,
            signedAt: new Date().toISOString(),
          });
        }}
      />

      {proof && (
        <div className="proof-summary">
          <p className="proof-summary-signature">
            Latest signature:
            <br />
            <code className="cursor-pointer" onClick={copyProofToClipboard} onKeyDown={copyProofToClipboard}>
              {proofCopied ? "Copied to clipboard" : truncatedSignature}
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
