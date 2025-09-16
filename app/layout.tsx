"use client";

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SynapseProvider } from "@/providers/SynapseProvider";
import { ConfettiProvider } from "@/providers/ConfettiProvider";
import { rpcConfig } from "@/config";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [filecoinCalibration, filecoin],
  connectors: [],
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
