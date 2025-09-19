"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useSiteZip } from "@/hooks/useSiteZip";
import { useSynapseClient } from "@/hooks/useSynapseClient";
import { useBalances } from "@/hooks/useBalances";
import { usePublishSite } from "@/hooks/usePublishSite";
import { ArrowLeft, Download, Upload, Globe, Loader2, CheckCircle, XCircle, AlertCircle, Wand2, Eye, Sparkles, Settings, Users, Star, MessageSquare, Building, Award, Mail, BarChart3, FileText, Copy, Palette, Zap, ToggleLeft, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AILandingPageGenerator } from "@/lib/aiLandingPageGenerator";

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

// Configuration constants
const COLOR_PALETTES = [
  { id: 'blue', name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
  { id: 'emerald', name: 'Forest Green', primary: '#10B981', secondary: '#059669', accent: '#34D399' },
  { id: 'purple', name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
  { id: 'orange', name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24' },
];

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', preview: 'Modern & Clean' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', preview: 'Professional & Readable' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif', preview: 'Friendly & Geometric' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif', preview: 'Elegant & Sophisticated' },
];

const ANIMATION_OPTIONS = [
  { id: 'fade', name: 'Fade In', description: 'Gentle fade-in effect' },
  { id: 'slide', name: 'Slide Up', description: 'Smooth slide from bottom' },
  { id: 'parallax', name: 'Parallax', description: 'Layered scrolling effect' },
  { id: 'zoom', name: 'Zoom In', description: 'Scale and fade effect' },
  { id: 'none', name: 'No Animation', description: 'Static appearance' },
];

const FEATURE_OPTIONS = [
  { id: 'darkModeToggle', name: 'Dark Mode Toggle', description: 'Allow users to switch between light and dark themes' },
  { id: 'smoothScrolling', name: 'Smooth Scrolling', description: 'Smooth page navigation with scroll effects' },
  { id: 'lazyLoading', name: 'Lazy Loading', description: 'Optimize performance with lazy-loaded images' },
  { id: 'mobileMenu', name: 'Mobile Menu', description: 'Responsive hamburger menu for mobile devices' },
  { id: 'backToTop', name: 'Back to Top', description: 'Floating button to scroll back to top' },
];

export default function SiteGenPage() {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [zipSize, setZipSize] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPreview, setGenerationPreview] = useState<any>(null);
  const [aiGenerator] = useState(() => new AILandingPageGenerator());
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
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedSections, setSelectedSections] = useState({
    hero: true,
    features: true,
    testimonials: false,
    about: false,
    pricing: false,
    contact: false,
    stats: false,
    team: false
  });
  const [theme, setTheme] = useState({
    palette: 'blue' as const,
    font: 'inter' as const,
    logo: ''
  });
  const [animations, setAnimations] = useState({
    global: 'fade' as const,
    perSection: {} as Record<string, string>
  });
  const [features, setFeatures] = useState({
    darkModeToggle: true,
    smoothScrolling: true,
    lazyLoading: true,
    mobileMenu: true,
    backToTop: false
  });
  const [expandedSections, setExpandedSections] = useState({
    sections: true,
    theme: false,
    animations: false,
    features: false
  });
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt'>('preview');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
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
  const {
    publishSite,
    isPublishing,
    publishError,
    publishedSite,
    resetPublishedSite
  } = usePublishSite();

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

  const generateHTML = async (userPrompt: string): Promise<string> => {
    try {
      setIsGenerating(true);

      // Generate AI prompt based on all configurations
      const selectedSectionsList = Object.entries(selectedSections)
        .filter(([_, selected]) => selected)
        .map(([section, _]) => section);

      const selectedPalette = COLOR_PALETTES.find(p => p.id === theme.palette);
      const selectedFont = FONT_OPTIONS.find(f => f.id === theme.font);
      const selectedAnimation = ANIMATION_OPTIONS.find(a => a.id === animations.global);
      const enabledFeatures = Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => FEATURE_OPTIONS.find(f => f.id === feature)?.name)
        .filter(Boolean);

      const aiPrompt = `Create a professional landing page for: ${userPrompt}

SECTIONS TO INCLUDE:
${selectedSectionsList.map(section => `- ${section.charAt(0).toUpperCase() + section.slice(1)}`).join('\n')}

THEME & BRANDING:
- Color Palette: ${selectedPalette?.name} (Primary: ${selectedPalette?.primary}, Secondary: ${selectedPalette?.secondary})
- Typography: ${selectedFont?.name} (${selectedFont?.family})
- Style: ${selectedFont?.preview}

ANIMATIONS:
- Global Animation: ${selectedAnimation?.name} - ${selectedAnimation?.description}
- Apply consistent ${animations.global} animations throughout the page

FEATURES TO IMPLEMENT:
${enabledFeatures.map(feature => `- ${feature}`).join('\n')}

TECHNICAL REQUIREMENTS:
- Modern, clean design with professional styling
- Responsive layout that works on all devices
- Clear call-to-action buttons using the specified color palette
- Consistent typography using ${selectedFont?.family}
- High-quality placeholder images where appropriate
- SEO-friendly structure with proper meta tags
- Fast loading and optimized code
- Accessibility features (ARIA labels, proper contrast)

DESIGN SPECIFICATIONS:
- Use the ${selectedPalette?.name} color scheme throughout
- Primary color: ${selectedPalette?.primary} for main CTAs and accents
- Secondary color: ${selectedPalette?.secondary} for supporting elements
- Typography: ${selectedFont?.family} for all text elements
- Animation style: Implement ${selectedAnimation?.description} for page elements
- Modern UI patterns with clean spacing and visual hierarchy
- Professional business appearance suitable for ${userPrompt}

CODE STRUCTURE:
- Single HTML file with embedded CSS and JavaScript
- Mobile-first responsive design
- Cross-browser compatible
- Optimized for performance and loading speed
`;

      setGeneratedPrompt(aiPrompt);

      // Use AI to generate a professional landing page
      const generatedHTML = await aiGenerator.generateLandingPage({ userInput: userPrompt });

      return generatedHTML;
    } catch (error) {
      console.error('AI generation failed, falling back to simple template:', error);

      // Fallback to simple template
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewGeneration = () => {
    if (!prompt.trim()) return;

    try {
      const preview = aiGenerator.previewGeneration(prompt);
      setGenerationPreview(preview);
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  };

  const handleBuildPreview = async () => {
    if (!prompt.trim()) return;

    const html = await generateHTML(prompt);
    setHtmlContent(html);

    // Calculate ZIP size
    const zip = new JSZip();
    zip.file("index.html", html);
    zip.file("README.md", `# Generated Landing Page\n\nPrompt: "${prompt}"\n\nGenerated on: ${new Date().toISOString()}\n\nGenerated with AI-powered landing page builder.\n`);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    setZipSize(zipBlob.size);

    // Switch to preview tab to show the generated content
    setActiveTab('preview');
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
      setUploadResult(result);
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
    console.log('uploadedPieceCid', uploadedPieceCid)
    console.log('uploadResult?.datasetId', uploadResult?.datasetId)
    if (!uploadedPieceCid || !uploadResult?.datasetId) return;

    try {
      // Generate a subdomain name if not provided
      const subdomain = `site-${uploadedPieceCid.substring(uploadedPieceCid.length - 8)}-${Date.now().toString().slice(-4)}`.toLowerCase();

      await publishSite({
        pieceCid: uploadedPieceCid,
        datasetId: uploadResult.datasetId,
        subdomain: subdomain
      });

    } catch (error: any) {
      console.error('Publish failed:', error);
    }
  };

  const handleResetAll = () => {
    setPrompt("");
    setHtmlContent("");
    setZipSize(0);
    setUploadStatus("");
    setUploadedPieceCid("");
    setUploadResult(null);
    resetPublishedSite();
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-600 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Wand2 className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Landing Page Generator
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isCalibration ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {isCalibration ? "Calibration" : "Mainnet"}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {parseFloat(balances.usdfc).toFixed(1)} USDFC
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {parseFloat(balances.fil).toFixed(2)} {filTokenName}
                </div>
              </div>
            )}
            <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {!isConnected ? (
        <div className="container mx-auto p-6 max-w-7xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="text-center py-12">
              <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-600 max-w-md mx-auto">
                <Globe className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Connect Your Wallet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Connect your Web3 wallet to start creating and deploying websites
                </p>
                <ConnectButton />
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-73px)]">
          {/* Configuration Wizard Sidebar */}
          <div className="w-80 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="p-6">
              {/* Wizard Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Page Configuration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your landing page sections</p>
                </div>
              </div>

              {/* Business Description */}
              <div className="mb-6">
                <label htmlFor="prompt" className="block text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Business Description
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (e.target.value.trim()) {
                      handlePreviewGeneration();
                    }
                  }}
                  placeholder="Describe your business, product, or service..."
                  className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  disabled={isUploading || isGenerating}
                />
              </div>

              {/* Configuration Sections */}
              <div className="space-y-4">
                {/* Page Sections */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, sections: !prev.sections }))}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Page Sections</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Choose which sections to include</p>
                      </div>
                    </div>
                    {expandedSections.sections ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.sections && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
                      {[
                        { key: 'hero', icon: Building, name: 'Hero Section', desc: 'Main headline and call-to-action' },
                        { key: 'features', icon: Star, name: 'Features', desc: 'Highlight key features' },
                        { key: 'testimonials', icon: MessageSquare, name: 'Testimonials', desc: 'Customer reviews and quotes' },
                        { key: 'about', icon: Users, name: 'About Us', desc: 'Company story and mission' },
                        { key: 'pricing', icon: BarChart3, name: 'Pricing', desc: 'Plans and pricing options' },
                        { key: 'contact', icon: Mail, name: 'Contact', desc: 'Contact form and information' },
                        { key: 'stats', icon: BarChart3, name: 'Statistics', desc: 'Key numbers and metrics' },
                        { key: 'team', icon: Award, name: 'Team', desc: 'Meet the team members' },
                      ].map(({ key, icon: Icon, name, desc }) => (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSections[key as keyof typeof selectedSections]}
                            onChange={(e) => setSelectedSections(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theme & Branding */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, theme: !prev.theme }))}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Theme & Branding</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Colors, fonts, and visual style</p>
                      </div>
                    </div>
                    {expandedSections.theme ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.theme && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                      {/* Color Palette Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Color Palette</label>
                        <div className="grid grid-cols-2 gap-3">
                          {COLOR_PALETTES.map((palette) => (
                            <button
                              key={palette.id}
                              onClick={() => setTheme(prev => ({ ...prev, palette: palette.id as any }))}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                theme.palette === palette.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-1">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }}></div>
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }}></div>
                                </div>
                              </div>
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{palette.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Typography</label>
                        <div className="space-y-2">
                          {FONT_OPTIONS.map((font) => (
                            <button
                              key={font.id}
                              onClick={() => setTheme(prev => ({ ...prev, font: font.id as any }))}
                              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                theme.font === font.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-gray-100" style={{ fontFamily: font.family }}>
                                {font.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{font.preview}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Animations */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, animations: !prev.animations }))}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Animations</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Motion and interaction effects</p>
                      </div>
                    </div>
                    {expandedSections.animations ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.animations && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Global Animation Style</label>
                        <div className="space-y-2">
                          {ANIMATION_OPTIONS.map((animation) => (
                            <button
                              key={animation.id}
                              onClick={() => setAnimations(prev => ({ ...prev, global: animation.id as any }))}
                              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                animations.global === animation.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-gray-100">{animation.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{animation.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-xl">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, features: !prev.features }))}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ToggleLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Features</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Interactive functionality</p>
                      </div>
                    </div>
                    {expandedSections.features ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.features && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
                      {FEATURE_OPTIONS.map((feature) => (
                        <label key={feature.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={features[feature.id as keyof typeof features]}
                            onChange={(e) => setFeatures(prev => ({ ...prev, [feature.id]: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{feature.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuildPreview}
                disabled={!prompt.trim() || isUploading || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                {isGenerating ? "Generating..." : isUploading ? "Uploading..." : "Generate Landing Page"}
              </motion.button>

              {/* Upload Requirements Checklist */}
              {htmlContent && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Upload Requirements</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {checklistStatus.walletConnected ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">Wallet Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checklistStatus.onCalibration ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">Calibration Network</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checklistStatus.hasEnoughFil ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">{filTokenName} for Gas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checklistStatus.hasEnoughUsdfc ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">USDFC Deposited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checklistStatus.warmStorageApproved ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">Storage Approved</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Preview Header with Tabs */}
              <div className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-600">
                <div className="p-6 pb-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Preview & Configuration</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View your generated content and AI prompt</p>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'preview'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('prompt')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'prompt'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    AI Prompt
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-6">
                <div className="h-full border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                  {activeTab === 'preview' ? (
                    // Live Preview Tab
                    htmlContent ? (
                      <iframe
                        srcDoc={htmlContent}
                        className="w-full h-full"
                        title="Site Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <Wand2 className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Preview Yet</p>
                        <p className="text-sm">Configure your sections and generate your landing page</p>
                      </div>
                    )
                  ) : (
                    // AI Prompt Tab
                    <div className="h-full flex flex-col">
                      {generatedPrompt ? (
                        <div className="h-full flex flex-col">
                          {/* Prompt Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Generated AI Prompt</h4>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generatedPrompt);
                                // You could add a toast notification here
                              }}
                              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>

                          {/* Prompt Content */}
                          <div className="flex-1 p-4 overflow-y-auto">
                            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                              {generatedPrompt}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <FileText className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-lg font-medium">No AI Prompt Yet</p>
                          <p className="text-sm text-center">Generate your landing page to see the AI prompt<br />that was used to create it</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {htmlContent && (
                <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-600 p-6">
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
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Download className="w-5 h-5" />
                      ZIP
                    </motion.button>
                  </div>

                  {/* Publish to WarmWeb Button */}
                  {uploadedPieceCid && !publishedSite && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePublishToWarmWeb}
                      disabled={isPublishing}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

                  {/* Status Messages */}
                  {uploadStatus && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <p className={`text-sm ${
                        uploadStatus.includes("❌") ? "text-red-500" :
                        uploadStatus.includes("✅") || uploadStatus.includes("🎉") ? "text-green-500" :
                        "text-gray-600 dark:text-gray-400"
                      }`}>
                        {uploadStatus}
                      </p>
                    </div>
                  )}

                  {/* Published URL Display */}
                  {publishedSite && (
                    <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300">Published to WarmWeb!</h4>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <div>
                          <span className="font-medium">Live URL:</span>
                          <a
                            href={publishedSite.accessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                          >
                            {publishedSite.accessUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {publishError && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        ❌ Publish failed: {publishError.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}