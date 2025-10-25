import { PricingGrid } from "@/components/pricing-cards";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-sm text-muted-foreground">Start free. Upgrade when your search gets serious.</p>
      </div>
      <PricingGrid />
      <p className="text-xs text-muted-foreground text-center">Trials and promotions configurable via environment. Taxes calculated at checkout.</p>
    </div>
  );
}

