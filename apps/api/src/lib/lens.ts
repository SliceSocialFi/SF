import 'dotenv/config';
// apps/api/src/lib/lens.ts
import { LensClient, development } from "@lens-protocol/client";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// 1️⃣ Tạo wallet giả lập (thường user connect qua Metamask)
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  transport: http(LENS_TESTNET_RPCS[0]),
});

// 2️⃣ Tạo Lens client (kết nối testnet/staging)
export const lensClient = new LensClient({
  environment: development,
});

// 3️⃣ Flow xác thực
export async function authenticate() {
  console.log("🔹 Requesting challenge...");
  const challenge = await lensClient.authentication.generateChallenge({
    signedBy: account.address, // ✅ sửa signedBy → address
  });

  console.log("🔹 Signing challenge...");
  const signature = await walletClient.signMessage({
    message: challenge.text,
  });
type ChallengeRequest = Parameters<typeof lensClient.authentication.generateChallenge>[0];

  console.log("🔹 Authenticating...");
  const tokens = await lensClient.authentication.authenticate({
    id: challenge.id,
    signature,
  });

  console.log("✅ Tokens received:", tokens);
  return tokens;
}
