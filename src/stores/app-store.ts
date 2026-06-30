import { create } from "zustand";
import type {
  AppUser,
  AppView,
  DashboardTab,
} from "@/lib/types";

interface AppState {
  // Auth
  user: AppUser | null;
  token: string | null;
  setUser: (user: AppUser | null, token: string | null) => void;
  logout: () => void;

  // Navigation
  currentView: AppView;
  selectedProductId: string | null;
  selectedBookingId: string | null;
  navigateTo: (view: AppView, productId?: string, bookingId?: string) => void;

  // Dashboard tabs
  customerTab: DashboardTab["customer"];
  vendorTab: DashboardTab["vendor"];
  adminTab: DashboardTab["admin"];
  setCustomerTab: (tab: DashboardTab["customer"]) => void;
  setVendorTab: (tab: DashboardTab["vendor"]) => void;
  setAdminTab: (tab: DashboardTab["admin"]) => void;

  // Auth dialogs
  showAuthDialog: boolean;
  authDialogMode: "login" | "register" | "vendor-register";
  openAuthDialog: (mode?: "login" | "register" | "vendor-register") => void;
  closeAuthDialog: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user, token) => {
    if (token) {
      localStorage.setItem("rw_token", token);
    } else {
      localStorage.removeItem("rw_token");
    }
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("rw_token");
    set({ user: null, token: null, currentView: "marketplace" });
  },

  // Navigation
  currentView: "marketplace",
  selectedProductId: null,
  selectedBookingId: null,
  navigateTo: (view, productId, bookingId) =>
    set({
      currentView: view,
      selectedProductId: productId || null,
      selectedBookingId: bookingId || null,
    }),

  // Dashboard tabs
  customerTab: "overview",
  vendorTab: "overview",
  adminTab: "overview",
  setCustomerTab: (tab) => set({ customerTab: tab }),
  setVendorTab: (tab) => set({ vendorTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),

  // Auth dialogs
  showAuthDialog: false,
  authDialogMode: "login",
  openAuthDialog: (mode = "login") =>
    set({ showAuthDialog: true, authDialogMode: mode }),
  closeAuthDialog: () => set({ showAuthDialog: false }),
}));