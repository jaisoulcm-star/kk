import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, ArrowRight, Sparkles, HeartOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../types";

export interface WishlistToast {
  id: string;
  type: "added" | "removed";
  product: Product;
}

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  toasts: WishlistToast[];
  removeToast: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("jaigo_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse wishlist from localStorage:", error);
      return [];
    }
  });

  const [toasts, setToasts] = useState<WishlistToast[]>([]);

  useEffect(() => {
    localStorage.setItem("jaigo_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (type: "added" | "removed", product: Product) => {
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    const newToast: WishlistToast = {
      id: toastId,
      type,
      product,
    };

    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 visible toasts

    // Auto dismiss after 3.8 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 3800);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        addToast("removed", product);
        return prev.filter((item) => item.id !== product.id);
      } else {
        addToast("added", product);
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isInWishlist, toasts, removeToast }}
    >
      {children}

      {/* Floating Wishlist Toast Notification Overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const isAdded = toast.type === "added";
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 50 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`pointer-events-auto bg-stone-900/95 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl border ${
                  isAdded
                    ? "border-heritage-gold/50 shadow-heritage-gold/10"
                    : "border-stone-700/80 shadow-black/40"
                } flex items-center gap-3.5 relative overflow-hidden`}
              >
                {/* Product Thumbnail */}
                <img
                  src={
                    toast.product.imageUrls?.[0] ||
                    "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
                  }
                  alt={toast.product.name}
                  className="w-12 h-14 object-cover rounded-2xl border border-white/10 shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {isAdded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-heritage-gold">
                        <Heart size={12} fill="currentColor" /> Saved to Wishlist
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                        <HeartOff size={12} /> Removed from Wishlist
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-bold text-white font-serif truncate">
                    {toast.product.name}
                  </h5>

                  {isAdded && (
                    <Link
                      to="/wishlist"
                      onClick={() => removeToast(toast.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-white transition-colors underline uppercase tracking-wider pt-0.5"
                    >
                      <span>View Wishlist</span>
                      <ArrowRight size={10} />
                    </Link>
                  )}
                </div>

                {/* Dismiss X */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>

                {/* Animated Progress Line */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3.8, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-1 ${
                    isAdded ? "bg-heritage-gold" : "bg-stone-500"
                  }`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};
