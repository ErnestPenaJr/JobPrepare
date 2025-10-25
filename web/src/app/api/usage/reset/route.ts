export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

function getCookie(req: Request, name: string): string | null {
  const hdr = req.headers.get('cookie') || ''
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(hdr)
  return m ? decodeURIComponent(m[1]) : null
}

function newSid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export async function POST(req: Request){
  try{
    const uid = getCookie(req, 'uid')
    const sid = getCookie(req, 'sid')
    let resetKeys: string[] = []
    if (uid) resetKeys.push(uid)
    if (sid) resetKeys.push(sid)
    resetKeys = Array.from(new Set(resetKeys.filter(Boolean)))

    // Try Prisma first
    try{
      const { prisma } = await import('@/lib/prisma')
      if (prisma && resetKeys.length){
        for (const key of resetKeys){
          const row = await prisma.usage.findFirst({ where: { sid: key } })
          if (row){
            await prisma.usage.update({ where: { id: row.id }, data: { analysesToday: 0 } })
          }
        }
        return NextResponse.json({ ok: true, reset: resetKeys })
      }
    }catch{}

    // Fallback: rotate sid to bypass daily count in non-DB/dev mode
    const res = NextResponse.json({ ok: true, rotated: true })
    const newId = newSid()
    res.cookies.set('sid', newId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Reset failed' }, { status: 400 })
  }
}

