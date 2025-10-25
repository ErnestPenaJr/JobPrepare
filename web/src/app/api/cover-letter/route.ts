export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
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
    const { canConsumeCoverLetter, recordCoverLetter } = usageLib as any
    let tier = 'free'
    if (uid) {
      try {
        const { prisma } = await import('@/lib/prisma')
        const u = await prisma.user.findUnique({ where: { id: uid } })
        if (u?.tier) tier = u.tier
      } catch {}
    }
    const gate = await (canConsumeCoverLetter as any)(uid || sid, tier)
    if (!gate.ok) return NextResponse.json({ error: gate.reason || 'Upgrade required' }, { status: 402 })

    const body = await req.json()
    const settings = body?.settings || {}
    const jdText = (body?.jd?.text || body?.jd?.raw || '') as string
    const resumeText = (body?.resume?.text || body?.resume?.raw || '') as string
    const existing = (body?.existingCoverLetter?.text || '') as string
    const today = settings.today || new Date().toISOString().slice(0,10)
    const jd = extract.buildJD(jdText)
    const candidate = extract.buildCandidate(resumeText, existing)
    const tailored = extract.generateCoverLetter(candidate, jd, today)
    try { await (recordCoverLetter as any)(gate.usage) } catch {}
    return NextResponse.json({ revisedCoverLetter: tailored })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 })
  }
}
