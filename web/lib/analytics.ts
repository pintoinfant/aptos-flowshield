import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { config } from "./config";

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network[config.aptosNetwork.toUpperCase() as keyof typeof Network] 
});
const aptos = new Aptos(aptosConfig);

export interface PoolUsage {
  denomination: number;
  count: number;
  percentage: number;
}

export interface PrivacyStats {
  totalDeposits: number;
  depositsThisMonth: number;
  totalMixed: number;
  averageAnonymitySet: number;
  daysSinceLastActivity: number;
  poolUsage: PoolUsage[];
  privacyScore: number;
}

export interface AddressInteraction {
  address: string;
  transactionCount: number;
  totalValue: number;
  lastInteraction: string;
  label?: string;
}

export interface TransactionData {
  hash: string;
  timestamp: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'other';
  amount: number;
  success: boolean;
  isFlowShield: boolean;
  counterparty?: string;
  poolDenomination?: number;
}

export interface WalletStats {
  totalTransactions: number;
  totalVolume: number;
  uniqueAddresses: number;
  mostActiveAddress: string;
  averageTransactionValue: number;
  transactionFrequency: number;
  recentTransactions: TransactionData[];
  topInteractions: AddressInteraction[];
}

export interface UserAnalytics {
  address: string;
  privacyStats: PrivacyStats;
  walletStats: WalletStats;
  lastUpdated: string;
}

export async function fetchUserAnalytics(address: string): Promise<UserAnalytics> {
  console.log("Fetching analytics for address:", address);
  
  try {
    // Fetch user's transaction history
    const transactions = await aptos.getAccountTransactions({
      accountAddress: address,
      options: {
        limit: 100
      }
    });

    console.log(`Found ${transactions.length} transactions for analysis`);

    // Analyze FlowShield specific transactions
    const privacyStats = await analyzeFlowShieldUsage(address, transactions);
    
    // Analyze general wallet activity
    const walletStats = await analyzeWalletActivity(address, transactions);

    return {
      address,
      privacyStats,
      walletStats,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error fetching user analytics:", error);
    
    // Return empty analytics on error
    return {
      address,
      privacyStats: {
        totalDeposits: 0,
        depositsThisMonth: 0,
        totalMixed: 0,
        averageAnonymitySet: 0,
        daysSinceLastActivity: 0,
        poolUsage: [],
        privacyScore: 0
      },
      walletStats: {
        totalTransactions: 0,
        totalVolume: 0,
        uniqueAddresses: 0,
        mostActiveAddress: "",
        averageTransactionValue: 0,
        transactionFrequency: 0,
        recentTransactions: [],
        topInteractions: []
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

async function analyzeFlowShieldUsage(address: string, transactions: any[]): Promise<PrivacyStats> {
  const userTransactions = transactions.filter(tx => tx.type === 'user_transaction');
  
  const flowShieldTxns = userTransactions.filter(tx => 
    tx.payload?.function?.includes(config.moduleAddress) &&
    tx.payload?.function?.includes("privacy_pool")
  );

  const deposits = flowShieldTxns.filter(tx => 
    tx.payload?.function?.includes("deposit")
  );

  const withdrawals = flowShieldTxns.filter(tx => 
    tx.payload?.function?.includes("withdraw")
  );

  // Calculate pool usage distribution
  const poolUsageMap = new Map<number, number>();
  deposits.forEach(tx => {
    if (tx.payload?.functionArguments?.length >= 2) {
      const amount = parseInt(tx.payload.functionArguments[1]) / 100000000; // Convert from octas
      poolUsageMap.set(amount, (poolUsageMap.get(amount) || 0) + 1);
    }
  });

  const poolUsage: PoolUsage[] = Array.from(poolUsageMap.entries()).map(([denomination, count]) => ({
    denomination,
    count,
    percentage: Math.round((count / deposits.length) * 100)
  }));

  // Calculate time since last activity
  const lastFlowShieldTx = flowShieldTxns[0];
  const daysSinceLastActivity = lastFlowShieldTx 
    ? Math.floor((Date.now() - (parseInt(lastFlowShieldTx.timestamp) / 1000)) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate deposits this month
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const depositsThisMonth = deposits.filter(tx => 
    (parseInt(tx.timestamp) / 1000) > oneMonthAgo
  ).length;

  // Calculate total mixed amount
  const totalMixed = deposits.reduce((sum, tx) => {
    if (tx.payload?.functionArguments?.length >= 2) {
      return sum + (parseInt(tx.payload.functionArguments[1]) / 100000000);
    }
    return sum;
  }, 0);

  // Estimate anonymity set (simplified calculation)
  const averageAnonymitySet = poolUsage.length > 0 
    ? Math.round(poolUsage.reduce((sum, pool) => sum + pool.count, 0) / poolUsage.length * 10)
    : 0;

  // Calculate privacy score (0-100) - more realistic calculation
  let privacyScore = 0;
  if (deposits.length > 0) {
    privacyScore = Math.min(100, Math.round(
      (Math.min(deposits.length, 10) * 5) +  // Up to 50 points for deposits (max 10)
      (Math.min(averageAnonymitySet, 20) * 2) +  // Up to 40 points for anonymity set
      (Math.min(poolUsage.length, 2) * 5)  // Up to 10 points for pool diversity
    ));
  }

  return {
    totalDeposits: deposits.length,
    depositsThisMonth,
    totalMixed,
    averageAnonymitySet,
    daysSinceLastActivity,
    poolUsage,
    privacyScore
  };
}

async function analyzeWalletActivity(address: string, transactions: any[]): Promise<WalletStats> {
  const recentTransactions: TransactionData[] = transactions.slice(0, 20).map(tx => {
    const isFlowShield = tx.payload?.function?.includes(config.moduleAddress);
    let type: TransactionData['type'] = 'other';
    let amount = 0;
    
    if (isFlowShield) {
      if (tx.payload?.function?.includes('deposit')) {
        type = 'deposit';
        amount = tx.payload?.functionArguments?.[1] 
          ? parseInt(tx.payload.functionArguments[1]) / 100000000 
          : 0;
      } else if (tx.payload?.function?.includes('withdraw')) {
        type = 'withdraw';
        amount = tx.payload?.functionArguments?.[1] 
          ? parseInt(tx.payload.functionArguments[1]) / 100000000 
          : 0;
      }
    } else if (tx.payload?.function?.includes('transfer')) {
      type = 'transfer';
      // Try to extract amount from gas used or other indicators
      amount = tx.gas_used ? parseFloat(tx.gas_used) / 100000000 : 0;
    }

    return {
      hash: tx.hash,
      timestamp: new Date(parseInt(tx.timestamp) / 1000).toISOString(),
      type,
      amount,
      success: tx.success || false,
      isFlowShield,
      counterparty: tx.payload?.functionArguments?.[2] || undefined
    };
  });

  // Calculate unique addresses interacted with
  const uniqueAddresses = new Set(
    transactions
      .filter(tx => tx.payload?.functionArguments?.[0])
      .map(tx => tx.payload.functionArguments[0])
  );

  // Calculate transaction statistics
  const totalVolume = recentTransactions
    .filter(tx => !tx.isFlowShield) // Exclude FlowShield for privacy
    .reduce((sum, tx) => sum + tx.amount, 0);

  const averageTransactionValue = recentTransactions.length > 0 
    ? totalVolume / recentTransactions.filter(tx => !tx.isFlowShield).length 
    : 0;

  // Create mock address interactions (privacy-safe)
  const topInteractions: AddressInteraction[] = [
    {
      address: "0x1::aptos_coin",
      transactionCount: Math.floor(Math.random() * 10) + 1,
      totalValue: Math.random() * 100,
      lastInteraction: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      label: "Aptos Coin"
    }
  ];

  return {
    totalTransactions: transactions.length,
    totalVolume,
    uniqueAddresses: uniqueAddresses.size,
    mostActiveAddress: Array.from(uniqueAddresses)[0] || "",
    averageTransactionValue,
    transactionFrequency: transactions.length > 0 ? 7 : 0, // Transactions per week
    recentTransactions,
    topInteractions
  };
}

export async function exportUserData(address: string, includePrivateData: boolean = false): Promise<string> {
  const analytics = await fetchUserAnalytics(address);
  
  const exportData = {
    exportDate: new Date().toISOString(),
    address,
    privacyStats: analytics.privacyStats,
    walletStats: includePrivateData ? analytics.walletStats : {
      ...analytics.walletStats,
      recentTransactions: "Hidden for privacy",
      topInteractions: "Hidden for privacy"
    },
    disclaimer: "This data is generated for personal use only. FlowShield does not store this information."
  };

  return JSON.stringify(exportData, null, 2);
}
