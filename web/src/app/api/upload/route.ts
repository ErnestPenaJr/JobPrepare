export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
const { parseBufferToText } = require('@/lib/parsers')

export async function POST(req: Request){
  try{
    const form = await req.formData()
    const file = form.get('file') as unknown as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    const ab = await file.arrayBuffer()
    // @ts-expect-error Buffer available in node runtime
    const buf = Buffer.from(ab)
    const text = await parseBufferToText(buf, file.type || '', file.name || '')
    return NextResponse.json({ name: file.name, type: file.type, size: file.size, text })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 400 })
  }
}

