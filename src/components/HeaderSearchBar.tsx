import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronRight, Tag, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { MOCK_PRODUCTS } from "../constants";

export const HeaderSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load all available products from local cache or constants
  useEffect(() => {
    const isDemo = sessionStorage.getItem("jaigo_demo_user")
      ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
      : false;
    const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";
    const storedProducts = localStorage.getItem(productKey);

    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllProducts(parsed);
          return;
        }
      } catch {}
    }
    setAllProducts(MOCK_PRODUCTS);
  }, []);

  // Close dropdown on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Live real-time filter by product title AND category
  const filteredProducts = query.trim()
    ? allProducts.filter((p) => {
        const q = query.toLowerCase().trim();
        const matchesTitle = p.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        return matchesTitle || matchesCategory || matchesDesc;
      })
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${productId}`);
  };

  const handleQuickCategoryClick = (categoryName: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/products?cat=${encodeURIComponent(categoryName)}`);
  };

  const popularCategories = ["Nutrients", "Fungicides", "Insecticides", "Seeds", "Weedicides", "Tissue Culture"];

  return (
    <div ref={containerRef} className="static sm:relative z-50 flex items-center justify-center">
      {/* Expandable Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full justify-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search seeds, nutrients, crops..."
          className="w-44 sm:w-64 md:w-72 lg:w-80 pl-9 pr-9 py-2 bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-stone-900 border border-stone-300 rounded-full text-xs font-semibold placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-heritage-maroon/40 focus:border-heritage-maroon transition-all duration-300 shadow-sm"
        />
        <Search
          size={14}
          className="absolute left-3 text-stone-500 pointer-events-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </form>

      {/* Real-time Filtered Search Results Modal Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 10, scale: 0.98, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 sm:mt-3 left-1/2 right-auto w-[calc(100vw-2rem)] sm:w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-50 p-4 sm:p-5 space-y-4 origin-top text-center mx-auto"
          >
            {/* Header / Query Info */}
            {query.trim() ? (
              <div className="flex items-center justify-center text-center relative pb-3 border-b border-stone-150">
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 text-center">
                  {filteredProducts.length} Products Found for "{query}"
                </span>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="absolute right-0 text-xs font-bold text-heritage-maroon hover:text-emerald-700 hover:underline flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight size={12} />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pb-3 border-b border-stone-150 text-center w-full mx-auto">
                <div className="flex items-center justify-center text-center gap-1.5 text-emerald-800 text-[10px] uppercase tracking-widest font-extrabold w-full mx-auto">
                  <Sparkles size={12} className="text-amber-500 shrink-0" />
                  <span className="text-center font-extrabold tracking-widest text-[10px] uppercase text-emerald-800">Popular Farm Categories</span>
                </div>
                <div className="grid grid-cols-2 gap-2 justify-items-center place-items-center justify-center items-center text-center w-full mx-auto">
                  {popularCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleQuickCategoryClick(cat)}
                      className="w-full px-3 py-1.5 bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-800 text-xs font-semibold rounded-full border border-stone-200 transition-all duration-200 flex items-center justify-center text-center gap-1.5 shadow-2xs active:scale-95 group mx-auto"
                    >
                      <Tag size={11} className="text-emerald-600 group-hover:text-white" />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results List */}
            {query.trim() && (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-left">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 space-y-1.5">
                    <p className="text-xs font-bold">No matching agricultural products found</p>
                    <p className="text-[11px] text-stone-400 font-normal">
                      Try searching for "Nutrients", "Fungicides", "Seeds", "Bio-Gold", or "Tissue Culture"
                    </p>
                  </div>
                ) : (
                  filteredProducts.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer group border border-transparent hover:border-stone-100"
                    >
                      <img
                        src={
                          product.imageUrls?.[0] ||
                          "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
                        }
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-heritage-maroon/10 text-heritage-maroon px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-stone-900 group-hover:text-heritage-maroon transition-colors truncate font-serif">
                          {product.name}
                        </h5>
                        <p className="text-xs font-bold font-serif text-stone-700">
                          ₹{product.price?.toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-stone-300 group-hover:text-heritage-maroon group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
