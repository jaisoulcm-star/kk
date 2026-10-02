import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "../contexts/CartContext";

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center bg-heritage-cream">
        <div className="w-24 h-24 bg-heritage-gold/20 rounded-full flex items-center justify-center mb-6 border border-heritage-gold/30">
          <ShoppingBag size={40} className="text-heritage-maroon" />
        </div>
        <h2 className="text-3xl font-serif text-stone-900 mb-4 italic">
          Your bag is empty
        </h2>
        <p className="text-stone-600 font-light mb-8 max-w-sm italic">
          It looks like you haven't added any organic farm produce or bio-inputs to your cart yet.
        </p>
        <Link
          to="/products"
          className="bg-heritage-maroon text-white px-8 py-3 rounded-full hover:bg-stone-900 transition-colors shadow-lg uppercase tracking-widest font-bold text-xs"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-heritage-cream py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-stone-900 mb-12 italic">
          Your Shopping Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-6 bg-white/80 p-6 rounded-2xl border border-stone-100 shadow-sm"
              >
                <div className="w-32 h-40 flex-shrink-0 overflow-hidden rounded-xl bg-stone-50 border border-stone-200">
                  <img
                    src={item.imageUrls?.[0]}
                    alt={item.name}
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                </div>

                <div className="flex-grow space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-heritage-gold font-bold">
                        {item.category}
                      </p>
                      <h3 className="text-xl font-serif text-stone-900 italic font-bold">
                        {item.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <p className="text-heritage-maroon font-serif text-lg font-bold">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>

                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center border border-stone-200 rounded-full bg-white overflow-hidden shadow-sm">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 hover:bg-stone-50 text-stone-400 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 hover:bg-stone-50 text-stone-400 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-stone-500 italic">
                      Subtotal: ₹
                      {(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-xl sticky top-32 space-y-6">
              <h3 className="text-2xl font-serif text-stone-900 border-b border-stone-100 pb-4 italic">
                Order Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-stone-600 font-light">
                  <span>
                    Items ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-light">
                  <span>Shipping</span>
                  <span className="text-green-600 uppercase text-[10px] font-bold tracking-widest">
                    Free
                  </span>
                </div>
                <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
                  <span className="text-lg font-serif text-stone-900 font-bold">
                    Total
                  </span>
                  <span className="text-2xl font-serif text-heritage-maroon font-bold">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-heritage-maroon text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors group shadow-lg font-bold uppercase tracking-widest text-xs"
              >
                Proceed to Checkout{" "}
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>

              <p className="text-[10px] text-center text-stone-400 uppercase tracking-widest mt-6">
                Secure SSL Encrypted Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
