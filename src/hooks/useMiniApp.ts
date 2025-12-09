import { sdk } from "@farcaster/miniapp-sdk";

export async function init() {
  try {
    if (await isMiniApp()) {
      await sdk.actions.ready();
    } else {
      alert("Not a miniapp!");
    }
  } catch (error) {
    console.error("MiniApp ready() failed", error);
  }
}

export async function isMiniApp() {
  try {
    return await sdk.isInMiniApp();
  } catch {
    return false;
  }
}
