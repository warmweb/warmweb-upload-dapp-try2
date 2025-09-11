import { useSynapse } from "@/providers/SynapseProvider";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { TOKENS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { checkAllowances } from "@/utils/warmStorageUtils";
import { WarmStorageService } from "@filoz/synapse-sdk/warm-storage";
import { MAX_UINT256, DATA_SET_CREATION_FEE } from "@/utils";

export function useSynapseClient() {
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

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
      const allowance = await synapse.payments.allowance(TOKENS.USDFC, paymentsAddress);
      
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
      
    } catch (error) {
      throw new Error(`Failed to upload bytes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    getBalances,
    getWarmStorageAddress,
    ensureDeposited,
    ensureAllowances,
    uploadBytes,
  };
}