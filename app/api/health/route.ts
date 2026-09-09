import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Usado pelo healthcheck do docker-compose e pela verificação pós-deploy do
// workflow de CD. Checa o banco de propósito: um container que subiu mas não
// alcança o Postgres está "no ar" e inútil ao mesmo tempo, e é justamente
// isso que o deploy precisa detectar.
export const dynamic = 'force-dynamic'

// Commit que gerou a imagem, injetado no build (ver GIT_SHA no Dockerfile).
//
// Responde a uma pergunta que antes não tinha resposta de fora: "a mudança já
// subiu?". Sem isso, deploy pendente, cache do navegador e bug de verdade se
// parecem, e a única saída era esperar e tentar de novo.
//
// Sai também na resposta de ERRO de propósito: quando o banco cai, saber qual
// versão está no ar é justamente o que se quer saber primeiro.
const version = process.env.GIT_SHA ?? 'desenvolvimento'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', database: 'up', version })
  } catch {
    return NextResponse.json({ status: 'error', database: 'down', version }, { status: 503 })
  }
}
