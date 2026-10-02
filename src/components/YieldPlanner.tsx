import React, { useState } from "react";
import { motion } from "motion/react";
import { Sprout, ShieldCheck, Zap, ArrowRight, CheckCircle2, ShoppingBag, Coins } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { MOCK_PRODUCTS } from "../constants";

const CROPS = [
  { id: "paddy", name: "Paddy / Heritage Rice", icon: "🌾", defaultNpk: 2, defaultFungicide: 1, baseYield: "+24%" },
  { id: "banana", name: "Banana Plantation", icon: "🍌", defaultNpk: 3, defaultFungicide: 2, baseYield: "+28%" },
  { id: "vegetables", name: "Organic Vegetables", icon: "🥦", defaultNpk: 1, defaultFungicide: 1, baseYield: "+20%" },
  { id: "cotton", name: "Cotton & Fiber", icon: "🌱", defaultNpk: 2, defaultFungicide: 1, baseYield: "+22%" },
  { id: "sugarcane", name: "Sugarcane Crops", icon: "🎋", defaultNpk: 4, defaultFungicide: 2, baseYield: "+25%" },
];

export const YieldPlanner: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [acres, setAcres] = useState<number>(5);
  const [goal, setGoal] = useState<"yield" | "soil" | "shield">("yield");
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  // Multiplier calculation
  const multiplier = Math.max(1, Math.ceil(acres / 2.5));
  const npkQty = selectedCrop.defaultNpk * multiplier;
  const fungicideQty = selectedCrop.defaultFungicide * multiplier;

  const npkProduct = MOCK_PRODUCTS.find((p) => p.category === "Nutrients") || MOCK_PRODUCTS[0];
  const fungicideProduct = MOCK_PRODUCTS.find((p) => p.category === "Fungicides") || MOCK_PRODUCTS[1];

  const totalCost = npkProduct.price * npkQty + fungicideProduct.price * fungicideQty;
  const estimatedSavings = acres * 3800;

  const handleAddBundle = () => {
    addToCart({ ...npkProduct, quantity: npkQty });
    addToCart({ ...fungicideProduct, quantity: fungicideQty });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <section className="py-24 bg-[#0e2a19] text-white relative overflow-hidden my-12 border-y border-emerald-900/50">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:24px_24px] opacity-5" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.5em] text-lime-400 font-extrabold flex items-center justify-center gap-2">
            <Sprout size={14} /> Interactive Agronomy Tool
          </span>
          <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">
            Crop Yield & Bio-Input Planner
          </h2>
          <p className="text-stone-300 text-sm font-light leading-relaxed">
            Configure your farm acreage and crop type to receive an instant, customized organic bio-nutrient formulation engineered for Cauvery Delta soil conditions.
          </p>
        </div>

        {/* Calculator Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls - Left Column (7 cols) */}
          <div className="lg:col-span-7 bg-emerald-950/80 backdrop-blur-xl border border-emerald-800/60 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
            {/* Step 1: Select Crop */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest text-lime-400 font-bold block">
                01. Select Crop Variety
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CROPS.map((crop) => {
                  const isSelected = selectedCrop.id === crop.id;
                  return (
                    <button
                      key={crop.id}
                      onClick={() => setSelectedCrop(crop)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "bg-lime-400 text-stone-950 border-lime-300 font-bold shadow-lg shadow-lime-400/20 scale-[1.02]"
                          : "bg-emerald-900/40 text-stone-200 border-emerald-800/60 hover:bg-emerald-800/60"
                      }`}
                    >
                      <span className="text-2xl">{crop.icon}</span>
                      <span className="text-xs font-semibold line-clamp-1">{crop.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Acreage Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <label className="uppercase tracking-widest text-lime-400 font-bold">
                  02. Land Area (Acres)
                </label>
                <span className="text-xl font-serif text-white font-bold bg-emerald-900 px-4 py-1 rounded-full border border-emerald-700">
                  {acres} {acres === 1 ? "Acre" : "Acres"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={acres}
                onChange={(e) => setAcres(Number(e.target.value))}
                className="w-full accent-lime-400 bg-emerald-900 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>1 Acre (Smallholding)</span>
                <span>25 Acres</span>
                <span>50 Acres (Estate)</span>
              </div>
            </div>

            {/* Step 3: Farming Goal */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest text-lime-400 font-bold block">
                03. Primary Cultivation Goal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "yield", label: "Maximum Yield", icon: Zap, desc: "Accelerate flowering & bunch weight" },
                  { id: "soil", label: "Soil Regeneration", icon: Sprout, desc: "Rebuild humic layer & microbes" },
                  { id: "shield", label: "Pest Shield", icon: ShieldCheck, desc: "Zero chemical residue defense" },
                ].map((g) => {
                  const Icon = g.icon;
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        active
                          ? "bg-white text-emerald-950 border-white font-bold"
                          : "bg-emerald-900/30 text-stone-300 border-emerald-800/40 hover:bg-emerald-800/40"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-emerald-950" : "text-lime-400"} />
                      <div className="text-xs font-bold mt-2">{g.label}</div>
                      <div className="text-[10px] text-stone-400 font-light mt-0.5">{g.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendation Summary - Right Column (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-lime-400 to-emerald-400 text-stone-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-900/20 pb-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-stone-800 block">
                    Customized Agronomy Formulation
                  </span>
                  <h3 className="text-2xl font-serif font-black italic">
                    {selectedCrop.name}
                  </h3>
                </div>
                <span className="text-3xl">{selectedCrop.icon}</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 bg-stone-950/10 rounded-2xl p-4 border border-stone-950/15">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-700 font-bold block">
                    Projected Yield Boost
                  </span>
                  <span className="text-2xl font-serif font-black text-stone-950">
                    {selectedCrop.baseYield}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-700 font-bold block">
                    Chem Savings / Yr
                  </span>
                  <span className="text-2xl font-serif font-black text-emerald-950">
                    ₹{estimatedSavings.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Included Products List */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-stone-800 block">
                  Recommended Input Bundle ({acres} {acres === 1 ? "Acre" : "Acres"})
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-stone-900/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-800 shrink-0" />
                      <span className="font-semibold">{npkProduct.name}</span>
                    </div>
                    <span className="font-mono font-bold bg-stone-900 text-white px-2 py-0.5 rounded text-[10px]">
                      {npkQty} Units
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-stone-900/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-800 shrink-0" />
                      <span className="font-semibold">{fungicideProduct.name}</span>
                    </div>
                    <span className="font-mono font-bold bg-stone-900 text-white px-2 py-0.5 rounded text-[10px]">
                      {fungicideQty} Units
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total & Add to Cart Action */}
            <div className="space-y-4 pt-4 border-t border-stone-900/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-stone-800">
                  Total Bundle Cost
                </span>
                <span className="text-3xl font-serif font-black text-stone-950">
                  ₹{totalCost.toLocaleString("en-IN")}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddBundle}
                className={`w-full py-4 px-6 rounded-2xl text-xs uppercase tracking-[0.2em] font-extrabold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                  added
                    ? "bg-stone-950 text-white"
                    : "bg-emerald-950 text-white hover:bg-stone-950"
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle2 size={16} className="text-lime-400" />
                    <span>Bundle Reserved in Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Add Recommended Bundle To Cart</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
