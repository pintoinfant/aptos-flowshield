"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Shield } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { shortenAddress } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const aptosConfig = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(aptosConfig);

export function Header() {
  const { connect, disconnect, account, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (connected && account) {
      aptos
        .getAccountAPTAmount({ accountAddress: account.address })
        .then((amount) => setBalance(amount / 10 ** 8));
    }
  }, [connected, account]);

  const router = useRouter();

  const handleConnect = (walletName: string) => {
    connect(walletName);
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
    // Navigate to landing page after disconnect
    router.push("/");
  };

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">FlowShield</span>
        </Link>

        {connected && account ? (
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-2 bg-secondary rounded-lg border border-border cursor-pointer"
              onClick={handleCopyAddress}
            >
              <span className="text-sm font-mono">
                {balance?.toFixed(4)} APT |{" "}
                {shortenAddress(account.address.toString())}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => handleConnect("Petra")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
}
