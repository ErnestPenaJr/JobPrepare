import { NextResponse } from "next/server";
import { PRICING, effectiveTrialDays } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || "");
    const tier = PRICING.tiers.find((t) => t.id === plan);
    if (!tier || tier.id === "free") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    // Decide provider: mock if no Stripe price IDs configured
    const monthlyId = tier.stripe?.monthlyPriceId;
    const yearlyId = tier.stripe?.yearlyPriceId;
    const hasStripe = Boolean(monthlyId || yearlyId);

    // Trial details (promotions can extend)
    const trialDays = effectiveTrialDays(tier.trialDays);
    const cardRequired = Boolean(tier.cardRequired);

    if (!hasStripe) {
      // Mock provider: redirect to a fake URL so the flow can be tested
      const mockUrl = `/landing?mockCheckout=1&plan=${encodeURIComponent(plan)}&trial=${trialDays || 0}&card=${cardRequired ? 1 : 0}`;
      return NextResponse.json({ url: mockUrl });
    }

    // If Stripe were configured, here we would create a Checkout Session or Billing Portal link.
    // Intentionally omitted to keep the project dependency-free in this prototype.
    // Return a not-implemented message with guidance.
    return NextResponse.json({
      error: "Stripe configured but server integration not implemented. Create a Checkout Session on the server and return its URL.",
    }, { status: 501 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Checkout failed" }, { status: 500 });
  }
}

