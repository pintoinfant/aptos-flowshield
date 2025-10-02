"use client";
import {
  AptosWalletAdapterProvider,
  DappConfig,
} from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { ReactNode } from "react";

const wallets = [new PetraWallet()];

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const dappConfig: DappConfig = {
    network: Network.DEVNET,
  };

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      dappConfig={dappConfig}
      autoConnect={true}
      onError={(error) => {
        console.error("Wallet Error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
