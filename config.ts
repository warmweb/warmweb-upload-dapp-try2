/*
    This is the configuration for the upload dApp using Synapse.
    It is used to configure the storage capacity, the persistence period, and the minimum number of days of lockup needed so the app can notify to pay for more storage.
*/

export const config = {
  // The number of GB of storage capacity needed to be sufficient
  storageCapacity: 10,
  // The number of days of lockup needed to be sufficient
  persistencePeriod: 30,
  // The minimum number of days of lockup needed to be sufficient
  minDaysThreshold: 10,
  // Whether to use CDN for the storage for faster retrieval
  withCDN: true,
} satisfies {
  storageCapacity: number;
  persistencePeriod: number;
  minDaysThreshold: number;
  withCDN: boolean;
};

// RPC Configuration - Alternative endpoints for when default ones are down
export const rpcConfig = {
  // Primary RPC endpoints (ChainStack - generally more reliable)
  primary: {
    filecoinMainnet: "https://filecoin-mainnet.chainstacklabs.com/rpc/v1",
    filecoinCalibration: "https://calibration.filfox.info/rpc/v1",
  },
  // Fallback RPC endpoints
  fallback: {
    filecoinMainnet: "https://api.node.glif.io/rpc/v1",
    filecoinCalibration: "https://api.calibration.node.glif.io/rpc/v1",
  },
  // Alternative endpoints
  alternative: {
    filecoinMainnet: "https://rpc.ankr.com/filecoin",
    filecoinCalibration: "https://rpc.ankr.com/filecoin_testnet",
  }
} as const;
