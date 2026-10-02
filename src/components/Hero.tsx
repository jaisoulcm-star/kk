import React from "react";
import { motion } from "motion/react";
import { ArrowRight, ShoppingBag, Sparkles, ChevronDown, ShieldCheck, Award, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { AGRI_IMAGES } from "../constants";

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-stone-950">
      {/* Background Hero Agriculture Image */}
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img
          src={AGRI_IMAGES.HERO}
          alt="KrishiMart Organic Farm & Agriculture Marketplace"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2600&auto=format&fit=crop";
          }}
          className="w-full h-full object-cover object-center opacity-75 contrast-110 saturate-125 transition-all duration-700"
        />
      </motion.div>

      {/* Earth & Emerald Agriculture Theme Overlays */}
      <div className="absolute inset-0 bg-stone-950/60 mix-blend-multiply z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-emerald-950/40 z-0" />

      {/* Decorative Side Borders - Desktop */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-12 z-20">
        <div className="h-28 w-px bg-heritage-gold/40" />
        <span className="text-[10px] uppercase tracking-[0.8em] text-heritage-gold/80 font-bold [writing-mode:vertical-lr] rotate-180">
          BIO-NUTRIENTS • HEIRLOOM SEEDS • TISSUE CULTURE
        </span>
        <div className="h-28 w-px bg-heritage-gold/40" />
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-12 z-20">
        <div className="h-28 w-px bg-heritage-gold/40" />
        <span className="text-[10px] uppercase tracking-[0.8em] text-heritage-gold/80 font-bold [writing-mode:vertical-lr]">
          100% ORGANIC & CERTIFIED FARM INPUTS
        </span>
        <div className="h-28 w-px bg-heritage-gold/40" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-6xl mx-auto w-full pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-col items-center"
        >
          {/* Main Display Headline */}
          <h1 className="text-[12vw] sm:text-[9vw] lg:text-[7vw] font-serif font-black text-white leading-[0.9] tracking-tight mb-8 flex flex-col items-center drop-shadow-2xl">
            <span className="block font-normal italic text-stone-200">Sustainable</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-heritage-gold via-amber-200 to-heritage-gold py-2">
              AGRICULTURE INPUTS
            </span>
            <span className="block text-[6vw] sm:text-[4vw] font-serif italic text-stone-300 font-light tracking-wide -mt-2">
              Organic Seeds, Bio-Nutrients & Hardware
            </span>
          </h1>

          {/* Descriptive Subtitle */}
          <p className="text-stone-200 font-light max-w-2xl text-xs sm:text-sm md:text-base tracking-wide leading-relaxed drop-shadow-lg mb-10">
            Direct farm-to-field supply of 100% organic fertilizers, bio-fungicides, heirloom paddy seeds, tissue culture plantlets, and precision drip irrigation hardware.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            {/* Primary 'Shop Now' CTA Button */}
            <Link
              to="/products"
              className="group relative inline-flex items-center justify-center gap-4 text-white uppercase tracking-[0.3em] text-xs font-extrabold bg-heritage-maroon px-10 py-5 rounded-full overflow-hidden transition-all duration-300 hover:bg-stone-900 shadow-2xl hover:shadow-heritage-gold/20 ring-2 ring-heritage-gold/50 w-full sm:w-auto hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-heritage-gold/20 via-transparent to-heritage-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShoppingBag size={18} className="relative z-10 text-heritage-gold group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Shop Farm Supplies</span>
              <ArrowRight
                size={18}
                className="relative z-10 text-white group-hover:translate-x-2 transition-transform duration-300"
              />
            </Link>

            {/* Secondary CTA Button */}
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-3 text-stone-200 hover:text-white uppercase tracking-[0.3em] text-xs font-semibold bg-stone-900/60 hover:bg-stone-800/80 backdrop-blur-md px-8 py-5 rounded-full border border-stone-700/80 transition-all duration-300 w-full sm:w-auto"
            >
              <span>Our Farming Mission</span>
            </Link>
          </div>

          {/* Key Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 mt-16 pt-10 border-t border-white/10 w-full max-w-3xl">
            <div className="flex items-center justify-center gap-3 text-stone-300 text-[11px] sm:text-xs font-medium">
              <ShieldCheck size={18} className="text-heritage-gold shrink-0" />
              <span>100% Organic Certified</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-stone-300 text-[11px] sm:text-xs font-medium">
              <Award size={18} className="text-heritage-gold shrink-0" />
              <span>Direct Farm-to-Field</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-3 text-stone-300 text-[11px] sm:text-xs font-medium">
              <Sparkles size={18} className="text-heritage-gold shrink-0" />
              <span>Fast All-India Delivery</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer z-20 group"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" })
        }
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold group-hover:text-heritage-gold transition-colors">
          Explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown
            className="text-heritage-gold group-hover:scale-110 transition-transform"
            size={28}
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
