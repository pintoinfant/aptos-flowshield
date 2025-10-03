// Shared configuration for FlowShield application
export const config = {
  // Public environment variables (accessible on client-side)
  moduleAddress: process.env.NEXT_PUBLIC_MODULE_ADDRESS || "0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd",
  aptosNetwork: (process.env.NEXT_PUBLIC_APTOS_NETWORK as "devnet" | "testnet" | "mainnet") || "devnet",
  
  // Server-side only environment variables
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY,
  
  // Validate required environment variables
  validate() {
    if (!this.moduleAddress) {
      throw new Error("NEXT_PUBLIC_MODULE_ADDRESS is required");
    }
    
    if (typeof window === "undefined") {
      // Server-side validation
      if (!this.relayerPrivateKey) {
        console.warn("RELAYER_PRIVATE_KEY not configured - relayer functionality will be disabled");
      }
    }
    
    return true;
  }
} as const;

// Validate configuration on import
config.validate();
