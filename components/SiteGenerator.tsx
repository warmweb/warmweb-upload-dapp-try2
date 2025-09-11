"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import JSZip from "jszip";
import { useSiteUpload } from "@/hooks/useSiteUpload";

export const SiteGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const { isConnected } = useAccount();

  const { uploadSiteMutation, uploadedInfo, handleReset, status, progress } =
    useSiteUpload();

  const { isPending: isGenerating, mutateAsync: generateSite } =
    uploadSiteMutation;

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
    </div>
  );
};