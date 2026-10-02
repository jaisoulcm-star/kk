import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  PackageCheck,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  MapPin,
  RefreshCw,
  Search,
  FileText,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export interface OrderItemSnapshot {
  id?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  totalCents: number;
  variantSnapshot: {
    sku: string;
    name: string;
    productName?: string;
    attributes?: Record<string, string>;
    imageUrl?: string;
  };
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  status: "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotalCents: number;
  taxCents: number;
  shippingFeeCents: number;
  totalCents: number;
  paymentSessionId?: string;
  createdAt: string;
  items: OrderItemSnapshot[];
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOrderModal, setActiveOrderModal] = useState<OrderRecord | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  // Fetch past orders from REST API endpoint /api/v1/orders/my-orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jaigo_auth_token") || "demo-token";
        const response = await fetch("/api/v1/orders/my-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.data.orders)) {
            setOrders(json.data.orders);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("REST API fetch failed, falling back to local storage history:", err);
      }

      // Fallback: Populate mock / local user purchases history
      const localKey = `jaigo_user_orders_${user?.uid || "guest"}`;
      let combinedOrders: any[] = [];

      try {
        const savedOrders = localStorage.getItem(localKey);
        if (savedOrders) {
          combinedOrders = JSON.parse(savedOrders);
        }
        // Also check if any orders were created in demo_orders pool
        const demoOrders = localStorage.getItem("jaigo_demo_orders");
        if (demoOrders) {
          const parsedDemo = JSON.parse(demoOrders);
          for (const d of parsedDemo) {
            if (!combinedOrders.some((existing) => existing.id === d.id)) {
              combinedOrders.push(d);
            }
          }
        }
      } catch {}

      if (combinedOrders.length > 0) {
        setOrders(combinedOrders);
        setLoading(false);
        return;
      }

      // Seed realistic demonstration purchase records
      const seedOrders: OrderRecord[] = [
        {
          id: "ord-1002",
          orderNumber: "ORD-1727508000-482",
          userId: user?.uid || "user-1",
          status: "SHIPPED",
          shippingAddress: {
            street: "Cauvery Organic Farm, 14 Green Field Road",
            city: "Thanjavur",
            state: "Tamil Nadu",
            postalCode: "613001",
            country: "India",
          },
          subtotalCents: 250000,
          taxCents: 12500,
          shippingFeeCents: 0,
          totalCents: 262500,
          trackingNumber: "TN-AGRI-984210",
          carrier: "Krishi Fast Express",
          estimatedDelivery: "Tomorrow, 2:00 PM",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          items: [
            {
              variantId: "agri-1",
              quantity: 2,
              priceCents: 125000,
              totalCents: 250000,
              variantSnapshot: {
                sku: "BIO-NPK-CONCENTRATE",
                name: "Cauvery Bio-Gold Organic NPK Concentrate",
                productName: "Cauvery Delta Soil Health Bio-Nutrients",
                imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=800",
                attributes: { category: "Nutrients", volume: "5 Litre Canister" },
              },
            },
          ],
        },
        {
          id: "ord-1001",
          orderNumber: "ORD-1727421600-119",
          userId: user?.uid || "user-1",
          status: "DELIVERED",
          shippingAddress: {
            street: "28 Farm Gate, Pollachi Road",
            city: "Coimbatore",
            state: "Tamil Nadu",
            postalCode: "641001",
            country: "India",
          },
          subtotalCents: 180000,
          taxCents: 9000,
          shippingFeeCents: 0,
          totalCents: 189000,
          trackingNumber: "TN-AGRI-442198",
          carrier: "India Post Farm Express",
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          items: [
            {
              variantId: "agri-3",
              quantity: 1,
              priceCents: 180000,
              totalCents: 180000,
              variantSnapshot: {
                sku: "HEIRLOOM-PADDY-MAPILLAI",
                name: "Native Heirloom Paddy Seeds (Mapillai Samba)",
                productName: "High-Nutrition Heirloom Rice Seeds",
                imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800",
                attributes: { category: "Seeds", weight: "10 Kg Bag" },
              },
            },
          ],
        },
      ];

      setOrders(seedOrders);
      localStorage.setItem(localKey, JSON.stringify(seedOrders));
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  // Filter orders by status tab and search term
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "pending", "processing", "shipped"].includes(order.status as any)) ||
      order.status.toUpperCase() === selectedStatus;

    const searchLower = searchTerm.toLowerCase();
    const orderNum = (order.orderNumber || order.id || "").toLowerCase();
    const matchesSearch =
      orderNum.includes(searchLower) ||
      (order.items &&
        order.items.some((i: any) =>
          (i.variantSnapshot?.name || i.name || "").toLowerCase().includes(searchLower)
        ));

    return matchesStatus && matchesSearch;
  });

  const formatPrice = (amountCents: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  };

  const getItemName = (item: any) => item?.variantSnapshot?.name || item?.name || "KrishiMart Item";
  const getItemImage = (item: any) => item?.variantSnapshot?.imageUrl || item?.imageUrls?.[0] || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop";
  const getItemSku = (item: any) => item?.variantSnapshot?.sku || item?.variantId || item?.id || "AGRI-ITEM";
  const getItemPriceCents = (item: any) => item?.priceCents || (item?.price ? item.price * 100 : 0);
  const getItemTotalCents = (item: any) => item?.totalCents || getItemPriceCents(item) * (item?.quantity || 1);
  const getOrderTotalCents = (order: any) => order?.totalCents || (order?.totalAmount ? order.totalAmount * 100 : 0);
  const getOrderAddressText = (order: any) => {
    if (typeof order?.shippingAddress === "string") return order.shippingAddress;
    if (order?.shippingAddress?.city) {
      return `${order.shippingAddress.city}, ${order.shippingAddress.state || "Tamil Nadu"}`;
    }
    if (typeof order?.address === "string") return order.address;
    return "Tamil Nadu, India";
  };

  const getStatusBadge = (status: OrderRecord["status"] | string) => {
    const s = String(status || "").toUpperCase();
    switch (s) {
      case "PAID":
      case "PROCESSING":
        return {
          label: "Paid & Processing",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock size={14} className="animate-spin text-amber-600" />,
        };
      case "SHIPPED":
        return {
          label: "In Transit",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Truck size={14} className="text-blue-600 animate-pulse" />,
        };
      case "DELIVERED":
        return {
          label: "Delivered",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 size={14} className="text-emerald-600" />,
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          bg: "bg-red-50 text-red-800 border-red-200",
          icon: <XCircle size={14} className="text-red-600" />,
        };
      default:
        return {
          label: "Order Placed",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 size={14} className="text-emerald-600" />,
        };
    }
  };

  const handleReorder = (order: any) => {
    for (const item of (order.items || [])) {
      addToCart({
        id: item.variantId || item.id || `agri-${Date.now()}`,
        name: getItemName(item),
        price: getItemPriceCents(item) / 100,
        imageUrls: [getItemImage(item)],
        category: item.category || "Nutrients",
        description: item.variantSnapshot?.productName || item.description || "KrishiMart Farm Input",
        inStock: true,
      }, item.quantity || 1);
    }
    setReorderSuccess(`Added items from order ${order.orderNumber || order.id} to your cart!`);
    setTimeout(() => setReorderSuccess(null), 4000);
  };

  return (
    <div className="bg-heritage-cream min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-heritage-maroon/10 text-heritage-maroon text-[10px] font-extrabold uppercase tracking-[0.3em]">
            <PackageCheck size={14} />
            <span>Order Fulfillment History</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 italic font-bold">
            My Past Purchases
          </h1>
          <p className="text-stone-600 font-light text-sm max-w-xl mx-auto">
            Track real-time courier dispatches, view immutable price receipts, and review your organic agriculture orders.
          </p>
        </div>

        {/* Reorder Toast Notification */}
        <AnimatePresence>
          {reorderSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-900 text-emerald-100 px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-700/50"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span className="text-xs font-medium tracking-wide">{reorderSuccess}</span>
              </div>
              <Link
                to="/cart"
                className="text-xs font-bold text-emerald-300 hover:text-white underline uppercase tracking-wider flex items-center gap-1"
              >
                View Cart <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "ACTIVE", label: "Active & Transit" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedStatus === tab.id
                    ? "bg-heritage-maroon text-white shadow-md"
                    : "bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order # or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-heritage-gold/50"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
            <RefreshCw size={32} className="mx-auto text-heritage-gold animate-spin" />
            <p className="text-xs uppercase tracking-widest font-bold text-stone-500">
              Retrieving Purchase Records...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty Orders State */
          <div className="py-20 text-center space-y-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm px-4">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-400 border border-stone-200">
              <ShoppingBag size={36} strokeWidth={1.5} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-serif text-stone-900 italic font-bold">No Orders Found</h3>
              <p className="text-stone-500 text-xs font-light leading-relaxed">
                You haven't placed any purchases matching this filter yet. Explore our organic farm inputs collection today.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-3 bg-heritage-maroon text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-900 transition-all shadow-lg"
            >
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-stone-200/80 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 bg-stone-50/70 border-b border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                          Order Number
                        </span>
                        <span className="text-sm font-mono font-bold text-stone-900">{order.orderNumber}</span>
                      </div>
                      <div className="h-8 w-px bg-stone-200 hidden sm:block" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                          Date Placed
                        </span>
                        <span className="text-xs font-medium text-stone-700">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {/* View Details Button */}
                      <button
                        onClick={() => setActiveOrderModal(order)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-stone-900 text-white rounded-full text-xs font-bold hover:bg-heritage-maroon transition-colors"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Body & Line Items */}
                  <div className="p-6 space-y-6">
                    <div className="divide-y divide-stone-100">
                      {(order.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={getItemImage(item)}
                              alt={getItemName(item)}
                              className="w-16 h-20 object-cover rounded-xl border border-stone-200 shrink-0"
                            />
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-stone-900 font-serif">
                                {getItemName(item)}
                              </h4>
                              <p className="text-xs text-stone-500 font-light">
                                SKU: {getItemSku(item)} • Qty: {item.quantity || 1}
                              </p>
                              {item.variantSnapshot?.attributes && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(item.variantSnapshot.attributes).map(([key, val]) => (
                                    <span
                                      key={key}
                                      className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono"
                                    >
                                      {key}: {String(val)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-serif text-heritage-maroon">
                              {formatPrice(getItemTotalCents(item))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tracking Status Box if Shipped / Active */}
                    {order.trackingNumber && (
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                            <Truck size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block">
                              Courier: {order.carrier || "Krishi Fast Express"} ({order.trackingNumber})
                            </span>
                            <span className="text-stone-500 font-light">
                              Estimated Delivery: {order.estimatedDelivery || "In Transit"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveOrderModal(order)}
                          className="text-xs font-bold text-heritage-maroon hover:underline flex items-center gap-1 self-start sm:self-auto"
                        >
                          Track Full Progress <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    {/* Order Footer & Actions */}
                    <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-stone-500 font-light">
                        Ship to: <span className="font-semibold text-stone-800">{getOrderAddressText(order)}</span>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                            Total Charged
                          </span>
                          <span className="text-lg font-serif font-bold text-stone-900">
                            {formatPrice(getOrderTotalCents(order))}
                          </span>
                        </div>

                        <button
                          onClick={() => handleReorder(order)}
                          className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
                        >
                          <RefreshCw size={14} />
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Order Modal Drawer */}
      <AnimatePresence>
        {activeOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveOrderModal(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Modal Header */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-heritage-gold font-bold block">
                  Official Purchase Invoice Snapshot
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  Order #{activeOrderModal.orderNumber}
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Placed on {new Date(activeOrderModal.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Timeline Tracker */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-bold text-stone-700">
                  Fulfillment Status Timeline
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center relative">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs font-bold">
                      ✓
                    </div>
                    <span className="text-[10px] font-bold text-stone-800 block">Placed</span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs font-bold">
                      ✓
                    </div>
                    <span className="text-[10px] font-bold text-stone-800 block">Confirmed</span>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        ["SHIPPED", "DELIVERED"].includes(activeOrderModal.status)
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white animate-pulse"
                      }`}
                    >
                      3
                    </div>
                    <span className="text-[10px] font-bold text-stone-800 block">Dispatched</span>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        activeOrderModal.status === "DELIVERED"
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      4
                    </div>
                    <span className="text-[10px] font-bold text-stone-800 block">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Addresses Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-light text-stone-600">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1 uppercase tracking-wider text-[10px]">
                    Shipping Destination
                  </span>
                  <p className="font-medium text-stone-800">{getOrderAddressText(activeOrderModal)}</p>
                  {activeOrderModal.shippingAddress?.street && (
                    <p>{activeOrderModal.shippingAddress.street}</p>
                  )}
                  {activeOrderModal.shippingAddress?.postalCode && (
                    <p>PIN: {activeOrderModal.shippingAddress.postalCode}</p>
                  )}
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1 uppercase tracking-wider text-[10px]">
                    Financial Summary
                  </span>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-stone-800">
                        {formatPrice(activeOrderModal.subtotalCents || getOrderTotalCents(activeOrderModal))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Tax (5%):</span>
                      <span className="font-semibold text-stone-800">
                        {formatPrice(activeOrderModal.taxCents || Math.round(getOrderTotalCents(activeOrderModal) * 0.05))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Fee:</span>
                      <span className="font-semibold text-emerald-600">
                        FREE
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-stone-300 pt-1 font-bold text-stone-900 text-sm">
                      <span>Total:</span>
                      <span className="text-heritage-maroon">{formatPrice(getOrderTotalCents(activeOrderModal))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-bold text-stone-700">Purchased Items</h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4 bg-stone-50">
                  {(activeOrderModal.items || []).map((item: any, i: number) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block">{getItemName(item)}</span>
                        <span className="text-stone-500 font-light">
                          {item.quantity || 1} x {formatPrice(getItemPriceCents(item))}
                        </span>
                      </div>
                      <span className="font-bold text-heritage-maroon font-serif">
                        {formatPrice(getItemTotalCents(item))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Footer */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setActiveOrderModal(null)}
                  className="bg-stone-900 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-heritage-maroon transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
