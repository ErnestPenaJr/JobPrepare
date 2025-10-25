export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request){
  try{
    const adminKey = process.env.FEEDBACK_ADMIN_KEY || ''
    if (!adminKey) return NextResponse.json({ error: 'admin key not configured' }, { status: 501 })
    const keyHdr = req.headers.get('x-admin-key') || ''
    if (keyHdr !== adminKey) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const items = await prisma.feedback.findMany({ where: { deleted: false }, orderBy: { createdAt: 'desc' }, include: { attachments: true } })
    const mapped = items.map((it:any)=> ({
      id: it.id,
      type: it.type,
      title: it.title,
      description: it.description,
      email: it.email,
      url: it.url,
      severity: it.severity,
      created_at: it.createdAt?.toISOString?.() || null,
      attachments: (it.attachments || []).map((a:any)=> ({ name: a.name, type: a.mime, size: a.size, dataUrl: a.dataUrl ? Buffer.from(a.dataUrl).toString() : undefined }))
    }))
    return NextResponse.json({ items: mapped })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Failed to list feedback' }, { status: 400 })
  }
}
