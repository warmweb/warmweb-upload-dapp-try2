"use client";

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css'
import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SynapseProvider } from "@/providers/SynapseProvider";
import { ConfettiProvider } from "@/providers/ConfettiProvider";
import { rpcConfig } from "@/config";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'WarmWeb',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'warmweb-upload-dapp', // Fallback for development
  chains: [filecoinCalibration, filecoin],
  transports: {
    [filecoin.id]: http(rpcConfig.primary.filecoinMainnet),
    [filecoinCalibration.id]: http(rpcConfig.primary.filecoinCalibration),
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfettiProvider>
            <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
              <RainbowKitProvider
                modalSize="compact"
                initialChain={filecoinCalibration.id}
              >
                <SynapseProvider>
                  {children}
                  <SpeedInsights />
                </SynapseProvider>
              </RainbowKitProvider>
            </WagmiProvider>
            </QueryClientProvider>
          </ConfettiProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
