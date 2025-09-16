"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import JSZip from "jszip";
import { useSiteUpload } from "@/hooks/useSiteUpload";
import { useBalances } from "@/hooks/useBalances";
import { useSynapse } from "@/providers/SynapseProvider";
import { TIME_CONSTANTS } from "@filoz/synapse-sdk";

export const SiteGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const { isConnected } = useAccount();

  const { uploadSiteMutation, uploadedInfo, handleReset, status, progress } =
    useSiteUpload();

  const { isPending: isGenerating, mutateAsync: generateSite } =
    uploadSiteMutation;

  const { data: balances } = useBalances();
  const { synapse } = useSynapse();
  const [durationAction, setDurationAction] = useState<{ type: 'deposit' | 'store', days: number } | null>(null);

  const generateStaticSite = (userPrompt: string): JSZip => {
    const zip = new JSZip();
    
    // Generate HTML content based on prompt
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Site</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
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
        }
        .content {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #667eea;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Generated Website</h1>
        <div class="content">
            <h2>Your Content:</h2>
            <p><strong>Prompt:</strong> ${userPrompt}</p>
            <p>This is a minimal static website generated from your text prompt and stored on Filecoin via Synapse Warm Storage.</p>
            
            <h3>Features:</h3>
            <ul>
                <li>✨ Generated from text prompt</li>
                <li>🔗 Decentralized storage on Filecoin</li>
                <li>⚡ Fast retrieval via warm storage</li>
                <li>🛡️ Immutable and censorship-resistant</li>
            </ul>
        </div>
        
        <div class="footer">
            <a href="https://filecoin.io" class="filecoin-badge" target="_blank">
                🚀 Powered by Filecoin
            </a>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    // Add files to ZIP
    zip.file("index.html", htmlContent);
    zip.file("README.md", `# Generated Website

This website was generated from the prompt: "${userPrompt}"

## Files:
- index.html - Main website file
- README.md - This file

Generated on: ${new Date().toISOString()}
Storage: Filecoin via Synapse Warm Storage
`);

    return zip;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    const zip = generateStaticSite(prompt);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Convert blob to File for upload
    const zipFile = new File([zipBlob], `site-${Date.now()}.zip`, {
      type: "application/zip"
    });
    
    await generateSite(zipFile);
  };

  // Handle simple deposit
  const handleSimpleDeposit = async () => {
    if (!synapse) return;
    
    try {
      setDurationAction({ type: 'deposit', days: 0 });
      
      // Deposit a fixed amount - let Synapse SDK handle the calculations
      const depositAmount = 10; // 10 USDFC deposit
      await synapse.payments.deposit(BigInt(depositAmount * 1e6)); // Convert to wei
      
      // Refresh balances
      window.location.reload(); // Simple refresh to update balances
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setDurationAction(null);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="mt-4 p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Describe your website:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what kind of website you want to generate (e.g., 'A personal portfolio site about my photography work' or 'A landing page for my startup')"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !!uploadedInfo}
            className={`px-6 py-2 rounded-[20px] text-center border-2 transition-all
              ${
                !prompt.trim() || isGenerating || uploadedInfo
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-secondary text-secondary hover:bg-secondary/70 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:border-secondary/70 hover:cursor-pointer"
              }
            `}
          >
            {isGenerating
              ? "Generating & Uploading..."
              : !uploadedInfo
              ? "Generate Site"
              : "Generated"}
          </button>
          <button
            onClick={() => {
              handleReset();
              setPrompt("");
            }}
            disabled={!prompt.trim() || isGenerating}
            className={`px-6 py-2 rounded-[20px] text-center border-2 transition-all
              ${
                !prompt.trim() || isGenerating
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-secondary text-secondary hover:bg-secondary/70 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:border-secondary/70 hover:cursor-pointer"
              }
            `}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Simple Deposit Section */}
      {prompt.trim() && !uploadedInfo && balances.warmStorageBalanceFormatted < 10 && (
        <div className="mt-6 bg-background border border-border rounded-xl p-4 text-left">
          <h4 className="font-semibold mb-3 text-foreground">
            💰 Add Storage Balance
          </h4>
          <div className="text-sm text-muted-foreground mb-3">
            Deposit USDFC to extend your storage persistence
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="ml-2 font-medium">{balances.warmStorageBalanceFormatted.toFixed(2)} USDFC</span>
            </div>
            <button
              onClick={handleSimpleDeposit}
              disabled={isGenerating || durationAction?.type === 'deposit'}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isGenerating || durationAction?.type === 'deposit'
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {durationAction?.type === 'deposit'
                ? "Depositing..."
                : "Deposit 10 USDFC"}
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className="mt-4 text-center">
          <p
            className={`text-sm
              ${
                status.includes("❌")
                  ? "text-red-500"
                  : status.includes("✅") || status.includes("🎉")
                  ? "text-green-500"
                  : "text-secondary"
              }
            `}
          >
            {status}
          </p>
          {isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded site info panel */}
      {uploadedInfo && !isGenerating && (
        <div className="mt-6 bg-background border border-border rounded-xl p-4 text-left">
          <h4 className="font-semibold mb-2 text-foreground">
            Site Upload Details
          </h4>
          <div className="text-sm text-foreground">
            <div>
              <span className="font-medium">Site name:</span>{" "}
              {uploadedInfo.fileName}
            </div>
            <div>
              <span className="font-medium">File size:</span>{" "}
              {uploadedInfo.fileSize?.toLocaleString() || "N/A"} bytes
            </div>
            <div className="break-all">
              <span className="font-medium">Piece CID:</span>{" "}
              {uploadedInfo.pieceCid}
            </div>
            <div className="break-all">
              <span className="font-medium">Tx Hash:</span>{" "}
              {uploadedInfo.txHash}
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              🎉 Your static site has been generated and stored on Filecoin! 
              The ZIP contains all the files needed to deploy your website.
            </p>
          </div>
        </div>
      )}

      {/* Storage Persistence Calculation Table */}
      {isConnected && (
        <div className="mt-6 bg-background border border-border rounded-xl p-4 text-left">
          <h4 className="font-semibold mb-3 text-foreground">
            📊 Storage Duration Calculator
          </h4>
          <div className="text-sm text-muted-foreground mb-3">
            Based on your current lockup allowance of {(Number(balances.currentLockupAllowance) / 1e6).toFixed(2)} USDFC
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-foreground">Storage Size</th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">Duration</th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {[0.001, 0.01, 0.1, 0.5, 1, 5, 10].map((sizeGB) => {
                  // Calculate persistence time for this storage size
                  // Using the formula: days = currentLockupAllowance / (rateNeeded * epochsPerDay)
                  // We need to estimate rate based on current usage ratio
                  const currentUsageRatio = balances.currentStorageGB > 0 
                    ? balances.currentStorageGB / balances.currentRateAllowanceGB 
                    : 0.1; // Default assumption
                  const estimatedRateForSize = Number(balances.rateNeeded) * (sizeGB / 10); // Assuming rateNeeded is for 10GB
                  const epochsPerDay = 2880; // Filecoin epochs per day
                  const lockupPerDay = epochsPerDay * estimatedRateForSize;
                  const daysForSize = lockupPerDay > 0 
                    ? Number(balances.currentLockupAllowance) / 1e6 / (lockupPerDay / 1e6)
                    : Infinity;
                  
                  const formatDuration = (days: number) => {
                    if (days === Infinity) return "∞";
                    if (days < 0.01) return `${(days * 24 * 60).toFixed(1)} min`;
                    if (days < 1) return `${(days * 24).toFixed(1)} hrs`;
                    if (days < 365) return `${days.toFixed(1)} days`;
                    return `${(days / 365).toFixed(1)} years`;
                  };
                  
                  const getStatus = (days: number) => {
                    if (days === Infinity) return { text: "No cost", color: "text-green-600" };
                    if (days > 30) return { text: "Good", color: "text-green-600" };
                    if (days > 7) return { text: "OK", color: "text-yellow-600" };
                    return { text: "Low", color: "text-red-600" };
                  };
                  
                  const status = getStatus(daysForSize);
                  
                  return (
                    <tr key={sizeGB} className="border-b border-border/50">
                      <td className="py-2 px-3">{sizeGB} GB</td>
                      <td className="py-2 px-3">{formatDuration(daysForSize)}</td>
                      <td className={`py-2 px-3 font-medium ${status.color}`}>{status.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            * Estimates based on current Synapse storage rates and your lockup allowance
          </div>
        </div>
      )}

      {/* Synapse Balance and Storage Info Panel */}
      {isConnected && (
        <div className="mt-6 bg-background border border-border rounded-xl p-4 text-left">
          <h4 className="font-semibold mb-2 text-foreground">
            Synapse Storage Status
          </h4>
          <div className="text-sm text-foreground">
            <div>
              <span className="font-medium">Contract Balance:</span>{" "}
              {balances.warmStorageBalanceFormatted} USDFC
            </div>
            <div>
              <span className="font-medium">Storage Usage:</span>{" "}
              {balances.currentStorageGB.toFixed(2)} GB
            </div>
            <div>
              <span className="font-medium">Persistence:</span>{" "}
              {balances.persistenceDaysLeft < 0.01 
                ? `${(balances.persistenceDaysLeft * 24 * 60).toFixed(1)} minutes`
                : balances.persistenceDaysLeft < 1 
                ? `${(balances.persistenceDaysLeft * 24).toFixed(1)} hours`
                : `${balances.persistenceDaysLeft.toFixed(1)} days`} remaining
            </div>
          </div>
        </div>
      )}
    </div>
  );
};