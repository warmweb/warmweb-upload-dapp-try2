"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useSiteUpload } from "@/hooks/useSiteUpload";

export default function SiteGenPage() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [zipSize, setZipSize] = useState(0);
  const { isConnected } = useAccount();

  const { uploadSiteMutation, uploadedInfo, handleReset: resetUpload, status, progress } =
    useSiteUpload();

  const { isPending: isUploading, mutateAsync: uploadSite } =
    uploadSiteMutation;

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
    
    const zip = new JSZip();
    zip.file("index.html", htmlContent);
    zip.file("README.md", `# Generated Website\n\nPrompt: "${prompt}"\n\nGenerated on: ${new Date().toISOString()}\n`);
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFile = new File([zipBlob], `site-${Date.now()}.zip`, {
      type: "application/zip"
    });
    
    await uploadSite(zipFile);
  };

  const handleDownloadZip = async () => {
    if (!htmlContent) return;
    
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
  };

  const handleResetAll = () => {
    setPrompt("");
    setHtmlContent("");
    setZipSize(0);
    resetUpload();
  };

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

              <div className="flex gap-2">
                <button
                  onClick={handleStoreWithSynapse}
                  disabled={!htmlContent || isUploading || !!uploadedInfo}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !htmlContent || isUploading || uploadedInfo
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {isUploading ? "Storing..." : "Store with Synapse"}
                </button>
                <button
                  onClick={handleDownloadZip}
                  disabled={!htmlContent || isUploading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !htmlContent || isUploading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                >
                  Download ZIP
                </button>
              </div>

              {zipSize > 0 && (
                <div className="text-sm text-gray-600">
                  ZIP size: {zipSize.toLocaleString()} bytes
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

              {status && (
                <div className="mt-4">
                  <p
                    className={`text-sm ${
                      status.includes("❌")
                        ? "text-red-500"
                        : status.includes("✅") || status.includes("🎉")
                        ? "text-green-500"
                        : "text-gray-600"
                    }`}
                  >
                    {status}
                  </p>
                  {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {uploadedInfo && !isUploading && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800">
                    ✅ Site Stored Successfully!
                  </h4>
                  <div className="text-sm text-green-700">
                    <div>
                      <span className="font-medium">File:</span> {uploadedInfo.fileName}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {uploadedInfo.fileSize?.toLocaleString()} bytes
                    </div>
                    <div className="break-all">
                      <span className="font-medium">Piece CID:</span> {uploadedInfo.pieceCid}
                    </div>
                    <div className="break-all">
                      <span className="font-medium">Tx Hash:</span> {uploadedInfo.txHash}
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
        )}
      </motion.div>
    </div>
  );
}