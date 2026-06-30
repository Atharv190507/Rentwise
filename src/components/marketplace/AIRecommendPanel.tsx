"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  ArrowRight,
  Clock,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { AIRecommendationResult } from "@/lib/types";

const REC_COLORS: Record<string, string> = {
  RENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  BUY: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  BOOK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function AIRecommendPanel({
  productTitle,
  rentPricePerDay,
  buyPrice,
}: {
  productTitle: string;
  rentPricePerDay: number;
  buyPrice: number;
}) {
  const [days, setDays] = useState("");
  const [budget, setBudget] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIRecommendationResult | null>(null);
  const [error, setError] = useState("");

  const handleRecommend = async () => {
    if (!days || parseInt(days) <= 0) {
      toast.error("Please enter the number of days");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: undefined,
          productTitle,
          rentPricePerDay,
          buyPrice,
          days: parseInt(days),
          budget: budget ? parseInt(budget) : undefined,
          purpose: purpose || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get recommendation");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Recommendation
        </CardTitle>
        <CardDescription>
          Not sure whether to rent or buy? Let AI decide for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rec-days" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              How many days do you need it?
            </Label>
            <Input
              id="rec-days"
              type="number"
              placeholder="e.g., 7"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-budget" className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              Budget (optional)
            </Label>
            <Input
              id="rec-budget"
              type="number"
              placeholder="e.g., 10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-purpose">Purpose (optional)</Label>
            <Input
              id="rec-purpose"
              placeholder="e.g., one-time event, regular project work..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleRecommend}
          className="w-full gap-2"
          disabled={loading || !days}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          Get AI Recommendation
        </Button>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-2"
          >
            {/* Recommendation Badge */}
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI suggests:</span>
              <Badge className={REC_COLORS[result.recommendation] || ""}>
                {result.recommendation}
              </Badge>
            </div>

            {/* Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.explanation}
            </p>

            {/* Savings */}
            {result.savings != null && result.savings > 0 && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-3">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  You could save{" "}
                  <span className="text-lg font-bold">
                    ₹{result.savings.toLocaleString("en-IN")}
                  </span>
                </p>
              </div>
            )}

            {/* Alternatives */}
            {result.alternatives && (
              <p className="text-xs text-muted-foreground italic">
                {result.alternatives}
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}