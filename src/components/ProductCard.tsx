import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Eye, Heart, Share2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isFavorite = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 2000);
  };

  const shareUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = `Discover this exquisite ${product.name} at KrishiMart.`;

  const shareLinks = [
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      color: "hover:text-green-600",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: "hover:text-sky-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block space-y-6">
        <div className="relative aspect-[3/4] overflow-hidden boutique-frame transition-all duration-700 group-hover:p-1.5 bg-stone-100/50 border border-stone-200">
          <img
            src={
              product.imageUrls?.[0] ||
              "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
            }
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop";
            }}
            className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 silk-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Quick Add / Sell Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 translate-y-full group-hover:translate-y-0 transition-all duration-700 ease-out z-30 flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickAdd}
              disabled={isAdding}
              className={`flex-1 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-xl backdrop-blur-md relative overflow-hidden flex items-center justify-center border rounded-xl ${
                isAdding
                  ? "bg-lime-500 text-stone-950 border-lime-400 font-extrabold"
                  : "bg-stone-950/90 text-white border-white/20 hover:bg-emerald-900 hover:border-emerald-500"
              }`}
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="added"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check size={14} className="text-stone-950 stroke-[3]" />
                    <span>Added</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reserve"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <ShoppingCart size={13} />
                    <span>Add To Bag</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Action Buttons - Corner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex flex-col gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product);
              }}
              className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                isFavorite
                  ? "bg-heritage-gold text-white scale-110 shadow-lg"
                  : "bg-white/60 text-stone-600 hover:bg-white shadow-sm"
              }`}
            >
              <Heart
                size={18}
                fill={isFavorite ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsShareOpen(!isShareOpen);
                }}
                className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                  isShareOpen
                    ? "bg-heritage-gold text-white shadow-lg"
                    : "bg-white/60 text-stone-600 hover:bg-white shadow-sm"
                }`}
              >
                <Share2 size={18} strokeWidth={1.5} />
              </button>

              <AnimatePresence>
                {isShareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="absolute right-full mr-3 top-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-100 p-1.5 flex flex-col gap-1 z-50 overflow-hidden"
                  >
                    {shareLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-xl text-[8px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${link.color} hover:bg-stone-50 flex items-center justify-center`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsShareOpen(false);
                        }}
                      >
                        {link.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {(product.isNew || product.isFeatured) && (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
              {product.isNew && (
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-stone-950 bg-lime-400 px-2.5 py-1 rounded-md shadow-md">
                  Fresh Batch
                </span>
              )}
              {product.isFeatured && (
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-white bg-emerald-900/90 px-2.5 py-1 rounded-md backdrop-blur-sm border border-emerald-700/50">
                  Certified Bio
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-center px-1">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.3em] text-emerald-800 font-extrabold">
              {product.category}
            </span>
            <h3 className="text-lg md:text-xl font-serif text-stone-900 group-hover:text-emerald-900 transition-colors tracking-tight font-semibold line-clamp-1">
              {product.name}
            </h3>
            {product.subtitle && (
              <p className="text-[10px] text-stone-500 font-light line-clamp-1 italic">
                {product.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <span className="text-emerald-950 font-serif font-bold text-xl">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.stock && (
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                In Stock ({product.stock})
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
