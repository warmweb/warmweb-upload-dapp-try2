"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useSiteZip } from "@/hooks/useSiteZip";
import { useSynapseClient } from "@/hooks/useSynapseClient";
import { useBalances } from "@/hooks/useBalances";
import { TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { ArrowLeft, Download, Upload, Globe, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function SiteGenPage() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [zipSize, setZipSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedPieceCid, setUploadedPieceCid] = useState("");
  const [balances, setBalances] = useState({ usdfc: "0", fil: "0" });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState({
    walletConnected: false,
    onCalibration: false,
    hasEnoughFil: false,
    hasEnoughUsdfc: false,
    warmStorageApproved: false,
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastUploadSize, setLastUploadSize] = useState<number>(0);
  const [showDebug, setShowDebug] = useState(false);
  const [durationAction, setDurationAction] = useState<{ type: 'deposit' | 'store', days: number } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const { isConnected, address, chainId } = useAccount();

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  const { getZipBytes, fileList } = useSiteZip(htmlContent);
  const { 
    getBalances, 
    ensureDeposited, 
    ensureAllowances, 
    uploadBytes, 
    checkAllowanceStatus,
    checkWarmStorageAllowances,
    checkUSDFCDeposit
  } = useSynapseClient();

  const { data: synapseBalances } = useBalances();

  // Network-specific token names and faucets
  const isCalibration = chainId === 314159;
  const filTokenName = isCalibration ? "tFIL" : "FIL";
  const filFaucetUrl = isCalibration 
    ? "https://faucet.calibnet.chainsafe-fil.io/funds.html"
    : "https://faucet.filecoin.io/";

  // Load balances when connected
  useEffect(() => {
    const loadBalances = async () => {
      if (!isConnected || balances !== null) return;
      
      setIsLoadingBalances(true);
      try {
        const balanceData = await getBalances();
        setBalances(balanceData);
      } catch (error) {
        console.error("Failed to load balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };
    
    loadBalances();
  }, [isConnected, balances]);

  // Check all requirements for upload
  const checkUploadRequirements = async () => {
    if (!isConnected) {
      setChecklistStatus({
        walletConnected: false,
        onCalibration: false,
        hasEnoughFil: false,
        hasEnoughUsdfc: false,
        warmStorageApproved: false,
      });
      return;
    }

    setIsCheckingStatus(true);
    try {
      const [balanceData, usdcDeposit, warmStorageStatus] = await Promise.all([
        getBalances().catch(() => ({ usdfc: "0", fil: "0" })),
        checkUSDFCDeposit().catch(() => ({ hasEnoughDeposit: false, currentDeposit: "0", needed: "5" })),
        checkWarmStorageAllowances().catch(() => ({ hasRateAllowance: false, hasLockupAllowance: false, rateAllowance: "0", lockupAllowance: "0" }))
      ]);

      setChecklistStatus({
        walletConnected: true,
        onCalibration: chainId === 314159,
        hasEnoughFil: parseFloat(balanceData.fil) >= 0.1,
        hasEnoughUsdfc: usdcDeposit.hasEnoughDeposit,
        warmStorageApproved: warmStorageStatus.hasRateAllowance && warmStorageStatus.hasLockupAllowance,
      });
    } catch (error) {
      console.error("Failed to check requirements:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Check requirements when connected or when HTML content changes
  useEffect(() => {
    if (isConnected && htmlContent) {
      checkUploadRequirements();
    }
  }, [isConnected, chainId, htmlContent]);

  // Collect debug information
  const updateDebugInfo = async () => {
    if (!isConnected || !isDev) return;

    try {
      const [balanceData, usdcDeposit, warmStorageStatus] = await Promise.all([
        getBalances().catch(() => ({ usdfc: "0", fil: "0" })),
        checkUSDFCDeposit().catch(() => ({ hasEnoughDeposit: false, currentDeposit: "0", needed: "5" })),
        checkWarmStorageAllowances().catch(() => ({ hasRateAllowance: false, hasLockupAllowance: false, rateAllowance: "0", lockupAllowance: "0" }))
      ]);

      setDebugInfo({
        network: {
          chainId,
          name: isCalibration ? "Filecoin Calibration (Testnet)" : "Filecoin Mainnet",
          isCalibration
        },
        signer: {
          address,
          connected: isConnected
        },
        balances: {
          wallet: balanceData,
          synapse: {
            usdfc: usdcDeposit.currentDeposit,
            hasEnoughDeposit: usdcDeposit.hasEnoughDeposit
          }
        },
        allowances: {
          warmStorage: warmStorageStatus,
          approved: warmStorageStatus.hasRateAllowance && warmStorageStatus.hasLockupAllowance
        },
        upload: {
          lastPayloadSize: lastUploadSize,
          lastUploadTime: lastUploadSize > 0 ? new Date().toISOString() : null
        }
      });
    } catch (error) {
      console.error("Failed to update debug info:", error);
    }
  };

  // Update debug info when relevant data changes
  useEffect(() => {
    if (isDev && isConnected) {
      updateDebugInfo();
    }
  }, [isConnected, chainId, balances, checklistStatus, lastUploadSize]);

  const generateHTML = (userPrompt: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployed via Filecoin Onchain Cloud</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 1rem;
        }
        .prompt-section {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 2rem 0;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #666;
            font-size: 0.9rem;
        }
        .filecoin-badge {
            background: #0090ff;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            display: inline-block;
            margin-top: 1rem;
            text-decoration: none;
            transition: background-color 0.3s;
        }
        .filecoin-badge:hover {
            background: #0070cc;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Deployed via Filecoin Onchain Cloud</h1>
        
        <div class="prompt-section">
            <p><strong>Prompt:</strong></p>
            <pre>${userPrompt}</pre>
        </div>
        
        <div class="footer">
            <a href="https://filecoin.io" class="filecoin-badge" target="_blank">
                🌐 Powered by Filecoin
            </a>
            <p>Generated on ${new Date().toLocaleDateString()} via Synapse Warm Storage</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleBuildPreview = async () => {
    if (!prompt.trim()) return;
    
    const html = generateHTML(prompt);
    setHtmlContent(html);
    
    // Calculate ZIP size
    const zip = new JSZip();
    zip.file("index.html", html);
    zip.file("README.md", `# Generated Website\n\nPrompt: "${prompt}"\n\nGenerated on: ${new Date().toISOString()}\n`);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    setZipSize(zipBlob.size);
  };

  const handleStoreWithSynapse = async () => {
    if (!htmlContent) return;
    
    setIsUploading(true);
    setUploadStatus("🔄 Preparing site for upload...");
    setUploadedPieceCid("");
    
    try {
      // Step 1: Build ZIP bytes
      setUploadStatus("📦 Building ZIP archive...");
      const zipBytes = await getZipBytes();
      setLastUploadSize(zipBytes.length);
      
      // Step 2: Check current allowance status
      setUploadStatus("🔍 Checking storage requirements...");
      const allowanceStatus = await checkAllowanceStatus(zipBytes.length);
      
      if (!allowanceStatus.sufficient) {
        setUploadStatus(`⚠️ ${allowanceStatus.message}. Setting up now...`);
        
        // Step 3a: Ensure minimum deposit (5 USDFC)
        if (allowanceStatus.details.needsDeposit) {
          setUploadStatus("💰 Ensuring USDFC deposit (this may require wallet approval)...");
          await ensureDeposited("5");
        }
        
        // Step 3b: Set allowances (this will definitely require wallet approval)
        if (allowanceStatus.details.needsRateAllowance || allowanceStatus.details.needsLockupAllowance) {
          setUploadStatus("🔐 Setting storage allowances (wallet approval required)...");
          await ensureAllowances({
            rate: "0.02",
            lock: "5", 
            maxLockEpochs: 86400n
          });
        }
      } else {
        setUploadStatus("✅ All allowances sufficient");
      }
      
      // Step 4: Upload bytes to Filecoin
      setUploadStatus("🚀 Uploading to Filecoin...");
      const result = await uploadBytes(zipBytes);
      console.log('result', result)
      
      // Step 5: Success!
      setUploadedPieceCid(result.pieceCid);
      setUploadStatus("🎉 Successfully stored on Filecoin Onchain Cloud!");
      
      // Telemetry logging
      console.log("📊 Upload Success:", {
        action: "synapse_upload",
        pieceCid: result.pieceCid,
        sizeBytes: zipBytes.length,
        timestamp: new Date().toISOString(),
        network: isCalibration ? "calibration" : "mainnet"
      });
      
      // Refresh balances
      try {
        const updatedBalances = await getBalances();
        setBalances(updatedBalances);
      } catch (error) {
        console.warn("Failed to refresh balances:", error);
      }
      
    } catch (error: any) {
      console.error("Upload failed:", error);
      
      // Provide helpful error messages
      let errorMessage = "❌ Upload failed: ";
      
      if (error.message.includes("Gas estimation failed") || error.message.includes("insufficient") && error.message.includes("tFIL")) {
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
      
      setUploadStatus(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!htmlContent) return;
    
    try {
      // Use server-side ZIP generation for artifact transparency
      const response = await fetch('/api/site-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: htmlContent }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate ZIP file');
      }
      
      // Get the ZIP blob from the response
      const zipBlob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `site-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to client-side generation if API fails
      const zip = new JSZip();
      zip.file("index.html", htmlContent);
      zip.file("README.md", `# Generated Website\n\nPrompt: "${prompt}"\n\nGenerated on: ${new Date().toISOString()}\n`);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `site-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePublishToWarmWeb = async () => {
    if (!uploadedPieceCid || !htmlContent) return;
    
    setIsPublishing(true);
    setPublishStatus("🌐 Publishing to WarmWeb...");
    
    try {
      const response = await fetch('https://warmweb.xyz/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pieceCid: uploadedPieceCid,
          htmlContent: htmlContent,
          prompt: prompt,
          fileSize: zipSize,
          timestamp: new Date().toISOString(),
          address: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        setPublishedUrl(result.url);
        setPublishStatus("🎉 Successfully published to WarmWeb!");
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
      
    } catch (error: any) {
      console.error('Publish failed:', error);
      setPublishStatus(`❌ Publish failed: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetAll = () => {
    setPrompt("");
    setHtmlContent("");
    setZipSize(0);
    setUploadStatus("");
    setUploadedPieceCid("");
    setPublishStatus("");
    setPublishedUrl("");
  };

  // Handle simple deposit
  const handleSimpleDeposit = async () => {
    try {
      setDurationAction({ type: 'deposit', days: 0 });
      
      // Deposit a fixed amount - let Synapse SDK handle the calculations
      const depositAmount = "10"; // 10 USDFC deposit
      await ensureDeposited(depositAmount);
      
      // Refresh balances
      const updatedBalances = await getBalances();
      setBalances(updatedBalances);
    } catch (error) {
      console.error('Deposit failed:', error);
      setUploadStatus(`❌ Deposit failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDurationAction(null);
    }
  };

  // Fix functions for checklist items
  const handleFixUSDFC = async () => {
    setIsFixing("usdfc");
    try {
      await ensureDeposited("5");
      await checkUploadRequirements(); // Recheck status
    } catch (error: any) {
      console.error("Failed to deposit USDFC:", error);
      setUploadStatus(`❌ Failed to deposit USDFC: ${error.message}`);
    } finally {
      setIsFixing(null);
    }
  };

  const handleFixWarmStorage = async () => {
    setIsFixing("warmstorage");
    try {
      await ensureAllowances({
        rate: "0.02",
        lock: "5", 
        maxLockEpochs: 86400n
      });
      await checkUploadRequirements(); // Recheck status
    } catch (error: any) {
      console.error("Failed to approve Warm Storage:", error);
      setUploadStatus(`❌ Failed to approve Warm Storage: ${error.message}`);
    } finally {
      setIsFixing(null);
    }
  };

  // Check if ready to upload
  const isReadyToUpload = checklistStatus.walletConnected && 
                         checklistStatus.onCalibration && 
                         checklistStatus.hasEnoughFil && 
                         checklistStatus.hasEnoughUsdfc && 
                         checklistStatus.warmStorageApproved;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto p-6 max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Globe className="w-12 h-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Site Generator
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create professional websites with AI and deploy them to the decentralized web
            </p>
          </motion.div>

          {!isConnected && (
            <motion.div variants={fadeInUp} className="text-center py-12">
              <div className="bg-card rounded-2xl p-8 shadow-lg border max-w-md mx-auto">
                <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your Web3 wallet to start creating and deploying websites
                </p>
                <ConnectButton />
              </div>
            </motion.div>
          )}

          {isConnected && (
            <>
              {/* Status Panel */}
              <motion.div variants={fadeInUp} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Account Status</h3>
                      <p className="text-sm text-muted-foreground">Monitor your wallet and storage metrics</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      setIsLoadingBalances(true);
                      try {
                        const balanceData = await getBalances();
                        setBalances(balanceData);
                        await checkUploadRequirements();
                      } catch (error) {
                        console.error("Failed to refresh balances:", error);
                      } finally {
                        setIsLoadingBalances(false);
                      }
                    }}
                    disabled={isLoadingBalances}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {isLoadingBalances ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isLoadingBalances ? "Refreshing..." : "Refresh"}
                  </motion.button>
                </div>
                {/* Network Status */}
                <div className="mb-6 p-4 bg-secondary/30 border rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isCalibration ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium">Network:</span>
                    <span className="text-muted-foreground">
                      {isCalibration ? "Filecoin Calibration (Testnet)" : "Filecoin Mainnet"}
                    </span>
                  </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-xs font-mono">0x</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Wallet Address</h4>
                        <p className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-700">$</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">USDFC Balance</h4>
                        <p className={`font-bold ${
                          isLoadingBalances 
                            ? "text-muted-foreground" 
                            : parseFloat(balances.usdfc) >= 5 
                              ? "text-green-600" 
                              : "text-red-600"
                        }`}>
                          {isLoadingBalances ? "Loading..." : `${parseFloat(balances.usdfc).toFixed(2)} USDFC`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-700">F</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{filTokenName} Balance</h4>
                        <p className="font-bold text-foreground">
                          {isLoadingBalances ? "Loading..." : `${parseFloat(balances.fil).toFixed(4)} ${filTokenName}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              
              {/* Synapse Storage Metrics */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Synapse Storage Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Contract Balance:</span>
                    <p className="font-medium text-blue-900">
                      {synapseBalances.warmStorageBalanceFormatted.toFixed(2)} USDFC
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Storage Usage:</span>
                    <p className="font-medium text-blue-900">
                      {synapseBalances.currentStorageGB.toFixed(2)} GB
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Persistence:</span>
                    <p className="font-medium text-blue-900">
                      {synapseBalances.persistenceDaysLeft < 0.01 
                        ? `${(synapseBalances.persistenceDaysLeft * 24 * 60).toFixed(1)} minutes`
                        : synapseBalances.persistenceDaysLeft < 1 
                        ? `${(synapseBalances.persistenceDaysLeft * 24).toFixed(1)} hours`
                        : `${synapseBalances.persistenceDaysLeft.toFixed(1)} days`} remaining
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Storage Persistence Calculation Table */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2">🕒 Storage Duration Calculator</h4>
                <div className="text-xs text-green-700 mb-3">
                  Based on your current lockup allowance of {(Number(synapseBalances.currentLockupAllowance) / 1e6).toFixed(2)} USDFC
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-green-300">
                        <th className="text-left py-1 px-2 font-medium text-green-800">Size</th>
                        <th className="text-left py-1 px-2 font-medium text-green-800">Duration</th>
                        <th className="text-left py-1 px-2 font-medium text-green-800">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0.001, 0.01, 0.1, 0.5, 1, 5, 10].map((sizeGB) => {
                        // Calculate persistence time for this storage size
                        const estimatedRateForSize = Number(synapseBalances.rateNeeded) * (sizeGB / 10); // Assuming rateNeeded is for 10GB
                        const epochsPerDay = 2880; // Filecoin epochs per day
                        const lockupPerDay = epochsPerDay * estimatedRateForSize;
                        const daysForSize = lockupPerDay > 0 
                          ? Number(synapseBalances.currentLockupAllowance) / 1e6 / (lockupPerDay / 1e6)
                          : Infinity;
                        
                        const formatDuration = (days: number) => {
                          if (days === Infinity) return "∞";
                          if (days < 0.01) return `${(days * 24 * 60).toFixed(1)} min`;
                          if (days < 1) return `${(days * 24).toFixed(1)} hrs`;
                          if (days < 365) return `${days.toFixed(1)} days`;
                          return `${(days / 365).toFixed(1)} years`;
                        };
                        
                        const getStatus = (days: number) => {
                          if (days === Infinity) return { text: "Free", color: "text-green-600" };
                          if (days > 30) return { text: "Good", color: "text-green-600" };
                          if (days > 7) return { text: "OK", color: "text-yellow-600" };
                          return { text: "Low", color: "text-red-600" };
                        };
                        
                        const status = getStatus(daysForSize);
                        
                        return (
                          <tr key={sizeGB} className="border-b border-green-200">
                            <td className="py-1 px-2 text-green-900">{sizeGB} GB</td>
                            <td className="py-1 px-2 text-green-900">{formatDuration(daysForSize)}</td>
                            <td className={`py-1 px-2 font-medium ${status.color}`}>{status.text}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-green-700">
                  * Estimates based on current Synapse storage rates and your lockup allowance
                </div>
              </div>
              
              {(parseFloat(balances.usdfc) < 5 || parseFloat(balances.fil) < 0.1) && !isLoadingBalances && (
                <div className="mt-3 space-y-2">
                  {parseFloat(balances.usdfc) < 5 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ You need at least 5 USDFC for storage. Get test tokens: <a href="https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc" target="_blank" className="underline">USDFC Faucet</a>
                    </div>
                  )}
                  {parseFloat(balances.fil) < 0.1 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      🚨 You need at least 0.1 {filTokenName} for gas fees. Get test tokens: <a href={filFaucetUrl} target="_blank" className="underline">{filTokenName} Faucet</a>
                    </div>
                  )}
                </div>
              )}
              </motion.div>
              
              {/* Main Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel - Website Builder */}
                <motion.div variants={fadeInUp} className="bg-card rounded-2xl p-6 shadow-lg border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Website Builder</h3>
                      <p className="text-sm text-muted-foreground">Describe your website and we&apos;ll generate it</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="prompt" className="block text-sm font-semibold mb-3">
                        Website Description
                      </label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your website content here... Be specific about the design, content, and functionality you want."
                        className="w-full h-32 p-4 border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        disabled={isUploading}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBuildPreview}
                      disabled={!prompt.trim() || isUploading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                      {isUploading ? "Generating..." : "Generate Website"}
                    </motion.button>
                  </div>

                  {/* Upload Checklist */}
                  {htmlContent && (
                    <div className="mt-6 p-4 bg-secondary/30 border rounded-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">Upload Requirements</h4>
                      </div>
                      <div className="space-y-3">
                        {/* Wallet Connected */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            {checklistStatus.walletConnected ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">Wallet Connected</span>
                          </div>
                          {!checklistStatus.walletConnected && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Required
                            </span>
                          )}
                        </div>

                        {/* Network Check */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            {checklistStatus.onCalibration ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">Filecoin Calibration Network</span>
                          </div>
                          {!checklistStatus.onCalibration && isConnected && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Switch Network
                            </span>
                          )}
                        </div>

                        {/* FIL Balance */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            {checklistStatus.hasEnoughFil ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">{filTokenName} for Gas (≥0.1)</span>
                          </div>
                          {!checklistStatus.hasEnoughFil && isConnected && (
                            <a 
                              href={filFaucetUrl} 
                              target="_blank" 
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              Get {filTokenName}
                            </a>
                          )}
                        </div>

                        {/* USDFC Deposit */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            {checklistStatus.hasEnoughUsdfc ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">USDFC Deposited (≥5)</span>
                          </div>
                          {!checklistStatus.hasEnoughUsdfc && isConnected && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleFixUSDFC}
                              disabled={isFixing === "usdfc"}
                              className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            >
                              {isFixing === "usdfc" ? (
                                <div className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Depositing...
                                </div>
                              ) : (
                                "Deposit USDFC"
                              )}
                            </motion.button>
                          )}
                        </div>

                        {/* Warm Storage Approval */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            {checklistStatus.warmStorageApproved ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">Warm Storage Approved</span>
                          </div>
                          {!checklistStatus.warmStorageApproved && isConnected && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleFixWarmStorage}
                              disabled={isFixing === "warmstorage"}
                              className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 disabled:opacity-50 transition-colors"
                            >
                              {isFixing === "warmstorage" ? (
                                <div className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Approving...
                                </div>
                              ) : (
                                "Approve Storage"
                              )}
                            </motion.button>
                          )}
                        </div>

                        {/* Ready Status */}
                        <div className={`p-3 rounded-lg border-2 ${
                          isReadyToUpload 
                            ? "bg-green-50 border-green-200" 
                            : "bg-yellow-50 border-yellow-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            {isReadyToUpload ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              isReadyToUpload ? "text-green-700" : "text-yellow-700"
                            }`}>
                              {isReadyToUpload ? "Ready to Deploy!" : "Setup Required"}
                              {isCheckingStatus && " (checking...)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Right Panel - Preview */}
                <motion.div variants={fadeInUp} className="bg-card rounded-2xl p-6 shadow-lg border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Live Preview</h3>
                      <p className="text-sm text-muted-foreground">See your website as it will appear</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-xl overflow-hidden h-96 bg-muted/20">
                    {htmlContent ? (
                      <iframe
                        srcDoc={htmlContent}
                        className="w-full h-full"
                        title="Site Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Globe className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Preview Yet</p>
                        <p className="text-sm">Generate your website to see a preview</p>
                      </div>
                    )}
                  </div>

                  {/* Deployment Actions */}
                  {htmlContent && (
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleStoreWithSynapse}
                          disabled={!htmlContent || isUploading || !!uploadedPieceCid || !isReadyToUpload}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : uploadedPieceCid ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          {isUploading ? "Deploying..." : uploadedPieceCid ? "Deployed!" : "Deploy to Filecoin"}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleDownloadZip}
                          disabled={!htmlContent || isUploading}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Download className="w-5 h-5" />
                          ZIP
                        </motion.button>
                      </div>

                      {/* Publish to WarmWeb Button - appears after successful deployment */}
                      {uploadedPieceCid && !publishedUrl && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePublishToWarmWeb}
                          disabled={isPublishing}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {isPublishing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Globe className="w-5 h-5" />
                          )}
                          {isPublishing ? "Publishing..." : "Publish to WarmWeb"}
                        </motion.button>
                      )}
                      
                      {/* Published URL Display */}
                      {publishedUrl && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Published to WarmWeb!</h4>
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div>
                              <span className="font-medium">Live URL:</span>
                              <a 
                                href={publishedUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                              >
                                {publishedUrl}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {publishStatus && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className={`text-sm ${
                            publishStatus.includes("❌") ? "text-red-500" :
                            publishStatus.includes("🎉") ? "text-blue-500" :
                            "text-muted-foreground"
                          }`}>
                            {publishStatus}
                          </p>
                        </div>
                      )}

                      {uploadedPieceCid && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Successfully Deployed!</h4>
                          </div>
                          <div className="text-sm text-green-700 space-y-1">
                            <div><span className="font-medium">Files:</span> {fileList.join(", ")}</div>
                            <div><span className="font-medium">Size:</span> {zipSize.toLocaleString()} bytes</div>
                            <div className="break-all"><span className="font-medium">Piece CID:</span> {uploadedPieceCid}</div>
                          </div>
                        </div>
                      )}

                      {uploadStatus && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className={`text-sm ${
                            uploadStatus.includes("❌") ? "text-red-500" :
                            uploadStatus.includes("✅") || uploadStatus.includes("🎉") ? "text-green-500" :
                            "text-muted-foreground"
                          }`}>
                            {uploadStatus}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Simple Deposit Section - moved outside grid */}
              {htmlContent && !uploadedPieceCid && parseFloat(balances.usdfc) < 10 && (
                <motion.div variants={fadeInUp} className="mt-8 p-6 bg-card rounded-2xl border shadow-lg">
                  <h4 className="font-semibold mb-3 text-blue-800">💰 Add Storage Balance</h4>
                  <div className="text-sm text-blue-700 mb-3">
                    Deposit USDFC to extend your storage persistence
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-blue-700">Current Balance:</span>
                      <span className="ml-2 font-medium text-blue-900">{parseFloat(balances.usdfc).toFixed(2)} USDFC</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSimpleDeposit}
                      disabled={isUploading || durationAction?.type === 'deposit'}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {durationAction?.type === 'deposit'
                        ? "Depositing..."
                        : "Deposit 10 USDFC"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}