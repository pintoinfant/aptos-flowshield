"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SecretNoteModal } from "@/components/secret-note-modal";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast as sonnerToast } from "sonner";
import { sha256 } from "js-sha256";
import { Buffer } from "buffer";

const POOLS = [
  { amount: 1, label: "1 APT", enabled: true },
  { amount: 1, label: "1 APT", enabled: false },
  { amount: 10, label: "10 APT", enabled: false },
  { amount: 100, label: "100 APT", enabled: false },
];

const MODULE_ADDRESS = "0x3eadac8d7170d34694f97efc1fad8c62f4b2ea8f23f5ddd1a4e2bc8c9bfc3d50";

export function DepositView() {
  const [selectedPool, setSelectedPool] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretNote, setSecretNote] = useState("");
  const { toast } = useToast();
  const { signAndSubmitTransaction, account } = useWallet();

  const handleDeposit = async () => {
    if (!account) {
      sonnerToast.error("Please connect your wallet first.");
      return;
    }

    const amount = selectedPool;

    if (amount !== 1) {
      sonnerToast.error("Please select the 10 APT pool to deposit.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate secret and hash
      const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
      // 2. Create secret note
      const note = `veil-10-${Date.now().toString(16)}-${secret.toString("hex")}`;
      const hash = sha256.create();
      hash.update(note);
      const secretHash = hash.hex();
      setSecretNote(secretHash);
      //
      // 3. Send transaction
            const response = await signAndSubmitTransaction({
        data: {
          // CORRECTED: This now calls your contract's deposit function.
          function: `${MODULE_ADDRESS}::privacy_pool::deposit`,
          
          // Your function requires a CoinType generic.
          typeArguments: ['0x1::aptos_coin::AptosCoin'],

          // We pass the secret hash and the amount, matching the Move function's signature.
          functionArguments: [
            secretHash,      // arg 0: secret_hash (vector<u8>)
            amount * (10 ** 8),   // arg 1: amount (u64), converted to octas.
          ],
        },
      });


      setShowSecretModal(true);
      sonnerToast.success("Deposit successful!");
    } catch (error) {
      console.error(error);
      sonnerToast.error("Deposit failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Pool Amount</Label>
            <div className="grid grid-cols-2 gap-3">
              {POOLS.map((pool) => (
                <button
                  key={pool.amount}
                  onClick={() => {
                    if (pool.enabled) {
                      setSelectedPool(pool.amount);
                      setCustomAmount("");
                    }
                  }}
                  disabled={!pool.enabled}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${
                      selectedPool === pool.amount
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary"
                    }
                    ${
                      pool.enabled
                        ? "cursor-pointer hover:border-primary/50"
                        : "cursor-not-allowed opacity-50"
                    }
                  `}
                >
                  {!pool.enabled && (
                    <span className="absolute top-1 right-1 text-xs font-bold bg-gray-500 text-white px-2 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{pool.label}</span>
                    {selectedPool === pool.amount && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="custom-amount" className="text-base font-semibold mb-2 block">
              Custom Amount
            </Label>
            <div className="relative">
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={customAmount}
                disabled
                className="pr-16 bg-secondary border-border text-lg h-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">APT</span>
            </div>
            <span className="absolute -bottom-2 right-1 text-xs font-bold bg-gray-500 text-white px-2 py-0.5 rounded">
              Soon
            </span>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleDeposit}
              disabled={isLoading || selectedPool !== 1}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
            >
              {isLoading ? "Processing..." : "Deposit to Pool"}
            </Button>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Note:</span> After depositing, you will receive a secret
              note. Keep this note safe - you will need it to withdraw your funds to a different address.
            </p>
          </div>
        </div>
      </Card>

      <SecretNoteModal isOpen={showSecretModal} onClose={() => setShowSecretModal(false)} secretNote={secretNote} />
    </>
  )
}
