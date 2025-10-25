export type TierID = "free" | "starter" | "pro" | "career";

export type Limits = {
  analysesPerDay?: number | "unlimited";
  analysesPerMonth?: number | "unlimited";
  coverLettersPerMonth?: number | "unlimited";
  storageMB?: number; // use GB by multiplying
  resumeProfiles?: number;
  saveLimit?: number | "unlimited";
};

export type Tier = {
  id: TierID;
  name: string;
  monthlyPrice: number; // 0 for free
  yearlyPrice: number; // 0 for free
  tagline: string;
  features: string[];
  limits: Limits;
  highlight?: boolean;
  trialDays?: number; // default trial for this tier
  cardRequired?: boolean; // default requirement for trial
  // Optional Stripe price IDs (can be injected via env/client config)
  stripe?: {
    monthlyPriceId?: string;
    yearlyPriceId?: string;
  };
};

export type PricingConfig = {
  tiers: Tier[];
  promotions?: {
    // Example toggles that can override default trial config
    newYearBoost?: boolean;
    springExtendedTrial?: boolean; // extends trialDays to 14
    blackFridayAnnualDiscount?: boolean; // pricing handled by Stripe coupons
  };
};

const env = {
  starterMonthly: process.env.NEXT_PUBLIC_PRICE_STARTER_MONTHLY,
  starterYearly: process.env.NEXT_PUBLIC_PRICE_STARTER_YEARLY,
  proMonthly: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY,
  proYearly: process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY,
  careerMonthly: process.env.NEXT_PUBLIC_PRICE_CAREER_MONTHLY,
  careerYearly: process.env.NEXT_PUBLIC_PRICE_CAREER_YEARLY,
};

// Single source of truth for pricing and limits
export const PRICING: PricingConfig = {
  tiers: [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      tagline: "Try the core analyzer",
      features: ["Unlimited analyses", "Score + basic gaps", "View results only"],
      limits: { coverLettersPerMonth: 0, storageMB: 0, resumeProfiles: 1, saveLimit: 0 },
    },
    {
      id: "starter",
      name: "Starter",
      monthlyPrice: 9.99,
      yearlyPrice: 89,
      tagline: "For active job seekers",
      features: ["50 analyses / month", "10 cover letters / month", "Export + save history"],
      limits: { analysesPerMonth: 50, coverLettersPerMonth: 10, storageMB: 100, resumeProfiles: 1, saveLimit: 20 },
      trialDays: 7,
      cardRequired: false,
      stripe: { monthlyPriceId: env.starterMonthly, yearlyPriceId: env.starterYearly },
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 24.99,
      yearlyPrice: 199,
      tagline: "Most popular — unlimited",
      features: ["Unlimited analyses", "Unlimited cover letters", "Advanced insights + tracker"],
      limits: { analysesPerMonth: "unlimited", coverLettersPerMonth: "unlimited", storageMB: 1024, resumeProfiles: 1, saveLimit: "unlimited" },
      highlight: true,
      trialDays: 7,
      cardRequired: false,
      stripe: { monthlyPriceId: env.proMonthly, yearlyPriceId: env.proYearly },
    },
    {
      id: "career",
      name: "Career",
      monthlyPrice: 49.99,
      yearlyPrice: 399,
      tagline: "Power users & coaches",
      features: ["Unlimited everything", "5 resume profiles", "Priority support"],
      limits: { analysesPerMonth: "unlimited", coverLettersPerMonth: "unlimited", storageMB: 10 * 1024, resumeProfiles: 5, saveLimit: "unlimited" },
      trialDays: 7,
      cardRequired: false,
      stripe: { monthlyPriceId: env.careerMonthly, yearlyPriceId: env.careerYearly },
    },
  ],
  promotions: {
    newYearBoost: false,
    springExtendedTrial: false, // toggle to extend to 14 days
    blackFridayAnnualDiscount: false,
  },
};

export function effectiveTrialDays(baseDays: number | undefined): number | undefined {
  if (!baseDays) return baseDays;
  if (PRICING.promotions?.springExtendedTrial) return Math.max(baseDays, 14);
  return baseDays;
}
