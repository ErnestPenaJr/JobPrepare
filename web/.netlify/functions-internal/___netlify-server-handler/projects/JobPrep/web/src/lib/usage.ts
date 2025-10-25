// Lightweight usage tracker backed by Netlify Blobs
import { PRICING } from "@/lib/pricing";

let prismaLib: any = null;
try { prismaLib = require('@/lib/prisma'); } catch {}

type UsageDoc = {
  sid: string;
  tier: string; // 'free' by default until auth exists
  day: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  analysesToday: number;
  analysesMonth: number;
  coverLettersMonth: number;
  updated_at: string;
};

function todayStr(){ return new Date().toISOString().slice(0,10); }
function monthStr(){ return new Date().toISOString().slice(0,7); }

export async function loadUsage(sid: string): Promise<UsageDoc> {
  if (prismaLib && prismaLib.prisma) {
    const nowDay = todayStr();
    const nowMonth = monthStr();
    const ex = await prismaLib.prisma.usage.findFirst({ where: { sid } }).catch(()=> null)
    if (ex) {
      let doc: UsageDoc = { sid: sid, tier: ex.tier || 'free', day: ex.day, month: ex.month, analysesToday: ex.analysesToday, analysesMonth: ex.analysesMonth, coverLettersMonth: ex.coverLettersMonth, updated_at: new Date().toISOString() }
      if (doc.day !== nowDay) doc.analysesToday = 0, doc.day = nowDay
      if (doc.month !== nowMonth) doc.analysesMonth = 0, doc.coverLettersMonth = 0, doc.month = nowMonth
      return doc
    }
    const fresh: UsageDoc = { sid, tier: 'free', day: nowDay, month: nowMonth, analysesToday: 0, analysesMonth: 0, coverLettersMonth: 0, updated_at: new Date().toISOString() }
    await prismaLib.prisma.usage.create({ data: { sid: sid, day: fresh.day, month: fresh.month, analysesToday: 0, analysesMonth: 0, coverLettersMonth: 0, tier: fresh.tier, sid: sid } as any }).catch(()=> {})
    return fresh
  }
  // Fallback: ephemeral in-memory (dev only)
  // @ts-ignore
  globalThis.__usage = globalThis.__usage || {};
  const m = (globalThis.__usage as any)[sid];
  const fallback: UsageDoc = m || {
    sid,
    tier: 'free',
    day: todayStr(),
    month: monthStr(),
    analysesToday: 0,
    analysesMonth: 0,
    coverLettersMonth: 0,
    updated_at: new Date().toISOString(),
  };
  // @ts-ignore
  (globalThis.__usage as any)[sid] = fallback;
  return fallback;
}

export async function saveUsage(doc: UsageDoc): Promise<void> {
  doc.updated_at = new Date().toISOString();
  if (prismaLib && prismaLib.prisma) {
    // Try by sid; if a userId-based record exists, the caller should use saveUsageForUser
    const ex = await prismaLib.prisma.usage.findFirst({ where: { sid: doc.sid } })
    if (ex) {
      await prismaLib.prisma.usage.update({ where: { id: ex.id }, data: { day: doc.day, month: doc.month, analysesToday: doc.analysesToday, analysesMonth: doc.analysesMonth, coverLettersMonth: doc.coverLettersMonth, tier: doc.tier } })
    } else {
      await prismaLib.prisma.usage.create({ data: { sid: doc.sid, day: doc.day, month: doc.month, analysesToday: doc.analysesToday, analysesMonth: doc.analysesMonth, coverLettersMonth: doc.coverLettersMonth, tier: doc.tier } })
    }
    return
  }
  // @ts-ignore
  globalThis.__usage = globalThis.__usage || {};
  // @ts-ignore
  (globalThis.__usage as any)[doc.sid] = doc;
}

export function getLimits(tier: string){
  const t = PRICING.tiers.find(x=> x.id === tier) || PRICING.tiers[0];
  return t.limits;
}

export async function canConsumeAnalyze(sid: string, tier = 'free'): Promise<{ ok: boolean; reason?: string; usage?: UsageDoc }>{
  const usage = await loadUsage(sid);
  usage.tier = tier;
  const lim = getLimits(tier);
  // Daily limit removed - only check monthly limits
  // if (typeof lim.analysesPerDay === 'number' && usage.analysesToday >= lim.analysesPerDay) return { ok: false, reason: `Daily analysis limit reached (${lim.analysesPerDay}/day)`, usage };
  if (typeof lim.analysesPerMonth === 'number' && usage.analysesMonth >= lim.analysesPerMonth) return { ok: false, reason: `Monthly analysis limit reached (${lim.analysesPerMonth}/month)`, usage };
  return { ok: true, usage };
}

export async function recordAnalyze(usage: UsageDoc): Promise<void> {
  usage.analysesToday += 1;
  usage.analysesMonth += 1;
  await saveUsage(usage);
}

export async function canConsumeCoverLetter(sid: string, tier = 'free'): Promise<{ ok: boolean; reason?: string; usage?: UsageDoc }>{
  const usage = await loadUsage(sid);
  usage.tier = tier;
  const lim = getLimits(tier);
  if (!lim.coverLettersPerMonth || lim.coverLettersPerMonth === 0) return { ok: false, reason: 'Cover letter generation requires Starter tier or higher.', usage };
  if (typeof lim.coverLettersPerMonth === 'number' && usage.coverLettersMonth >= lim.coverLettersPerMonth) return { ok: false, reason: `Cover letter limit reached (${lim.coverLettersPerMonth}/month)`, usage };
  return { ok: true, usage };
}

export async function recordCoverLetter(usage: UsageDoc): Promise<void> {
  usage.coverLettersMonth += 1;
  await saveUsage(usage);
}
