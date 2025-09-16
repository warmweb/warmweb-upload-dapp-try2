"use client";
import { useAccount } from "wagmi";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalances } from "@/hooks/useBalances";
import Github from "@/components/ui/icons/Github";
import Filecoin from "@/components/ui/icons/Filecoin";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

function ScrollSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const { isConnected, chainId } = useAccount();
  const { data: balances, isLoading: isLoadingBalances } = useBalances();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <motion.section 
        style={{ opacity }}
        className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center z-10 max-w-4xl mx-auto px-6"
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <Filecoin className="w-16 h-16" />
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Filecoin Cloud
            </h1>
          </motion.div>
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            The future of decentralized storage. Upload, manage, and host your files on the Filecoin network with enterprise-grade reliability.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-6">
            {!isConnected ? (
              <motion.div 
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ConnectButton />
              </motion.div>
            ) : (
              <motion.div variants={scaleIn} className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-lg">
                  <span className="text-muted-foreground">Your USDFC Balance:</span>
                  <span className="font-bold text-2xl text-primary">
                    {isLoadingBalances ? "..." : `$${balances?.usdfcBalanceFormatted.toFixed(2)}`}
                  </span>
                </div>
                <Link href="/app" className="inline-block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Launch App
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {chainId !== 314159 && (
              <motion.div
                variants={fadeInUp}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-lg"
              >
                <p className="text-red-400 text-center">
                  ⚠️ Please switch to Filecoin Calibration network for full functionality
                </p>
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex items-center justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>Powered by</span>
            <motion.a
              href="https://github.com/FilOzone/synapse-sdk"
              target="_blank"
              className="text-primary hover:underline font-semibold"
              whileHover={{ scale: 1.05 }}
            >
              Synapse SDK
            </motion.a>
            <span>•</span>
            <motion.a
              href="https://github.com/FIL-Builders/fs-upload-dapp"
              target="_blank"
              className="text-primary hover:underline flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <Github className="w-4 h-4" />
              GitHub
            </motion.a>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <ScrollSection className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose Filecoin Cloud?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the power of decentralized storage with enterprise features and Web3 innovation.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-8">
            <motion.div variants={scaleIn} className="bg-card rounded-2xl p-8 shadow-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Decentralized</h3>
              <p className="text-muted-foreground">Your files are stored across the Filecoin network, ensuring maximum security and redundancy.</p>
            </motion.div>

            <motion.div variants={scaleIn} className="bg-card rounded-2xl p-8 shadow-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground">Optimized for performance with global CDN and intelligent caching mechanisms.</p>
            </motion.div>

            <motion.div variants={scaleIn} className="bg-card rounded-2xl p-8 shadow-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Cost Effective</h3>
              <p className="text-muted-foreground">Pay only for what you use with transparent USDFC pricing and no hidden fees.</p>
            </motion.div>
          </motion.div>
        </div>
      </ScrollSection>

      {/* How It Works Section */}
      <ScrollSection className="py-24 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with Filecoin Cloud in just a few simple steps.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect Wallet", desc: "Link your Web3 wallet to get started" },
              { step: "02", title: "Fund Account", desc: "Add USDFC to your account for storage payments" },
              { step: "03", title: "Upload Files", desc: "Drag and drop files to upload to Filecoin" },
              { step: "04", title: "Manage & Share", desc: "Organize files and generate shareable links" }
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </ScrollSection>

      {/* CTA Section */}
      <ScrollSection className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={stagger}>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users already storing their files on the decentralized web.
            </motion.p>
            <motion.div variants={fadeInUp}>
              {!isConnected ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ConnectButton />
                </motion.div>
              ) : (
                <Link href="/app">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Launch App Now
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </ScrollSection>
    </div>
  );
}
