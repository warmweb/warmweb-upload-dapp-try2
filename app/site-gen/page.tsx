"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useSiteZip } from "@/hooks/useSiteZip";
import { useSynapseClient } from "@/hooks/useSynapseClient";

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
      
      if (error.message.includes("Insufficient USDFC")) {
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

  const handleResetAll = () => {
    setPrompt("");
    setHtmlContent("");
    setZipSize(0);
    setUploadStatus("");
    setUploadedPieceCid("");
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
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🌐 Site Generator</h1>
          <p className="text-gray-600">
            Generate static websites and store them on Filecoin
          </p>
        </div>

        {!isConnected && (
          <div className="text-center py-8">
            <ConnectButton />
            <p className="mt-3 text-gray-500">
              Please connect your wallet to use the Site Generator
            </p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Status Panel */}
            <div className="bg-gray-50 border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">📊 Status</h3>
                <button
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
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    isLoadingBalances
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  title="Refresh balances and status"
                >
                  {isLoadingBalances ? "🔄 Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <span className="font-medium">Network:</span> {isCalibration ? "🧪 Filecoin Calibration (Testnet)" : "🌐 Filecoin Mainnet"}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="font-mono text-xs break-all">{address}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">USDFC Balance:</span>
                  <p className={`font-medium ${
                    isLoadingBalances 
                      ? "text-gray-400" 
                      : parseFloat(balances.usdfc) >= 5 
                        ? "text-green-600" 
                        : "text-red-600"
                  }`}>
                    {isLoadingBalances ? "Loading..." : `${parseFloat(balances.usdfc).toFixed(2)} USDFC`}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{filTokenName} Balance:</span>
                  <p className="font-medium text-gray-700">
                    {isLoadingBalances ? "Loading..." : `${parseFloat(balances.fil).toFixed(4)} ${filTokenName}`}
                  </p>
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
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Controls */}
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your website content here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUploading}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleBuildPreview}
                  disabled={!prompt.trim() || isUploading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !prompt.trim() || isUploading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Build Preview
                </button>
              </div>

              {/* Upload Checklist */}
              {htmlContent && (
                <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3 text-gray-800">📋 Upload Requirements</h4>
                  <div className="space-y-2">
                    {/* Wallet Connected */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={checklistStatus.walletConnected ? "text-green-600" : "text-red-600"}>
                          {checklistStatus.walletConnected ? "✅" : "❌"}
                        </span>
                        <span className="text-sm">Wallet connected (Calibration)</span>
                      </div>
                      {!checklistStatus.walletConnected && (
                        <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Connect to Calibration testnet
                        </div>
                      )}
                    </div>

                    {/* Network Check */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={checklistStatus.onCalibration ? "text-green-600" : "text-red-600"}>
                          {checklistStatus.onCalibration ? "✅" : "❌"}
                        </span>
                        <span className="text-sm">On Filecoin Calibration</span>
                      </div>
                      {!checklistStatus.onCalibration && isConnected && (
                        <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Switch to Calibration network
                        </div>
                      )}
                    </div>

                    {/* FIL Balance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={checklistStatus.hasEnoughFil ? "text-green-600" : "text-red-600"}>
                          {checklistStatus.hasEnoughFil ? "✅" : "❌"}
                        </span>
                        <span className="text-sm">{filTokenName} for fees present (≥0.1)</span>
                      </div>
                      {!checklistStatus.hasEnoughFil && isConnected && (
                        <a 
                          href={filFaucetUrl} 
                          target="_blank" 
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Get {filTokenName}
                        </a>
                      )}
                    </div>

                    {/* USDFC Deposit */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={checklistStatus.hasEnoughUsdfc ? "text-green-600" : "text-red-600"}>
                          {checklistStatus.hasEnoughUsdfc ? "✅" : "❌"}
                        </span>
                        <span className="text-sm">USDFC ≥5 deposited</span>
                      </div>
                      {!checklistStatus.hasEnoughUsdfc && isConnected && (
                        <button
                          onClick={handleFixUSDFC}
                          disabled={isFixing === "usdfc"}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
                        >
                          {isFixing === "usdfc" ? "Depositing..." : "Deposit USDFC"}
                        </button>
                      )}
                    </div>

                    {/* Warm Storage Approval */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={checklistStatus.warmStorageApproved ? "text-green-600" : "text-red-600"}>
                          {checklistStatus.warmStorageApproved ? "✅" : "❌"}
                        </span>
                        <span className="text-sm">Warm Storage approved</span>
                      </div>
                      {!checklistStatus.warmStorageApproved && isConnected && (
                        <button
                          onClick={handleFixWarmStorage}
                          disabled={isFixing === "warmstorage"}
                          className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50"
                        >
                          {isFixing === "warmstorage" ? "Approving..." : "Approve Warm Storage"}
                        </button>
                      )}
                    </div>

                    {/* Ready Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className={isReadyToUpload ? "text-green-600" : "text-yellow-600"}>
                          {isReadyToUpload ? "✅" : "⏳"}
                        </span>
                        <span className="text-sm font-medium">Ready to upload</span>
                        {isCheckingStatus && <span className="text-xs text-gray-500">(checking...)</span>}
                      </div>
                      {isReadyToUpload && (
                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          All requirements met!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleStoreWithSynapse}
                  disabled={!htmlContent || isUploading || !!uploadedPieceCid || !isReadyToUpload}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !htmlContent || isUploading || uploadedPieceCid || !isReadyToUpload
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                  title={!isReadyToUpload ? "Complete all requirements above first" : ""}
                >
                  {isUploading ? "Storing..." : uploadedPieceCid ? "Stored!" : "Store with Synapse"}
                </button>
                <button
                  onClick={handleDownloadZip}
                  disabled={!htmlContent || isUploading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !htmlContent || isUploading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                  title="Download the exact ZIP artifact that was uploaded to Filecoin"
                >
                  📦 Download ZIP
                </button>
              </div>

              {zipSize > 0 && (
                <div className="text-sm text-gray-600">
                  ZIP size: {zipSize.toLocaleString()} bytes
                  {fileList.length > 0 && (
                    <div className="mt-1">
                      Files: {fileList.join(", ")}
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-700 text-xs">
                    💡 <strong>Artifact Transparency:</strong> The &quot;Download ZIP&quot; button gives you the exact same file structure that was uploaded to Filecoin, ensuring full transparency of the stored artifact.
                  </div>
                </div>
              )}

              <button
                onClick={handleResetAll}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isUploading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                Reset
              </button>

              {uploadStatus && (
                <div className="mt-4">
                  <p
                    className={`text-sm ${
                      uploadStatus.includes("❌")
                        ? "text-red-500"
                        : uploadStatus.includes("✅") || uploadStatus.includes("🎉")
                        ? "text-green-500"
                        : "text-gray-600"
                    }`}
                  >
                    {uploadStatus}
                  </p>
                  {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-blue-500 h-2.5 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              )}

              {uploadedPieceCid && !isUploading && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800">
                    🎉 Stored on Filecoin Onchain Cloud!
                  </h4>
                  <div className="text-sm text-green-700">
                    <div>
                      <span className="font-medium">Files:</span> {fileList.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium">ZIP Size:</span> {zipSize.toLocaleString()} bytes
                    </div>
                    <div className="break-all">
                      <span className="font-medium">Piece CID:</span> {uploadedPieceCid}
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
                      💡 Your static site is now permanently stored on Filecoin&apos;s decentralized network!
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="border border-gray-300 rounded-lg h-96 overflow-hidden">
                {htmlContent ? (
                  <iframe
                    srcDoc={htmlContent}
                    className="w-full h-full"
                    title="Site Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Build a preview to see your site here
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Debug Section - Development Only */}
            {isDev && isConnected && (
              <div className="mt-6 border border-gray-300 rounded-lg bg-gray-50">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="w-full p-3 text-left font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>🐛 Debug Information</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    DEV MODE
                  </span>
                </button>
                
                {showDebug && debugInfo && (
                  <div className="p-4 border-t border-gray-200 bg-white text-xs font-mono">
                    <div className="space-y-3">
                      {/* Network Info */}
                      <div>
                        <h5 className="font-semibold text-blue-600 mb-1">Network</h5>
                        <div className="bg-blue-50 p-2 rounded text-blue-800">
                          <div>Chain ID: {debugInfo.network.chainId}</div>
                          <div>Name: {debugInfo.network.name}</div>
                          <div>Is Calibration: {debugInfo.network.isCalibration ? "Yes" : "No"}</div>
                        </div>
                      </div>

                      {/* Signer Info */}
                      <div>
                        <h5 className="font-semibold text-green-600 mb-1">Signer</h5>
                        <div className="bg-green-50 p-2 rounded text-green-800">
                          <div>Address: {debugInfo.signer.address}</div>
                          <div>Connected: {debugInfo.signer.connected ? "Yes" : "No"}</div>
                        </div>
                      </div>

                      {/* Balances */}
                      <div>
                        <h5 className="font-semibold text-purple-600 mb-1">Balances</h5>
                        <div className="bg-purple-50 p-2 rounded text-purple-800">
                          <div><strong>Wallet:</strong></div>
                          <div className="ml-2">
                            <div>{filTokenName}: {debugInfo.balances.wallet.fil}</div>
                            <div>USDFC: {debugInfo.balances.wallet.usdfc}</div>
                          </div>
                          <div className="mt-1"><strong>Synapse:</strong></div>
                          <div className="ml-2">
                            <div>USDFC Deposit: {debugInfo.balances.synapse.usdfc}</div>
                            <div>Sufficient: {debugInfo.balances.synapse.hasEnoughDeposit ? "Yes" : "No"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Allowances */}
                      <div>
                        <h5 className="font-semibold text-orange-600 mb-1">Allowances</h5>
                        <div className="bg-orange-50 p-2 rounded text-orange-800">
                          <div>Rate Allowance: {debugInfo.allowances.warmStorage.rateAllowance} USDFC</div>
                          <div>Lockup Allowance: {debugInfo.allowances.warmStorage.lockupAllowance} USDFC</div>
                          <div>Has Rate: {debugInfo.allowances.warmStorage.hasRateAllowance ? "Yes" : "No"}</div>
                          <div>Has Lockup: {debugInfo.allowances.warmStorage.hasLockupAllowance ? "Yes" : "No"}</div>
                          <div>Fully Approved: {debugInfo.allowances.approved ? "Yes" : "No"}</div>
                        </div>
                      </div>

                      {/* Upload Info */}
                      <div>
                        <h5 className="font-semibold text-red-600 mb-1">Upload</h5>
                        <div className="bg-red-50 p-2 rounded text-red-800">
                          <div>Last Payload Size: {debugInfo.upload.lastPayloadSize.toLocaleString()} bytes</div>
                          <div>Last Upload: {debugInfo.upload.lastUploadTime || "None"}</div>
                          {uploadedPieceCid && (
                            <div className="mt-1">
                              <div>Last Piece CID: {uploadedPieceCid}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Raw Debug Object */}
                      <details className="mt-3">
                        <summary className="cursor-pointer font-semibold text-gray-600 hover:text-gray-800">
                          Raw Debug Object
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 text-gray-800 text-xs overflow-auto max-h-40">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}