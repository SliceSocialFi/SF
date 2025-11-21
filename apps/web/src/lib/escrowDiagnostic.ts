/**
 * Escrow Diagnostic Helper
 * Use this to debug escrow deposit issues
 */

import { ethers } from "ethers";
import { TASK_ESCROW_POOL_ADDRESS, ERC20_TOKEN_ADDRESS } from "@slice/data/constants";
import { ESCROW_ABI, TOKEN_ABI } from "@/lib/abis";

export async function diagnoseEscrowIssue(
  signer: ethers.Signer,
  params: {
    freelancerAddress: string;
    amount: string; // in tokens (not wei)
    externalTaskId: string;
  }
) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    params,
    checks: {},
    errors: []
  };

  try {
    const userAddress = await signer.getAddress();
    const token = new ethers.Contract(ERC20_TOKEN_ADDRESS, TOKEN_ABI, signer);
    const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, signer);
    const amountWei = ethers.parseUnits(params.amount, 18);

    // Check 1: Wallet connected
    diagnostics.checks.walletAddress = userAddress;
    console.log("✓ Wallet connected:", userAddress);

    // Check 2: Contract addresses
    diagnostics.checks.escrowContract = TASK_ESCROW_POOL_ADDRESS;
    diagnostics.checks.tokenContract = ERC20_TOKEN_ADDRESS;
    console.log("✓ Escrow contract:", TASK_ESCROW_POOL_ADDRESS);
    console.log("✓ Token contract:", ERC20_TOKEN_ADDRESS);

    if (TASK_ESCROW_POOL_ADDRESS === ethers.ZeroAddress) {
      diagnostics.errors.push("Escrow contract address is zero address!");
    }

    // Check 3: Token balance
    const balance = await token.balanceOf(userAddress);
    diagnostics.checks.tokenBalance = {
      wei: balance.toString(),
      formatted: ethers.formatUnits(balance, 18)
    };
    console.log("✓ Token balance:", ethers.formatUnits(balance, 18));

    if (balance < amountWei) {
      diagnostics.errors.push(
        `Insufficient balance: have ${ethers.formatUnits(balance, 18)}, need ${params.amount}`
      );
    }

    // Check 4: Token allowance
    console.log("Checking allowance: owner=", userAddress, "spender=", TASK_ESCROW_POOL_ADDRESS);
    const allowance = await token.allowance(userAddress, TASK_ESCROW_POOL_ADDRESS);
    diagnostics.checks.tokenAllowance = {
      wei: allowance.toString(),
      formatted: ethers.formatUnits(allowance, 18),
      owner: userAddress,
      spender: TASK_ESCROW_POOL_ADDRESS
    };
    console.log("✓ Token allowance:", ethers.formatUnits(allowance, 18));

    if (allowance < amountWei) {
      diagnostics.errors.push(
        `Insufficient allowance: have ${ethers.formatUnits(allowance, 18)}, need ${params.amount}`
      );
    }

    // Check 5: Freelancer address validity
    if (!ethers.isAddress(params.freelancerAddress)) {
      diagnostics.errors.push(`Invalid freelancer address: ${params.freelancerAddress}`);
    } else {
      diagnostics.checks.freelancerAddressValid = true;
      console.log("✓ Freelancer address valid");
    }

    // Check 6: External task ID
    diagnostics.checks.externalTaskId = params.externalTaskId;
    console.log("✓ External task ID:", params.externalTaskId);

    // Check 7: Try to estimate gas
    try {
      const deadlineUnix = Math.floor(Date.now() / 1000) + 7 * 86400; // 7 days
      const gasEstimate = await escrow.deposit.estimateGas(
        amountWei,
        params.freelancerAddress,
        deadlineUnix,
        params.externalTaskId
      );
      diagnostics.checks.gasEstimate = gasEstimate.toString();
      console.log("✓ Gas estimate:", gasEstimate.toString());
    } catch (err: any) {
      diagnostics.errors.push(`Gas estimation failed: ${err.message || err}`);
      console.error("✗ Gas estimation failed:", err);
      
      // Try to decode error
      if (err.data) {
        diagnostics.checks.errorData = err.data;
        console.error("Error data:", err.data);
        
        // Decode common error selectors
        if (err.data.includes("0xfb8f41b2")) {
          console.error("⚠️  DECODED ERROR: InsufficientAllowance");
          console.error("💡 This means the token allowance is less than the deposit amount");
          console.error("💡 Our check shows allowance:", diagnostics.checks.tokenAllowance);
          console.error("💡 Required amount:", params.amount, "tokens =", ethers.parseUnits(params.amount, 18).toString(), "wei");
          
          // Decode error data: InsufficientAllowance(address spender, uint256 currentAllowance, uint256 required)
          try {
            const errorDataHex = err.data.slice(10); // Remove 0xfb8f41b2
            const spenderHex = "0x" + errorDataHex.slice(24, 64);
            const allowanceHex = "0x" + errorDataHex.slice(64, 128);
            const requiredHex = "0x" + errorDataHex.slice(128, 192);
            
            console.error("💡 CONTRACT ERROR DATA:");
            console.error("   Spender:", spenderHex);
            console.error("   Current allowance:", ethers.formatUnits(BigInt(allowanceHex), 18), "tokens");
            console.error("   Required:", ethers.formatUnits(BigInt(requiredHex), 18), "tokens");
            console.error("💡 ACTION: Contract sees allowance =", ethers.formatUnits(BigInt(allowanceHex), 18), "but needs", ethers.formatUnits(BigInt(requiredHex), 18));
          } catch (decodeErr) {
            console.error("Failed to decode error data:", decodeErr);
          }
          
          console.error("💡 SOLUTION: Call approve() to increase allowance before depositing");
        }
      }
    }

    // Check 8: Network
    const network = await signer.provider?.getNetwork();
    diagnostics.checks.network = {
      chainId: network?.chainId.toString(),
      name: network?.name
    };
    console.log("✓ Network:", network?.name, "Chain ID:", network?.chainId);

  } catch (error: any) {
    diagnostics.errors.push(`Diagnostic error: ${error.message}`);
    console.error("Diagnostic error:", error);
  }

  console.log("\n=== DIAGNOSTIC SUMMARY ===");
  console.log("Errors found:", diagnostics.errors.length);
  diagnostics.errors.forEach((err: string, i: number) => {
    console.error(`${i + 1}. ${err}`);
  });

  if (diagnostics.errors.length === 0) {
    console.log("✓ No obvious issues found. Contract may have custom validation.");
  }

  return diagnostics;
}
