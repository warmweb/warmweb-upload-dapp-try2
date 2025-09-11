import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();
    
    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Create ZIP file with same structure as client-side
    const zip = new JSZip();
    
    // Add index.html
    zip.file("index.html", html);
    
    // Add assets/main.js (boot script)
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
    
    // Generate ZIP as buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    // Return ZIP file with proper headers
    return new NextResponse(zipBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="site.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('ZIP generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}