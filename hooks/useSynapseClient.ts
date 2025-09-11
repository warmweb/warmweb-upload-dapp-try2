import { useSynapse } from "@/providers/SynapseProvider";
import { useAccount, useChainId } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { TOKENS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { checkAllowances } from "@/utils/warmStorageUtils";
import { WarmStorageService } from "@filoz/synapse-sdk/warm-storage";
import { MAX_UINT256, DATA_SET_CREATION_FEE } from "@/utils";

export function useSynapseClient() {
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Network-specific token names and faucets
  const isCalibration = chainId === 314159;
  const filTokenName = isCalibration ? "tFIL" : "FIL";
  const filFaucetUrl = isCalibration 
    ? "https://faucet.calibnet.chainsafe-fil.io/funds.html"
    : "https://faucet.filecoin.io/"; // Mainnet faucet (if available)

  /**
   * Get current balances for USDFC and FIL
   */
  const getBalances = async (): Promise<{ usdfc: string; fil: string }> => {
    if (!synapse) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      const [filRaw, usdfcRaw] = await Promise.all([
        synapse.payments.walletBalance(),
        synapse.payments.walletBalance(TOKENS.USDFC),
      ]);

      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);

      return {
        fil: formatUnits(filRaw, 18),
        usdfc: formatUnits(usdfcRaw, usdfcDecimals),
      };
    } catch (error) {
      throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Get the Warm Storage service contract address
   */
  const getWarmStorageAddress = async (): Promise<string> => {
    if (!synapse) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      return synapse.getWarmStorageAddress();
    } catch (error) {
      throw new Error(`Failed to get Warm Storage address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Ensure minimum USDFC deposit, depositing only if balance is insufficient
   */
  const ensureDeposited = async (minUSDFC: string): Promise<void> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);
      const minAmount = parseUnits(minUSDFC, usdfcDecimals);
      
      // Check current warm storage balance
      const currentBalance = await synapse.payments.balance(TOKENS.USDFC);
      
      if (currentBalance >= minAmount) {
        return; // Already sufficient
      }

      const depositAmount = minAmount - currentBalance;
      
      // Check wallet balance
      const walletBalance = await synapse.payments.walletBalance(TOKENS.USDFC);
      if (walletBalance < depositAmount) {
        throw new Error(`Insufficient USDFC in wallet. Need ${formatUnits(depositAmount, usdfcDecimals)} USDFC but only have ${formatUnits(walletBalance, usdfcDecimals)} USDFC.`);
      }

      // Check and approve USDFC spending if needed
      const paymentsAddress = synapse.getPaymentsAddress();
      const allowance = await synapse.payments.allowance(paymentsAddress);
      
      if (allowance < MAX_UINT256 / 2n) {
        const approveTx = await synapse.payments.approve(
          paymentsAddress,
          MAX_UINT256,
          TOKENS.USDFC
        );
        await approveTx.wait();
      }

      // Deposit USDFC
      const depositTx = await synapse.payments.deposit(depositAmount);
      await depositTx.wait();
      
    } catch (error) {
      throw new Error(`Failed to ensure deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Ensure allowances are set for Warm Storage service
   */
  const ensureAllowances = async (opts: {
    rate: string;
    lock: string;
    maxLockEpochs: bigint;
  }): Promise<void> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);
      const rateAmount = parseUnits(opts.rate, usdfcDecimals);
      const lockAmount = parseUnits(opts.lock, usdfcDecimals);

      // Approve Warm Storage service to spend USDFC at specified rates
      const approvalTx = await synapse.payments.approveService(
        synapse.getWarmStorageAddress(),
        rateAmount,
        lockAmount,
        opts.maxLockEpochs
      );
      
      await approvalTx.wait();
      
    } catch (error) {
      throw new Error(`Failed to set allowances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Upload bytes to Warm Storage and return PieceCID with retry logic
   */
  const uploadBytes = async (bytes: Uint8Array, retryCount: number = 0): Promise<{ pieceCid: string }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      // Check FIL balance for gas fees
      const filBalance = await synapse.payments.walletBalance();
      const minFilNeeded = BigInt("100000000000000000"); // 0.1 FIL minimum for gas
      
      if (filBalance < minFilNeeded) {
        throw new Error(`Insufficient ${filTokenName} for gas fees. You have ${Number(filBalance) / 1e18} ${filTokenName}, but need at least 0.1 ${filTokenName}. Get test tokens from: ${filFaucetUrl}`);
      }

      // Check if we have datasets
      const datasets = await synapse.storage.findDataSets(address);
      console.log('datasets', datasets)
      const datasetExists = datasets.length > 0;
      const includeDatasetCreationFee = !datasetExists;

      // Create warm storage service if not available
      const warmStorage = warmStorageService || await WarmStorageService.create(
        synapse.getProvider(),
        synapse.getWarmStorageAddress()
      );

      // Check allowances for the file size
      const warmStorageBalance = await warmStorage.checkAllowanceForStorage(
        bytes.length,
        config.withCDN,
        synapse.payments,
        config.persistencePeriod
      );

      // Verify allowances are sufficient
      const { isSufficient } = await checkAllowances(
        warmStorageBalance,
        config.minDaysThreshold,
        includeDatasetCreationFee
      );

      if (!isSufficient) {
        throw new Error("Insufficient allowances for upload. Please ensure deposits and allowances are set properly.");
      }

      // Create storage service
      const storageService = await synapse.createStorage();

      // Upload the bytes
      const { pieceCid } = await storageService.upload(bytes, {
        onUploadComplete: (piece) => {
          console.log("Upload complete, piece:", piece.toV1().toString());
        },
        onPieceAdded: (txResponse) => {
          console.log("Piece added to dataset, tx:", txResponse?.hash);
        },
        onPieceConfirmed: (pieceIds) => {
          console.log("Pieces confirmed:", pieceIds);
        },
      });

      return { pieceCid: pieceCid.toV1().toString() };
      
    } catch (error: any) {
      // Enhanced error handling for common Filecoin errors
      let errorMessage = error.message || 'Unknown error';
      
      console.error("Upload error details:", {
        originalError: error,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (errorMessage.includes('RetCode=33') || errorMessage.includes('exit=[33]')) {
        errorMessage = `Gas estimation failed. This usually means insufficient ${filTokenName} for gas fees, or network congestion. Please ensure you have at least 0.1 ${filTokenName} and try again.`;
      } else if (errorMessage.includes('failed to estimate gas')) {
        errorMessage = `Cannot estimate gas for transaction. This might be due to insufficient ${filTokenName} balance or network issues. Please check your ${filTokenName} balance and try again.`;
      } else if (errorMessage.includes('contract reverted')) {
        errorMessage = "Smart contract error. This might be temporary network congestion or insufficient gas. Please try again in a few moments.";
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        if (retryCount < 2) {
          console.warn(`PDP server error (500), retrying... (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
          return uploadBytes(bytes, retryCount + 1);
        }
        errorMessage = "PDP server error (500). The Synapse infrastructure may be experiencing issues. This is likely temporary - please try again in a few moments.";
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        if (retryCount < 2) {
          console.warn(`PDP server error (404), retrying... (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
          return uploadBytes(bytes, retryCount + 1);
        }
        errorMessage = "PDP server error (404). The Synapse infrastructure may be experiencing issues or the piece was not found. Please try again.";
      } else if (errorMessage.includes('calib.ezpdpz.net') || errorMessage.includes('ezpdpz')) {
        if (retryCount < 2) {
          console.warn(`PDP server infrastructure error, retrying... (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1))); // Longer backoff for infrastructure issues
          return uploadBytes(bytes, retryCount + 1);
        }
        errorMessage = "PDP server infrastructure error. The Synapse service endpoints may be temporarily unavailable. Please try again later.";
      }
      
      throw new Error(`Failed to upload bytes: ${errorMessage}`);
    }
  };

  /**
   * Check current allowance status for a given file size
   */
  const checkAllowanceStatus = async (fileSizeBytes: number): Promise<{
    sufficient: boolean;
    message: string;
    details: {
      hasDataset: boolean;
      needsRateAllowance: boolean;
      needsLockupAllowance: boolean;
      needsDeposit: boolean;
    };
  }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      // Check if we have datasets
      const datasets = await synapse.storage.findDataSets(address);
      const datasetExists = datasets.length > 0;
      const includeDatasetCreationFee = !datasetExists;

      // Create warm storage service if not available
      const warmStorage = warmStorageService || await WarmStorageService.create(
        synapse.getProvider(),
        synapse.getWarmStorageAddress()
      );

      // Check allowances for the file size
      const warmStorageBalance = await warmStorage.checkAllowanceForStorage(
        fileSizeBytes,
        config.withCDN,
        synapse.payments,
        config.persistencePeriod
      );

      // Verify allowances are sufficient
      const { 
        isSufficient, 
        isRateSufficient, 
        isLockupSufficient,
        depositAmountNeeded
      } = await checkAllowances(
        warmStorageBalance,
        config.minDaysThreshold,
        includeDatasetCreationFee
      );

      let message = "";
      if (isSufficient) {
        message = "✅ All allowances are sufficient for upload";
      } else {
        const issues = [];
        if (!isRateSufficient) issues.push("rate allowance");
        if (!isLockupSufficient) issues.push("lockup allowance");
        if (depositAmountNeeded > 0n) issues.push("deposit");
        message = `⚠️ Insufficient: ${issues.join(", ")}`;
      }

      return {
        sufficient: isSufficient,
        message,
        details: {
          hasDataset: datasetExists,
          needsRateAllowance: !isRateSufficient,
          needsLockupAllowance: !isLockupSufficient,
          needsDeposit: depositAmountNeeded > 0n
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to check allowance status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Check if Warm Storage has sufficient allowances without uploading
   */
  const checkWarmStorageAllowances = async (): Promise<{
    hasRateAllowance: boolean;
    hasLockupAllowance: boolean;
    rateAllowance: string;
    lockupAllowance: string;
  }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      // Create warm storage service
      const warmStorage = warmStorageService || await WarmStorageService.create(
        synapse.getProvider(),
        synapse.getWarmStorageAddress()
      );

      // Check current allowances for a small file (1KB) to test permissions
      const testFileSize = 1024; 
      const warmStorageBalance = await warmStorage.checkAllowanceForStorage(
        testFileSize,
        config.withCDN,
        synapse.payments,
        config.persistencePeriod
      );

      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);
      
      return {
        hasRateAllowance: warmStorageBalance.currentRateAllowance > 0n,
        hasLockupAllowance: warmStorageBalance.currentLockupAllowance > 0n,
        rateAllowance: formatUnits(warmStorageBalance.currentRateAllowance, usdfcDecimals),
        lockupAllowance: formatUnits(warmStorageBalance.currentLockupAllowance, usdfcDecimals),
      };
      
    } catch (error) {
      throw new Error(`Failed to check allowances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Check USDFC deposit status in Synapse payments
   */
  const checkUSDFCDeposit = async (): Promise<{
    hasEnoughDeposit: boolean;
    currentDeposit: string;
    needed: string;
  }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      const currentBalance = await synapse.payments.balance(TOKENS.USDFC);
      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);
      const minNeeded = parseUnits("5", usdfcDecimals);
      
      return {
        hasEnoughDeposit: currentBalance >= minNeeded,
        currentDeposit: formatUnits(currentBalance, usdfcDecimals),
        needed: "5",
      };
      
    } catch (error) {
      throw new Error(`Failed to check USDFC deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Check PDP server health
   */
  const checkPDPServerHealth = async (): Promise<{ healthy: boolean; message: string }> => {
    try {
      const response = await fetch("https://calib.ezpdpz.net/pdp/health", {
        method: "GET",
        timeout: 5000
      } as any);
      
      if (response.ok) {
        return { healthy: true, message: "PDP server is responding normally" };
      } else {
        return { healthy: false, message: `PDP server returned status ${response.status}` };
      }
    } catch (error) {
      return { healthy: false, message: `PDP server unreachable: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  /**
   * Run preflight check for upload and return exact requirements
   */
  const preflightUpload = async (fileSizeBytes: number): Promise<{
    sufficient: boolean;
    depositNeeded: string;
    rateAllowanceNeeded: string;
    lockupAllowanceNeeded: string;
    maxLockEpochs: bigint;
  }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      // Check if we have datasets
      const datasets = await synapse.storage.findDataSets(address);
      const datasetExists = datasets.length > 0;
      const includeDatasetCreationFee = !datasetExists;

      // Create warm storage service if not available
      const warmStorage = warmStorageService || await WarmStorageService.create(
        synapse.getProvider(),
        synapse.getWarmStorageAddress()
      );

      // Check allowances for the file size
      const warmStorageBalance = await warmStorage.checkAllowanceForStorage(
        fileSizeBytes,
        config.withCDN,
        synapse.payments,
        config.persistencePeriod
      );

      // Verify allowances are sufficient
      const { 
        isSufficient, 
        isRateSufficient, 
        isLockupSufficient,
        depositAmountNeeded
      } = await checkAllowances(
        warmStorageBalance,
        config.minDaysThreshold,
        includeDatasetCreationFee
      );

      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);

      // Calculate what's needed
      let depositNeeded = "0";
      if (depositAmountNeeded > 0n) {
        depositNeeded = formatUnits(depositAmountNeeded, usdfcDecimals);
      }

      // Use recommended rates from warm storage balance
      let rateAllowanceNeeded = "0";
      let lockupAllowanceNeeded = "0";
      
      if (!isRateSufficient) {
        rateAllowanceNeeded = formatUnits(warmStorageBalance.rateAllowanceNeeded, usdfcDecimals);
      }
      
      if (!isLockupSufficient) {
        lockupAllowanceNeeded = formatUnits(warmStorageBalance.lockupAllowanceNeeded, usdfcDecimals);
      }

      // Default lock epochs (can be customized)
      const maxLockEpochs = BigInt(86400); // ~30 days

      return {
        sufficient: isSufficient,
        depositNeeded,
        rateAllowanceNeeded,
        lockupAllowanceNeeded,
        maxLockEpochs,
      };
      
    } catch (error) {
      throw new Error(`Failed to run preflight check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    getBalances,
    getWarmStorageAddress,
    ensureDeposited,
    ensureAllowances,
    uploadBytes,
    checkAllowanceStatus,
    checkWarmStorageAllowances,
    checkUSDFCDeposit,
    preflightUpload,
    checkPDPServerHealth,
  };
}