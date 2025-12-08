import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { useConnection, useConnect, useConnectors, useSignMessage } from "wagmi";

function App() {
  useEffect(() => {
    const id = setTimeout(() => {
      sdk.actions.ready();
    }, 3 * 1000);

    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <div>Hello World</div>
      <ConnectMenu />
    </>
  );
}

function ConnectMenu() {
  const { isConnected, address, } = useConnection();
  const { connect } = useConnect();
  const connectors = useConnectors();

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <>
      <button type="button" onClick={() => signMessage({ message: "hello world" })} disabled={isPending}>
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}

export default App;
