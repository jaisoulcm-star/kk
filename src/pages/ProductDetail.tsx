import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import {
  ShoppingCart,
  Heart,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { Product, Review, OperationType } from "../types";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [zoomState, setZoomState] = useState({ isZoomed: false, x: 0, y: 0 });
  const [isShareOpen, setIsShareOpen] = useState(false);

  const paginate = (newDirection: number) => {
    if (!product) return;
    setDirection(newDirection);
    const nextIdx =
      (activeImage + newDirection + product.imageUrls.length) %
      product.imageUrls.length;
    setActiveImage(nextIdx);
  };
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product!);
    setTimeout(() => setIsAdding(false), 2000);
  };
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = product ? isInWishlist(product.id) : false;

  const shareUrl = window.location.href;
  const shareText = `Discover this exquisite ${product?.name} at KrishiMart.`;

  const shareLinks = [
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      color: "hover:text-green-600",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: "hover:text-sky-500",
    },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomState({ isZoomed: true, x, y });
  };

  const { user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Load cached reviews first if available
    try {
      const cached = localStorage.getItem(`reviews_${id}`);
      if (cached) setReviews(JSON.parse(cached));
    } catch {}

    let unsubscribe: () => void = () => {};
    try {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", id)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const reviewsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Review[];

            // Sort client-side to prevent Firestore composite index requirements
            reviewsData.sort((a, b) => {
              const tA = (a.createdAt as any)?.toMillis
                ? (a.createdAt as any).toMillis()
                : (a.createdAt as any)?.seconds
                  ? (a.createdAt as any).seconds * 1000
                  : typeof a.createdAt === "string"
                    ? new Date(a.createdAt).getTime()
                    : 0;
              const tB = (b.createdAt as any)?.toMillis
                ? (b.createdAt as any).toMillis()
                : (b.createdAt as any)?.seconds
                  ? (b.createdAt as any).seconds * 1000
                  : typeof b.createdAt === "string"
                    ? new Date(b.createdAt).getTime()
                    : 0;
              return tB - tA;
            });

            setReviews(reviewsData);
            try {
              localStorage.setItem(`reviews_${id}`, JSON.stringify(reviewsData));
            } catch {}
          } catch (e) {
            console.warn("Reviews process error:", e);
          }
        },
        (error) => {
          console.warn("Reviews snapshot listener operating in offline/fallback mode:", error);
        }
      );
    } catch (e) {
      console.warn("Failed to subscribe to reviews:", e);
    }

    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmittingReview(true);
    const newRevPayload: any = {
      productId: id,
      userId: user.uid,
      userName: user.displayName || user.email?.split("@")[0] || "Farmer",
      rating: newReviewRating,
      comment: newReviewComment,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "reviews"), {
        ...newRevPayload,
        createdAt: serverTimestamp(),
      });
      setNewReviewComment("");
      setNewReviewRating(5);
    } catch (error) {
      console.warn("Firestore reviews write failed or blocked, falling back to local state:", error);
      const fallbackRev = { id: `rev-${Date.now()}`, ...newRevPayload };
      setReviews((prev) => [fallbackRev, ...prev]);
      try {
        const current = JSON.parse(localStorage.getItem(`reviews_${id}`) || "[]");
        localStorage.setItem(`reviews_${id}`, JSON.stringify([fallbackRev, ...current]));
      } catch {}
      setNewReviewComment("");
      setNewReviewRating(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (error) {
      console.warn("Firestore delete review failed or offline:", error);
    }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    try {
      const current = JSON.parse(localStorage.getItem(`reviews_${id}`) || "[]");
      localStorage.setItem(`reviews_${id}`, JSON.stringify(current.filter((r: any) => r.id !== reviewId)));
    } catch {}
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        let foundProduct: Product | undefined;

        // Try to fetch from live Firestore database first
        try {
          const docRef = doc(db, "products", id);
          const snapshot = await getDoc(docRef);
          if (snapshot.exists()) {
            foundProduct = { id: snapshot.id, ...snapshot.data() } as Product;
          }
        } catch (dbError) {
          console.warn("Firestore product details retrieval error, trying local caches:", dbError);
        }

        // If not found in live database (or blocked), check localized sandbox cache
        if (!foundProduct) {
          const isDemo = sessionStorage.getItem("jaigo_demo_user")
            ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
            : false;
          const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";
          const storedProducts = localStorage.getItem(productKey);
          if (storedProducts) {
            try {
              const allProducts: Product[] = JSON.parse(storedProducts);
              foundProduct = allProducts.find((p) => p.id === id);
            } catch {}
          }
        }

        // If not found in localized sandbox cache, check static presets
        if (!foundProduct) {
          const { MOCK_PRODUCTS } = await import("../constants");
          foundProduct = MOCK_PRODUCTS.find((p) => p.id === id) as Product;
        }

        if (foundProduct) {
          setProduct(foundProduct);
          const { addRecentlyViewed } = await import("../utils/recentViews");
          addRecentlyViewed(foundProduct.id);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-heritage-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-heritage-maroon"></div>
      </div>
    );
  if (!product)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-heritage-cream space-y-6">
        <div className="text-4xl font-serif text-heritage-maroon italic">Product Not Found</div>
        <p className="text-stone-500 italic max-w-xs text-center">This specific agricultural product could not be located in our current catalog.</p>
        <Link to="/products" className="bg-heritage-maroon text-white px-8 py-3 rounded-full uppercase tracking-widest text-[10px] font-bold shadow-lg hover:bg-stone-900 transition-all">
          Explore Catalog
        </Link>
      </div>
    );

  return (
    <div className="bg-heritage-cream min-h-screen py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="flex items-center gap-2 text-stone-600 hover:text-heritage-maroon mb-12 transition-colors uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft size={16} /> Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Images Section */}
          <div className="space-y-6">
            <div
              className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xl relative cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseEnter={() =>
                setZoomState((prev) => ({ ...prev, isZoomed: true }))
              }
              onMouseLeave={() =>
                setZoomState((prev) => ({ ...prev, isZoomed: false }))
              }
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={activeImage}
                  custom={direction}
                  variants={{
                    enter: (direction: number) => ({
                      x: direction > 0 ? "100%" : "-100%",
                      opacity: 0,
                    }),
                    center: { x: 0, opacity: 1 },
                    exit: (direction: number) => ({
                      x: direction < 0 ? "100%" : "-100%",
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  src={
                    product.imageUrls?.[activeImage] ||
                    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2400&auto=format&fit=crop"
                  }
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2400&auto=format&fit=crop";
                  }}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                  style={{
                    transformOrigin: `${zoomState.x}% ${zoomState.y}%`,
                    transform: zoomState.isZoomed ? "scale(3)" : "scale(1)",
                    transition: "transform 0.4s ease-out",
                  }}
                />
              </AnimatePresence>

              {/* Carousel Navigation */}
              {product.imageUrls && product.imageUrls.length > 1 && !zoomState.isZoomed && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      paginate(-1);
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-10"
                  >
                    <ChevronLeft size={24} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      paginate(1);
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 z-10"
                  >
                    <ChevronRight size={24} strokeWidth={1.5} />
                  </button>

                  <div className="absolute top-6 right-6 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-stone-900 font-bold tracking-widest z-10 border border-stone-200/50">
                    {activeImage + 1} / {product.imageUrls.length}
                  </div>
                </>
              )}

              {/* Custom Cursor/Hint */}
              {!zoomState.isZoomed && (
                <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 text-stone-900 px-5 py-2.5 rounded-full text-[9px] uppercase tracking-[0.3em] backdrop-blur-md border border-stone-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-heritage-gold animate-pulse rounded-full" />
                    Inspect Quality & Purity
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {product.imageUrls && product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-24 h-32 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === idx
                      ? "border-heritage-gold scale-105 shadow-md"
                      : "border-transparent opacity-40 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-1000"
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-heritage-gold/10 text-heritage-gold font-bold rounded-full border border-heritage-gold/20">
                  {product.category}
                </span>
                {product.isFeatured && (
                  <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-stone-800 text-heritage-gold font-bold rounded-full border border-heritage-gold/30">
                    Exquisite Choice
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-serif text-stone-900 leading-tight italic">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-sm uppercase tracking-[0.3em] text-heritage-gold font-bold italic mt-2">
                  {product.subtitle}
                </p>
              )}
              <p className="text-3xl font-serif text-heritage-maroon font-bold">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
            </div>

            <p className="text-stone-600 font-light leading-relaxed text-lg italic border-l-2 border-heritage-gold/50 pl-6 py-2">
              {product.description}
            </p>

            {/* Features Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-stone-200">
              <div className="flex items-center gap-3 opacity-90">
                <ShieldCheck className="text-heritage-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-600">
                  100% Genuine
                </span>
              </div>
              <div className="flex items-center gap-3 opacity-90">
                <Truck className="text-heritage-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-600">
                  Heritage Box Shipping
                </span>
              </div>
              <div className="flex items-center gap-3 opacity-90">
                <RotateCcw className="text-heritage-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-600">
                  Easy Returns
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`w-full px-10 py-5 rounded-full flex items-center justify-center gap-3 transition-all duration-500 font-bold uppercase tracking-widest relative overflow-hidden shadow-xl ${
                  isAdding
                    ? "bg-stone-100 text-heritage-maroon shadow-inner"
                    : "bg-heritage-maroon text-white hover:bg-stone-900 hover:shadow-2xl active:scale-95"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.div
                      key="adding"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShieldCheck size={20} className="text-heritage-gold" />
                      <span>Added to collection</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="normal"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart size={20} />
                      <span>Add to Collection</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAdding && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="absolute bottom-0 left-0 h-1 bg-heritage-gold"
                  />
                )}
              </button>

              <div className="flex gap-4">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`flex-1 sm:flex-none p-5 border rounded-full flex items-center justify-center transition-all group ${
                    isFavorite
                      ? "border-heritage-gold bg-heritage-gold text-white shadow-lg"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <Heart
                    size={20}
                    className={
                      isFavorite
                        ? "fill-current"
                        : "group-hover:text-heritage-gold transition-colors"
                    }
                  />
                </button>
                <div className="flex-1 sm:flex-none relative">
                  <button
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className={`w-full p-5 border rounded-full flex items-center justify-center transition-all group ${
                      isShareOpen
                        ? "bg-heritage-gold text-white border-heritage-gold"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Share2
                      size={20}
                      className={
                        !isShareOpen
                          ? "group-hover:text-heritage-gold transition-colors"
                          : ""
                      }
                    />
                  </button>

                  <AnimatePresence>
                    {isShareOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 flex gap-1 z-50 backdrop-blur-xl"
                      >
                        {shareLinks.map((link) => (
                          <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors ${link.color} hover:bg-stone-50`}
                            onClick={() => setIsShareOpen(false)}
                          >
                            {link.name}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-10">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500">
                Authentic Details
              </h4>
              <ul className="grid grid-cols-2 gap-4 text-xs font-light text-stone-500 list-disc list-inside">
                <li>100% Organic Certified</li>
                <li>Soil Lab Tested</li>
                <li>Cauvery Delta Origin</li>
                <li>Direct Farm Source</li>
                <li>Bio-Active Formulation</li>
                <li>Eco-Friendly Pack</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 pt-24 border-t border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Review Summary */}
            <div className="space-y-6">
              <h2 className="text-3xl font-serif text-stone-900 italic">
                Customer Reviews & Field Reports
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-serif text-heritage-maroon">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((acc, r) => acc + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </div>
                <div className="space-y-1">
                  <div className="flex text-heritage-gold">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={
                          s <=
                          Math.round(
                            reviews.reduce((acc, r) => acc + r.rating, 0) /
                              (reviews.length || 1)
                          )
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                    Based on {reviews.length} reviews
                  </p>
                </div>
              </div>

              {!user ? (
                <div className="p-6 bg-white rounded-2xl border border-stone-200 space-y-4">
                  <p className="text-sm text-stone-500 italic">
                    Share your experience with this agricultural product.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-heritage-maroon border-b border-heritage-maroon pb-1"
                  >
                    Sign in to leave a review
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-8 bg-white rounded-3xl border border-stone-100 space-y-6 shadow-xl"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                      Your Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className={`transition-colors ${
                            star <= newReviewRating
                              ? "text-heritage-gold"
                              : "text-stone-200"
                          }`}
                        >
                          <Star
                            size={24}
                            fill={star <= newReviewRating ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                      Your Thoughts
                    </label>
                    <textarea
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Describe crop yield, product effectiveness, and application results..."
                      rows={4}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm text-stone-900 focus:outline-none focus:border-heritage-gold transition-colors placeholder:text-stone-300 italic"
                    />
                  </div>
                  <button
                    disabled={submittingReview}
                    className="w-full bg-heritage-maroon text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send size={14} /> Submit Review
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 space-y-8">
              {reviews.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-stone-300 rounded-[48px]">
                  <MessageSquare size={40} className="text-stone-200" />
                  <p className="text-stone-400 italic">
                    Be the first to celebrate this creation.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[32px] border border-stone-100 relative group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center border border-stone-200">
                          <UserIcon size={18} className="text-heritage-gold" />
                        </div>
                        <div>
                          <h4 className="font-serif text-stone-900 italic font-bold">
                            {review.userName}
                          </h4>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                            Verified Collector
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex text-heritage-gold">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= review.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        {(user?.uid === review.userId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-stone-200 hover:text-red-500 transition-colors"
                            title="Delete Review"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-stone-600 font-light leading-relaxed italic">
                      "{review.comment}"
                    </p>
                    {review.createdAt && (
                      <p className="mt-4 text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                        {review.createdAt instanceof Timestamp
                          ? review.createdAt.toDate().toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Legacy Review"}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
