export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: Request, ctx: { params: { id: string } }){
  try{
    const adminKey = process.env.FEEDBACK_ADMIN_KEY || ''
    if (!adminKey) return NextResponse.json({ error: 'admin key not configured' }, { status: 501 })
    const keyHdr = req.headers.get('x-admin-key') || ''
    if (keyHdr !== adminKey) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const id = ctx.params.id
    const ex = await prisma.feedback.findUnique({ where: { id } })
    if (!ex) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await prisma.feedback.update({ where: { id }, data: { deleted: true } })
    return new NextResponse(null, { status: 204 })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 400 })
  }
}
