"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/stores/app-store";

// --- Schemas ---
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "VENDOR"]),
});

const vendorRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  description: z.string().min(10, "Please provide a brief description (min 10 characters)"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type VendorRegisterValues = z.infer<typeof vendorRegisterSchema>;

export default function AuthDialog() {
  const { showAuthDialog, authDialogMode, closeAuthDialog, setUser, openAuthDialog } =
    useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CUSTOMER" },
  });

  const vendorForm = useForm<VendorRegisterValues>({
    resolver: zodResolver(vendorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      businessName: "",
      phone: "",
      description: "",
    },
  });

  const resetForms = () => {
    loginForm.reset();
    registerForm.reset();
    vendorForm.reset();
    setShowPassword(false);
    setLoading(false);
  };

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setUser(data.user, data.token);
      closeAuthDialog();
      toast.success(`Welcome back, ${data.user.name}!`);
      resetForms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setUser(data.user, data.token);
      closeAuthDialog();
      toast.success(`Welcome, ${data.user.name}! Account created.`);
      resetForms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorRegister = async (values: VendorRegisterValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role: "VENDOR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setUser(data.user, data.token);
      closeAuthDialog();
      toast.success(`Welcome, ${data.user.name}! Vendor account submitted for review.`);
      resetForms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={showAuthDialog}
      onOpenChange={(open) => {
        if (!open) {
          closeAuthDialog();
          resetForms();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Login Form */}
          {authDialogMode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl">Welcome back</DialogTitle>
                <DialogDescription>
                  Sign in to your RentWise AI account
                </DialogDescription>
              </DialogHeader>
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="px-6 pb-6 space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-premium"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => {
                        resetForms();
                        openAuthDialog("register");
                      }}
                    >
                      Register
                    </button>
                  </div>

                  {/* Quick Demo Login */}
                  <div className="pt-2">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-3 text-muted-foreground">
                          Quick Demo Login
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          loginForm.setValue("email", "arjun.sharma@email.com");
                          loginForm.setValue("password", "customer123");
                          loginForm.handleSubmit(handleLogin)();
                        }}
                        className="flex-1 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-premium"
                      >
                        Try as Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loginForm.setValue("email", "progear@rentwise.ai");
                          loginForm.setValue("password", "vendor123");
                          loginForm.handleSubmit(handleLogin)();
                        }}
                        className="flex-1 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-premium"
                      >
                        Try as Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loginForm.setValue("email", "admin@rentwise.ai");
                          loginForm.setValue("password", "admin123");
                          loginForm.handleSubmit(handleLogin)();
                        }}
                        className="flex-1 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-premium"
                      >
                        Try as Admin
                      </button>
                    </div>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Register Form */}
          {authDialogMode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl">Create account</DialogTitle>
                <DialogDescription>
                  Join RentWise AI and start renting smarter
                </DialogDescription>
              </DialogHeader>
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="px-6 pb-6 space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Min 6 characters"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-premium"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I want to</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">Rent equipment</SelectItem>
                            <SelectItem value="VENDOR">List equipment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => {
                        resetForms();
                        openAuthDialog("login");
                      }}
                    >
                      Already have an account?
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => {
                        resetForms();
                        openAuthDialog("vendor-register");
                      }}
                    >
                      Vendor sign up
                    </button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Vendor Register Form */}
          {authDialogMode === "vendor-register" && (
            <motion.div
              key="vendor-register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="px-6 pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForms();
                    openAuthDialog("register");
                  }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-premium mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to register
                </button>
                <DialogTitle className="text-xl">
                  Vendor Registration
                </DialogTitle>
                <DialogDescription>
                  Register your business and start listing equipment
                </DialogDescription>
              </DialogHeader>
              <Form {...vendorForm}>
                <form
                  onSubmit={vendorForm.handleSubmit(handleVendorRegister)}
                  className="px-6 pb-6 pt-2 space-y-4 max-h-[60vh] overflow-y-auto"
                >
                  <FormField
                    control={vendorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@business.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Min 6 characters"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-premium"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Equipment Rentals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your business, types of equipment you offer..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register as Vendor
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}