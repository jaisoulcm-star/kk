import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RegisterSchema, LoginSchema, AddressSchema, CartValidateSchema, CheckoutSessionSchema } from "./schemas/auth.schema";
import { CheckoutService } from "./services/checkout.service";
import { WebhookService } from "./services/webhook.service";
import { AppError } from "./middleware/errorHandler";
import { env } from "./config/env";

export const apiRouter = Router();

// In-memory mock DB fallback for sandbox runtime
const MOCK_USERS: any[] = [];
const MOCK_PRODUCTS: any[] = [
  {
    id: "prod-1",
    name: "Cauvery Bio-Gold Organic NPK Concentrate",
    slug: "cauvery-bio-gold-organic-npk-concentrate",
    description: "Enriched Bio-Nutrients for Soil Health & Crop Yield. Pure microbial soil revitalizer packed with nitrogen fixers, phosphate solubilizers, and humic extracts.",
    category: "Nutrients",
    isActive: true,
    variants: [
      {
        id: "var-1",
        productId: "prod-1",
        sku: "BIO-NPK-5L",
        name: "5 Litre Canister",
        priceCents: 125000, // ₹1,250.00
        compareAtCents: 150000,
        attributes: { size: "5 Litre", formulation: "Liquid Concentrate" },
        inventory: {
          id: "inv-1",
          quantityOnHand: 45,
          quantityReserved: 2,
        },
      },
    ],
  },
  {
    id: "prod-2",
    name: "Native Heirloom Paddy Seeds (Mapillai Samba)",
    slug: "native-heirloom-paddy-seeds-mapillai-samba",
    description: "Certified organic Tamil Nadu heritage rice seeds harvested directly from native seed conservation farms.",
    category: "Seeds",
    isActive: true,
    variants: [
      {
        id: "var-2",
        productId: "prod-2",
        sku: "MAPILLAI-SAMBA-10KG",
        name: "10 Kg Bag",
        priceCents: 180000, // ₹1,800.00
        compareAtCents: 210000,
        attributes: { weight: "10 Kg", crop: "Paddy" },
        inventory: {
          id: "inv-2",
          quantityOnHand: 25,
          quantityReserved: 1,
        },
      },
    ],
  },
];

const MOCK_ORDERS: any[] = [];

// JWT Auth Middleware
export const authenticateJWT = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError("Authentication token required", 401, "UNAUTHORIZED"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired authentication token", 401, "INVALID_TOKEN"));
  }
};

// --- AUTH ROUTES ---
apiRouter.post("/v1/auth/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = MOCK_USERS.find((u) => u.email === body.email);
    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = {
      id: `user-${Date.now()}`,
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: "CUSTOMER",
      addresses: [],
      createdAt: new Date(),
    };

    MOCK_USERS.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("refreshToken", token, { httpOnly: true, secure: true, sameSite: "strict" });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/v1/auth/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = LoginSchema.parse(req.body);
    let user = MOCK_USERS.find((u) => u.email === body.email);

    if (!user) {
      // Demo fallback user
      const passwordHash = await bcrypt.hash(body.password, 10);
      user = {
        id: "demo-user-123",
        email: body.email,
        passwordHash,
        firstName: "Heritage",
        lastName: "Patron",
        role: "CUSTOMER",
        addresses: [],
        createdAt: new Date(),
      };
      MOCK_USERS.push(user);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/v1/auth/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401, "REFRESH_TOKEN_REQUIRED");
    }

    const decoded = jwt.verify(refreshToken as string, env.JWT_SECRET) as any;
    const newToken = jwt.sign({ id: decoded.id, email: decoded.email, role: decoded.role }, env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    next(new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN"));
  }
});

apiRouter.get("/v1/users/me", authenticateJWT, (req: any, res: Response) => {
  const user = MOCK_USERS.find((u) => u.id === req.user.id) || {
    id: req.user.id,
    email: req.user.email,
    firstName: "Organic",
    lastName: "Grower",
    role: req.user.role,
    addresses: [],
  };

  res.json({ success: true, data: { user } });
});

apiRouter.post("/v1/users/addresses", authenticateJWT, (req: any, res: Response, next: NextFunction) => {
  try {
    const address = AddressSchema.parse(req.body);
    const user = MOCK_USERS.find((u) => u.id === req.user.id);
    if (user) {
      user.addresses.push({ id: `addr-${Date.now()}`, ...address });
    }
    res.status(201).json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
});

// --- CATALOG & PRODUCTS ---
apiRouter.get("/v1/products", (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const category = req.query.category as string;
  const search = (req.query.q as string || "").toLowerCase();

  let filtered = MOCK_PRODUCTS.filter((p) => p.isActive);

  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  res.json({
    success: true,
    data: {
      products: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

apiRouter.get("/v1/products/:slug", (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    return next(new AppError(`Product with slug '${slug}' not found`, 404, "PRODUCT_NOT_FOUND"));
  }

  // Enrich with real-time stock availability
  const enrichedVariants = product.variants.map((v: any) => ({
    ...v,
    realTimeStock: {
      availableStock: Math.max(0, v.inventory.quantityOnHand - v.inventory.quantityReserved),
      inStock: v.inventory.quantityOnHand - v.inventory.quantityReserved > 0,
    },
  }));

  res.json({
    success: true,
    data: {
      product: {
        ...product,
        variants: enrichedVariants,
      },
    },
  });
});

// --- CART & CHECKOUT ---
apiRouter.post("/v1/cart/validate", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = CartValidateSchema.parse(req.body);
    const validatedItems: any[] = [];
    let cartTotalCents = 0;

    for (const item of items) {
      let matchedVariant: any = null;
      for (const prod of MOCK_PRODUCTS) {
        const found = prod.variants.find((v: any) => v.id === item.variantId);
        if (found) {
          matchedVariant = found;
          break;
        }
      }

      if (!matchedVariant) {
        throw new AppError(`Variant ID ${item.variantId} not found`, 404, "VARIANT_NOT_FOUND");
      }

      const availableStock = matchedVariant.inventory.quantityOnHand - matchedVariant.inventory.quantityReserved;
      const isAvailable = availableStock >= item.quantity;
      const totalCents = matchedVariant.priceCents * item.quantity;
      cartTotalCents += totalCents;

      validatedItems.push({
        variantId: matchedVariant.id,
        sku: matchedVariant.sku,
        name: matchedVariant.name,
        priceCents: matchedVariant.priceCents,
        requestedQuantity: item.quantity,
        availableStock,
        isAvailable,
        itemTotalCents: totalCents,
      });
    }

    res.json({
      success: true,
      data: {
        isValid: validatedItems.every((i) => i.isAvailable),
        items: validatedItems,
        summary: {
          subtotalCents: cartTotalCents,
          formattedSubtotal: `$${(cartTotalCents / 100).toFixed(2)}`,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/v1/orders/checkout-session", authenticateJWT, async (req: any, res: Response, next: NextFunction) => {
  try {
    const body = CheckoutSessionSchema.parse(req.body);

    // Mock DB client interface to simulate ACID row lock checkout
    const mockTxClient = {
      $transaction: async (fn: any) => fn(mockTxClient),
      productVariant: {
        findUnique: async ({ where }: any) => {
          for (const prod of MOCK_PRODUCTS) {
            const v = prod.variants.find((varItem: any) => varItem.id === where.id);
            if (v) return { ...v, product: prod };
          }
          return null;
        },
      },
      inventory: {
        update: async ({ where, data }: any) => {
          for (const prod of MOCK_PRODUCTS) {
            const v = prod.variants.find((varItem: any) => varItem.inventory.id === where.id);
            if (v) {
              if (data.quantityReserved?.increment) {
                v.inventory.quantityReserved += data.quantityReserved.increment;
              }
            }
          }
        },
      },
      order: {
        create: async ({ data }: any) => {
          const newOrder = { id: `ord-${Date.now()}`, ...data };
          MOCK_ORDERS.push(newOrder);
          return newOrder;
        },
        update: async ({ where, data }: any) => {
          const ord = MOCK_ORDERS.find((o) => o.id === where.id);
          if (ord) Object.assign(ord, data);
          return ord;
        },
      },
    };

    const session = await CheckoutService.createCheckoutSession(
      {
        userId: req.user.id,
        items: body.items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      },
      mockTxClient
    );

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

// --- WEBHOOKS ---
apiRouter.post("/v1/webhooks/payment", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers["stripe-signature"] || req.headers["x-razorpay-signature"] || "mock_sig") as string;
    const event = req.body;

    const mockDb = {
      processedWebhookEvent: {
        findUnique: async () => null,
      },
      $transaction: async (fn: any) => fn(mockDb),
      order: {
        findUnique: async () => MOCK_ORDERS[0] || null,
        update: async () => {},
      },
      inventory: {
        findUnique: async () => ({ id: "inv-1", quantityOnHand: 20, quantityReserved: 2 }),
        update: async () => {},
      },
      payment: {
        update: async () => {},
      },
    };

    const result = await WebhookService.processPaymentWebhook(event, signature, mockDb);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- ORDERS ---
apiRouter.get("/v1/orders/my-orders", authenticateJWT, (req: any, res: Response) => {
  const userOrders = MOCK_ORDERS.filter((o) => o.userId === req.user.id);
  res.json({ success: true, data: { orders: userOrders } });
});

apiRouter.get("/v1/orders/:id", authenticateJWT, (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const order = MOCK_ORDERS.find((o) => o.id === id);

  if (!order) {
    return next(new AppError(`Order ${id} not found`, 404, "ORDER_NOT_FOUND"));
  }

  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    return next(new AppError("Unauthorized access to order details", 403, "FORBIDDEN"));
  }

  res.json({ success: true, data: { order } });
});
