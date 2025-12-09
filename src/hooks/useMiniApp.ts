import { sdk } from "@farcaster/miniapp-sdk";

export async function initMiniApp() {
  try {
    const isMiniApp = await sdk.isInMiniApp();

    if (isMiniApp) {
      await sdk.actions.ready();
    } else {
      alert("Not a miniapp!");
    }
  } catch (error) {
    console.error("MiniApp ready() failed", error);
  }
}
