import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";

export const Contact: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className="bg-[#0c0a09] py-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 space-y-4">
          <span className="text-heritage-gold uppercase tracking-[0.4em] text-[10px] font-bold">
            Get In Touch
          </span>
          <h1 className="text-5xl font-serif text-stone-50 italic">
            Connect With Us
          </h1>
          <p className="text-stone-500 font-light max-w-xl mx-auto italic">
            Have questions about our bio-inputs, organic produce, or bulk farm orders? We're here to
            help you with expert agronomy guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Info Side */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-serif text-heritage-gold italic">
                Heritage Hub
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-stone-900 rounded-2xl border border-white/5 text-heritage-gold shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-100 text-sm uppercase tracking-widest">
                      Our Studio
                    </h4>
                    <p className="text-stone-400 font-light leading-relaxed">
                      Visit us at our hub in Kanchipuram
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-stone-900 rounded-2xl border border-white/5 text-heritage-gold shadow-sm">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-100 text-sm uppercase tracking-widest">
                      Call or WhatsApp
                    </h4>
                    <p className="text-stone-400 font-light">
                      +91 9944763671
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-stone-900 rounded-2xl border border-white/5 text-heritage-gold shadow-sm">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-100 text-sm uppercase tracking-widest">
                      Email
                    </h4>
                    <p className="text-stone-400 font-light">
                      krishimartgroups@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif text-stone-200">
                Follow the Journey
              </h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="p-4 bg-stone-900 text-stone-400 rounded-full hover:bg-heritage-gold hover:text-stone-950 transition-all shadow-lg"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="p-4 bg-stone-900 text-stone-400 rounded-full hover:bg-heritage-gold hover:text-stone-950 transition-all shadow-lg"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-stone-900 text-stone-400 rounded-full hover:bg-heritage-gold hover:text-stone-950 transition-all shadow-lg"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <div className="bg-[#131110] p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 agri-pattern -translate-y-1/2 translate-x-1/2 opacity-10" />

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[400px] flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-green-900/20 text-green-400 rounded-full flex items-center justify-center border border-green-500/20">
                    <Send size={32} />
                  </div>
                  <h3 className="text-3xl font-serif text-stone-50 italic">
                    Message Received
                  </h3>
                  <p className="text-stone-500 font-light max-w-xs italic">
                    We've received your query and will get back to you within 24
                    hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-heritage-gold font-bold uppercase tracking-widest text-[10px] border-b border-heritage-gold pb-1"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 relative z-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                        Your Name
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                      Subject
                    </label>
                    <select className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 appearance-none cursor-pointer">
                      <option className="bg-[#1c1917]">Product Inquiry</option>
                      <option className="bg-[#1c1917]">Custom Madurai Order</option>
                      <option className="bg-[#1c1917]">Wholesale Queries</option>
                      <option className="bg-[#1c1917]">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                    />
                  </div>
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-heritage-gold text-stone-950 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-heritage-gold-light transition-all shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
