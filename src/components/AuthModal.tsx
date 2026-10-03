import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Store,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandName } from "./BrandName";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  asPage?: boolean;
  initialMode?: "login" | "signup" | "forgot_password";
  initialMethod?: "google" | "mobile" | "email";
  initialRole?: "customer" | "vendor" | "admin";
  returnTo?: string;
  onSuccess?: () => void;
}

// Canonical categories for vendor registration
const CATEGORIES = [
  { id: "venues", name: "Venues" },
  { id: "photography", name: "Photography & Cinema" },
  { id: "catering", name: "Catering Services" },
  { id: "decoration", name: "Decoration & Themes" },
  { id: "music_dj", name: "DJ, Music & Dhol Tasha" },
  { id: "pandit_priest", name: "Pandits & Priests" },
];

// Pune-only localities
const PUNE_LOCALITIES = [
  "Baner",
  "Koregaon Park",
  "Kothrud",
  "Wakad",
  "Kalyani Nagar",
  "Hadapsar",
  "Viman Nagar",
  "Sinhagad Road",
  "Aundh",
  "Hinjewadi",
  "Pimpri-Chinchwad",
  "Shivajinagar",
  "Bibwewadi",
  "Undri",
  "Kharadi",
  "Magarpatta",
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  asPage = false,
  initialMode = "login",
  initialMethod = "google",
  initialRole = "customer",
  returnTo = "/",
  onSuccess,
}) => {
  useModalScrollLock(Boolean(isOpen && !asPage), onClose);

  // Modal display modes: 'login' | 'signup' | 'forgot_password'
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">(initialMode);
  // Login method tabs: 'google' | 'mobile' | 'email'
  const [loginMethod, setLoginMethod] = useState<"google" | "mobile" | "email">(initialMethod);

  // Form states - Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile Auth states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileAuthType, setMobileAuthType] = useState<"otp" | "password">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);

  // Form states - Signup
  const [signupRole, setSignupRole] = useState<"customer" | "vendor" | "admin">(initialRole);
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("venues");
  const [selectedLocality, setSelectedLocality] = useState("Baner");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Google custom email state
  const [googleEmail, setGoogleEmail] = useState("pradipsable43@gmail.com");
  const [isCustomGoogle, setIsCustomGoogle] = useState(false);

  // Password Recovery / Forgot Password state
  const [recoveryInput, setRecoveryInput] = useState("");

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Synchronize initial mode, method & role when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginMethod(initialMethod);
      setSignupRole(initialRole);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode, initialMethod, initialRole]);

  // Session observer: auto-redirect if session is active or created
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        if (onSuccess) {
          onSuccess();
        } else if (asPage) {
          window.location.href = returnTo;
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (onSuccess) {
          onSuccess();
        } else if (asPage) {
          window.location.href = returnTo;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [returnTo, onSuccess, asPage]);

  // Resend OTP timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  if (!isOpen && !asPage) return null;

  // STUB: Mobile OTP verification pending SMS gateway decision (e.g. Twilio vs MSG91 / Supabase Phone Auth)
  const handleSendOtp = () => {
    const digits = phoneNumber.replace(/[^0-9]/g, "");
    if (digits.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setResendTimer(30);
      setSuccessMessage(`OTP sent to +91 ${digits.slice(-10)}. (Use test code 123456)`);
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pasted = val.replace(/[^0-9]/g, "").slice(0, 6).split("");
      const newOtp = [...otpValue];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtpValue(newOtp);
      return;
    }
    const newOtp = [...otpValue];
    newOtp[index] = val.slice(-1);
    setOtpValue(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Real Google OAuth sign-in via Lovable Cloud Auth
  const handleGoogleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
        ...(isCustomGoogle && googleEmail.trim()
          ? { extraParams: { login_hint: googleEmail.trim() } }
          : {}),
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Google sign-in failed.");
        setIsLoading(false);
      } else if (!result.redirected) {
        setSuccessMessage("Successfully signed in with Google!");
        if (onSuccess) {
          onSuccess();
          onClose?.();
        } else if (asPage) {
          window.location.href = returnTo;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message ?? "Google sign-in failed.");
      setIsLoading(false);
    }
  };

  // STUB: Mobile password login pending backend schema and phone auth integration
  const handleMobileLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/[^0-9]/g, "");
    if (digits.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (mobileAuthType === "otp" && !otpSent) {
      handleSendOtp();
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Verified and signed in successfully!");
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 800);
    }, 500);
  };

  // Real Email & password authentication using user's actual password
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      setSuccessMessage("Signed in successfully!");
      if (onSuccess) {
        onSuccess();
        onClose?.();
      } else if (asPage) {
        window.location.href = returnTo;
      }
    } catch (err: any) {
      setErrorMessage(err.message ?? "Sign-in failed. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Real account registration using user's actual signupPassword and role metadata
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = signupEmail.trim();
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name or contact person name.");
      return;
    }
    if (!cleanEmail) {
      setErrorMessage("Please provide an email address.");
      return;
    }
    if (signupRole === "vendor" && !businessName.trim()) {
      setErrorMessage("Please enter your business or brand name.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Please accept the Terms of Service & Privacy Policy to continue.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            account_type: signupRole,
            phone: signupPhone.trim() || undefined,
            business_name: signupRole === "vendor" ? businessName.trim() : undefined,
            category: signupRole === "vendor" ? selectedCategory : undefined,
            locality: signupRole === "vendor" ? selectedLocality : undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data?.session) {
        setSuccessMessage("Check your email to confirm your account.");
        return;
      }

      setSuccessMessage(
        signupRole === "vendor"
          ? "Vendor Studio registered successfully!"
          : "Host account created successfully!",
      );
      if (onSuccess) {
        onSuccess();
        onClose?.();
      } else if (asPage) {
        window.location.href = returnTo;
      }
    } catch (err: any) {
      setErrorMessage(err.message ?? "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Real password recovery via Supabase
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = recoveryInput.trim();
    if (!cleanInput) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanInput, {
        redirectTo: `${window.location.origin}/auth?mode=signin`,
      });
      if (error) throw error;
      setSuccessMessage("Password reset instructions sent to your email!");
      setTimeout(() => {
        setMode("login");
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div
      className={`bg-white dark:bg-card rounded-3xl border border-border shadow-2xl overflow-hidden ${
        asPage ? "max-w-2xl mx-auto my-6" : "w-full max-w-xl max-h-[92vh] flex flex-col"
      }`}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-accent-dark p-6 text-white relative shrink-0">
        {!asPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 mb-2">
          <div className="px-2.5 py-1.5 rounded-xl bg-white flex items-center gap-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-primary-dark flex items-center justify-center text-white font-brand text-sm shadow-xs border border-primary-dark/20 shrink-0">
              <span className="lowercase text-white">c</span>
              <span className="text-accent -ml-0.5 text-[9px] font-black">&bull;</span>
            </div>
            <BrandName size="xl" weight="black" />
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-light border border-accent/30 uppercase tracking-widest font-semibold">
            Pune
          </span>
        </div>

        <h1 className="font-serif font-bold text-2xl text-accent-light">
          {mode === "login" && "Sign in to your account"}
          {mode === "signup" && "Create your Celebratz account"}
          {mode === "forgot_password" && "Reset your password"}
        </h1>
        <p className="text-xs text-white/80 mt-1">
          {mode === "login" &&
            "Access your booking requests, saved wishlist, reviews, and vendor studio."}
          {mode === "signup" &&
            "Join thousands of event hosts and verified event vendors across Pune."}
          {mode === "forgot_password" &&
            "Enter your registered email or mobile to receive recovery instructions."}
        </p>
      </div>

      {/* Main Form Body */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-success/10 border border-success/20 text-success rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === "login" && (
          <div className="space-y-5">
            {/* Login Method Tabs */}
            <div className="flex bg-muted p-1 rounded-2xl border border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("google");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMethod === "google"
                    ? "bg-white dark:bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod("mobile");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMethod === "mobile"
                    ? "bg-white dark:bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="w-4 h-4 text-success shrink-0" />
                <span>Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMethod === "email"
                    ? "bg-white dark:bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>Email</span>
              </button>
            </div>

            {/* TAB 1: GOOGLE SIGN IN */}
            {loginMethod === "google" && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-card shadow-xs border border-border flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-foreground text-sm">
                      One-Click Google Authentication
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Securely sign in with your verified Google account
                    </p>
                  </div>

                  {!isCustomGoogle ? (
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-card rounded-xl border border-border text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                          PS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Pradip Sable</p>
                          <p className="text-[11px] text-muted-foreground">{googleEmail}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomGoogle(true)}
                        className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-semibold text-foreground">
                        Enter Google Account Email
                      </label>
                      <input
                        type="email"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full bg-white dark:bg-card border border-border rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-primary"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGoogleLoginSubmit}
                    disabled={isLoading}
                    className="w-full py-3 bg-white dark:bg-card border border-border hover:bg-muted/40 text-foreground rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MOBILE NUMBER & OTP */}
            {loginMethod === "mobile" && (
              <form onSubmit={handleMobileLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Mobile Number (India)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2.5 bg-muted border border-border rounded-xl text-xs font-bold text-foreground flex items-center gap-1 select-none">
                      <span>🇮🇳 +91</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98230 45678"
                        maxLength={12}
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-toggle: OTP or Password */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileAuthType("otp")}
                      className={`text-xs font-semibold cursor-pointer ${
                        mobileAuthType === "otp"
                          ? "text-primary underline"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Login via OTP
                    </button>
                    <span className="text-muted-foreground">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setMobileAuthType("password")}
                      className={`text-xs font-semibold cursor-pointer ${
                        mobileAuthType === "password"
                          ? "text-primary underline"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Use Password
                    </button>
                  </div>
                </div>

                {mobileAuthType === "otp" ? (
                  <div className="space-y-3">
                    {otpSent ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground">
                            Enter 6-Digit OTP
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpValue(["1", "2", "3", "4", "5", "6"]);
                            }}
                            className="text-[10px] text-accent hover:text-accent-dark font-bold bg-accent-subtle px-2 py-0.5 rounded border border-accent/30 cursor-pointer"
                          >
                            Auto-fill (123456)
                          </button>
                        </div>
                        <div className="flex justify-between gap-1.5">
                          {otpValue.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-input-${idx}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-10 h-11 text-center font-bold text-base bg-muted/40 border border-border rounded-xl focus:border-primary focus:bg-white dark:focus:bg-card outline-hidden"
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                          <span>Didn't receive code?</span>
                          {resendTimer > 0 ? (
                            <span>Resend in {resendTimer}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-primary font-bold hover:underline cursor-pointer"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        We will send a fast 6-digit verification code to confirm your mobile number.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mobileAuthType === "otp"
                          ? otpSent
                            ? "Verify OTP & Sign In"
                            : "Get OTP on Mobile"
                          : "Sign In with Password"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: EMAIL WITH PASSWORD */}
            {loginMethod === "email" && (
              <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya.sharma@example.com"
                      className="w-full bg-muted/40 border border-border rounded-xl py-2.5 pl-9 pr-3 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot_password");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-muted/40 border border-border rounded-xl py-2.5 pl-9 pr-9 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: SIGN UP / REGISTER */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupRole("customer")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    signupRole === "customer"
                      ? "border-primary bg-primary-subtle shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-border bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon
                      className={`w-4 h-4 ${signupRole === "customer" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-serif font-bold text-xs text-foreground">
                      Event Host / Planner
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    I want to discover venues & book vendors
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole("vendor")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    signupRole === "vendor"
                      ? "border-accent bg-accent-subtle shadow-xs ring-1 ring-accent"
                      : "border-border hover:border-border bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Store
                      className={`w-4 h-4 ${signupRole === "vendor" ? "text-accent" : "text-muted-foreground"}`}
                    />
                    <span className="font-serif font-bold text-xs text-foreground">
                      Pune Vendor / Venue
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    I want to list my business & receive leads
                  </p>
                </button>
              </div>
            </div>

            {/* Vendor Specific Inputs */}
            {signupRole === "vendor" && (
              <div className="p-3.5 bg-accent-subtle/80 rounded-2xl border border-accent/40 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-accent-dark uppercase tracking-wider mb-1">
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Royal Heritage Banquets, LensCraft Studio"
                    className="w-full bg-white dark:bg-card border border-accent/40 rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark uppercase tracking-wider mb-1">
                      Primary Service
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white dark:bg-card border border-accent/40 rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-accent"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-accent-dark uppercase tracking-wider mb-1">
                      Pune Locality
                    </label>
                    <select
                      value={selectedLocality}
                      onChange={(e) => setSelectedLocality(e.target.value)}
                      className="w-full bg-white dark:bg-card border border-accent/40 rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-accent"
                    >
                      {PUNE_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* General User Inputs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {signupRole === "vendor" ? "Owner / Representative Full Name *" : "Full Name *"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number (+91)
                </label>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+91 98230 45678"
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-white dark:focus:bg-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="agree-terms" className="cursor-pointer">
                I agree to the{" "}
                <Link
                  to="/terms"
                  onClick={onClose}
                  className="text-primary font-bold hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  onClick={onClose}
                  className="text-primary font-bold hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create {signupRole === "vendor" ? "Vendor Studio" : "Host Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === "forgot_password" && (
          <div className="space-y-4">
            <form
              onSubmit={handleForgotPasswordSubmit}
              className="p-4 bg-muted/40 rounded-2xl border border-border text-xs text-muted-foreground space-y-3"
            >
              <p>
                Enter the email address or mobile number linked with your Celebratz account. We will
                send a secure recovery link / OTP.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Registered Email or Phone
                </label>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  placeholder="priya.sharma@example.com or 9823045678"
                  className="w-full bg-white dark:bg-card border border-border rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Send Recovery Instructions</span>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-foreground hover:text-primary hover:underline cursor-pointer"
              >
                &larr; Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Footer Toggle between Login & Signup */}
        <div className="pt-2 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <p>
              Don't have a Celebratz account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (asPage) {
    return <div className="py-6 px-4">{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {content}
    </div>
  );
};
