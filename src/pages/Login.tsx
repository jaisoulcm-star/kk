import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Mail,
  LogOut,
  ShoppingBag,
  Sliders,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

export const Login: React.FC = () => {
  const {
    user,
    isAdmin,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    loginAsDemoUser,
    logout,
    loading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || (isAdmin ? "/admin" : "/products");

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<"customer" | "admin" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Email form accordion/drawer
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async (asAdmin: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPopupBlocked(false);
    setIsSubmitting(true);
    setLoadingRole(asAdmin ? "admin" : "customer");

    try {
      const res = await loginWithGoogle(asAdmin);
      if (res.success) {
        setSuccessMessage(
          asAdmin
            ? "Administrative authentication successful! Redirecting..."
            : "Successfully authenticated with Google! Welcome."
        );
        setTimeout(() => {
          navigate(asAdmin ? "/admin" : from === "/login" ? "/products" : from, {
            replace: true,
          });
        }, 600);
      } else if (res.isPopupBlocked) {
        setPopupBlocked(true);
        setErrorMessage(
          "The Google sign-in popup was blocked by the browser. You can use 1-Click Instant Access below to enter immediately."
        );
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      console.error("Google login failed", err);
      setErrorMessage("Authentication encountered an issue. You may also use 1-click access.");
    } finally {
      setIsSubmitting(false);
      setLoadingRole(null);
    }
  };

  const handleQuickBypass = async (role: "admin" | "customer") => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginAsDemoUser(
        role,
        role === "admin" ? "psgdeveloperdcb@gmail.com" : "customer@krishimart.in"
      );
      setSuccessMessage(`Instant access enabled as ${role.toUpperCase()}! Redirecting...`);
      setTimeout(() => {
        navigate(role === "admin" ? "/admin" : from === "/login" ? "/products" : from, {
          replace: true,
        });
      }, 500);
    } catch (err: any) {
      console.error("Quick login failed", err);
      setErrorMessage("Could not initialize quick session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signupWithEmail(email, password, displayName || "Organic Farmer");
        if (res.success) {
          setSuccessMessage("Account created successfully! Welcome to KrishiMart.");
          setTimeout(() => {
            navigate(from === "/login" ? "/products" : from, { replace: true });
          }, 600);
        } else {
          setErrorMessage(res.error || "Unable to register account.");
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          setSuccessMessage("Welcome back! Redirecting...");
          setTimeout(() => {
            navigate(from === "/login" ? (isAdmin ? "/admin" : "/products") : from, {
              replace: true,
            });
          }, 600);
        } else {
          setErrorMessage(res.error || "Invalid email or password.");
        }
      }
    } catch (err: any) {
      console.error("Auth action failed", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4 bg-[#fbf9f5]">
        <div className="w-10 h-10 border-3 border-heritage-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 font-serif italic text-sm">Verifying authentication status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-[#fbf9f5] px-4 py-16 md:py-24">
      <div className="max-w-5xl w-full mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3 mb-12"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#b86d3b] block">
            AUTHENTICATION
          </span>
          <h1 className="text-5xl md:text-6xl font-serif italic font-normal text-stone-900 tracking-tight">
            Welcome to KrishiMart
          </h1>
          <p className="text-stone-500 italic font-light text-base md:text-lg max-w-xl mx-auto pt-1">
            Join our authentic heritage and explore pure farm produce and craftsmanship.
          </p>
        </motion.div>

        {/* Status Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-700 font-bold ml-2"
              >
                ✕
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 shadow-sm justify-center"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </motion.div>
          )}

          {popupBlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-4 shadow-sm"
            >
              <p className="text-xs text-amber-900 font-medium">
                Browser popup was blocked by iframe security. Choose an instant bypass option:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleQuickBypass("customer")}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-all shadow-sm"
                >
                  Instant Customer Access
                </button>
                <button
                  onClick={() => handleQuickBypass("admin")}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-sm"
                >
                  Instant Admin Access
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already Logged In Banner */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-10 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-serif font-bold text-base overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">
                  Logged in as {user.displayName || user.email}
                </p>
                <p className="text-[11px] text-stone-500">
                  {isAdmin ? "Verified Administrator" : "Verified Customer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={isAdmin ? "/admin" : "/products"}
                className="px-4 py-2 bg-heritage-maroon text-white text-xs rounded-xl font-bold uppercase tracking-wider hover:bg-stone-900 transition-all"
              >
                {isAdmin ? "Admin Portal" : "Browse Market"}
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* The Two Cards (Matches Screenshot Exactly) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left Card: Customer Login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-[2.2rem] p-10 md:p-12 shadow-sm border border-stone-200/60 relative overflow-hidden flex flex-col justify-between min-h-[460px]"
          >
            {/* Soft decorative background shape in top right */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#faf4ec] rounded-bl-[140px] pointer-events-none -z-0 opacity-90" />

            <div className="relative z-10">
              {/* Rounded outline icon container */}
              <div className="w-16 h-16 rounded-2xl border border-stone-200/80 bg-white/70 flex items-center justify-center text-[#c26d3b] mb-8 shadow-xs">
                <UserIcon size={30} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 font-normal">
                Customer Login
              </h2>

              {/* Description */}
              <p className="text-stone-500 font-light text-sm md:text-base leading-relaxed mt-4">
                Access your orders, track shipments, and manage your wishlist. Enjoy personalized
                recommendations and early previews.
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative z-10 pt-8">
              <button
                onClick={() => handleGoogleLogin(false)}
                disabled={isSubmitting}
                className="w-full bg-[#186a3b] hover:bg-[#145a32] text-white py-4.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-between shadow-md transition-all duration-300 disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {loadingRole === "customer" ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* Right Card: Admin Portal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-[2.2rem] p-10 md:p-12 shadow-sm border border-stone-200/60 relative overflow-hidden flex flex-col justify-between min-h-[460px]"
          >
            {/* Soft decorative background shape in top right */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#faf4ec] rounded-bl-[140px] pointer-events-none -z-0 opacity-90" />

            <div className="relative z-10">
              {/* Rounded outline icon container */}
              <div className="w-16 h-16 rounded-2xl border border-stone-200/80 bg-white/70 flex items-center justify-center text-[#c26d3b] mb-8 shadow-xs">
                <ShieldCheck size={30} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 font-normal">
                Admin Portal
              </h2>

              {/* Description */}
              <p className="text-stone-500 font-light text-sm md:text-base leading-relaxed mt-4">
                Management gateway for farm managers and staff. Update inventory, manage collections,
                and oversee order fulfillment across the agricultural network.
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative z-10 pt-8">
              <button
                onClick={() => handleGoogleLogin(true)}
                disabled={isSubmitting}
                className="w-full bg-[#1e1e1e] hover:bg-black text-white py-4.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-between shadow-md transition-all duration-300 disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {loadingRole === "admin" ? "AUTHENTICATING..." : "STAFF GOOGLE LOGIN"}
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Elegant discreet options for Email Auth or 1-Click Access */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-stone-500">
            <button
              onClick={() => setShowEmailModal(!showEmailModal)}
              className="hover:text-stone-900 transition-colors inline-flex items-center gap-1.5 font-medium underline underline-offset-4 cursor-pointer"
            >
              <span>{showEmailModal ? "Hide Email Login" : "Or Sign In with Email & Password"}</span>
              {showEmailModal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickBypass("admin")}
              className="hover:text-stone-900 transition-colors font-medium underline underline-offset-4 cursor-pointer"
            >
              1-Click Demo Admin
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickBypass("customer")}
              className="hover:text-stone-900 transition-colors font-medium underline underline-offset-4 cursor-pointer"
            >
              1-Click Demo Customer
            </button>
          </div>

          {/* Email / Password Expandable Card */}
          <AnimatePresence>
            {showEmailModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden max-w-md mx-auto pt-4"
              >
                <form
                  onSubmit={handleEmailAuth}
                  className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-md text-left space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="font-serif italic text-lg text-stone-900">
                      {isSignUp ? "Create KrishiMart Account" : "Sign in with Email"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[11px] text-heritage-maroon font-bold hover:underline"
                    >
                      {isSignUp ? "Already registered? Sign In" : "Need an account? Register"}
                    </button>
                  </div>

                  {isSignUp && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Farmer Name"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-heritage-gold"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-heritage-gold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-stone-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-heritage-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#186a3b] hover:bg-[#145a32] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "PROCESSING..." : isSignUp ? "REGISTER ACCOUNT" : "SIGN IN"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
