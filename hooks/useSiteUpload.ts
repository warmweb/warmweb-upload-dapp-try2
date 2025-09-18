import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { preflightCheck } from "@/utils/preflightCheck";
import { useSynapse } from "@/providers/SynapseProvider";
import { UploadedInfo } from "@/hooks/useFileUpload";

/**
 * Hook to upload a generated site ZIP to the Filecoin network using Synapse.
 */
export const useSiteUpload = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);
  const { synapse } = useSynapse();
  const { triggerConfetti } = useConfetti();
  const { address } = useAccount();
  
  const mutation = useMutation({
    mutationKey: ["site-upload", address],
    mutationFn: async (file: File) => {
      if (!synapse) throw new Error("Synapse not found");
      if (!address) throw new Error("Address not found");
      setProgress(0);
      setUploadedInfo(null);
      setStatus("🔄 Initializing site upload to Filecoin...");

      // 1) Convert File → ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // 2) Convert ArrayBuffer → Uint8Array
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      // 3) Get dataset
      const datasets = await synapse.storage.findDataSets(address);
      // 4) Check if we have a dataset
      const datasetExists = datasets.length > 0;
      // Include proofset creation fee if no proofset exists
      const includeDatasetCreationFee = !datasetExists;

      // 5) Check if we have enough USDFC to cover the storage costs and deposit if not
      setStatus("💰 Checking USDFC balance and storage allowances...");
      setProgress(5);
      await preflightCheck(
        file,
        synapse,
        includeDatasetCreationFee,
        setStatus,
        setProgress
      );

      setStatus("🔗 Setting up storage service and dataset...");
      setProgress(25);

      // 6) Create storage service
      const storageService = await synapse.createStorage({
        callbacks: {
          onDataSetResolved: (info) => {
            console.log("Dataset resolved:", info);
            setStatus("🔗 Existing dataset found and resolved");
            setProgress(30);
          },
          onDataSetCreationStarted: (transactionResponse, statusUrl) => {
            console.log("Dataset creation started:", transactionResponse);
            console.log("Dataset creation status URL:", statusUrl);
            setStatus("🏗️ Creating new dataset on blockchain...");
            setProgress(35);
          },
          onDataSetCreationProgress: (status) => {
            console.log("Dataset creation progress:", status);
            if (status.transactionSuccess) {
              setStatus(`⛓️ Dataset transaction confirmed on chain`);
              setProgress(45);
            }
            if (status.serverConfirmed) {
              setStatus(
                `🎉 Dataset ready! (${Math.round(status.elapsedMs / 1000)}s)`
              );
              setProgress(50);
            }
          },
          onProviderSelected: (provider) => {
            console.log("Storage provider selected:", provider);
            setStatus(`🏪 Storage provider selected`);
          },
        },
      });

      setStatus("🌐 Uploading site ZIP to storage provider...");
      setProgress(55);
      
      // 7) Upload site ZIP to storage provider
      const { pieceCid } = await storageService.upload(uint8ArrayBytes, {
        onUploadComplete: (piece) => {
          setStatus(
            `📊 Site uploaded! Signing msg to add pieces to the dataset`
          );
          setUploadedInfo((prev) => ({
            ...prev,
            fileName: file.name,
            fileSize: file.size,
            pieceCid: piece.toV1().toString(),
          }));
          setProgress(80);
        },
        onPieceAdded: (transactionResponse) => {
          setStatus(
            `🔄 Waiting for transaction to be confirmed on chain${
              transactionResponse ? ` (txHash: ${transactionResponse.hash})` : ""
            }`
          );
          if (transactionResponse) {
            console.log("Transaction response:", transactionResponse);
            setUploadedInfo((prev) => ({
              ...prev,
              txHash: transactionResponse?.hash,
            }));
          }
        },
        onPieceConfirmed: (pieceIds) => {
          setStatus("🌳 Site pieces added to dataset successfully");
          setProgress(90);
        },
      });

      setProgress(95);
      setUploadedInfo((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        pieceCid: pieceCid.toV1().toString(),
      }));
    },
    onSuccess: () => {
      setStatus("🎉 Site successfully stored on Filecoin!");
      setProgress(100);
      triggerConfetti();
    },
    onError: (error) => {
      console.error("Site upload failed:", error);
      
      // Provide helpful error messages
      let errorMessage = "❌ Upload failed: ";
      
      if (error.message.includes("Gas estimation failed") || (error.message.includes("insufficient") && error.message.includes("tFIL"))) {
        errorMessage += "Not enough tFIL tokens for gas fees. You need at least 0.1 tFIL to pay for transactions. Get test tFIL from the Calibration faucet: https://faucet.calibnet.chainsafe-fil.io/funds.html";
      } else if (error.message.includes("Insufficient USDFC")) {
        errorMessage += "Not enough USDFC tokens. Get test USDFC from the Calibration faucet: https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc";
      } else if (error.message.includes("allowance") || error.message.includes("insufficient")) {
        errorMessage += "Storage allowances couldn't be set. This usually means you need to approve transactions in your wallet, or you don't have enough USDFC balance. Please check your wallet and try again.";
      } else if (error.message.includes("connect")) {
        errorMessage += "Please connect your wallet first.";
      } else if (error.message.includes("rejected") || error.message.includes("denied")) {
        errorMessage += "Transaction was rejected in wallet. Please try again and approve the required transactions.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      setStatus(errorMessage);
      setProgress(0);
    },
  });

  const handleReset = () => {
    setProgress(0);
    setUploadedInfo(null);
    setStatus("");
  };

  return {
    uploadSiteMutation: mutation,
    progress,
    uploadedInfo,
    handleReset,
    status,
  };
};