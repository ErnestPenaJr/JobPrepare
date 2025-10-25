"use client";
import Link from "next/link";
import { PRICING, effectiveTrialDays } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PricingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PRICING.tiers.map((t) => {
        const trial = effectiveTrialDays(t.trialDays);
        const trialNote = trial ? `${trial}-day trial` : undefined;
        return (
          <Card key={t.id} className={t.highlight ? "border-primary" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.name}</CardTitle>
                {t.highlight && <Badge>Most Popular</Badge>}
              </div>
              <div className="text-2xl font-semibold">
                {t.monthlyPrice === 0 ? "$0" : `$${t.monthlyPrice}/mo`}
              </div>
              <div className="text-xs text-muted-foreground">{t.tagline}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm list-disc ml-5 space-y-1">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {t.id === "free" ? (
                <Button asChild className="w-full border border-[color:var(--ring)]" variant="secondary">
                  <Link href="/">Try Free</Link>
                </Button>
              ) : (
                <Button className="w-full border border-[color:var(--ring)]" onClick={() => startCheckout(t.id)}>
                  {trialNote ? `Start ${trialNote}` : "Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function startCheckout(plan: string) {
  try {
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await r.json();
    if (data?.url) window.location.href = data.url;
    else throw new Error(data?.error || "Checkout unavailable");
  } catch (e) {
    console.error(e);
    alert((e as Error).message || "Checkout failed");
  }
}
