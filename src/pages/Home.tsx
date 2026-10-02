import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Star,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Product } from "../types";
import { HERITAGE_IMAGES } from "../constants";
import { DecorativeBorder } from "../components/DecorativeBorder";
import { Hero } from "../components/Hero";

export const Home: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animation variants for section title letters
  const titleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [accessoryProducts, setAccessoryProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const isDemo = sessionStorage.getItem("jaigo_demo_user")
          ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
          : false;
        const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";

        let allProducts: Product[] = [];
        const storedProducts = localStorage.getItem(productKey);
        if (storedProducts) {
          try { allProducts = JSON.parse(storedProducts); } catch {}
        }

        if (allProducts.length === 0) {
          const { MOCK_PRODUCTS } = await import("../constants");
          allProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
          localStorage.setItem(productKey, JSON.stringify(allProducts));
          localStorage.setItem("jaigo_products_initialized", "true");
        }

        const featured = allProducts.filter((p) => p.isFeatured).slice(0, 4);
        setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 4));
        setAccessoryProducts(
          allProducts.filter((p) => p.category === "Accessories").slice(0, 3),
        );

        // Load recently viewed
        const { getRecentlyViewedIds } = await import("../utils/recentViews");
        const recentIds = getRecentlyViewedIds();
        if (recentIds.length > 0) {
          const matched = recentIds
            .map((id) => allProducts.find((p) => p.id === id))
            .filter((p): p is Product => !!p);
          setRecentProducts(matched);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
        // Fallback on error too
        try {
          const isDemo = sessionStorage.getItem("jaigo_demo_user")
            ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
            : false;
          const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";
          let allProducts: Product[] = [];
          const storedProducts = localStorage.getItem(productKey);
          if (storedProducts) {
            try { allProducts = JSON.parse(storedProducts); } catch {}
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
          
          const featured = allProducts.filter((p) => p.isFeatured).slice(0, 4);
          setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 4));
          setAccessoryProducts(
            allProducts.filter((p) => p.category === "Accessories").slice(0, 3),
          );

          // Load recently viewed
          const { getRecentlyViewedIds } = await import("../utils/recentViews");
          const recentIds = getRecentlyViewedIds();
          if (recentIds.length > 0) {
            const matched = recentIds
              .map((id) => allProducts.find((p) => p.id === id))
              .filter((p): p is Product => !!p);
            setRecentProducts(matched);
          }
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.8
          : scrollLeft + clientWidth * 0.8;

      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <Hero />

      {/* Decorative Divider */}
      <DecorativeBorder className="my-12" />

      {/* Narrative Section */}
      <section className="bg-heritage-cream py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 text-heritage-gold uppercase tracking-widest text-[10px] font-bold">
              <div className="w-12 h-px bg-heritage-gold" />
              A Timeless Art
            </div>
            <h2 className="text-5xl md:text-7xl font-serif zari-text leading-tight">
              Bounty of the <br /> <span className="italic">Southern</span> Earth
            </h2>
            <p className="text-lg text-stone-600 font-light leading-relaxed max-w-md">
              Tamil Nadu’s traditional red clay lands yield more than mere food; they carry the sacred rhythms of the monsoons, ancestral seed wisdom, and the pure, chemical-free vitality nourished by generational farmers.
            </p>
            <div className="pt-4">
              <Link
                to="/about"
                className="text-heritage-gold font-serif italic text-xl border-b border-heritage-gold pb-1 hover:text-heritage-maroon hover:border-heritage-maroon transition-colors"
              >
                Our Farming Roots
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-t-[100px] rounded-b-[20px] overflow-hidden boutique-frame shadow-2xl">
              <img
                src={HERITAGE_IMAGES.STORY}
                alt="Organic Farming Agriculture"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop";
                }}
                className="w-full h-full object-cover object-top scale-110 hover:scale-125 transition-transform duration-1000"
              />
            </div>
            {/* Abstract Element */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-heritage-gold/5 rounded-full border border-heritage-gold/10 -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-24">
          <div className="text-center space-y-4">
            <motion.span 
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.4em" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-heritage-gold uppercase text-[10px] font-bold block"
            >
              Southern Agricultural Heritage
            </motion.span>
            
            <motion.h2 
              variants={titleContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-serif zari-text italic flex justify-center flex-wrap gap-x-4"
            >
              {"Regional Produce".split(" ").map((word, wordIdx) => (
                <span key={wordIdx} className="inline-flex">
                  {word.split("").map((letter, letterIdx) => (
                    <motion.span
                      key={letterIdx}
                      variants={letterVariants}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="h-[1px] w-28 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mx-auto mt-6 origin-center"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                title: "Cauvery Bio-Nutrients",
                desc: "Microbial NPK enrichers and humic soil conditioners harvested for organic Delta farming.",
                origin: "Cauvery Delta",
                image: HERITAGE_IMAGES.BIO_NUTRIENTS,
              },
              {
                title: "Botanical Bio-Fungicides",
                desc: "Trichoderma & Neem-based organic protection against leaf rust and soil pathogens.",
                origin: "Karaikudi Bio-Hub",
                image: HERITAGE_IMAGES.BIO_FUNGICIDES,
              },
              {
                title: "Native Heirloom Seeds",
                desc: "Mapillai Samba, Karuppu Kavuni & traditional drought-resilient cereal grains.",
                origin: "Madurai Seed Bank",
                image: HERITAGE_IMAGES.HEIRLOOM_SEEDS,
              },
              {
                title: "Banana Tissue Culture",
                desc: "Sterile Grand Naine tissue culture plantlets designed for zero-pest early establishment.",
                origin: "Kongu Agri Labs",
                image: HERITAGE_IMAGES.TISSUE_CULTURE,
              },
              {
                title: "Foliar Seaweed Fertilizers",
                desc: "Cold-extracted marine algae liquid nutrients rich in natural cytokinins for root vigor.",
                origin: "Coastal Farms",
                image: HERITAGE_IMAGES.SEAWEED_FERTILIZER,
              },
            ].map((type, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group space-y-6 cursor-pointer"
              >
                <div className="aspect-[3/5] relative overflow-hidden rounded-t-[60px] rounded-b-[10px] boutique-frame bg-stone-100 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={type.image}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop";
                    }}
                    className="w-full h-full object-cover object-center scale-105 group-hover:scale-115 transition-transform duration-[1500ms] ease-out"
                    alt={type.title}
                  />
                  <div className="absolute inset-0 bg-stone-100/10 opacity-25 group-hover:opacity-0 transition-opacity duration-500" />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/40 via-black/10 to-transparent text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-heritage-gold">
                      {type.origin}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-serif text-heritage-gold group-hover:text-heritage-maroon transition-colors duration-300">
                      {type.title}
                    </h3>
                    <div className="h-[1px] w-0 bg-heritage-maroon/40 group-hover:w-8 transition-all duration-500" />
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Grid - Agricultural Essentials */}
      <section className="bg-heritage-cream py-32 space-y-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-end gap-12 mb-12">
          <div className="space-y-6">
            <h3 className="text-6xl font-serif text-stone-950 leading-none">
              Season's <br />{" "}
              <span className="italic zari-text">Curations</span>
            </h3>
          </div>
          <p className="max-w-xs text-stone-600 font-light text-sm uppercase tracking-widest leading-relaxed text-right">
            Curated by our agronomy team for high soil vitality, root protection, and maximum crop yield.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative group/showcase">
          {/* Navigation Arrows - Visible on mobile, tablet and desktop */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 lg:left-0 top-1/2 -translate-y-1/2 lg:-translate-x-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/95 shadow-xl border border-stone-200 flex items-center justify-center hover:bg-heritage-gold hover:text-white transition-all group pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover/showcase:opacity-100"
            aria-label="Scroll left"
          >
            <ArrowLeft
              size={20}
              className="md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform"
            />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute right-2 lg:right-0 top-1/2 -translate-y-1/2 lg:translate-x-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/95 shadow-xl border border-stone-200 flex items-center justify-center hover:bg-heritage-gold hover:text-white transition-all group pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover/showcase:opacity-100"
            aria-label="Scroll right"
          >
            <ArrowRight
              size={20}
              className="md:w-6 md:h-6 group-hover:translate-x-1 transition-transform"
            />
          </button>

          <div
            ref={scrollRef}
            className="overflow-x-auto pb-12 scrollbar-hide snap-x snap-mandatory touch-pan-x"
          >
            <div className="flex gap-12">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[320px] md:min-w-[400px] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
              {featuredProducts.length === 0 && !loading && (
                <p className="text-stone-400 italic py-10 w-full text-center">
                  More pieces arriving soon...
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Community Section */}
      <section className="py-24 bg-heritage-cream border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 text-[#25D366] uppercase tracking-widest text-[10px] font-bold">
                <div className="w-12 h-px bg-[#25D366]" />
                Join Farmers Community
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-950">
                Agrarian wisdom, <br />{" "}
                <span className="italic">delivered</span> to your chat.
              </h2>
              <p className="text-stone-600 font-light max-w-sm">
                Get advisory insights, seasonal crop protection alerts, and direct harvest drops via WhatsApp.
              </p>
            </div>

            <a
              href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-12 py-5 rounded-full inline-flex items-center gap-4 hover:bg-[#128C7E] transition-all shadow-xl shadow-green-500/20 font-bold uppercase tracking-widest text-xs"
            >
              <MessageCircle size={20} fill="currentColor" />
              Join Farmers WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Finishing Touches Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center space-y-16">
          <div className="space-y-4">
            <span className="text-heritage-gold uppercase tracking-[0.4em] text-[10px] font-bold">
              The Curation
            </span>
            <h2 className="text-5xl font-serif zari-text italic leading-tight">
              Essential Farm Inputs
            </h2>
            <p className="text-stone-600 font-light max-w-sm mx-auto">
              Bio-certified fertilizers and precision hardware to maximize crop yield.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {accessoryProducts.map((p) => (
              <Link
                to={`/product/${p.id}`}
                key={p.id}
                className="group space-y-6"
              >
                <div className="aspect-square overflow-hidden boutique-frame bg-stone-100">
                  <img
                    src={p.imageUrls?.[0] || "https://images.unsplash.com/photo-1590156221122-c748e7892b07?auto=format&fit=crop&q=80&w=800"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-1000 scale-100 group-hover:scale-110"
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1590156221122-c748e7892b07?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-2xl group-hover:text-heritage-maroon transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest text-heritage-gold font-bold">
                    View Product
                  </p>
                </div>
              </Link>
            ))}
            {accessoryProducts.length === 0 && !loading && (
              <div className="col-span-full py-12 text-stone-500 italic">
                Sourcing new bio-inputs...
              </div>
            )}
          </div>

          <div className="pt-8">
            <Link
              to="/products"
              className="bg-heritage-maroon text-white px-12 py-4 rounded-full inline-flex items-center gap-3 hover:bg-stone-900 transition-all shadow-xl font-bold uppercase tracking-widest text-xs"
            >
              View all farm products
            </Link>
          </div>
        </div>
      </section>

      {/* Full Width Pattern Section */}
      <section className="relative py-48 bg-heritage-maroon overflow-hidden">
        <div className="agri-pattern absolute inset-0 opacity-20 scale-150 rotate-12" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h4 className="text-heritage-gold uppercase tracking-[0.6em] text-[10px] font-bold">
              The Agricultural Promise
            </h4>
            <h2 className="text-5xl md:text-6xl font-serif text-white italic leading-tight">
              "We don't just sell inputs. We nurture soil and farm livelihoods."
            </h2>
            <p className="text-white/60 font-light mx-auto max-w-sm pt-8 text-sm uppercase tracking-[0.2em]">
              Verified Organic • Soil Tested • Cauvery Origin
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
