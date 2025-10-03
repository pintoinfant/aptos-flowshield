import { NextRequest, NextResponse } from "next/server";
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { config } from "@/lib/config";

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network[config.aptosNetwork.toUpperCase() as keyof typeof Network] 
});
const aptos = new Aptos(aptosConfig);

// Request body interface
interface RelayerRequest {
  secretHash: string;
  amount: number; // Amount in APT
  recipientAddress: string;
}

// Response interface
interface RelayerResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  userAmount?: number;
  relayerFee?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<RelayerResponse>> {
  try {
    // Check if relayer is configured
    if (!config.relayerPrivateKey) {
      return NextResponse.json({
        success: false,
        error: "Relayer service is not configured"
      }, { status: 503 });
    }

    // Parse request body
    const body: RelayerRequest = await request.json();
    const { secretHash, amount, recipientAddress } = body;

    // Validate input parameters
    if (!secretHash || typeof secretHash !== 'string') {
      return NextResponse.json({
        success: false,
        error: "Invalid secret hash"
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid amount"
      }, { status: 400 });
    }

    if (!recipientAddress || typeof recipientAddress !== 'string') {
      return NextResponse.json({
        success: false,
        error: "Invalid recipient address"
      }, { status: 400 });
    }

    // Validate recipient address format
    if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 66) {
      return NextResponse.json({
        success: false,
        error: "Invalid recipient address format"
      }, { status: 400 });
    }

    // Validate secret hash format (should be hex string)
    if (!/^[0-9a-fA-F]+$/.test(secretHash)) {
      return NextResponse.json({
        success: false,
        error: "Invalid secret hash format"
      }, { status: 400 });
    }

    // Create relayer account from private key
    const privateKey = new Ed25519PrivateKey(config.relayerPrivateKey);
    const relayerAccount = Account.fromPrivateKey({ privateKey });

    console.log("Processing relayer withdrawal:", {
      secretHash: secretHash.substring(0, 10) + "...",
      amount,
      recipientAddress: recipientAddress.substring(0, 10) + "...",
      relayerAddress: relayerAccount.accountAddress.toString()
    });

    // Convert amount to octas (APT * 10^8)
    const amountInOctas = Math.floor(amount * 100000000);

    // Calculate user amount and relayer fee (95% user, 5% relayer)
    const relayerFee = amount * 0.05;
    const userAmount = amount - relayerFee;

    // Submit withdrawal transaction via relayer
    const transaction = await aptos.transaction.build.simple({
      sender: relayerAccount.accountAddress,
      data: {
        function: `${config.moduleAddress}::privacy_pool::withdraw_via_relayer`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [
          secretHash,
          amountInOctas,
          recipientAddress
        ]
      }
    });

    // Sign and submit the transaction
    const committedTransaction = await aptos.signAndSubmitTransaction({
      signer: relayerAccount,
      transaction
    });

    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTransaction.hash,
      options: {
        checkSuccess: true
      }
    });

    console.log("Relayer withdrawal successful:", {
      transactionHash: committedTransaction.hash,
      userAmount,
      relayerFee
    });

    return NextResponse.json({
      success: true,
      transactionHash: committedTransaction.hash,
      userAmount,
      relayerFee
    });

  } catch (error: any) {
    console.error("Relayer withdrawal failed:", error);

    // Handle specific contract errors
    let errorMessage = "Withdrawal failed";
    
    if (error.message?.includes("E_SECRET_ALREADY_USED")) {
      errorMessage = "This secret note has already been used";
    } else if (error.message?.includes("E_DEPOSIT_NOT_FOUND")) {
      errorMessage = "Invalid secret note or deposit not found";
    } else if (error.message?.includes("E_POOL_NOT_FOUND")) {
      errorMessage = "Pool not found for this amount";
    } else if (error.message?.includes("INSUFFICIENT_BALANCE")) {
      errorMessage = "Insufficient balance in the pool";
    } else if (error.transaction_hash) {
      errorMessage = "Transaction failed on-chain";
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 400 });
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: "Method not allowed"
  }, { status: 405 });
}
