// app/api/ai/route.ts — Groq AI endpoints
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePortfolioInsight, suggestAlertThreshold } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'portfolio_insight') {
      const { assets } = body;
      if (!Array.isArray(assets) || assets.length === 0) {
        return NextResponse.json({ error: 'assets array required' }, { status: 400 });
      }
      const insight = await generatePortfolioInsight(assets);
      return NextResponse.json({ insight });
    }

    if (action === 'suggest_threshold') {
      const { symbol, currentPrice, assetType, change24h } = body;
      if (!symbol || !currentPrice || !assetType) {
        return NextResponse.json({ error: 'symbol, currentPrice, assetType required' }, { status: 400 });
      }
      const suggestion = await suggestAlertThreshold({ symbol, currentPrice, assetType, change24h });
      return NextResponse.json({ suggestion });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('AI endpoint error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
