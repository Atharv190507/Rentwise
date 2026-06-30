"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Package,
  Wallet,
  CalendarCheck,
  ShieldCheck,
  Users,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Star,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  Zap,
  Crown,
  Leaf,
  AlertTriangle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/stores/app-store";
import type { AIEventPlanResult, AITierPackage } from "@/lib/types";

const EVENT_TYPES = [
  "Wedding",
  "Concert",
  "Corporate Event",
  "Birthday Party",
  "Conference",
  "Exhibition",
  "Festival",
  "Sports Event",
  "Religious Ceremony",
  "Other",
];

const GENERATING_STAGES = [
  { text: "Analyzing your event requirements...", icon: FileText },
  { text: "Scanning marketplace inventory...", icon: Package },
  { text: "Matching equipment to your needs...", icon: ShieldCheck },
  { text: "Building custom packages...", icon: Sparkles },
  { text: "Optimizing costs & vendors...", icon: Wallet },
];

const TIER_CONFIG = {
  ECONOMY: {
    label: "Economy",
    icon: Leaf,
    color: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  STANDARD: {
    label: "Standard",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    accent: "text-amber-600 dark:text-amber-400",
  },
  PREMIUM: {
    label: "Premium",
    icon: Crown,
    color: "from-violet-500 to-purple-600",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
    accent: "text-violet-600 dark:text-violet-400",
  },
};

type Step = "form" | "generating" | "results" | "detail" | "booking" | "success";

export default function AIEventPlannerView() {
  const { navigateTo, user, token, openAuthDialog } = useAppStore();

  // Step management
  const [step, setStep] = useState<Step>("form");

  // Form state
  const [eventType, setEventType] = useState("");
  const [guests, setGuests] = useState("");
  const [venueType, setVenueType] = useState("Indoor");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [duration, setDuration] = useState("2");
  const [eventDate, setEventDate] = useState("");
  const [requirements, setRequirements] = useState("");
  const [preference, setPreference] = useState("RENT");
  const [quality, setQuality] = useState("STANDARD");

  // Result state
  const [result, setResult] = useState<AIEventPlanResult | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<AITierPackage | null>(null);
  const [generatingStage, setGeneratingStage] = useState(0);
  const [bookingDates, setBookingDates] = useState({ startDate: "", endDate: "" });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Auto-cycle generating stages
  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setGeneratingStage((prev) => (prev + 1) % GENERATING_STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!eventType || !guests || !budget) {
      toast.error("Please fill in event type, number of guests, and budget");
      return;
    }

    if (!token) {
      openAuthDialog("login");
      toast.error("Please log in to use AI Event Planner");
      return;
    }

    setStep("generating");
    setGeneratingStage(0);

    try {
      const res = await fetch("/api/ai/event-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventType,
          guests: parseInt(guests),
          venueType,
          budget: parseFloat(budget),
          city: city || undefined,
          duration: parseInt(duration) || 1,
          eventDate: eventDate || undefined,
          requirements: requirements || undefined,
          preference,
          quality,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate event plan");

      setResult(data);
      setStep("results");

      // Auto-select the tier matching user's quality preference
      const prefTier = quality.toLowerCase() as keyof typeof data.packages;
      if (data.packages[prefTier]?.items?.length > 0) {
        setSelectedTier(prefTier);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }, [eventType, guests, venueType, budget, city, duration, eventDate, requirements, preference, quality, token, openAuthDialog]);

  const handleViewDetails = (tierKey: string) => {
    const pkg = result?.packages[tierKey as keyof typeof result.packages];
    if (pkg && pkg.items && pkg.items.length > 0) {
      setSelectedTier(tierKey);
      setSelectedPackage(pkg);
      setStep("detail");
    }
  };

  const handleBookPackage = async () => {
    if (!result || !selectedTier || !selectedPackage) return;
    if (!bookingDates.startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (!token) {
      openAuthDialog("login");
      return;
    }

    setBookingLoading(true);

    try {
      const res = await fetch(`/api/event-plans/${result.id}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: selectedTier.toUpperCase(),
          startDate: bookingDates.startDate,
          endDate: bookingDates.endDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book package");

      toast.success("Package booked successfully! Check your dashboard for details.");
      setStep("success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const totalHighPriority = (items: AIPackageItem[]) =>
    items.filter((i) => i.priority === "HIGH").length;

  const isWithinBudget = (cost: number) => result && cost <= result.budget;

  return (
    <div className="min-h-[80vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => navigateTo("marketplace")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Event Planner
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Let AI build custom equipment packages from our marketplace
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        {step !== "success" && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { key: "form", label: "Event Details" },
              { key: "results", label: "Compare Packages" },
              { key: "detail", label: "Package Details" },
              { key: "booking", label: "Book" },
            ].map((s, i) => {
              const stepOrder = ["form", "generating", "results", "detail", "booking"];
              const currentIdx = stepOrder.indexOf(step);
              const sIdx = stepOrder.indexOf(s.key);
              const isActive = s.key === step || (s.key === "results" && step === "generating");
              const isCompleted = sIdx < currentIdx;

              return (
                <div key={s.key} className="flex items-center gap-2">
                  {i > 0 && <div className="w-8 h-px bg-border" />}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className={isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ======================== FORM STEP ======================== */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">Tell us about your event</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details and our AI will create custom equipment packages
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Type & Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Event Type *
                      </Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger id="eventType">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guests" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        Number of Guests *
                      </Label>
                      <Input
                        id="guests"
                        type="number"
                        placeholder="e.g., 200"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        min={10}
                        max={10000}
                      />
                    </div>
                  </div>

                  {/* Venue Type */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Venue Type
                    </Label>
                    <RadioGroup value={venueType} onValueChange={setVenueType} className="flex flex-wrap gap-3">
                      {["Indoor", "Outdoor", "Both"].map((v) => (
                        <Label
                          key={v}
                          htmlFor={`venue-${v}`}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-premium ${
                            venueType === v
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <RadioGroupItem value={v} id={`venue-${v}`} />
                          {v}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Budget & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                        Budget (₹) *
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="e.g., 100000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        min={1000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="e.g., Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Duration & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Duration (days)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min={1}
                        max={30}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventDate" className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Event Date
                      </Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Special Requirements */}
                  <div className="space-y-2">
                    <Label htmlFor="requirements" className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      Special Requirements
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="e.g., Need a DJ setup, photo booth, and stage lighting for a wedding reception..."
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  {/* Preference */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      Preference
                    </Label>
                    <RadioGroup value={preference} onValueChange={setPreference} className="flex flex-wrap gap-3">
                      {[
                        { value: "RENT", label: "Rent Equipment", desc: "Best for short-term events" },
                        { value: "BUY", label: "Buy Equipment", desc: "Best for recurring needs" },
                        { value: "BOTH", label: "Both", desc: "AI will recommend the best option" },
                      ].map((p) => (
                        <Label
                          key={p.value}
                          htmlFor={`pref-${p.value}`}
                          className={`flex flex-col px-4 py-3 rounded-lg border cursor-pointer transition-premium ${
                            preference === p.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={p.value} id={`pref-${p.value}`} />
                            <span className="font-medium text-sm">{p.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-6">{p.desc}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      Quality Preference
                    </Label>
                    <RadioGroup value={quality} onValueChange={setQuality} className="flex flex-wrap gap-3">
                      {[
                        { value: "BASIC", label: "Basic", desc: "Budget-friendly essentials" },
                        { value: "STANDARD", label: "Standard", desc: "Best balance of quality & cost" },
                        { value: "PREMIUM", label: "Premium", desc: "Top-tier equipment only" },
                      ].map((q) => (
                        <Label
                          key={q.value}
                          htmlFor={`quality-${q.value}`}
                          className={`flex flex-col px-4 py-3 rounded-lg border cursor-pointer transition-premium ${
                            quality === q.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={q.value} id={`quality-${q.value}`} />
                            <span className="font-medium text-sm">{q.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-6">{q.desc}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full gap-2 text-base"
                    disabled={!eventType || !guests || !budget}
                  >
                    <Sparkles className="h-5 w-5" />
                    Generate AI Event Plan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ======================== GENERATING STEP ======================== */}
          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-orange-200/30 dark:from-primary/10 dark:to-orange-900/20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-10 w-10 text-primary" />
                  </motion.div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </motion.div>
              </div>

              <h2 className="text-xl font-bold mb-2">AI is crafting your event plan</h2>
              <p className="text-muted-foreground text-sm mb-8">
                Analyzing {guests} guest{parseInt(guests) > 1 ? "s" : ""} {eventType.toLowerCase()} event
              </p>

              <div className="w-full max-w-md space-y-3">
                {GENERATING_STAGES.map((stage, i) => {
                  const StageIcon = stage.icon;
                  const isActive = i === generatingStage;
                  const isDone = i < generatingStage;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : isDone
                            ? "bg-emerald-50 dark:bg-emerald-950/20"
                            : "bg-muted/50"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <StageIcon className="h-5 w-5 text-primary shrink-0" />
                        </motion.div>
                      ) : (
                        <StageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {stage.text}
                      </span>
                      {isDone && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ======================== RESULTS STEP (3-Tier Comparison) ======================== */}
          {step === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Summary */}
              <Card className="bg-gradient-to-r from-primary/5 via-amber-50/50 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm">
                    <div>
                      <span className="text-muted-foreground">Event:</span>{" "}
                      <span className="font-semibold">{result.eventType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guests:</span>{" "}
                      <span className="font-semibold">{result.guests}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span className="font-semibold">{result.duration} days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget:</span>{" "}
                      <span className="font-bold text-primary">{fmt(result.budget)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3 Package Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(["economy", "standard", "premium"] as const).map((tierKey) => {
                  const pkg = result.packages[tierKey];
                  if (!pkg || !pkg.items || pkg.items.length === 0) return null;
                  const config = TIER_CONFIG[(pkg.tier as keyof typeof TIER_CONFIG)] || TIER_CONFIG.STANDARD;
                  const TierIcon = config.icon;
                  const withinBudget = isWithinBudget(pkg.totalCost);
                  const isRecommended = quality.toLowerCase() === tierKey;
                  const highPriorityCount = totalHighPriority(pkg.items);

                  return (
                    <motion.div
                      key={tierKey}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: tierKey === "economy" ? 0.1 : tierKey === "standard" ? 0.2 : 0.3 }}
                    >
                      <Card
                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
                          isRecommended ? `ring-2 ring-primary ${config.border}` : config.border
                        }`}
                        onClick={() => handleViewDetails(tierKey)}
                      >
                        {isRecommended && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-orange-500" />
                        )}

                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className={config.badge}>
                              <TierIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{pkg.name}</CardTitle>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Price */}
                          <div>
                            <p className="text-3xl font-bold">{fmt(pkg.totalCost)}</p>
                            <p className="text-xs text-muted-foreground">
                              + {fmt(pkg.totalDeposit)} deposit
                            </p>
                          </div>

                          {/* Budget indicator */}
                          <div className="flex items-center gap-2">
                            {withinBudget ? (
                              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Within Budget
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Over Budget
                              </Badge>
                            )}
                          </div>

                          <Separator />

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 rounded-lg bg-muted/50">
                              <p className="text-lg font-bold">{pkg.items.length}</p>
                              <p className="text-xs text-muted-foreground">Items</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-muted/50">
                              <p className="text-lg font-bold">{highPriorityCount}</p>
                              <p className="text-xs text-muted-foreground">Essential</p>
                            </div>
                          </div>

                          {/* Top items preview */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Top items:</p>
                            {pkg.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="truncate text-muted-foreground">{item.productName}</span>
                                <span className="text-xs shrink-0 ml-2">
                                  {item.priority === "HIGH" && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-500 border-red-200 dark:border-red-800">
                                      Essential
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            ))}
                            {pkg.items.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{pkg.items.length - 3} more items</p>
                            )}
                          </div>

                          <Button
                            className="w-full gap-2"
                            variant={isRecommended ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(tierKey);
                            }}
                          >
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Upsells */}
              {result.upsells && result.upsells.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      Recommended Add-ons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.upsells.map((upsell, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{upsell.name}</p>
                            <p className="text-xs text-muted-foreground">{upsell.reason}</p>
                            {upsell.estimatedCost > 0 && (
                              <p className="text-xs font-semibold text-primary mt-1">
                                ~{fmt(upsell.estimatedCost)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <Card className="bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold mb-2">Pro Tips</p>
                        <ul className="space-y-1">
                          {result.tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5 shrink-0">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* ======================== DETAIL STEP ======================== */}
          {step === "detail" && selectedPackage && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Back + Header */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => setStep("results")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Comparison
                </Button>
                {selectedTier && (
                  <Badge className={TIER_CONFIG[selectedTier.toUpperCase() as keyof typeof TIER_CONFIG]?.badge}>
                    {selectedTier.toUpperCase()} Package
                  </Badge>
                )}
              </div>

              {/* Package Summary */}
              <Card className="border-2 border-primary/20">
                <CardContent className="py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedPackage.name}</h2>
                      {selectedPackage.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedPackage.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{fmt(selectedPackage.totalCost)}</p>
                      <p className="text-sm text-muted-foreground">
                        + {fmt(selectedPackage.totalDeposit)} deposit
                      </p>
                      {result && !isWithinBudget(selectedPackage.totalCost) && (
                        <p className="text-xs text-amber-600 mt-1">
                          Exceeds budget by {fmt(selectedPackage.totalCost - result.budget)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Equipment List ({selectedPackage.items.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Equipment</th>
                          <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                          <th className="text-center py-3 px-3 font-medium text-muted-foreground">Qty</th>
                          <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">Rent/Day</th>
                          <th className="text-center py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">Days</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Subtotal</th>
                          <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden lg:table-cell">Vendor</th>
                          <th className="text-center py-3 px-3 font-medium text-muted-foreground">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPackage.items.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                {item.reason && (
                                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                    {item.reason}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 hidden sm:table-cell">
                              {item.category && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0">
                                  {item.category}
                                </Badge>
                              )}
                            </td>
                            <td className="text-center py-3 px-3 font-medium">{item.quantity}</td>
                            <td className="text-right py-3 px-3 hidden md:table-cell text-muted-foreground">
                              {fmt(item.rentPerDay)}
                            </td>
                            <td className="text-center py-3 px-3 hidden md:table-cell text-muted-foreground">
                              {item.duration}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold">{fmt(item.subtotal)}</td>
                            <td className="text-left py-3 px-3 hidden lg:table-cell">
                              {item.vendorName && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs truncate max-w-[100px]">{item.vendorName}</span>
                                  {item.vendorRating && item.vendorRating > 0 && (
                                    <span className="text-[10px] text-amber-500 shrink-0">
                                      {item.vendorRating.toFixed(1)}★
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="text-center py-3 px-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0 ${
                                  item.priority === "HIGH"
                                    ? "text-red-500 border-red-200 dark:border-red-800"
                                    : item.priority === "MEDIUM"
                                      ? "text-amber-600 border-amber-200 dark:border-amber-800"
                                      : "text-emerald-600 border-emerald-200 dark:border-emerald-800"
                                }`}
                              >
                                {item.priority === "HIGH" ? "Essential" : item.priority === "MEDIUM" ? "Recommended" : "Optional"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Footer */}
              <Card className="bg-gradient-to-r from-primary/5 to-amber-50/50 dark:from-primary/5 dark:to-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {selectedPackage.items.length} items total
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {totalHighPriority(selectedPackage.items)} essential items
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">Total Rental Cost</p>
                      <p className="text-2xl font-bold text-primary">{fmt(selectedPackage.totalCost)}</p>
                      <p className="text-xs text-muted-foreground">
                        + {fmt(selectedPackage.totalDeposit)} refundable deposit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Book Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gap-2 px-8 text-base"
                  onClick={() => {
                    if (!token) {
                      openAuthDialog("login");
                      return;
                    }
                    setStep("booking");
                  }}
                >
                  <CalendarCheck className="h-5 w-5" />
                  Book This Package
                </Button>
              </div>
            </motion.div>
          )}

          {/* ======================== BOOKING STEP ======================== */}
          {step === "booking" && selectedPackage && result && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Confirm Booking
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review and confirm your package booking
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Package Summary */}
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{selectedPackage.name}</span>
                      <Badge className={TIER_CONFIG[selectedTier?.toUpperCase() as keyof typeof TIER_CONFIG]?.badge}>
                        {selectedTier?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-semibold">{selectedPackage.items.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rental Cost</p>
                        <p className="font-semibold">{fmt(selectedPackage.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deposit</p>
                        <p className="font-semibold">{fmt(selectedPackage.totalDeposit)}</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">
                        {fmt(selectedPackage.totalCost + selectedPackage.totalDeposit)}
                      </span>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={bookingDates.startDate}
                        onChange={(e) =>
                          setBookingDates((d) => ({ ...d, startDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date (optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={bookingDates.endDate}
                        onChange={(e) =>
                          setBookingDates((d) => ({ ...d, endDate: e.target.value }))
                        }
                        min={bookingDates.startDate || undefined}
                      />
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Items to be booked:</p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border">
                      {selectedPackage.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 py-2 text-sm border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.priority === "HIGH" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border shrink-0" />
                            )}
                            <span className="truncate">{item.productName}</span>
                            <span className="text-muted-foreground">x{item.quantity}</span>
                          </div>
                          <span className="font-medium shrink-0 ml-2">{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("detail")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      size="lg"
                      onClick={handleBookPackage}
                      disabled={bookingLoading || !bookingDates.startDate}
                    >
                      {bookingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                      Confirm & Book Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ======================== SUCCESS STEP ======================== */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
              >
                <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">Package Booked Successfully!</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Your {selectedTier} package has been booked. All equipment rentals have been created and are pending vendor approval. Check your dashboard for updates.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigateTo("customer-dashboard")}
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setStep("form");
                    setResult(null);
                    setSelectedTier(null);
                    setSelectedPackage(null);
                    setBookingDates({ startDate: "", endDate: "" });
                  }}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Plan Another Event
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}