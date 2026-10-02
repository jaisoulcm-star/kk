import React, { useState, useEffect } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { Product, OperationType } from "../types";
import { handleFirestoreError } from "../utils/error-handler";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  "All",
  "Nutrients",
  "Fungicides",
  "Insecticides",
  "Seeds",
  "Weedicides",
  "Tissue Culture",
  "Fertilizers",
  "Hardware",
];

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("cat") || "All",
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const colPath = "products";
      const cat = searchParams.get("cat");
      if (cat && cat !== "All") {
        setSelectedCategory(cat);
      } else {
        setSelectedCategory("All");
      }

      try {
        const isDemo = sessionStorage.getItem("jaigo_demo_user")
          ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
          : false;
        const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";

        let allProducts: Product[] = [];
        const storedProducts = localStorage.getItem(productKey);
        
        if (storedProducts) {
          try {
            allProducts = JSON.parse(storedProducts);
          } catch {}
        }

        if (allProducts.length === 0) {
          const { MOCK_PRODUCTS } = await import("../constants");
          allProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
          localStorage.setItem(productKey, JSON.stringify(allProducts));
          localStorage.setItem("jaigo_products_initialized", "true");
        }

        // Apply category filter
        let displayProducts = allProducts;
        if (cat && cat !== "All") {
          displayProducts = allProducts.filter((p) => p.category === cat);
        }
        setProducts(displayProducts);
      } catch (error) {
        console.warn("Products load error, attempting local cache fallback", error);
        const isDemo = sessionStorage.getItem("jaigo_demo_user")
          ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
          : false;
        const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";
        let allProducts: Product[] = [];
        try {
          const storedProducts = localStorage.getItem(productKey);
          if (storedProducts) {
            allProducts = JSON.parse(storedProducts);
          }
          if (allProducts.length === 0) {
            const isInitialized = localStorage.getItem("jaigo_products_initialized");
            if (!isInitialized) {
              const { MOCK_PRODUCTS } = await import("../constants");
              allProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
              localStorage.setItem(productKey, JSON.stringify(allProducts));
              localStorage.setItem("jaigo_products_initialized", "true");
            }
          }
          let displayProducts = allProducts;
          if (cat && cat !== "All") {
            displayProducts = allProducts.filter((p) => p.category === cat);
          }
          setProducts(displayProducts);
        } catch {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search");
    if (qParam !== null) {
      setSearchTerm(qParam);
    }
  }, [searchParams]);

  const filteredProducts = products.filter((p) => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    );
  });

  const handleCategoryChange = (cat: string) => {
    if (cat === "All") {
      searchParams.delete("cat");
    } else {
      searchParams.set("cat", cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-heritage-cream pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Discovery Header */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-4">
            <span className="text-heritage-gold uppercase tracking-[0.4em] text-[10px] font-bold">
              Discovery
            </span>
            <h1 className="text-5xl sm:text-7xl font-serif text-stone-900 tracking-tight leading-none text-center md:text-left">
              Farm <span className="italic">Selection</span>
            </h1>
          </div>
          <div className="max-w-sm text-right">
            <p className="text-sm text-stone-600 font-light leading-relaxed uppercase tracking-widest">
              BROWSE NATIVE HEIRLOOM SEEDS, BIO-INPUTS, AND ORGANIC NOURISHMENT ACROSS SOUTHERN FARMS.
            </p>
          </div>
        </div>

        {/* Minimal Filters */}
        <div className="flex flex-col md:flex-row gap-12 justify-between items-start mb-20 border-t border-stone-200 pt-10">
          <div className="flex flex-wrap gap-x-6 sm:gap-x-12 gap-y-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all relative py-2 ${
                  selectedCategory === cat
                    ? "text-heritage-maroon"
                    : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {cat}
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="cat-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-heritage-maroon"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="flex items-center border-b border-stone-300 focus-within:border-heritage-maroon transition-all duration-300">
              <Search
                className="text-stone-400 group-focus-within:text-heritage-maroon transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search titles, categories, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-8 py-3 bg-transparent text-sm focus:outline-none placeholder:text-stone-400 text-stone-800 italic font-light"
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-0 text-stone-400 hover:text-heritage-maroon p-2"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Search Results Summary */}
        <AnimatePresence mode="wait">
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-12"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] font-light text-stone-500">
                Displaying <span className="text-heritage-maroon font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'masterpiece' : 'masterpieces'} for <span className="italic font-serif normal-case text-stone-900 tracking-normal text-sm ml-1">"{searchTerm}"</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-6 animate-pulse">
                  <div className="aspect-[3/4] bg-stone-100 boutique-frame" />
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="h-2 w-20 bg-stone-100" />
                    <div className="h-4 w-40 bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500 space-y-8 border-2 border-dashed border-stone-200 rounded-[40px]">
              <div className="relative">
                <ShoppingBag size={48} className="text-heritage-maroon/20" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-heritage-maroon rounded-full" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-serif italic" >
                  This collection is currently empty
                </p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
                  Please check again soon for new arrivals
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
