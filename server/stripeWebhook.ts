import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { logSecurityAudit } from './audit';
import { processBillingWebhookEvent } from '../src/lib/billing';

const router = express.Router();

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'FATAL: STRIPE_SECRET_KEY is required but not set. ' +
      'Obtain your key from https://dashboard.stripe.com/apikeys'
    );
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

/**
 * Returns a Stripe client suitable for webhook signature verification ONLY.
 * Signature verification is a local HMAC operation — it does not call the
 * Stripe API — so an absent or placeholder secret key is acceptable here.
 */
function getStripeForWebhookVerification(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_placeholder_webhook_verification_only';
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

    let event: Stripe.Event;
    try {
      // Use webhook-only client — signature verification is a local HMAC operation
      // and does not require a valid Stripe API key.
      const stripe = getStripeForWebhookVerification();
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err: any) {
      logSecurityAudit('INVALID_STRIPE_WEBHOOK', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Signature verification failed', error: err.message });
      return res.status(400).json({ error: `Signature Verification Failed: ${err.message}` });
    }

    try {
      await processBillingWebhookEvent(event);
      return res.status(200).json({ received: true });
    } catch (err: any) {
      logSecurityAudit('STRIPE_WEBHOOK_PROCESSING_ERROR', { ip: req.ip, path: req.path, method: req.method }, { eventType: event.type, error: err.message });
      return res.status(500).json({ error: 'Webhook processing failed.' });
    }
  }
);

export default router;
