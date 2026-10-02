import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Ticket,
  CreditCard,
  Smartphone,
  Landmark,
  QrCode,
  Copy,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { OperationType } from "../types";
import { handleFirestoreError } from "../utils/error-handler";

type UpiProvider = "gpay" | "phonepe" | "paytm" | "bhim" | "custom";

export const Checkout: React.FC = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Delivery Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "UPI", // Defaults to dynamic UPI
  });

  // Card payment details
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // UPI Specific States
  const [upiProvider, setUpiProvider] = useState<UpiProvider>("gpay");
  const [upiId, setUpiId] = useState("");
  const [customUpiHandle, setCustomUpiHandle] = useState("@okaxis");
  const [upiVerified, setUpiVerified] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Bank transfer states
  const [bankTxRef, setBankTxRef] = useState("");
  const [copiedBankText, setCopiedBankText] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  // UPI Simulation State
  const [showUpiSimulator, setShowUpiSimulator] = useState(false);
  const [simulatorSecondsLeft, setSimulatorSecondsLeft] = useState(45);
  const [simulatedStatus, setSimulatedStatus] = useState<"waiting" | "approving" | "declined">("waiting");

  // Format Helper for Card
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(" ").slice(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9]/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length > 2) {
      setCardData({ ...cardData, expiry: `${clean.slice(0, 2)}/${clean.slice(2)}` });
    } else {
      setCardData({ ...cardData, expiry: clean });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, "");
    setCardData({ ...cardData, cvv: clean.slice(0, 3) });
  };

  // Autocomplete UPI ID VPA handle based on provider
  useEffect(() => {
    if (upiProvider === "gpay") {
      setCustomUpiHandle("@okaxis");
    } else if (upiProvider === "phonepe") {
      setCustomUpiHandle("@ybl");
    } else if (upiProvider === "paytm") {
      setCustomUpiHandle("@paytm");
    } else if (upiProvider === "bhim") {
      setCustomUpiHandle("@upi");
    }
    setUpiVerified(false);
  }, [upiProvider]);

  // UPI simulation countdown and automatic authentication
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let autoApproveTimeout: NodeJS.Timeout;
    if (showUpiSimulator && simulatedStatus === "waiting") {
      setSimulatorSecondsLeft(5);
      interval = setInterval(() => {
        setSimulatorSecondsLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      autoApproveTimeout = setTimeout(() => {
        handleSimulateApprovalChange(true);
      }, 4000);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(autoApproveTimeout);
    };
  }, [showUpiSimulator, simulatedStatus]);

  // Construct complete UPI ID string
  const getFullUpiId = () => {
    if (!upiId) return "";
    if (upiProvider === "custom") {
      return upiId.includes("@") ? upiId : `${upiId}@upi`;
    }
    const cleanId = upiId.split("@")[0];
    return `${cleanId}${customUpiHandle}`;
  };

  const validateDetails = (): boolean => {
    setFormErrors(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setFormErrors("Please fill in all delivery details before completing order.");
      return false;
    }

    if (formData.paymentMethod === "Card") {
      if (!cardData.number || cardData.number.replace(/\s/g, "").length < 16) {
        setFormErrors("Please enter a valid 16-digit Card Number.");
        return false;
      }
      if (!cardData.name.trim()) {
        setFormErrors("Please enter the Cardholder's Name.");
        return false;
      }
      if (!cardData.expiry || !cardData.expiry.includes("/") || cardData.expiry.length < 5) {
        setFormErrors("Please enter a valid Card Expiration Date (MM/YY).");
        return false;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        setFormErrors("Please enter a valid 3-digit CVV code.");
        return false;
      }
    } else if (formData.paymentMethod === "UPI") {
      const fullUpi = getFullUpiId();
      if (!fullUpi && !showQrCode) {
        setFormErrors("Please enter your UPI ID or use the QR Code scan option.");
        return false;
      }
      if (fullUpi && !fullUpi.includes("@")) {
        setFormErrors("Please enter a valid UPI ID (Virtual Payment Address).");
        return false;
      }
    } else if (formData.paymentMethod === "Bank") {
      if (!bankTxRef.trim() || bankTxRef.trim().length < 8) {
        setFormErrors("Please provide a valid Bank Transfer UTR transaction ID (at least 8 characters).");
        return false;
      }
    }
    return true;
  };

  // Firestore submission
  const submitOrderToFirebase = async (paymentDetailsStr: string) => {
    setIsSubmitting(true);
    const colPath = "orders";
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const orderPayload = {
      customerName: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      paymentMethod: formData.paymentMethod,
      items: cart,
      totalAmount: total,
      status: "pending" as const,
      createdAt: new Date(),
      paymentDetails: paymentDetailsStr,
    };

    // Mirror to local storage demo orders instantly for the sandbox dashboard & order history
    try {
      const storedOrders = localStorage.getItem("jaigo_demo_orders");
      const existingOrders = storedOrders ? JSON.parse(storedOrders) : [];
      const newOrder = {
        ...orderPayload,
        id: "ord-" + Date.now().toString(),
        orderNumber,
        userId: user?.uid || "user-1",
        createdAt: new Date().toISOString(),
        shippingAddress: {
          street: formData.address,
          city: "Farm Gate",
          state: "Tamil Nadu",
          postalCode: "600001",
          country: "India",
        },
        subtotalCents: total * 100,
        taxCents: Math.round(total * 5),
        shippingFeeCents: 0,
        totalCents: Math.round(total * 105),
        items: cart.map((c) => ({
          variantId: c.id,
          quantity: c.quantity,
          priceCents: c.price * 100,
          totalCents: c.price * c.quantity * 100,
          variantSnapshot: {
            sku: `SKU-${c.id.toUpperCase()}`,
            name: c.name,
            productName: c.subtitle || c.name,
            imageUrl: c.imageUrls?.[0] || "",
            attributes: { Category: c.category },
          },
        })),
      };

      // Save to admin orders pool
      localStorage.setItem("jaigo_demo_orders", JSON.stringify([newOrder, ...existingOrders]));

      // Also save to user specific order history key
      const userKey = `jaigo_user_orders_${user?.uid || "guest"}`;
      const savedUserOrders = localStorage.getItem(userKey);
      const existingUserOrders = savedUserOrders ? JSON.parse(savedUserOrders) : [];
      localStorage.setItem(userKey, JSON.stringify([newOrder, ...existingUserOrders]));
    } catch (e) {
      console.warn("Could not mirror order to fallback local storage", e);
    }

    try {
      await addDoc(collection(db, colPath), orderPayload);
      setOrderComplete(true);
      clearCart();
    } catch (error: any) {
      if (error?.code === "permission-denied" || error?.message?.includes("offline")) {
        console.warn("Firestore blocked or offline. Falling back to sandbox order simulation.", error);
        setOrderComplete(true);
        clearCart();
      } else {
        handleFirestoreError(error, OperationType.CREATE, colPath);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main submit trigger
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    if (formData.paymentMethod === "UPI") {
      // Trigger checkout simulated flow
      setShowUpiSimulator(true);
      setSimulatedStatus("waiting");
    } else {
      // For Card and Bank Transfer standard paths, proceed instantly
      let details = "";
      if (formData.paymentMethod === "Card") {
        const lastFour = cardData.number.replace(/\s/g, "").slice(-4);
        details = `Card ending in **** ${lastFour}`;
      } else if (formData.paymentMethod === "Bank") {
        details = `Bank IMPS/NEFT UTR: ${bankTxRef}`;
      }
      await submitOrderToFirebase(details);
    }
  };

  // Simulate payment confirmation callback
  const handleSimulateApprovalChange = async (isApproved: boolean) => {
    if (isApproved) {
      setSimulatedStatus("approving");
      setTimeout(async () => {
        const fullUpi = getFullUpiId();
        const detailsStr = fullUpi 
          ? `UPI Payment ID: ${fullUpi} (${upiProvider.toUpperCase()})` 
          : `UPI QR Scan Web Payment`;
        await submitOrderToFirebase(detailsStr);
        setShowUpiSimulator(false);
      }, 1500);
    } else {
      setSimulatedStatus("declined");
      setTimeout(() => {
        setShowUpiSimulator(false);
        setFormErrors("UPI Payment was declined by the user in the UPI App.");
      }, 1000);
    }
  };

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center bg-[#fdfbf7] text-stone-900">
        <h2 className="text-3xl font-serif text-stone-900 mb-4 italic">
          Checkout is empty
        </h2>
        <p className="text-stone-500 mb-8 italic">Find some organic produce or bio-inputs to fill your cart</p>
        <button
          onClick={() => navigate("/products")}
          className="bg-[#c4a456] text-white px-8 py-3 rounded-full hover:bg-stone-800 transition-colors uppercase tracking-widest font-bold text-xs"
        >
          Return to Shopping
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#fdfbf7] py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl border border-stone-200/60 shadow-xl text-center max-w-lg space-y-6"
        >
          <div className="w-20 h-20 bg-green-50 text-[#c4a456] rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-200">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-4xl font-serif text-stone-900 italic">
            Order Placed successfully!
          </h2>
          <p className="text-stone-600 font-light leading-relaxed italic">
            Thank you for choosing KrishiMart. Your order has been
            received and is now being packaged. An order digest confirmation is available
            on your digital portal.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#c4a456] text-white px-10 py-3 rounded-full hover:bg-[#efcc7d] transition-colors shadow-lg uppercase tracking-widest font-bold text-xs"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Generate appropriate deep-link for Scan UPI QR Code using mock details
  const upiDeepLink = `upi://pay?pa=krishimart@okaxis&pn=KrishiMart&am=${total}&cu=INR&tn=Order%20Payment`;

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12 md:py-20 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* UPI PAYMENT SIMULATION DRAWER/OVERLAY */}
        <AnimatePresence>
          {showUpiSimulator && (
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-200"
              >
                {/* Header brand strip */}
                <div className="bg-[#4c1d1d] text-[#fdfbf7] p-6 text-center space-y-1">
                  <h3 className="font-serif text-xl italic font-bold">UPI Payment Gateway</h3>
                  <p className="text-xs text-stone-300">Secured Merchant Transaction Panel</p>
                </div>

                <div className="p-6 space-y-6 text-center">
                  <div className="space-y-2">
                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">Amount Requested</p>
                    <p className="text-4xl font-serif font-bold text-[#4c1d1d]">₹{total.toLocaleString("en-IN")}</p>
                    <p className="text-stone-500 text-xs">Merchant: <span className="font-semibold text-stone-800">KrishiMart</span></p>
                  </div>

                  {simulatedStatus === "waiting" && (
                    <div className="space-y-4">
                      {/* Pulse Loading indicator */}
                      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 bg-[#c4a456]/20 rounded-full animate-ping" />
                        <div className="absolute inset-2 bg-[#c4a456]/10 rounded-full" />
                        <Clock size={32} className="text-[#c4a456] relative z-10 animate-pulse" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-stone-800">
                          Authenticating secure transaction
                        </p>
                        <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                          We are communicating with your bank to verify credentials. Please do not close or refresh this window.
                        </p>
                      </div>

                      {/* Timer */}
                      <div className="bg-stone-50 rounded-xl py-2 px-4 max-w-[120px] mx-auto border border-stone-200 text-stone-700 text-xs font-mono select-none">
                        00:{simulatorSecondsLeft < 10 ? `0${simulatorSecondsLeft}` : simulatorSecondsLeft}
                      </div>
                    </div>
                  )}

                  {simulatedStatus === "approving" && (
                    <div className="py-8 space-y-4">
                      <div className="w-16 h-16 bg-green-50 mx-auto rounded-full flex items-center justify-center border border-green-200">
                        <Loader2 className="text-green-600 animate-spin" size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-green-700">UPI Payment Authorized</p>
                        <p className="text-xs text-stone-500">Creating secure entry in database ledger...</p>
                      </div>
                    </div>
                  )}

                  {simulatedStatus === "declined" && (
                    <div className="py-8 space-y-4">
                      <div className="w-16 h-16 bg-red-50 mx-auto rounded-full flex items-center justify-center border border-red-200">
                        <AlertCircle className="text-red-500" size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-red-700">UPI Transaction Timed out or Cancelled</p>
                        <p className="text-xs text-stone-500">Merchant failed to receive positive response callback.</p>
                      </div>
                      <button
                        onClick={() => setShowUpiSimulator(false)}
                        className="mt-2 text-xs text-stone-600 underline font-semibold block mx-auto hover:text-stone-900"
                      >
                        Go back to checkout
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-stone-50 p-4 border-t border-stone-100 flex items-center justify-center gap-2 text-[10px] text-stone-400 select-none">
                  <ShieldCheck size={12} className="text-green-600" />
                  <span>128-bit Encrypted SSL Merchant Gateway Connection</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Checkout Info Panel card */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200/50 shadow-sm space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-serif text-stone-900 italic">
                KrishiMart Agriculture Checkout
              </h1>
              <p className="text-stone-500 font-light text-sm italic">
                Confirm your delivery details for direct farm delivery.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              
              {/* Delivery info inputs */}
              <div className="space-y-4">
                <h3 className="font-serif text-stone-800 text-lg font-bold border-b border-stone-150 pb-2">Delivery Particulars</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#4c1d1d] font-bold mb-1.5">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Enter legal name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-[#fdfbf7] border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] focus:ring-1 focus:ring-[#c4a456]/40 text-stone-800 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#4c1d1d] font-bold mb-1.5">
                      Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-[#fdfbf7] border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] focus:ring-1 focus:ring-[#c4a456]/40 text-stone-800 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#4c1d1d] font-bold mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="Enter email for shipping details"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#fdfbf7] border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] focus:ring-1 focus:ring-[#c4a456]/40 text-stone-800 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#4c1d1d] font-bold mb-1.5">
                    Delivery Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific door no, block, landmark and pin code details"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#fdfbf7] border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] focus:ring-1 focus:ring-[#c4a456]/40 text-stone-800 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Payment selector */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="font-serif text-stone-800 text-lg font-bold border-b border-stone-150 pb-2">Select Payment Gateway</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Dynamic brand UPI selection */}
                  <label
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "UPI"
                        ? "border-[#c4a456] bg-[#c4a456]/5 text-[#c4a456] shadow-sm font-semibold"
                        : "border-stone-200 hover:border-stone-300 bg-[#fdfbf7] text-stone-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={formData.paymentMethod === "UPI"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Smartphone size={20} className="flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-bold uppercase tracking-widest text-[10px]">UPI Payment</p>
                      <p className="text-[9px] text-stone-500 font-light truncate">
                        GPay, PhonePe, Paytm
                      </p>
                    </div>
                  </label>

                  {/* Card selector */}
                  <label
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "Card"
                        ? "border-[#c4a456] bg-[#c4a456]/5 text-[#c4a456] shadow-sm font-semibold"
                        : "border-stone-200 hover:border-stone-300 bg-[#fdfbf7] text-stone-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Card"
                      checked={formData.paymentMethod === "Card"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <CreditCard size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Credit / Debit</p>
                      <p className="text-[9px] text-stone-500 font-light">
                        Visa, Mastercard
                      </p>
                    </div>
                  </label>

                  {/* Bank transfer selector */}
                  <label
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "Bank"
                        ? "border-[#c4a456] bg-[#c4a456]/5 text-[#c4a456] shadow-sm font-semibold"
                        : "border-stone-200 hover:border-stone-300 bg-[#fdfbf7] text-stone-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Bank"
                      checked={formData.paymentMethod === "Bank"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Landmark size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Bank Transfer</p>
                      <p className="text-[9px] text-stone-500 font-light">
                        Direct IMPS Transfer
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Interactive Input Panels */}
              <AnimatePresence mode="wait">
                
                {/* DEDICATED LIGHT-THEMED UPI PANEL */}
                {formData.paymentMethod === "UPI" && (
                  <motion.div
                    key="upi-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 bg-[#fdfbf7] border border-stone-200 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <div className="flex flex-col gap-3">
                      <p className="text-[#4c1d1d] font-serif font-bold text-xs">Choose preferred UPI Application</p>
                      
                      {/* Popular UPI Apps Quick Selectors */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "gpay", name: "Google Pay", color: "border-blue-200 hover:border-blue-400 bg-blue-50/20 text-blue-800" },
                          { id: "phonepe", name: "PhonePe", color: "border-purple-200 hover:border-purple-400 bg-purple-50/20 text-purple-800" },
                          { id: "paytm", name: "Paytm", color: "border-sky-200 hover:border-sky-400 bg-sky-50/20 text-sky-800" },
                          { id: "bhim", name: "BHIM UPI", color: "border-orange-200 hover:border-orange-400 bg-orange-50/20 text-orange-800" },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setUpiProvider(app.id as UpiProvider)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[9.5px] font-bold uppercase tracking-wider ${app.color} ${
                              upiProvider === app.id ? "ring-2 ring-stone-900 border-transparent scale-102 font-extrabold" : "opacity-80"
                            }`}
                          >
                            <Smartphone size={16} />
                            {app.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>

                      {/* Manual UPI ID Input */}
                      <div className="pt-2">
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
                          {upiProvider === "gpay" ? "Google Pay" : upiProvider.toUpperCase()} UPI handle Virtual Address (VPA)
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-grow flex items-center">
                            <input
                              type="text"
                              required={!showQrCode}
                              placeholder="e.g. mobileNumber or username"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setUpiVerified(false);
                              }}
                              className="w-full pl-3 pr-20 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm font-mono"
                            />
                            {/* Auto Handle Badge */}
                            {upiProvider !== "custom" && (
                              <span className="absolute right-3 text-stone-400 text-xs font-mono select-none pointer-events-none">
                                {customUpiHandle}
                              </span>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (!upiId) return;
                              setIsVerifyingUpi(true);
                              setTimeout(() => {
                                setIsVerifyingUpi(false);
                                setUpiVerified(true);
                              }, 1100);
                            }}
                            disabled={!upiId || isVerifyingUpi}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                              upiVerified
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-stone-900 hover:bg-stone-800 text-white"
                            }`}
                          >
                            {isVerifyingUpi ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : upiVerified ? (
                              "Verified ✓"
                            ) : (
                              "Verify"
                            )}
                          </button>
                        </div>
                        {upiVerified && (
                          <span className="text-[10px] font-semibold text-green-600 mt-1 block">✓ Account authenticated for: KrishiMart Retail User</span>
                        )}
                      </div>

                      {/* QR code option fallback */}
                      <div className="border-t border-stone-200/60 pt-4 text-center">
                        <span className="text-stone-400 text-[9px] uppercase font-bold tracking-widest block mb-2">Or Scan Dynamic QR Code</span>
                        {!showQrCode ? (
                          <button
                            type="button"
                            onClick={() => setShowQrCode(true)}
                            className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-sm"
                          >
                            <QrCode size={13} /> Present UPI QR Code
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-2.5 p-4 bg-white border border-stone-200 rounded-2xl w-44 mx-auto select-none shadow-sm">
                            <div className="bg-stone-50 p-1 rounded-xl">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiDeepLink)}`}
                                alt="Universal UPI QR Code"
                                className="w-32 h-32"
                              />
                            </div>
                            <span className="text-[9.5px] text-[#4c1d1d] font-bold tracking-wider uppercase flex items-center gap-1.5 justify-center">
                              <QrCode size={12} /> Scan with any UPI app
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Card payment inputs */}
                {formData.paymentMethod === "Card" && (
                  <motion.div
                    key="card-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 bg-[#fdfbf7] border border-stone-200 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <p className="text-[#4c1d1d] font-serif font-bold text-xs">Enter Credit / Debit Card Details</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          value={cardData.number}
                          onChange={handleCardNumberChange}
                          className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Cardholder Name"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">CVV</label>
                          <input
                            type="password"
                            required
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={handleCvvChange}
                            className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Direct Bank transfer details */}
                {formData.paymentMethod === "Bank" && (
                  <motion.div
                    key="bank-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 bg-[#fdfbf7] border border-stone-200 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <p className="text-[#4c1d1d] font-serif font-bold text-xs">Direct Bank IMPS / NEFT Transfer details</p>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 text-xs font-mono text-stone-700">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Bank Name</span>
                        <span className="font-semibold text-stone-800">State Bank of India</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Account Name</span>
                        <span className="font-semibold text-stone-800">KrishiMart LLP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Account No.</span>
                        <span className="flex items-center gap-1 font-semibold text-stone-900">
                          401928374827
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("401928374827");
                              setCopiedBankText(true);
                              setTimeout(() => setCopiedBankText(false), 2000);
                            }}
                            className="text-[#c4a456] hover:text-stone-900 transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">IFSC Code</span>
                        <span className="font-semibold text-stone-800">SBIN0000800</span>
                      </div>
                    </div>
                    {copiedBankText && (
                      <p className="text-[10px] text-green-600 text-center font-bold">Account details copied to clipboard!</p>
                    )}

                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Transaction Ref (UTR) ID</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter 12-digit UTR reference"
                        value={bankTxRef}
                        onChange={(e) => setBankTxRef(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#c4a456] text-stone-800 text-sm font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {formErrors && (
                <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2 select-none">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                  <span>{formErrors}</span>
                </div>
              )}

              {/* Secure payment confirmation button */}
              <button
                disabled={isSubmitting}
                className="w-full bg-[#4c1d1d] hover:bg-[#c4a456] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-97 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Completing Transaction...
                  </>
                ) : (
                  `Complete Order - ₹${total.toLocaleString("en-IN")}`
                )}
              </button>
            </form>
          </div>

          {/* Cart Sidebar panel to review order items */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-serif text-stone-900 flex items-center gap-2 italic">
                Order Review{" "}
                <span className="text-xs bg-[#4c1d1d] text-white px-2 py-0.5 rounded-full font-bold">
                  {cart.length} Articles
                </span>
              </h2>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-center bg-white p-3.5 rounded-xl border border-stone-200/50 shadow-sm"
                  >
                    <img
                      src={item.imageUrls?.[0]}
                      className="w-14 h-14 object-cover rounded-lg"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200&auto=format&fit=crop";
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-semibold text-stone-900 truncate italic">
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 italic">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-serif text-[#4c1d1d] font-bold text-sm">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-stone-200/60 font-medium">
              <div className="flex justify-between items-center text-stone-500 uppercase tracking-widest text-[10px]">
                <span>Shipping & Doorstep Delivery</span>
                <span className="text-green-600 font-bold">Complimentary</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-serif text-stone-800 italic">
                  Grand Total
                </span>
                <span className="text-2xl font-serif text-[#4c1d1d] font-bold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Heritage card guarantee */}
            <div className="bg-[#fdfbf7] p-5 rounded-xl border border-stone-200 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#4c1d1d] flex items-center gap-1.5">
                <Ticket size={13} className="text-[#c4a456]" /> Tamil Heritage Authenticity
              </h4>
              <p className="text-xs text-stone-600 italic leading-relaxed select-none">
                Each product is certified with genuine GI tags representing pure wefts
                and authentic yarn from historical hotspots (Kanchipuram, Madurai, Chettinad, Coimbatore, Kerala).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
