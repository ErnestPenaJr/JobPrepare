# Pricing & Subscription Config

Single source of truth is defined at `web/src/lib/pricing.ts`.

## Tiers

- `free`: 5 analyses/day, view-only, no storage
- `starter`: 50 analyses/month, 10 cover letters/month, 100 MB storage, save up to 20
- `pro`: Unlimited analyses/cover letters, 1 GB storage
- `career`: Unlimited, 10 GB storage, 5 resume profiles

Update feature lists and limits only in `pricing.ts`; UI components and entitlement helpers derive from it.

## Trials & Promotions

- Default trials: 7 days for Starter/Pro/Career, no card by default.
- Toggle promotions in `PRICING.promotions`:
  - `springExtendedTrial: true` extends trial to 14 days.
  - Other promotions (e.g., Black Friday) should be applied via Stripe coupons.

## Stripe Integration

Environment variables (optional; mock checkout is used if absent):

- `NEXT_PUBLIC_PRICE_STARTER_MONTHLY`
- `NEXT_PUBLIC_PRICE_STARTER_YEARLY`
- `NEXT_PUBLIC_PRICE_PRO_MONTHLY`
- `NEXT_PUBLIC_PRICE_PRO_YEARLY`
- `NEXT_PUBLIC_PRICE_CAREER_MONTHLY`
- `NEXT_PUBLIC_PRICE_CAREER_YEARLY`

With IDs set, implement server-side Checkout in `web/src/app/api/checkout/route.ts` by creating a Stripe Checkout Session and returning its `url`.

## Entitlements

Helpers at `web/src/lib/entitlements.ts`:

- `canAnalyze(tier, usage)`
- `canGenerateCoverLetter(tier, usage)`

Use these in the backend before processing requests that consume quota.
