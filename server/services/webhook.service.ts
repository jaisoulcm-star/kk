import { AppError } from "../middleware/errorHandler";

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      metadata?: {
        orderId?: string;
      };
      payment_status?: string;
      amount_total?: number;
    };
  };
}

/**
 * Production Webhook & Fulfillment Handler.
 * Enforces strict Idempotency and State Machine transitions.
 */
export class WebhookService {
  /**
   * Processes inbound Stripe or Razorpay webhook event idempotently.
   */
  public static async processPaymentWebhook(
    event: StripeWebhookEvent,
    rawSignature: string,
    dbClient: any
  ) {
    // 1. In production, verify rawSignature against STRIPE_WEBHOOK_SECRET
    if (!rawSignature) {
      throw new AppError("Missing webhook signature header", 400, "MISSING_SIGNATURE");
    }

    const eventId = event.id;
    const eventType = event.type;
    const sessionObj = event.data.object;
    const orderId = sessionObj.metadata?.orderId;

    // 2. Check for duplicate processing (Idempotency Check)
    const existingEvent = await dbClient.processedWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`[Webhook] Event ${eventId} already processed. Skipping idempotently.`);
      return { processed: true, duplicate: true };
    }

    // 3. Execute State Machine Transition within DB Transaction
    await dbClient.$transaction(async (tx: any) => {
      // Record event as processed immediately inside transaction
      await tx.processedWebhookEvent.create({
        data: {
          eventId,
          provider: "STRIPE",
        },
      });

      if (!orderId) {
        console.warn(`[Webhook] Event ${eventId} does not contain an orderId metadata.`);
        return;
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!order) {
        throw new AppError(`Order ${orderId} not found`, 404, "ORDER_NOT_FOUND");
      }

      // Handle SUCCESS events
      if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
        if (order.status === "PAID") {
          console.log(`[Webhook] Order ${orderId} is already PAID.`);
          return;
        }

        // Fulfill Order: Decrement Both Reserved and On-Hand Stock
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantityOnHand: {
                  decrement: item.quantity,
                },
                quantityReserved: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Transition Order State to PAID
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

        // Update Payment Record
        if (order.payments.length > 0) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: "SUCCESS",
              transactionId: sessionObj.id,
              rawWebhookPayload: event as any,
            },
          });
        }
      }

      // Handle FAILURE / CANCELLATION / EXPIRATION events
      else if (
        eventType === "payment_intent.payment_failed" ||
        eventType === "checkout.session.expired" ||
        eventType === "charge.failed"
      ) {
        if (order.status === "CANCELLED") {
          return;
        }

        // Release Reserved Inventory (subtract from quantity_reserved)
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantityReserved: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Transition Order State to CANCELLED
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });

        // Update Payment Record to FAILED
        if (order.payments.length > 0) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: "FAILED",
              rawWebhookPayload: event as any,
            },
          });
        }
      }
    });

    return { processed: true, duplicate: false, eventType };
  }
}
