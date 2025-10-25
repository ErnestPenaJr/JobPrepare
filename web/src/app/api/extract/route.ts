export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
const extract = require('@/lib/extract')

export async function POST(req: Request){
  try{
    const body = await req.json()
    const doc = body?.document || {}
    const text = doc.text || ''
    const result = extract.extractDocument(text)
    return NextResponse.json(result)
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 })
  }
}

