"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingDown, ShieldCheck, Truck } from "lucide-react";

const CARDS = [
  {
    icon: Sparkles,
    title: "AI-Powered Decisions",
    description:
      "Our AI analyzes your needs and recommends the most cost-effective option",
    gradient: "from-amber-100 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: TrendingDown,
    title: "Save Up to 97%",
    description:
      "Renting is often drastically cheaper than buying for short-term needs",
    gradient: "from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Verified Vendors",
    description:
      "All vendors are verified with quality equipment and reliable service",
    gradient: "from-sky-100 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/10",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    icon: Truck,
    title: "Doorstep Delivery",
    description:
      "Get equipment delivered to your venue and picked up when you're done",
    gradient: "from-rose-100 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function WhyRentWise() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Why RentWise?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Everything you need for a hassle-free equipment experience
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={item}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 card-hover"
              >
                {/* Subtle gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}