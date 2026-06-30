"use client";

import { Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/app-store";

const FOOTER_LINKS = [
  { label: "Browse Equipment", action: "browse" },
  { label: "Become a Vendor", action: "vendor" },
  { label: "AI Event Planner", action: "planner" },
  { label: "How It Works", action: "how" },
  { label: "Help & Support", action: "help" },
] as const;

export default function Footer() {
  const { navigateTo, openAuthDialog } = useAppStore();

  const handleLinkClick = (action: string) => {
    if (action === "browse") {
      navigateTo("marketplace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "vendor") {
      openAuthDialog("vendor-register");
    } else if (action === "planner") {
      navigateTo("ai-event-planner");
    } else if (action === "how") {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (action === "help") {
      toast.info("Support: support@rentwise.ai");
    }
  };

  return (
    <footer className="w-full border-t bg-card/50 pb-safe">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                RentWise AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              India&apos;s smartest equipment rental marketplace. Powered by AI to
              help you rent, buy, or book equipment at the best prices with
              intelligent recommendations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2.5">
              {FOOTER_LINKS.map((link) => (
                <button
                  key={link.action}
                  className="text-sm text-muted-foreground hover:text-foreground transition-premium text-left"
                  onClick={() => handleLinkClick(link.action)}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>support@rentwise.ai</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>
                  123, Tech Park, Koramangala,
                  <br />
                  Bengaluru, Karnataka 560034
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2025 RentWise AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-premium" onClick={() => toast.info("Coming soon")}>
              Privacy Policy
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-premium" onClick={() => toast.info("Coming soon")}>
              Terms of Service
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-premium" onClick={() => toast.info("Coming soon")}>
              Cancellation Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}