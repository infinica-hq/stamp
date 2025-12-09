import { useEffect, useMemo, useState } from "react";
import { useConnection, useConnect, useConnectors } from "wagmi";
import { SignButton } from "./sign_button";

export function ConnectMenu() {
  const { isConnected, address } = useConnection();
  const { connect, isPending, error, status } = useConnect();
  const connectors = useConnectors();
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState("Helloooooooo!");

  useEffect(() => {
    if (selectedConnectorId === null && connectors.length > 0) {
      setSelectedConnectorId(connectors[0]?.uid ?? connectors[0]?.id ?? null);
    }
  }, [connectors, selectedConnectorId]);

  const selectedConnector = useMemo(() => {
    if (!selectedConnectorId) {
      return null;
    }

    return (
      connectors.find(
        (connector) => connector.uid === selectedConnectorId || connector.id === selectedConnectorId,
      ) ?? null
    );
  }, [connectors, selectedConnectorId]);

  const handleConnect = () => {
    if (selectedConnector) {
      connect({ connector: selectedConnector });
    }
  };

  if (!isConnected) {
    return (
      <div className="connect-wallet-panel">
        <label className="connector-select">
          Wallet connector
          <select
            value={selectedConnectorId ?? ""}
            onChange={(event) => setSelectedConnectorId(event.target.value)}
            disabled={!connectors.length || isPending}
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

        <button type="button" onClick={handleConnect} disabled={!selectedConnector || isPending}>
          {isPending ? "Connecting…" : "Connect"}
        </button>

        <p className="connector-status">Status: {status}</p>
        {error && <p className="connector-error">❌ {error.message}</p>}
      </div>
    );
  }

  return (
    <div className="connected-wallet-panel">
      <p>
        Connected as <code>{address}</code>
      </p>
      <label className="sign-message-input">
        Message to sign
        <textarea
          value={message}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type anything you want to sign"
        />
      </label>

      <SignButton message={message} />
    </div>
  );
}
