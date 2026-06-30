"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, CalendarDays, Users, Wallet, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EventPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EventPlannerResult {
  equipment: Array<{
    name: string;
    quantity: number;
    dailyRate: number;
    totalCost: number;
  }>;
  totalEstimate: number;
  tips: string[];
}

export default function EventPlannerDialog({
  open,
  onOpenChange,
}: EventPlannerDialogProps) {
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EventPlannerResult | null>(null);
  const [error, setError] = useState("");

  const handlePlan = async () => {
    if (!description.trim()) {
      toast.error("Please describe your event");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/event-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          attendees: attendees ? parseInt(attendees) : undefined,
          budget: budget ? parseInt(budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to plan event");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Don't reset state so user can revisit
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Event Planner
          </DialogTitle>
          <DialogDescription>
            Describe your event and our AI will suggest the best equipment with
            cost estimates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">Event Description</Label>
            <textarea
              id="event-desc"
              placeholder="e.g., College tech fest with 300 attendees, need projectors, sound systems, and laptops for hackathon..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Attendees & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendees" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Attendees (optional)
              </Label>
              <Input
                id="attendees"
                type="number"
                placeholder="300"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                Budget ₹ (optional)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="50000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handlePlan}
            className="w-full gap-2"
            disabled={loading || !description.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Plan My Event
          </Button>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-4 w-1/3" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
              <Separator />
              <Skeleton className="h-6 w-32" />
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2"
            >
              <Separator />

              {/* Equipment List */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Recommended Equipment
                </h4>
                <div className="rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Equipment</span>
                    <span>Qty</span>
                    <span>Cost</span>
                  </div>
                  {result.equipment.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 text-sm border-t last:border-t-0"
                    >
                      <span className="font-medium truncate">{item.name}</span>
                      <span className="text-muted-foreground">{item.quantity}</span>
                      <span className="font-semibold">
                        ₹{item.totalCost.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Estimate</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{result.totalEstimate.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  * Estimate for rental duration. Final price may vary.
                </p>
              </div>

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-1.5">
                    {result.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}