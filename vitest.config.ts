import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Só lógica pura é testada aqui (motor de batalha, IA, progressão, helpers).
// Páginas e server actions dependem de Prisma/sessão e já são cobertas pelo
// smoke test, que sobe a imagem de produção de verdade — ver
// scripts/smoke-test.sh.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['app/lib/**/*.ts'],
      // Arquivos que falam com Prisma/cookies não têm teste unitário de
      // propósito — declarar 100% de cobertura sobre eles seria mentira.
      exclude: ['app/lib/**/queries.ts', 'app/lib/**/actions.ts', 'app/lib/prisma.ts', 'app/lib/session.ts'],
    },
  },
})
