"use client";

import { motion } from "framer-motion";
import { Search, BarChart3, CreditCard, PackageCheck } from "lucide-react";

const STEPS = [
  {
    num: 1,
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse our extensive catalog of event equipment from verified vendors",
  },
  {
    num: 2,
    icon: BarChart3,
    title: "Compare & Choose",
    description:
      "Use AI recommendations to decide between rent, buy, or book",
  },
  {
    num: 3,
    icon: CreditCard,
    title: "Book & Pay",
    description:
      "Select dates, choose quantity, and pay securely online",
  },
  {
    num: 4,
    icon: PackageCheck,
    title: "Receive & Enjoy",
    description:
      "Get equipment delivered or pick up. Easy returns when done.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function HowItWorks() {
  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Four simple steps to get the equipment you need
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          {/* Dotted connector line (desktop only) */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] border-t-2 border-dashed border-primary/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={item}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step circle */}
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-primary text-primary text-xs font-bold">
                    {step.num}
                  </div>

                  {/* Content */}
                  <div className="mt-5">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}