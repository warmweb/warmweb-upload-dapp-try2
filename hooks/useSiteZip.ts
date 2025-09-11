import { useMemo } from "react";
import JSZip from "jszip";

export function useSiteZip(html: string): {
  getZipBytes: () => Promise<Uint8Array>;
  fileList: string[];
} {
  const { zip, fileList } = useMemo(() => {
    const zip = new JSZip();
    
    // Add index.html (provided HTML)
    zip.file("index.html", html);
    
    // Add assets/main.js (tiny boot script that logs to console)
    const bootScript = `// Filecoin Onchain Cloud - Boot Script
console.log("🚀 Site deployed via Filecoin Onchain Cloud!");
console.log("⚡ Powered by Synapse Warm Storage");
console.log("🌐 Generated on:", new Date().toISOString());

// Optional: Add any additional initialization logic here
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 Site loaded successfully!");
    
    // Add a subtle indicator that this is a Filecoin-deployed site
    const indicator = document.createElement('div');
    indicator.style.cssText = \`
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 144, 255, 0.1);
        color: #0090ff;
        padding: 4px 8px;
        font-size: 10px;
        border-radius: 4px;
        font-family: monospace;
        z-index: 9999;
        pointer-events: none;
    \`;
    indicator.textContent = '🌐 Filecoin';
    document.body.appendChild(indicator);
});`;
    
    zip.file("assets/main.js", bootScript);
    
    // Generate file list for debugging/preview
    const fileList: string[] = [];
    zip.forEach((relativePath) => {
      fileList.push(relativePath);
    });
    
    return { zip, fileList };
  }, [html]);

  const getZipBytes = async (): Promise<Uint8Array> => {
    return await zip.generateAsync({ type: 'uint8array' });
  };

  return {
    getZipBytes,
    fileList
  };
}