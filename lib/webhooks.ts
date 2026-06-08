// lib/webhooks.ts — Webhook delivery system with HMAC signing
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Sign a webhook payload with HMAC-SHA256
 */
export function signWebhook(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify an incoming webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhook(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

/**
 * Deliver a webhook to a registered endpoint
 */
export async function deliverWebhook(
  webhookId: string,
  event: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || !webhook.isActive) return false;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
  const payloadStr = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Alert-Event': event,
    'X-Alert-Timestamp': payload.timestamp,
    'X-Alert-Signature': signWebhook(
      payloadStr,
      webhook.secret ?? process.env.WEBHOOK_SECRET ?? 'default'
    ),
    'User-Agent': 'CryptoAlertPWA/1.0',
  };

  let success = false;
  let statusCode: number | null = null;
  let responseBody: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = res.status;
    responseBody = await res.text();
    success = res.ok;
  } catch (err) {
    responseBody = err instanceof Error ? err.message : 'Unknown error';
  }

  // Log delivery
  await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: payloadStr,
      statusCode,
      success,
      responseBody: responseBody?.slice(0, 2000),
    },
  });

  // Update fail count
  if (!success) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        failCount: { increment: 1 },
        // Disable after 10 consecutive failures
        isActive: webhook.failCount < 9,
      },
    });
  } else {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { lastFired: new Date(), failCount: 0 },
    });
  }

  return success;
}

/**
 * Fire webhook to all active webhooks of a user for an event
 */
export async function fireUserWebhooks(
  userId: string,
  event: 'ALERT_TRIGGERED' | 'PRICE_UPDATE',
  data: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      isActive: true,
      events: { hasSome: [event, 'ALL'] },
    },
  });

  await Promise.allSettled(
    webhooks.map(wh => deliverWebhook(wh.id, event, data))
  );
}
