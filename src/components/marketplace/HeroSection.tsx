"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const QUICK_CHIPS = [
  { label: "DSLR Cameras", query: "DSLR Camera" },
  { label: "Speakers", query: "Speakers" },
  { label: "LED Walls", query: "LED Wall" },
  { label: "Projectors", query: "Projector" },
];

const STATS = [
  { value: "10,000+", label: "Rentals" },
  { value: "500+", label: "Vendors" },
  { value: "\u20B92Cr+", label: "Saved" },
  { value: "4.8\u2605", label: "Rating" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HeroSection() {
  const [heroQuery, setHeroQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      window.dispatchEvent(
        new CustomEvent("marketplace-search", {
          detail: heroQuery.trim(),
        })
      );
    }
  };

  const handleChipClick = (query: string) => {
    window.dispatchEvent(
      new CustomEvent("marketplace-search", { detail: query })
    );
  };

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-amber-50/80 dark:from-primary/15 dark:via-primary/8 dark:to-background" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-amber-200/30 to-transparent blur-3xl dark:from-amber-900/20" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-orange-200/20 to-transparent blur-3xl dark:from-orange-900/15" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28"
      >
        <div className="text-center max-w-3xl mx-auto">
          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight"
          >
            Rent it. Buy it. Book it.{" "}
            <span className="bg-gradient-to-r from-primary via-amber-600 to-orange-500 bg-clip-text text-transparent dark:from-primary dark:via-amber-400 dark:to-orange-400">
              Let AI decide what&apos;s best.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            India&apos;s smartest equipment rental marketplace. Discover, compare,
            and save with AI-powered recommendations for rent, buy, or book.
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={item} className="mt-8 sm:mt-10">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cameras, speakers, projectors, lighting..."
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                className="pl-14 pr-28 h-14 sm:h-16 rounded-2xl bg-card border-2 border-primary/20 shadow-lg shadow-primary/5 text-base sm:text-lg focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 sm:h-12 px-6 rounded-xl font-medium"
              >
                Search
              </Button>
            </form>
          </motion.div>

          {/* Quick Action Chips */}
          <motion.div
            variants={item}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            <span className="text-xs text-muted-foreground self-center mr-1 hidden sm:inline">
              Popular:
            </span>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.query)}
                className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-premium backdrop-blur-sm"
              >
                {chip.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={item}
          className="mt-12 sm:mt-16 flex justify-center"
        >
          <div className="inline-flex flex-wrap justify-center gap-6 sm:gap-0 rounded-2xl border bg-card/70 backdrop-blur-sm px-6 sm:px-10 py-4 shadow-sm">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6 sm:gap-10">
                {i > 0 && (
                  <div className="hidden sm:block w-px h-8 bg-border" />
                )}
                <div className="text-center px-2">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}