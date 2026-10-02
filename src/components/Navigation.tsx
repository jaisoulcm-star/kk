import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Heart,
  MessageCircle,
  Home,
  Compass,
  LogOut,
  Sliders,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { HeaderSearchBar } from "./HeaderSearchBar";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const { cart } = useCart();

  React.useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);
  const { wishlist } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Our Roots", path: "/products" },
    { name: "My Orders", path: "/orders" },
    { name: "The Heritage", path: "/about" },
    { name: "Connect", path: "/contact" },
  ];

  if (isAdmin) {
    navLinks.push({ name: "Admin", path: "/admin" });
  }

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-0 z-50 glass-nav relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:grid md:grid-cols-3">
            {/* Logo Left for Mobile / Discovery for Desktop */}
            <div className="flex items-center">
              <Link
                to="/"
                className="flex flex-col group md:hidden scale-90 origin-left"
              >
                <span className="text-2xl font-serif font-black text-heritage-maroon tracking-[0.1em] group-hover:zari-text transition-all duration-300 italic">
                  KrishiMart
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-heritage-maroon -mt-1 font-semibold whitespace-nowrap">
                  Organic Agriculture
                </span>
              </Link>
              <div className="hidden md:flex items-center text-stone-500">
                <Link
                  to="/products"
                  className="text-[10px] uppercase tracking-[0.4em] hover:text-heritage-maroon transition-colors font-black"
                >
                  Discovery
                </Link>
              </div>
            </div>

            <Link
              to="/"
              className="hidden md:flex flex-col items-center group justify-center"
            >
              <span className="text-4xl font-serif font-black text-heritage-maroon group-hover:text-heritage-maroon/80 transition-all duration-300 tracking-[0.15em] italic leading-none">
                KrishiMart
              </span>
              <span className="text-[9px] uppercase tracking-[0.6em] text-heritage-gold font-bold whitespace-nowrap mt-1">
                Organic Agriculture
              </span>
            </Link>

            {/* Icons Right */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <HeaderSearchBar />
              {user && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {isAdmin ? "Admin" : "Farmer"}
                  </span>
                </div>
              )}
              {/* User Profile / Login Button with Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                    } else {
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }
                  }}
                  className={`p-2 rounded-full transition-all flex items-center gap-1.5 ${
                    user
                      ? "bg-heritage-maroon/10 text-heritage-maroon hover:bg-heritage-maroon/20"
                      : "text-stone-500 hover:text-heritage-maroon"
                  }`}
                  title={user ? `${user.displayName || user.email} (Click to open menu)` : "Sign In"}
                >
                  <User size={20} strokeWidth={1.5} />
                  {user && (
                    <span className="hidden lg:inline text-xs font-semibold max-w-[90px] truncate text-stone-700">
                      {user.displayName?.split(" ")[0] || "Account"}
                    </span>
                  )}
                </button>

                {/* Floating User Menu Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50 text-left"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 font-bold flex items-center justify-center font-serif shrink-0 border border-stone-200">
                          {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {user.displayName || "Agricultural Member"}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                          <span
                            className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isAdmin
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isAdmin ? "👑 Admin" : "🌾 Farmer"}
                          </span>
                        </div>
                      </div>

                      <div className="py-2 space-y-1">
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-colors"
                          >
                            <Sliders size={14} className="text-amber-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-xl transition-colors"
                        >
                          <Package size={14} className="text-stone-500" />
                          <span>My Farm Orders</span>
                        </Link>
                        <Link
                          to="/login"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-xl transition-colors"
                        >
                          <User size={14} className="text-stone-500" />
                          <span>Account & Security Portal</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link
                to="/cart"
                className="relative p-2 sm:p-2 text-stone-500 hover:text-heritage-maroon transition-colors pr-0"
              >
                <ShoppingCart size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute top-0 right-[-4px] bg-heritage-maroon text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 pr-0 text-stone-500 hover:text-heritage-maroon transition-colors"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex justify-center space-x-12">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative group ${
                    location.pathname === link.path
                      ? "text-heritage-maroon"
                      : "text-stone-500 hover:text-heritage-maroon"
                  }`}
                >
                  <span className={location.pathname === link.path ? "bg-heritage-gold/20 px-2 py-0.5 rounded" : ""}>
                    {link.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-heritage-cream border-t border-heritage-gold/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-lg font-serif transition-colors italic ${
                      location.pathname === link.path
                        ? "text-heritage-gold underline decoration-heritage-maroon/20"
                        : "text-stone-600 hover:text-heritage-gold"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-heritage-gold/10 space-y-4">
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-serif text-stone-600 hover:text-heritage-gold flex items-center gap-2 italic"
                  >
                    Wishlist{" "}
                    {wishlist.length > 0 && (
                      <span className="bg-heritage-gold text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  {!user ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/login");
                      }}
                      className="w-full flex items-center justify-between group bg-stone-900 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      <span>Sign In</span>
                      <User size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (
                          window.confirm("Are you sure you want to sign out?")
                        ) {
                          logout();
                        }
                      }}
                      className="w-full flex items-center justify-between group bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-red-100"
                    >
                      <span>Logout ({user.displayName || "Artisan"})</span>
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* PERSISTENT MOBILE BOTTOM NAV - NOT A DOCK */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 z-[40]">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/" ? "text-heritage-gold" : "text-stone-400"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Home size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Home
            </span>
          </Link>
          <Link
            to="/products"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname.startsWith("/product") ? "text-heritage-gold" : "text-stone-600"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Compass size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Shop
            </span>
          </Link>
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/wishlist" ? "text-heritage-gold" : "text-stone-600"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Heart size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Saved
            </span>
          </Link>
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/cart" ? "text-heritage-gold" : "text-stone-600"} relative`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <ShoppingCart size={20} strokeWidth={1.5} />
            </motion.div>
            {cartCount > 0 && (
              <span className="absolute top-3 right-5 bg-heritage-gold text-stone-950 text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Cart
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export const Footer: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-heritage-maroon text-stone-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex flex-col mb-6">
              <span className="text-3xl font-serif font-black text-heritage-cream tracking-wider italic">
                KrishiMart
              </span>
              <span className="text-xs uppercase tracking-[0.3em] text-heritage-gold -mt-1 font-semibold">
                AUTHENTIC HARVEST
              </span>
            </Link>
            <p className="max-w-md text-stone-400 leading-relaxed font-light italic">
              Celebrating the rich agrarian bounty and fertile soils of Tamil Nadu across generations. Our mission is to bring pure, traditionally nurtured farm produce directly from grower to table.
            </p>
          </div>
          <div>
            <h4 className="text-heritage-gold uppercase tracking-widest text-sm font-bold mb-6">
              Explore
            </h4>
            <ul className="space-y-4 text-sm font-light italic">
              <li>
                <Link
                  to="/products?cat=Heirloom%20Spices"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Heirloom Spices
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Cold-Pressed%20Oils"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Cold-Pressed Oils
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Heritage%20Rice%20%26%20Millets"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Heritage Rice & Millets
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Raw%20Forest%20Honey"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Raw Forest Honey
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Our Story
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-heritage-gold uppercase tracking-widest text-sm font-bold mb-6">
              Contact
            </h4>
            <div className="space-y-4 text-sm font-light italic">
              <p className="flex items-center gap-3">
                <Phone size={16} /> +91 9944763671
              </p>
              <p className="flex items-center gap-3">
                <Mail size={16} /> krishimartgroups@gmail.com
              </p>
              <div className="flex gap-4 pt-4">
                <a
                  href="#"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-500 font-light uppercase tracking-widest">
          <p>
            © 2026 KrishiMart |{" "}
            <a
              href="https://krishimart.in"
              className="hover:text-heritage-gold transition-colors"
            >
              krishimart.in
            </a>
            . All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 italic">Designed with tradition & elegance</p>
        </div>
      </div>
    </footer>

  );
};
