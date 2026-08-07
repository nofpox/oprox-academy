import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { logSecurityAudit } from './audit';
import { processBillingWebhookEvent } from '../src/lib/billing';

const router = express.Router();

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_key';
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

// Stripe Webhook Endpoint requiring raw body & signature verification
router.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logSecurityAudit('INVALID_STRIPE_WEBHOOK', { ip: req.ip, path: req.path, method: req.method }, { reason: 'STRIPE_WEBHOOK_SECRET is not configured' });
      return res.status(500).json({ error: 'Webhook handler misconfigured: Missing secret configuration.' });
    }

    if (!signature || typeof signature !== 'string') {
      logSecurityAudit('INVALID_STRIPE_WEBHOOK', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Missing stripe-signature header' });
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    const stripe = getStripeClient();
    let event: Stripe.Event;

    try {
      const payload = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      logSecurityAudit('INVALID_STRIPE_WEBHOOK', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Signature Verification Failed', error: err.message });
      return res.status(400).json({ error: `Signature Verification Failed: ${err.message}` });
    }

    // Process valid constructed event idempotently
    const idempotency = await processBillingWebhookEvent({ id: event.id, type: event.type, data: event.data });
    if (idempotency.duplicate) {
      console.log(`[STRIPE WEBHOOK IDEMPOTENT SKIP] Event ID: ${event.id}`);
      return res.json({ received: true, id: event.id, type: event.type, idempotent: true });
    }

    console.log(`[STRIPE WEBHOOK VERIFIED] Event ID: ${event.id} | Type: ${event.type}`);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', { ip: req.ip, path: req.path, method: req.method }, {
      action: 'STRIPE_WEBHOOK_PROCESSED',
      eventId: event.id,
      eventType: event.type,
    });

    res.json({ received: true, id: event.id, type: event.type, idempotent: false });
  }
);

export default router;
