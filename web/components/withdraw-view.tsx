"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast as sonnerToast } from "sonner";
import { sha256 } from "js-sha256";
import { Buffer } from "buffer";

const MODULE_ADDRESS = "0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd";

export function WithdrawView() {
  const [secretNote, setSecretNote] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signAndSubmitTransaction, account } = useWallet();

  const handleWithdraw = async () => {
    if (!account) {
      sonnerToast.error("Please connect your wallet first.");
      return;
    }

    if (!secretNote.trim()) {
      sonnerToast.error("Please enter your secret note.");
      return;
    }

    const noteParts = secretNote.trim().split("-");
    if (noteParts.length !== 3 || noteParts[0] !== "veil") {
      sonnerToast.error("Invalid secret note format.");
      return;
    }

    setIsLoading(true);

    try {
      const amount = parseFloat(noteParts[1]);
      const secret = Buffer.from(noteParts[2], "hex");

      // 1. Calculate secret hash
      const hash = sha256.create();
      hash.update(secret);
      const secretHash = hash.hex();

      // 2. Send transaction
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::privacy_pool::withdraw_direct`,
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
            placeholder="veil-xxxxxxxxxxxxxxxxxxxxx"
            value={secretNote}
            onChange={(e) => setSecretNote(e.target.value)}
            className="bg-secondary border-border font-mono text-sm min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">Enter the secret note you received when depositing</p>
        </div>

        <div>
          <Label htmlFor="recipient" className="text-base font-semibold mb-2 block">
            Recipient Address
          </Label>
          <Input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={account?.address.toString() || ""}
            readOnly
            disabled
            className="bg-secondary border-border font-mono h-12"
          />
          <p className="text-xs text-muted-foreground mt-2">Funds will be withdrawn to the connected wallet address.</p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !secretNote}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
          >
            {isLoading ? "Processing Withdrawal..." : "Withdraw Funds"}
          </Button>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Privacy Note:</span> Withdrawals are processed through
            zero-knowledge proofs to ensure your transaction privacy. The withdrawal process may take a few moments.
          </p>
        </div>
      </div>
    </Card>
  )
}
