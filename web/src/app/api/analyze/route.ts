export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
const scoring = require('@/lib/scoring')
const stop = require('@/lib/stop')
const extract = require('@/lib/extract')

function getSid(req: Request): string {
  const hdr = req.headers.get('cookie') || '';
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(hdr);
  return m ? decodeURIComponent(m[1]) : 'anon';
}
function getUid(req: Request): string | null {
  const hdr = req.headers.get('cookie') || ''
  const m = /(?:^|;\s*)uid=([^;]+)/.exec(hdr)
  return m ? decodeURIComponent(m[1]) : null
}

export async function POST(req: Request){
  try{
    const sid = getSid(req)
    const uid = getUid(req)
    const usageLib = await import('@/lib/usage')
    const { canConsumeAnalyze, recordAnalyze } = usageLib as any
    let tier = 'free'
    if (uid) {
      try {
        const { prisma } = await import('@/lib/prisma')
        const u = await prisma.user.findUnique({ where: { id: uid } })
        if (u?.tier) tier = u.tier
      } catch {}
    }
    const gate = await (canConsumeAnalyze as any)(uid || sid, tier)
    if (!gate.ok) return NextResponse.json({ error: gate.reason || 'Limit reached' }, { status: 429 })
    const body = await req.json()
    const settings = body?.settings || {}
    const jdText = (body?.jd?.text || body?.jd?.raw || '') as string
    const resumeText = (body?.resume?.text || body?.resume?.raw || '') as string
    const clText = (body?.coverLetter?.text || body?.coverLetter?.raw || '') as string

    const allEmpty = !jdText.trim() && !resumeText.trim() && !clText.trim()
    if (allEmpty){
      const iterations = Array.from({ length: 10 }, () => 0)
      const response = {
        scorecard: { iterations, final_score: 0, iteration_labels: ['Python/Django Focus','Backend Depth','Data/Modeling','Cloud/BI','Transferability','Domain Fit','Experience Tenure','Keyword Match Strict','Learning Agility','Holistic'] },
        gaps: [],
        keywords: { matched: [], missing: [] },
        decision: 'reject' as const,
        meta: { jd: { title: null, company: null, location: null } },
      }
      return NextResponse.json(response)
    }

    const jd = extract.buildJD(jdText)
    jd.full_text = jdText
    const candidate = extract.buildCandidate(resumeText, clText)
    candidate.full_text = `${resumeText}\n${clText}`

    const passThreshold = typeof settings.minFinalScore === 'number' ? settings.minFinalScore : 8.0
    const scorecardRaw = scoring.runAll(jd, candidate, passThreshold)
    const scorecard = { iterations: scorecardRaw.iterations, final_score: scorecardRaw.final_score, stability: scorecardRaw.stability, iteration_labels: scorecardRaw.labels, word_comparison: scorecardRaw.word_comparison }
    const allowed = ['jdKeywords','minScore','yrs8','mgmt5','architectNoIC','legacy','locationNoRemote','devopsOnly','qaOnly','pmOnly']
    const checkIDs = Array.isArray(settings.checks) ? new Set(settings.checks) : null
    const checks = checkIDs ? Object.fromEntries(allowed.map((k)=> [k, checkIDs.has(k)])) : {
      jdKeywords: settings.checkJDKeywords !== false,
      minScore: settings.checkMinScore !== false,
      yrs8: settings.check8PlusYears !== false,
      mgmt5: settings.checkManagement5Plus !== false,
      architectNoIC: settings.checkArchitectWithoutIC !== false,
      legacy: settings.checkLegacyStack !== false,
      locationNoRemote: settings.checkLocationNoRemote !== false,
      devopsOnly: settings.checkDevopsOnly !== false,
      qaOnly: settings.checkQaOnly !== false,
      pmOnly: settings.checkPmOnly !== false,
    }
    const stopCfg = {
      minFinalScore: passThreshold,
      stopKeywords: Array.isArray(settings.stopKeywords) ? settings.stopKeywords : undefined,
      checks,
      thresholds: {
        yearsMinRequiredStop: typeof settings.yearsMinRequiredStop === 'number' ? settings.yearsMinRequiredStop : undefined,
        managementRequiredStop: typeof settings.managementRequiredStop === 'number' ? settings.managementRequiredStop : undefined,
        onsiteDaysStop: typeof settings.onsiteDaysStop === 'number' ? settings.onsiteDaysStop : undefined,
      },
    }
    const stopCheck = stop.stopConditions(scorecard.final_score, jd, candidate, stopCfg)
    const decision = stopCheck.triggered ? 'reject' : (scorecard.final_score >= passThreshold ? 'accept' : 'reject')

    const response:any = {
      scorecard,
      gaps: extract.gapAnalysis(jd, candidate),
      keywords: extract.keywordDiff(jd, candidate),
      decision,
      meta: { jd: { title: jd.title || null, company: jd.company || null, location: jd.location || null } },
    }
    if (stopCheck.triggered) response.stop_conditions_triggered = stopCheck.reasons
    if (stopCheck.details) response.stop_details = stopCheck.details
    // Include word comparison data from scorecard
    if (scorecard.word_comparison) response.word_comparison = scorecard.word_comparison
    // Record usage post-success
    try { await (recordAnalyze as any)(gate.usage) } catch {}
    return NextResponse.json(response)
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 })
  }
}
