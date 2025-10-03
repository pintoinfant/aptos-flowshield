"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast as sonnerToast } from "sonner";
import { sha256 } from "js-sha256";
import { Buffer } from "buffer";
import { config } from "@/lib/config";

export function WithdrawView() {
  const [secretNote, setSecretNote] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [useRelayer, setUseRelayer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signAndSubmitTransaction, account } = useWallet();

  const handleWithdraw = async () => {
    if (!secretNote.trim()) {
      sonnerToast.error("Please enter your secret note.");
      return;
    }

    const noteParts = secretNote.trim().split("-");
    if (noteParts.length !== 3 || noteParts[0] !== "flowshield") {
      sonnerToast.error("Invalid secret note format.");
      return;
    }

    if (useRelayer) {
      await handleRelayerWithdraw();
    } else {
      await handleDirectWithdraw();
    }
  };

  const handleDirectWithdraw = async () => {
    if (!account) {
      sonnerToast.error("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);

    try {
      const amount = parseFloat(secretNote.trim().split("-")[1]);
      const secret = Buffer.from(secretNote.trim().split("-")[2], "hex");

      // 1. Calculate secret hash
      const hash = sha256.create();
      hash.update(secret);
      const secretHash = hash.hex();

      // 2. Send transaction
      const response = await signAndSubmitTransaction({
        data: {
          function: `${config.moduleAddress}::privacy_pool::withdraw_direct`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [secretHash, amount * 10 ** 8],
        },
      });

      sonnerToast.success("Withdrawal successful!");
      setSecretNote("");
      setRecipientAddress("");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message.includes("E_SECRET_ALREADY_USED")
        ? "This secret note has already been used."
        : "Withdrawal failed. Please check the note and try again.";
      sonnerToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelayerWithdraw = async () => {
    if (!recipientAddress.trim()) {
      sonnerToast.error("Please enter a recipient address for relayer withdrawal.");
      return;
    }

    setIsLoading(true);

    try {
      const amount = parseFloat(secretNote.trim().split("-")[1]);
      const secret = Buffer.from(secretNote.trim().split("-")[2], "hex");

      // 1. Calculate secret hash
      const hash = sha256.create();
      hash.update(secret);
      const secretHash = hash.hex();

      // 2. Call relayer API
      const response = await fetch('/api/resolver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretHash,
          amount,
          recipientAddress: recipientAddress.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        sonnerToast.success(
          `Relayer withdrawal successful! You received ${data.userAmount?.toFixed(4)} APT (${data.relayerFee?.toFixed(4)} APT fee)`
        );
        setSecretNote("");
        setRecipientAddress("");
      } else {
        sonnerToast.error(data.error || "Relayer withdrawal failed");
      }
    } catch (error: any) {
      console.error(error);
      sonnerToast.error("Relayer withdrawal failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Security Warning</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never share your secret note with anyone. Make sure you're withdrawing to a different address than the one
              you deposited from.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="secret-note" className="text-base font-semibold mb-2 block">
            Secret Note
          </Label>
          <Textarea
            id="secret-note"
            placeholder="flowshield-xxxxxxxxxxxxxxxxxxxxx"
            value={secretNote}
            onChange={(e) => setSecretNote(e.target.value)}
            className="bg-secondary border-border font-mono text-sm min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">Enter the secret note you received when depositing</p>
        </div>

        {/* Relayer Option */}
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-base font-semibold">Use Relayer Service</Label>
              <p className="text-sm text-muted-foreground">No gas fees required (5% service fee)</p>
            </div>
          </div>
          <Switch
            checked={useRelayer}
            onCheckedChange={setUseRelayer}
          />
        </div>

        <div>
          <Label htmlFor="recipient" className="text-base font-semibold mb-2 block">
            Recipient Address
          </Label>
          <Input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={useRelayer ? recipientAddress : (account?.address.toString() || "")}
            onChange={(e) => setRecipientAddress(e.target.value)}
            readOnly={!useRelayer}
            disabled={!useRelayer && !account}
            className="bg-secondary border-border font-mono h-12"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {useRelayer 
              ? "Enter the address where you want to receive your funds"
              : "Funds will be withdrawn to the connected wallet address"
            }
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !secretNote || (useRelayer && !recipientAddress) || (!useRelayer && !account)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
          >
            {isLoading 
              ? "Processing Withdrawal..." 
              : useRelayer 
                ? "Withdraw via Relayer (5% fee)"
                : "Withdraw Funds"
            }
          </Button>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Privacy Note:</span> Withdrawals are processed through
            zero-knowledge proofs to ensure your transaction privacy. {useRelayer 
              ? "Relayer service allows withdrawal without gas fees but charges a 5% service fee."
              : "Direct withdrawal requires APT for gas fees but has no service charges."
            }
          </p>
        </div>
      </div>
    </Card>
  )
}
