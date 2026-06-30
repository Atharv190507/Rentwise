"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { AppCategory } from "@/lib/types";

const EMOJI_MAP: Record<string, string> = {
  Cameras: "\u{1F4F7}",
  Speakers: "\u{1F50A}",
  Projectors: "\u{1F4FD}",
  Lighting: "\u{1F4A1}",
  Microphones: "\u{1F3A4}",
  "LED Walls": "\u{1F5A5}\uFE0F",
  Furniture: "\u{1FA91}",
  "Tents & Canopies": "\u26FA",
  Decoration: "\u2728",
  "Stage Equipment": "\u{1F3AC}",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function CategoriesShowcase() {
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleClick = (categoryId: string) => {
    window.dispatchEvent(
      new CustomEvent("marketplace-category-filter", { detail: categoryId })
    );
    // Scroll to marketplace content
    const el = document.getElementById("marketplace-content");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Browse by Category
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Find the perfect equipment for your event
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-28 sm:h-32 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                variants={item}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClick(cat.id)}
                className="group flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl border bg-card p-4 sm:p-6 card-hover cursor-pointer"
              >
                <span className="text-3xl sm:text-4xl lg:text-5xl transition-transform duration-300 group-hover:scale-110">
                  {EMOJI_MAP[cat.name] || cat.icon || "\u{1F4E6}"}
                </span>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight">
                  {cat.name}
                </span>
                {cat._count?.products != null && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {cat._count.products} items
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}