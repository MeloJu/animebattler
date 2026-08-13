import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Usado pelo healthcheck do docker-compose e pela verificação pós-deploy do
// workflow de CD. Checa o banco de propósito: um container que subiu mas não
// alcança o Postgres está "no ar" e inútil ao mesmo tempo, e é justamente
// isso que o deploy precisa detectar.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', database: 'up' })
  } catch {
    return NextResponse.json({ status: 'error', database: 'down' }, { status: 503 })
  }
}
