const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main(){
  const email = 'demo@example.com'
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email, name: 'Demo User', tier: 'starter' } })
  }
  const sid = 'demo-sid'
  const now = new Date()
  const day = now.toISOString().slice(0,10)
  const month = now.toISOString().slice(0,7)
  const existingUsage = await prisma.usage.findFirst({ where: { sid } })
  if (!existingUsage) {
    await prisma.usage.create({ data: { sid, day, month, analysesToday: 0, analysesMonth: 0, coverLettersMonth: 0, tier: 'starter' } })
  }
  const fb = await prisma.feedback.create({ data: { type: 'feature', title: 'Sample feedback', description: 'Great app! Consider adding more sources.', email: 'demo@example.com', url: null, severity: null } })
  await prisma.feedbackAttachment.create({ data: { feedbackId: fb.id, name: 'screenshot.png', mime: 'image/png', size: 0, dataUrl: Buffer.from('') } })
}

main().then(()=> prisma.$disconnect()).catch(async (e)=> { console.error(e); await prisma.$disconnect(); process.exit(1); })

