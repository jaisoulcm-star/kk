var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv2 = __toESM(require("dotenv"), 1);

// server/routes.ts
var import_express = require("express");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);

// server/schemas/auth.schema.ts
var import_zod = require("zod");
var RegisterSchema = import_zod.z.object({
  email: import_zod.z.string().email("Invalid email address"),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters long"),
  firstName: import_zod.z.string().min(1, "First name is required"),
  lastName: import_zod.z.string().min(1, "Last name is required")
});
var LoginSchema = import_zod.z.object({
  email: import_zod.z.string().email("Invalid email address"),
  password: import_zod.z.string().min(1, "Password is required")
});
var AddressSchema = import_zod.z.object({
  street: import_zod.z.string().min(1, "Street address is required"),
  city: import_zod.z.string().min(1, "City is required"),
  state: import_zod.z.string().min(1, "State is required"),
  postalCode: import_zod.z.string().min(1, "Postal code is required"),
  country: import_zod.z.string().default("IN"),
  isDefault: import_zod.z.boolean().default(false)
});
var CartValidateSchema = import_zod.z.object({
  items: import_zod.z.array(
    import_zod.z.object({
      variantId: import_zod.z.string().min(1),
      quantity: import_zod.z.number().int().positive()
    })
  ).min(1, "Cart cannot be empty")
});
var CheckoutSessionSchema = import_zod.z.object({
  items: import_zod.z.array(
    import_zod.z.object({
      variantId: import_zod.z.string().min(1),
      quantity: import_zod.z.number().int().positive()
    })
  ).min(1, "Cart cannot be empty"),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema
});

// server/middleware/errorHandler.ts
var import_zod2 = require("zod");
var AppError = class extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST", details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      type: `https://api.ecommerce.com/errors/${err.code.toLowerCase()}`,
      title: err.message,
      status: err.statusCode,
      code: err.code,
      details: err.details || null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (err instanceof import_zod2.ZodError) {
    return res.status(422).json({
      type: "https://api.ecommerce.com/errors/validation-failed",
      title: "Input validation failed",
      status: 422,
      code: "VALIDATION_ERROR",
      details: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message
      })),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  console.error("Unhandled Internal Error:", err);
  return res.status(500).json({
    type: "https://api.ecommerce.com/errors/internal-server-error",
    title: "An unexpected internal error occurred",
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};

// server/services/checkout.service.ts
var CheckoutService = class {
  /**
   * Executes atomic checkout stock reservation and session generation.
   */
  static async createCheckoutSession(params, dbClient) {
    const { userId, items, shippingAddress, billingAddress } = params;
    if (!items || items.length === 0) {
      throw new AppError("Cart is empty", 400, "EMPTY_CART");
    }
    return await dbClient.$transaction(async (tx) => {
      let subtotalCents = 0;
      const orderItemsToCreate = [];
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new AppError("Item quantity must be greater than zero", 400, "INVALID_QUANTITY");
        }
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            inventory: true,
            product: true
          }
        });
        if (!variant || !variant.product.isActive) {
          throw new AppError(`Product variant ${item.variantId} is not available`, 404, "VARIANT_NOT_FOUND");
        }
        const inventory = variant.inventory;
        if (!inventory) {
          throw new AppError(`Inventory record missing for SKU ${variant.sku}`, 500, "INVENTORY_MISSING");
        }
        const availableStock = inventory.quantityOnHand - inventory.quantityReserved;
        if (availableStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for ${variant.name} (SKU: ${variant.sku}). Available: ${availableStock}, Requested: ${item.quantity}`,
            409,
            "INSUFFICIENT_STOCK",
            {
              sku: variant.sku,
              availableStock,
              requestedQuantity: item.quantity
            }
          );
        }
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantityReserved: {
              increment: item.quantity
            }
          }
        });
        const lineItemTotalCents = variant.priceCents * item.quantity;
        subtotalCents += lineItemTotalCents;
        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: item.quantity,
          priceCents: variant.priceCents,
          // Snapshot historical unit price
          totalCents: lineItemTotalCents,
          variantSnapshot: {
            sku: variant.sku,
            name: variant.name,
            productName: variant.product.name,
            attributes: variant.attributes
          }
        });
      }
      const taxCents = Math.round(subtotalCents * 0.05);
      const shippingFeeCents = subtotalCents > 1e4 ? 0 : 500;
      const totalCents = subtotalCents + taxCents + shippingFeeCents;
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING_PAYMENT",
          shippingAddress,
          billingAddress,
          subtotalCents,
          taxCents,
          shippingFeeCents,
          totalCents,
          items: {
            create: orderItemsToCreate
          },
          payments: {
            create: {
              provider: "STRIPE",
              status: "INITIATED",
              amountCents: totalCents
            }
          }
        },
        include: {
          items: true,
          payments: true
        }
      });
      const paymentSessionId = `cs_test_${order.id}_${Date.now()}`;
      await tx.order.update({
        where: { id: order.id },
        data: { paymentSessionId }
      });
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentSessionId,
        checkoutUrl: `https://checkout.stripe.com/pay/${paymentSessionId}`,
        amounts: {
          subtotalCents,
          taxCents,
          shippingFeeCents,
          totalCents,
          formattedTotal: `$${(totalCents / 100).toFixed(2)}`
        }
      };
    });
  }
};

// server/services/webhook.service.ts
var WebhookService = class {
  /**
   * Processes inbound Stripe or Razorpay webhook event idempotently.
   */
  static async processPaymentWebhook(event, rawSignature, dbClient) {
    if (!rawSignature) {
      throw new AppError("Missing webhook signature header", 400, "MISSING_SIGNATURE");
    }
    const eventId = event.id;
    const eventType = event.type;
    const sessionObj = event.data.object;
    const orderId = sessionObj.metadata?.orderId;
    const existingEvent = await dbClient.processedWebhookEvent.findUnique({
      where: { eventId }
    });
    if (existingEvent) {
      console.log(`[Webhook] Event ${eventId} already processed. Skipping idempotently.`);
      return { processed: true, duplicate: true };
    }
    await dbClient.$transaction(async (tx) => {
      await tx.processedWebhookEvent.create({
        data: {
          eventId,
          provider: "STRIPE"
        }
      });
      if (!orderId) {
        console.warn(`[Webhook] Event ${eventId} does not contain an orderId metadata.`);
        return;
      }
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true
        }
      });
      if (!order) {
        throw new AppError(`Order ${orderId} not found`, 404, "ORDER_NOT_FOUND");
      }
      if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
        if (order.status === "PAID") {
          console.log(`[Webhook] Order ${orderId} is already PAID.`);
          return;
        }
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId }
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantityOnHand: {
                  decrement: item.quantity
                },
                quantityReserved: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" }
        });
        if (order.payments.length > 0) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: "SUCCESS",
              transactionId: sessionObj.id,
              rawWebhookPayload: event
            }
          });
        }
      } else if (eventType === "payment_intent.payment_failed" || eventType === "checkout.session.expired" || eventType === "charge.failed") {
        if (order.status === "CANCELLED") {
          return;
        }
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId }
          });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantityReserved: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" }
        });
        if (order.payments.length > 0) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: "FAILED",
              rawWebhookPayload: event
            }
          });
        }
      }
    });
    return { processed: true, duplicate: false, eventType };
  }
};

// server/config/env.ts
var import_zod3 = require("zod");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var envSchema = import_zod3.z.object({
  NODE_ENV: import_zod3.z.enum(["development", "test", "production"]).default("development"),
  PORT: import_zod3.z.string().default("3000").transform((val) => parseInt(val, 10)),
  DATABASE_URL: import_zod3.z.string().url().default("postgresql://postgres:postgres@localhost:5432/ecommerce_db"),
  JWT_SECRET: import_zod3.z.string().min(32, "JWT secret must be at least 32 characters long").default("super-secret-production-jwt-key-minimum-32-chars!"),
  JWT_EXPIRES_IN: import_zod3.z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: import_zod3.z.string().default("7d"),
  STRIPE_SECRET_KEY: import_zod3.z.string().optional().default("sk_test_mock_stripe_key_123"),
  STRIPE_WEBHOOK_SECRET: import_zod3.z.string().optional().default("whsec_mock_stripe_webhook_secret_123"),
  CORS_ORIGIN: import_zod3.z.string().default("http://localhost:3000")
});
var env = envSchema.parse(process.env);

// server/routes.ts
var apiRouter = (0, import_express.Router)();
var MOCK_USERS = [];
var MOCK_PRODUCTS = [
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
        priceCents: 125e3,
        // ₹1,250.00
        compareAtCents: 15e4,
        attributes: { size: "5 Litre", formulation: "Liquid Concentrate" },
        inventory: {
          id: "inv-1",
          quantityOnHand: 45,
          quantityReserved: 2
        }
      }
    ]
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
        priceCents: 18e4,
        // ₹1,800.00
        compareAtCents: 21e4,
        attributes: { weight: "10 Kg", crop: "Paddy" },
        inventory: {
          id: "inv-2",
          quantityOnHand: 25,
          quantityReserved: 1
        }
      }
    ]
  }
];
var MOCK_ORDERS = [];
var authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Authentication token required", 401, "UNAUTHORIZED"));
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired authentication token", 401, "INVALID_TOKEN"));
  }
};
apiRouter.post("/v1/auth/register", async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = MOCK_USERS.find((u) => u.email === body.email);
    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }
    const passwordHash = await import_bcryptjs.default.hash(body.password, 10);
    const user = {
      id: `user-${Date.now()}`,
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: "CUSTOMER",
      addresses: [],
      createdAt: /* @__PURE__ */ new Date()
    };
    MOCK_USERS.push(user);
    const token = import_jsonwebtoken.default.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "1d"
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
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
});
apiRouter.post("/v1/auth/login", async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    let user = MOCK_USERS.find((u) => u.email === body.email);
    if (!user) {
      const passwordHash = await import_bcryptjs.default.hash(body.password, 10);
      user = {
        id: "demo-user-123",
        email: body.email,
        passwordHash,
        firstName: "Heritage",
        lastName: "Patron",
        role: "CUSTOMER",
        addresses: [],
        createdAt: /* @__PURE__ */ new Date()
      };
      MOCK_USERS.push(user);
    }
    const token = import_jsonwebtoken.default.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "1d"
    });
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
});
apiRouter.post("/v1/auth/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401, "REFRESH_TOKEN_REQUIRED");
    }
    const decoded = import_jsonwebtoken.default.verify(refreshToken, env.JWT_SECRET);
    const newToken = import_jsonwebtoken.default.sign({ id: decoded.id, email: decoded.email, role: decoded.role }, env.JWT_SECRET, {
      expiresIn: "1d"
    });
    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    next(new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN"));
  }
});
apiRouter.get("/v1/users/me", authenticateJWT, (req, res) => {
  const user = MOCK_USERS.find((u) => u.id === req.user.id) || {
    id: req.user.id,
    email: req.user.email,
    firstName: "Organic",
    lastName: "Grower",
    role: req.user.role,
    addresses: []
  };
  res.json({ success: true, data: { user } });
});
apiRouter.post("/v1/users/addresses", authenticateJWT, (req, res, next) => {
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
apiRouter.get("/v1/products", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const category = req.query.category;
  const search = (req.query.q || "").toLowerCase();
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
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});
apiRouter.get("/v1/products/:slug", (req, res, next) => {
  const { slug } = req.params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  if (!product) {
    return next(new AppError(`Product with slug '${slug}' not found`, 404, "PRODUCT_NOT_FOUND"));
  }
  const enrichedVariants = product.variants.map((v) => ({
    ...v,
    realTimeStock: {
      availableStock: Math.max(0, v.inventory.quantityOnHand - v.inventory.quantityReserved),
      inStock: v.inventory.quantityOnHand - v.inventory.quantityReserved > 0
    }
  }));
  res.json({
    success: true,
    data: {
      product: {
        ...product,
        variants: enrichedVariants
      }
    }
  });
});
apiRouter.post("/v1/cart/validate", (req, res, next) => {
  try {
    const { items } = CartValidateSchema.parse(req.body);
    const validatedItems = [];
    let cartTotalCents = 0;
    for (const item of items) {
      let matchedVariant = null;
      for (const prod of MOCK_PRODUCTS) {
        const found = prod.variants.find((v) => v.id === item.variantId);
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
        itemTotalCents: totalCents
      });
    }
    res.json({
      success: true,
      data: {
        isValid: validatedItems.every((i) => i.isAvailable),
        items: validatedItems,
        summary: {
          subtotalCents: cartTotalCents,
          formattedSubtotal: `$${(cartTotalCents / 100).toFixed(2)}`
        }
      }
    });
  } catch (err) {
    next(err);
  }
});
apiRouter.post("/v1/orders/checkout-session", authenticateJWT, async (req, res, next) => {
  try {
    const body = CheckoutSessionSchema.parse(req.body);
    const mockTxClient = {
      $transaction: async (fn) => fn(mockTxClient),
      productVariant: {
        findUnique: async ({ where }) => {
          for (const prod of MOCK_PRODUCTS) {
            const v = prod.variants.find((varItem) => varItem.id === where.id);
            if (v) return { ...v, product: prod };
          }
          return null;
        }
      },
      inventory: {
        update: async ({ where, data }) => {
          for (const prod of MOCK_PRODUCTS) {
            const v = prod.variants.find((varItem) => varItem.inventory.id === where.id);
            if (v) {
              if (data.quantityReserved?.increment) {
                v.inventory.quantityReserved += data.quantityReserved.increment;
              }
            }
          }
        }
      },
      order: {
        create: async ({ data }) => {
          const newOrder = { id: `ord-${Date.now()}`, ...data };
          MOCK_ORDERS.push(newOrder);
          return newOrder;
        },
        update: async ({ where, data }) => {
          const ord = MOCK_ORDERS.find((o) => o.id === where.id);
          if (ord) Object.assign(ord, data);
          return ord;
        }
      }
    };
    const session = await CheckoutService.createCheckoutSession(
      {
        userId: req.user.id,
        items: body.items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress
      },
      mockTxClient
    );
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});
apiRouter.post("/v1/webhooks/payment", async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"] || req.headers["x-razorpay-signature"] || "mock_sig";
    const event = req.body;
    const mockDb = {
      processedWebhookEvent: {
        findUnique: async () => null
      },
      $transaction: async (fn) => fn(mockDb),
      order: {
        findUnique: async () => MOCK_ORDERS[0] || null,
        update: async () => {
        }
      },
      inventory: {
        findUnique: async () => ({ id: "inv-1", quantityOnHand: 20, quantityReserved: 2 }),
        update: async () => {
        }
      },
      payment: {
        update: async () => {
        }
      }
    };
    const result = await WebhookService.processPaymentWebhook(event, signature, mockDb);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
apiRouter.get("/v1/orders/my-orders", authenticateJWT, (req, res) => {
  const userOrders = MOCK_ORDERS.filter((o) => o.userId === req.user.id);
  res.json({ success: true, data: { orders: userOrders } });
});
apiRouter.get("/v1/orders/:id", authenticateJWT, (req, res, next) => {
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

// server.ts
import_dotenv2.default.config();
var app = (0, import_express2.default)();
var PORT = 3e3;
app.use(import_express2.default.json());
app.use("/api", apiRouter);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new import_genai.GoogleGenAI({ apiKey });
}
var SYSTEM_INSTRUCTION = `You are the "KrishiMart Agronomy & Farming Assistant" for an organic farm inputs, heirloom seeds, and bio-nutrients e-commerce platform.
Your goal is to provide exceptional, polite, and knowledgeable customer support for farmers, agriculturalists, and organic gardeners.

Tone: Knowledgeable, practical, supportive, eco-friendly, and polite.
Context:
- We specialize in organic bio-nutrients, botanical fungicides, native heirloom seeds, tissue culture plantlets, foliar seaweed fertilizers, and drip irrigation kits.
- We emphasize sustainable agriculture, Cauvery Delta soil enrichment, chemical-free pest control, and native high-yield crops.

Available Inventory Summary:
- Cauvery Bio-Gold Organic NPK Concentrate: Enriched microbial soil revitalizer packed with nitrogen fixers and humic extracts from Cauvery Delta. Price: \u20B91,250
- NeemShield Botanical Bio-Fungicide: 100% cold-pressed neem oil & Trichoderma bio-fungicide protecting against leaf rust and soil pathogens. Price: \u20B9850
- Native Heirloom Paddy Seeds (Mapillai Samba): Drought-resistant, high-nutrition heirloom rice seeds certified organic. Price: \u20B91,800
- Banana Tissue Culture Plantlets (Grand Naine): High-yield disease-free laboratory plantlets for accelerated growth and maximum yield. Price: \u20B93,200
- Bio-Power Natural Seaweed Liquid Fertilizer: Cold-extracted Ascophyllum Nodosum foliar spray rich in cytokinins and micro-nutrients. Price: \u20B9950
- Drip Irrigation Micro-Sprinkler Hardware Kit: UV-stabilized precision agricultural water-saving irrigation set with emitters and tubing. Price: \u20B92,400
- Organic Neem Seed Cake Bio-Insecticide: Cold-pressed neem cake pellets eradicating root pests and nematodes with slow-release nitrogen. Price: \u20B91,100

Guidelines:
1. Recommend specific products based on the farmer's crop, acreage, pest problem, or nutrient deficiencies.
2. Provide organic farming tips (e.g. bio-fertilizer application timings, seed treatment, drip hydration).
3. If asked about shipping, we deliver directly to farm gate across India within 3-5 business days.
4. Keep answers concise, clear, and easy to read.`;
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    let sanitizedHistory = [];
    if (Array.isArray(history)) {
      const firstUserIndex = history.findIndex((h) => h.role === "user");
      if (firstUserIndex !== -1) {
        sanitizedHistory = history.slice(firstUserIndex).map((h) => ({
          role: h.role,
          parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts || "") }]
        }));
      }
    }
    const ai = getGeminiClient();
    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let replyText = "";
    let lastError = null;
    for (const model of candidateModels) {
      try {
        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION
          },
          history: sanitizedHistory
        });
        const result = await chat.sendMessage({ message });
        replyText = result.text || "";
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err.message || err);
      }
    }
    if (lastError && !replyText) {
      throw lastError;
    }
    res.json({ text: replyText });
  } catch (error) {
    console.error("Server-side Gemini Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while communicating with the KrishiMart Assistant."
    });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use(errorHandler);
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
