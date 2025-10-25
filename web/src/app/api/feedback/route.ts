export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request){
  try{
    const ctype = req.headers.get('content-type') || ''
    let payload: any = null
    let files: { name: string; type: string; size: number; data?: Buffer }[] = []
    if (ctype.includes('multipart/form-data')) {
      const form = await req.formData()
      const p = form.get('payload') as string | null
      try { payload = p ? JSON.parse(p) : null } catch { payload = null }
      const fileFields = form.getAll('files') as unknown as File[]
      for (const f of fileFields) {
        if (!f) continue
        const ab = await f.arrayBuffer()
        // @ts-expect-error Buffer in node runtime
        const buf = Buffer.from(ab)
        files.push({ name: (f as any).name || 'file', type: (f as any).type || 'application/octet-stream', size: (f as any).size || buf.length, data: buf })
      }
    } else {
      payload = await req.json()
    }

    const kind = String(payload?.type || payload?.kind || '').toLowerCase()
    const allowed = new Set(['feature','bug','error','other'])
    const type = allowed.has(kind) ? (kind === 'error' ? 'bug' : kind) : 'other'
    const title = String(payload?.title || '').trim()
    const description = String(payload?.description || payload?.details || '').trim()
    const email = String(payload?.email || '').trim()
    const page_url = String(payload?.url || payload?.page || '').trim()
    const severity = String(payload?.severity || '').trim()
    if (!title || !description) return NextResponse.json({ error: 'title and description are required' }, { status: 400 })

    const id = randomUUID()
    // Persist attachments (embed dataUrl for admin preview)
    const attachments: any[] = []
    if (files.length) {
      let i = 0
      for (const f of files) {
        let dataUrl: string | undefined
        try {
          const base64 = (f.data as any).toString('base64')
          dataUrl = `data:${f.type};base64,${base64}`
        } catch {}
        attachments.push({ name: f.name, type: f.type, size: f.size, dataUrl })
        i++
      }
    }

    const entry = {
      id, type, title, description,
      email: email || null, url: page_url || null, severity: severity || null,
      attachments: attachments.length ? attachments : undefined,
      created_at: new Date().toISOString()
    }
    await prisma.feedback.create({
      data: {
        id: entry.id,
        type,
        title,
        description,
        email: email || null,
        url: page_url || null,
        severity: severity || null,
        attachments: attachments?.length ? {
          create: attachments.map((a:any)=> ({ name: a.name, mime: a.type || null, size: a.size || null, dataUrl: a.dataUrl ? Buffer.from(a.dataUrl) : null }))
        } : undefined,
      }
    })
    return NextResponse.json({ ok: true, id: entry.id }, { status: 201 })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 })
  }
}
