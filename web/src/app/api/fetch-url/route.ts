export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
const { stripHtml } = require('@/lib/parsers')

export async function POST(req: Request){
  try{
    const body = await req.json()
    const urlStr = String(body?.url || '')
    if (!/^https?:\/\//i.test(urlStr)) throw new Error('Only http/https allowed')
    const r = await fetch(urlStr, { redirect: 'follow' })
    const ct = r.headers.get('content-type') || ''
    const raw = await r.text()
    const text = /html/i.test(ct) ? stripHtml(raw) : raw
    return NextResponse.json({ text, contentType: ct })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Fetch failed' }, { status: 400 })
  }
}

