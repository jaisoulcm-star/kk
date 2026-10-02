import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useWishlist } from "../contexts/WishlistContext";
import { ProductCard } from "../components/ProductCard";

export const Wishlist: React.FC = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="bg-heritage-cream min-h-screen py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 space-y-4">
          <Link
            to="/products"
            className="flex items-center gap-2 text-stone-600 hover:text-heritage-maroon transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            <ArrowLeft size={14} /> Continue Discovery
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <span className="text-heritage-gold uppercase tracking-[0.4em] text-[10px] font-bold">
                Your Selection
              </span>
              <h1 className="text-5xl md:text-7xl font-serif text-stone-900 tracking-tight leading-none italic">
                The <span className="italic">Wishlist</span>
              </h1>
            </div>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-32 space-y-8 bg-white/50 rounded-[48px] border border-stone-200 shadow-sm backdrop-blur-sm">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-heritage-gold/5 blur-3xl rounded-full" />
              <ShoppingBag
                size={64}
                className="relative text-stone-200 mx-auto"
                strokeWidth={1}
              />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-serif text-stone-800 italic">
                Your collection is empty
              </p>
              <p className="text-stone-500 italic">
                Save your favorite masterpieces here for later
              </p>
            </div>
            <Link
              to="/products"
              className="inline-block bg-heritage-maroon text-white px-10 py-4 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-stone-900 transition-all shadow-xl"
            >
              Discover Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
