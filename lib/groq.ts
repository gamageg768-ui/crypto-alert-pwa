// lib/groq.ts — Groq AI for real-time market analysis
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

export interface PriceContext {
  symbol: string;
  assetType: 'CRYPTO' | 'STOCK';
  currentPrice: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
  alertThreshold: number;
  alertType: string;
}

/**
 * Generate a concise AI market analysis when an alert triggers.
 */
export async function analyzeAlertTrigger(ctx: PriceContext): Promise<string> {
  const prompt = `
You are a professional financial analyst. Provide a brief, actionable market analysis (2-3 sentences) for the following alert trigger:

Asset: ${ctx.symbol} (${ctx.assetType})
Current Price: $${ctx.currentPrice.toLocaleString()}
24h Change: ${ctx.change24h !== undefined ? `${ctx.change24h.toFixed(2)}%` : 'N/A'}
24h High/Low: $${ctx.high24h?.toLocaleString() ?? 'N/A'} / $${ctx.low24h?.toLocaleString() ?? 'N/A'}
Volume (24h): $${ctx.volume24h?.toLocaleString() ?? 'N/A'}
Alert Type: ${ctx.alertType}
Alert Threshold: $${ctx.alertThreshold.toLocaleString()}

Provide: 1) Why this price level matters, 2) Key risk/opportunity, 3) Short-term outlook.
Keep it under 60 words. Be direct and factual. No disclaimers.
`.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content?.trim() ?? 'Analysis unavailable.';
}

/**
 * Generate portfolio summary using Groq.
 */
export async function generatePortfolioInsight(assets: {
  symbol: string;
  type: string;
  price: number;
  change24h: number;
}[]): Promise<string> {
  const assetList = assets
    .map(a => `${a.symbol} (${a.type}): $${a.price.toLocaleString()} | ${a.change24h > 0 ? '+' : ''}${a.change24h.toFixed(2)}%`)
    .join('\n');

  const prompt = `
You are a senior portfolio analyst. Given these tracked assets, provide a 3-sentence market outlook:

${assetList}

Focus on: overall market sentiment, standout movers, and one actionable insight.
Keep it under 80 words. Be precise and professional.
`.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content?.trim() ?? 'Insight unavailable.';
}

/**
 * AI-powered alert recommendation
 */
export async function suggestAlertThreshold(ctx: {
  symbol: string;
  currentPrice: number;
  assetType: string;
  change24h?: number;
}): Promise<{ above: number; below: number; reasoning: string }> {
  const prompt = `
For ${ctx.symbol} (${ctx.assetType}) currently at $${ctx.currentPrice} with ${ctx.change24h?.toFixed(2) ?? 0}% 24h change:

Suggest meaningful price alert thresholds. Reply ONLY in this JSON format:
{"above": <number>, "below": <number>, "reasoning": "<one sentence>"}

Base on typical support/resistance levels and recent volatility. No extra text.
`.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.3,
  });

  try {
    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    const above = +(ctx.currentPrice * 1.05).toFixed(2);
    const below = +(ctx.currentPrice * 0.95).toFixed(2);
    return { above, below, reasoning: 'Based on standard 5% deviation.' };
  }
}

export { groq };
