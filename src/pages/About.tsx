import React from "react";
import { motion } from "motion/react";
import { Star, Shield, Users, Heart } from "lucide-react";
import { HERITAGE_IMAGES } from "../constants";

export const About: React.FC = () => {
  return (
    <div className="bg-heritage-cream">
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img
          src={HERITAGE_IMAGES.STORY_HERO}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Tamil Nadu Organic Agriculture Farmland"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=2600";
          }}
        />
        <div className="absolute inset-0 bg-stone-900/35 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-heritage-cream via-transparent to-stone-900/20" />
        
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl md:text-9xl font-serif mb-6 italic drop-shadow-2xl"
          >
            Our Story
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto text-xs md:text-sm text-stone-200 font-light leading-relaxed drop-shadow-md tracking-wide"
          >
            KrishiMart cultivates authentic, pure-origin spices and organic produce from Tamil Nadu. Our roots are deeply embedded in the fertile soil of the Cauvery Delta, where farming traditions and agricultural knowledge have been passed down through generations
          </motion.p>
        </div>
      </section>

      {/* Story Content */}
      <section className="max-w-4xl mx-auto px-4 py-24 space-y-16">
        <div className="space-y-6 text-center">
          <h2 className="text-4xl font-serif text-stone-900 italic">
            The Seeds of Tradition
          </h2>
          <div className="w-16 h-1 bg-heritage-gold mx-auto" />
          <p className="text-xl text-stone-600 font-light leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-heritage-gold italic">
            True flavor cannot be rushed. By collaborating directly with
            traditional farming communities, we honor indigenous knowledge
            passed down through centuries. From seasonal sowing to careful
            sun-drying, we craft each batch by hand to preserve natural aroma,
            medicinal value, and rich nutrition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl boutique-frame bg-stone-100">
            <img
              src={HERITAGE_IMAGES.STORY}
              alt="Traditional Agricultural Farmer"
              className="w-full h-full object-cover opacity-90 scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop";
              }}
            />
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-heritage-maroon italic font-bold">
                Traditional Husbandry
              </h3>
              <p className="text-stone-600 font-light leading-relaxed italic">
                Chemical-free farming that respects the land's natural life cycle,
                building long-term soil vitality and resilient crops.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-heritage-maroon italic font-bold">
                Fair & Sustainable Stewardship
              </h3>
              <p className="text-stone-600 font-light leading-relaxed italic">
                By bridging local farmers directly with conscious consumers, we
                ensure fair returns for our growers while fostering sustainable,
                eco-friendly rural ecosystems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-24 text-stone-600 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Star size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Single-Origin Purity</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                100% farm-direct produce, native heirloom seeds, zero chemical residues, fully traceable.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Shield size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Certified Quality</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                NPOP & PGS organic certified, sun-cured, and lab-tested for peak active nutrients.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Users size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Fair Farmer Trade</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                Ethical above-market farm-gate procurement empowering 500+ local farming families.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Heart size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Eco-Conscious Living</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                Plastic-free, breathable, compostable packaging dispatched within 48 hours of harvest.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
