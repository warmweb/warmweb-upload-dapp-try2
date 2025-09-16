"use client";
import { StorageManager } from "@/components/StorageManager";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FileUploader } from "../../components/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";
import { DatasetsViewer } from "@/components/DatasetsViewer";
import { SiteGenerator } from "@/components/SiteGenerator";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalances } from "@/hooks/useBalances";
import Github from "@/components/ui/icons/Github";
import Filecoin from "@/components/ui/icons/Filecoin";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "manage-storage" | "upload" | "datasets" | "site-gen";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "smooth",
    },
  },
};

export default function AppPage() {
  const { isConnected, chainId } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("manage-storage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showConfetti } = useConfetti();
  const { data: balances, isLoading: isLoadingBalances } = useBalances();

  const isTab = (value: string | null): value is Tab =>
    value === "manage-storage" || value === "upload" || value === "datasets" || value === "site-gen";

  const updateUrl = (tab: Tab) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tab);
    router.replace(`/app?${params.toString()}`);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    updateUrl(tab);
  };

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (isTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      updateUrl(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="w-full flex flex-col justify-center min-h-fit bg-gradient-to-br from-background via-background to-secondary/5">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />
      )}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center my-10 w-full mx-auto px-6"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3 mb-4"
        >
          <Filecoin className="w-8 h-8" />
          Filecoin Cloud Dashboard
          <motion.a
            whileHover={{ scale: 1.2 }}
            href="https://github.com/FIL-Builders/fs-upload-dapp"
            className="text-primary transition-colors duration-200 hover:underline cursor-pointer rounded-md hover:text-[#008cf6]"
            target="_blank"
          >
            <Github className="w-6 h-6" />
          </motion.a>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground mb-6 text-center max-w-2xl"
        >
          Manage your decentralized storage, upload files, and track your usage with{" "}
          <motion.a
            href="https://docs.secured.finance/usdfc-stablecoin/getting-started"
            className="text-[#e9ac00] hover:underline cursor-pointer font-semibold"
            target="_blank"
          >
            USDFC
          </motion.a>
          . Your current balance: {" "}
          <span className="font-bold text-primary">
            {isLoadingBalances || !isConnected
              ? "..."
              : `$${balances?.usdfcBalanceFormatted.toFixed(2)}`}
          </span>
        </motion.p>

        {chainId !== 314159 && (
          <motion.div
            variants={itemVariants}
            className="mb-6 max-w-xl text-center bg-red-500/10 border border-red-500/30 p-4 rounded-lg"
          >
            <p className="text-red-400">
              ⚠️ Filecoin mainnet is not supported yet. Please use Filecoin Calibration network.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="flex flex-col items-center bg-card rounded-2xl p-8 shadow-lg border"
            >
              <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Please connect your Web3 wallet to access the Filecoin Cloud dashboard
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ConnectButton />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={itemVariants}
              className="mt-3 max-w-6xl w-full bg-card/50 backdrop-blur-sm border rounded-2xl p-8 shadow-xl"
            >
              <motion.div variants={itemVariants} className="flex mb-8 bg-muted rounded-xl p-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange("manage-storage")}
                  className={`flex-1 py-3 px-6 text-center rounded-lg transition-all font-medium ${
                    activeTab === "manage-storage"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Manage Storage
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange("upload")}
                  className={`flex-1 py-3 px-6 text-center rounded-lg transition-all font-medium ${
                    activeTab === "upload"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Upload Files
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange("datasets")}
                  className={`flex-1 py-3 px-6 text-center rounded-lg transition-all font-medium ${
                    activeTab === "datasets"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  View Datasets
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange("site-gen")}
                  className={`flex-1 py-3 px-6 text-center rounded-lg transition-all font-medium ${
                    activeTab === "site-gen"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Site Generator
                </motion.button>
              </motion.div>

              <AnimatePresence mode="wait">
                {activeTab === "manage-storage" ? (
                  <motion.div
                    key="deposit"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <StorageManager />
                  </motion.div>
                ) : activeTab === "upload" ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      type: "smooth",
                    }}
                  >
                    <FileUploader />
                  </motion.div>
                ) : activeTab === "datasets" ? (
                  <motion.div
                    key="datasets"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <DatasetsViewer />
                  </motion.div>
                ) : (
                  activeTab === "site-gen" && (
                    <motion.div
                      key="site-gen"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                    >
                      <SiteGenerator />
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          variants={itemVariants}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>
            Powered by{" "}
            <motion.a
              href="https://github.com/FilOzone/synapse-sdk"
              target="_blank"
              className="text-primary hover:underline font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Synapse SDK
            </motion.a>
          </p>
        </motion.div>
      </motion.main>
    </div>
  );
}