import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Node/CommonJS tooling scripts, not app source.
    //
    // O padrão cobre prisma/ inteiro de propósito: antes era só o seed.js por
    // caminho exato, e o primeiro script novo ali (sync-catalog.js) quebrou o
    // lint por usar require(). Todo script de prisma/ roda no Node fora do
    // bundle do Next, então a regra de import de módulo do app não se aplica.
    "scripts/**",
    "prisma/**/*.js",
  ]),
]);

export default eslintConfig;
