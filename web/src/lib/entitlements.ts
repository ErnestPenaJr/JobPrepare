import { Limits, PRICING, TierID } from "./pricing";

export type Usage = {
  analysesThisMonth: number;
  analysesToday?: number;
  coverLettersThisMonth: number;
  storageUsedMB: number;
};

function limitsFor(tier: TierID): Limits {
  const t = PRICING.tiers.find((x) => x.id === tier);
  return t?.limits || {};
}

export function canAnalyze(tier: TierID, usage: Usage): boolean {
  const lim = limitsFor(tier);
  if (lim.analysesPerDay === "unlimited" || lim.analysesPerMonth === "unlimited") return true;
  if (typeof lim.analysesPerDay === 'number') {
    const today = usage.analysesToday ?? 0;
    return today < lim.analysesPerDay;
  }
  const max = lim.analysesPerMonth ?? 0;
  return usage.analysesThisMonth < max;
}

export function canGenerateCoverLetter(tier: TierID, usage: Usage): boolean {
  const lim = limitsFor(tier);
  if (!lim.coverLettersPerMonth) return false;
  if (lim.coverLettersPerMonth === "unlimited") return true;
  return usage.coverLettersThisMonth < lim.coverLettersPerMonth;
}
