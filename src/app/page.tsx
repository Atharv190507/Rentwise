"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/app-store";
import { useEffect, useState } from "react";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import AuthDialog from "@/components/auth/AuthDialog";
import MarketplaceView from "@/components/marketplace/MarketplaceView";
import ProductDetailView from "@/components/marketplace/ProductDetailView";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";
import VendorDashboard from "@/components/dashboard/VendorDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

function DashboardLoader() {
  const { user } = useAppStore();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      import("@/components/dashboard/AdminDashboard").then((m) => setComponent(() => m.default));
    } else if (user?.role === "VENDOR") {
      import("@/components/dashboard/VendorDashboard").then((m) => setComponent(() => m.default));
    } else {
      import("@/components/dashboard/CustomerDashboard").then((m) => setComponent(() => m.default));
    }
  }, [user?.role]);

  if (!Component) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <Component />;
}

export default function Home() {
  const { currentView } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentView === "marketplace" && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MarketplaceView />
            </motion.div>
          )}

          {currentView === "product-detail" && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProductDetailView />
            </motion.div>
          )}

          {(currentView === "customer-dashboard" ||
            currentView === "vendor-dashboard" ||
            currentView === "admin-dashboard") && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-6"
            >
              <DashboardLoader />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <AuthDialog />
    </div>
  );
}