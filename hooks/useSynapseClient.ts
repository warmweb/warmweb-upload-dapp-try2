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
   * Calculate estimated gas requirements for storage operations
   */
  const calculateGasRequirements = (fileSizeBytes: number) => {
    // Base gas for Filecoin storage operations (empirically determined)
    const baseGasLimit = 20000000n; // 20M gas base
    
    // Additional gas per MB of data
    const fileSizeMB = Math.ceil(fileSizeBytes / (1024 * 1024));
    const additionalGas = BigInt(fileSizeMB) * 2000000n; // 2M gas per MB
    
    // Total with safety margin for network congestion
    const totalGasLimit = (baseGasLimit + additionalGas) * 150n / 100n; // 50% safety margin
    
    // Gas price recommendations (in attoFIL)
    const gasPrice = isCalibration ? 1500000000n : 3000000000n; // 1.5-3 Gwei
    
    // Estimated cost in FIL
    const estimatedCostWei = totalGasLimit * gasPrice;
    const estimatedCostFil = Number(estimatedCostWei) / 1e18;
    
    return {
      gasLimit: totalGasLimit,
      gasPrice,
      estimatedCostFil,
      recommendedMinBalance: estimatedCostFil * 2, // Double for safety
    };
  };

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
   * Upload bytes to Warm Storage and return PieceCID
   */
  const uploadBytes = async (bytes: Uint8Array): Promise<{ pieceCid: string }> => {
    if (!synapse || !address) {
      throw new Error("Wallet not connected. Please connect your wallet to continue.");
    }

    try {
      // Pre-check gas requirements with detailed calculation
      const gasReq = calculateGasRequirements(bytes.length);
      console.log(`Gas Requirements Check:`, {
        fileSize: bytes.length,
        estimatedCost: gasReq.estimatedCostFil,
        recommendedMin: gasReq.recommendedMinBalance,
        network: isCalibration ? 'Calibration' : 'Mainnet'
      });
      
      // Check FIL balance for gas fees with dynamic requirements
      const filBalance = await synapse.payments.walletBalance();
      const requiredBalance = BigInt(Math.ceil(gasReq.recommendedMinBalance * 1e18));
      
      if (filBalance < requiredBalance) {
        const currentFil = Number(filBalance) / 1e18;
        throw new Error(
          `Insufficient ${filTokenName} for estimated gas costs. Need at least ${gasReq.recommendedMinBalance.toFixed(4)} ${filTokenName} but have ${currentFil.toFixed(4)} ${filTokenName}. Get more from: ${filFaucetUrl}`
        );
      }
      
      console.log(`✅ Gas check passed. Proceeding with upload...`);

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

      // Upload the bytes with retry logic for gas estimation failures
      let uploadAttempts = 0;
      const maxAttempts = 3;
      
      while (uploadAttempts < maxAttempts) {
        try {
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
        } catch (retryError: any) {
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts} failed:`, retryError.message);
          
          if (uploadAttempts >= maxAttempts) {
            throw retryError; // Re-throw after max attempts
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * uploadAttempts));
        }
      }

      // This should never be reached, but TypeScript requires it
      throw new Error("Upload failed after all retry attempts");
      
    } catch (error: any) {
      console.log('error', error)
      // Enhanced error handling for common Filecoin errors
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('RetCode=33') || errorMessage.includes('exit=[33]')) {
        errorMessage = `Gas estimation failed. This usually means insufficient ${filTokenName} for gas fees, or network congestion. Please ensure you have at least 0.1 ${filTokenName} and try again.`;
      } else if (errorMessage.includes('failed to estimate gas')) {
        errorMessage = `Cannot estimate gas for transaction. This might be due to insufficient ${filTokenName} balance or network issues. Please check your ${filTokenName} balance and try again.`;
      } else if (errorMessage.includes('contract reverted')) {
        errorMessage = "Smart contract error. This might be temporary network congestion or insufficient gas. Please try again in a few moments.";
      } else if (errorMessage.includes('500')) {
        errorMessage = "Server error occurred. This is likely temporary - please try again in a few moments.";
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

  return {
    getBalances,
    getWarmStorageAddress,
    ensureDeposited,
    ensureAllowances,
    uploadBytes,
    checkAllowanceStatus,
    checkWarmStorageAllowances,
    checkUSDFCDeposit,
    calculateGasRequirements,
  };
}