"use client";
import {
  AptosWalletAdapterProvider,
  DappConfig,
} from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { ReactNode } from "react";

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const dappConfig: DappConfig = {
    network: Network.TESTNET,
  };

  return (
    <AptosWalletAdapterProvider
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
