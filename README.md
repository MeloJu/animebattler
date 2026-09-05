# 🎮 Anime Battler

Um jogo de batalha por turnos baseado em personagens de anime e quadrinhos, desenvolvido com Next.js, TypeScript e Prisma.

## 📋 Sobre o Projeto

Anime Battler é uma aplicação web interativa que permite aos jogadores colecionar personagens de diferentes animes e quadrinhos, desenvolver suas habilidades através de um sistema de árvore de skills, e batalhar contra IA ou outros jogadores. O jogo apresenta um sistema de transformações, gerenciamento de personagens e progressão de níveis.

### 🎯 Funcionalidades Principais

- **Sistema de Autenticação**: Registro e login de usuários com sessões seguras
- **Coleção de Personagens**: Mais de 20 personagens de animes populares (Naruto, Dragon Ball, Bleach, etc.) e quadrinhos (DC, Marvel)
- **Sistema de Batalha**: Combate por turnos contra IA com mecânicas de energia, habilidades e transformações
- **Árvore de Habilidades**: Sistema de progressão com skill trees únicos para cada personagem
- **Transformações**: Desbloqueie transformações poderosas (Super Saiyajin, Bijuu Mode, etc.)
- **Gestão de Personagens**: Customize e evolua seus personagens
- **Dashboard**: Acompanhe suas estatísticas, vitórias e progresso

## ⚠️ Estado Atual do Projeto

O que já funciona:
- Autenticação (registro, login, sessão)
- CRUD de personagens do usuário (criar, selecionar, listar)
- Dashboard com stats do personagem selecionado
- Listagem e detalhe de personagens do catálogo (via API + páginas)
- **Sistema de batalha contra IA** (`/battle/ai`) — motor de combate por turnos com energia, habilidades, status effects e transformações
- **Raid contra monstro** (`/battle/raid`)
- **Árvore de habilidades / progressão** (`/status`)

O que **ainda não existe** (só placeholders "em construção"):
- PvP multiplayer (`/battle/pvp`)
- Sistema de equipamentos (`/equipment`)

## ☁️ Deploy

A aplicação é containerizada e o deploy é automatizado: GitHub Actions builda
a imagem, publica no GHCR e sobe numa VM Always Free provisionada por
Terraform, com Caddy na frente fazendo TLS.

O Terraform é modular por provedor, um root independente por nuvem em
[infra/](infra):
- [infra/oracle](infra/oracle) — E2.1.Micro (amd64) ou Ampere A1.Flex (arm64), Oracle Always Free.
  Passo a passo: [docs/deploy-oracle.md](docs/deploy-oracle.md).
- [infra/gcp](infra/gcp) — e2-micro (amd64), Google Cloud Always Free.
  Passo a passo: [docs/deploy-gcp.md](docs/deploy-gcp.md).

O bootstrap de cada VM (Docker, firewall local) é compartilhado entre os
dois em [infra/shared/cloud-init.yaml](infra/shared/cloud-init.yaml).

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16** - Framework React com renderização do lado do servidor
- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS 4** - Framework CSS utilitário
- **Lucide React** - Ícones modernos e personalizáveis

### Backend
- **Next.js API Routes** - Endpoints serverless
- **Prisma ORM** - ORM moderno para TypeScript/Node.js
- **PostgreSQL 16** - Banco de dados relacional

### Infraestrutura
- **Docker / Docker Compose** - Ambientes de dev e produção containerizados
- **Terraform** - Provisionamento da VM, um root modular por provedor Always Free (Oracle, GCP)
- **Caddy** - Reverse proxy com HTTPS automático (Let's Encrypt)
- **GitHub Actions** - CI (lint, typecheck, build, imagem) e CD (build + push no GHCR + deploy)

### Ferramentas de Desenvolvimento
- **Vitest** - Testes unitários da lógica de jogo (`npm test`)
- **ESLint** - Linting de código
- **PostCSS** - Processamento de CSS
- **Docker / Docker Compose** - Ambiente de desenvolvimento containerizado

## 🧪 Testes

```bash
npm test            # roda a suíte uma vez
npm run test:watch  # modo watch durante o desenvolvimento
```

A estratégia é dividida por camada, em vez de perseguir uma % de cobertura:

- **Testes unitários** (`tests/`) cobrem a lógica **pura**: o motor de batalha
  (dano, crítico, escudo, contra-ataque, DOT, stun, transformação, ordem de
  turno), a IA, a curva de XP e os helpers. `resolveRound` recebe a função
  aleatória por parâmetro, então o combate é testado de forma determinística.
- **Smoke test** (`scripts/smoke-test.sh`) sobe a **imagem de produção** de
  verdade, aplica migrations, roda o seed e exercita rotas reais — é o que
  cobre páginas e server actions, que dependem de Prisma e sessão.

Rotas e componentes não têm teste unitário de propósito: mockar Prisma e
`cookies()` testaria o mock, não o comportamento. Quem cobre essa camada é o
smoke test, contra a imagem real.

### Inteligência Artificial
- **Claude Sonnet 4.5** - Assistência no desenvolvimento via GitHub Copilot

## 📦 Estrutura do Banco de Dados

O projeto utiliza um schema Prisma robusto com os seguintes modelos principais:

### Modelos de Domínio
- **Anime**: Representa as diferentes séries/universos
- **Affiliation**: Facções e organizações dentro dos animes
- **Character**: Personagens jogáveis com stats base (HP, Attack, Defense, Speed, Energy)
- **Skill**: Habilidades com categorias (Ninjutsu, Ki, Kido, etc.)
- **Transformation**: Transformações com modificadores de stats

### Modelos de Usuário
- **User**: Dados do jogador com sistema de roles
- **UserCharacter**: Personagens do usuário com progressão (level, XP, wins)
- **UserSkillUnlock**: Habilidades desbloqueadas pelo usuário
- **UserCharacterTransformation**: Transformações desbloqueadas

### Sistema de Batalha
- **Battle**: Gerencia batalhas ativas e finalizadas
- **Turn**: Registra cada turno com ações e resultados
- **Session**: Gerenciamento de sessões de autenticação

## 🚀 Como Executar

### Opção A: Docker (recomendado)

Pré-requisito: Docker + Docker Compose instalados.

```bash
docker compose up --build
```

Isso instala as dependências, gera o client do Prisma, aplica as migrations e sobe o servidor de dev em `http://localhost:3000`. O código-fonte fica montado como volume, então alterações no host refletem no container automaticamente. Para popular o banco com dados iniciais:

```bash
docker compose exec app npm run prisma:seed
```

### Opção B: Local (Node.js)

#### Pré-requisitos
- Node.js 20+ instalado
- npm

#### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd anime-battler
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure o banco de dados:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Popular o banco com dados iniciais:
```bash
npm run prisma:seed
```

6. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse a aplicação em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
anime-battler/
├── app/                      # Diretório principal Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── characters/       # Endpoints de personagens
│   │   ├── user/            # Endpoints de usuário
│   │   └── user-characters/ # Endpoints de personagens do usuário
│   ├── battle/              # Páginas de batalha
│   ├── characters/          # Páginas de personagens
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── landing/         # Componentes da landing page
│   │   ├── AppNav.tsx       # Navegação da aplicação
│   │   └── NavBar.tsx       # Barra de navegação
│   ├── create/              # Criação de personagens
│   ├── dashboard/           # Dashboard do usuário
│   ├── equipment/           # Sistema de equipamentos
│   ├── lib/                 # Bibliotecas e utilidades
│   │   ├── auth.ts          # Autenticação
│   │   ├── prisma.ts        # Cliente Prisma
│   │   └── session.ts       # Gerenciamento de sessões
│   ├── login/               # Página de login
│   ├── register/            # Página de registro
│   └── select/              # Seleção de personagens
├── prisma/                  # Schema e migrações do banco
│   ├── schema.prisma        # Definição do schema
│   ├── seed.js              # Dados iniciais
│   └── migrations/          # Histórico de migrações
├── public/                  # Arquivos estáticos
│   ├── images/              # Imagens de personagens e transformações
│   └── landing/             # Assets da landing page
├── scripts/                 # Scripts utilitários
│   ├── list-characters.js   # Listar personagens
│   ├── set-character-slugs.js # Configurar slugs
│   └── setup-character-folders.js # Configurar pastas
├── Dockerfile                # Imagem Docker para dev
├── docker-compose.yml         # Orquestração local via Docker
└── .env.example               # Template de variáveis de ambiente
```

## 🎮 Personagens no Seed Atual

O `prisma/seed.js` atualmente popula estes personagens (o restante mencionado no roadmap ainda não foi adicionado):

### Naruto Universe
- Naruto Uzumaki
- Sasuke Uchiha

### Bleach Universe
- Ichigo Kurosaki
- Rukia Kuchiki

### Dragon Ball Z Universe
- Goku
- Vegeta
- Broly

### DC Universe
- Batman
- Superman
- Wonder Woman

### Marvel Universe
- Daredevil
- Jean Grey
- Emma Frost

## 🔐 Sistema de Autenticação

O projeto implementa um sistema de autenticação personalizado com:
- Hash de senhas usando Scrypt
- Sessões com tokens HTTP-only cookies
- Middleware de proteção de rotas
- Expiração automática de sessões (30 dias)

## 🎯 Roadmap

- [x] Sistema de batalha (motor de combate contra IA)
- [x] Árvore de habilidades / progressão de personagem
- [ ] Sistema PvP multiplayer
- [ ] Sistema de equipamentos
- [ ] Mais personagens: Kakashi, Minato, personagens de Jujutsu Kaisen (Yuji, Megumi, Nobara, Maki, Sukuna) e Sword Art Online (Kirito, Asuna)
- [ ] Sistema de clãs/guildas
- [ ] Eventos e torneios
- [ ] Sistema de conquistas
- [ ] Modo história

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linting
- `npm run prisma:seed` - Popula o banco com dados iniciais

## 🤝 Desenvolvimento Assistido por IA

Este projeto foi desenvolvido com assistência do **Claude Sonnet 4.5** através do GitHub Copilot, que auxiliou em:
- Arquitetura e estruturação do projeto
- Desenvolvimento do schema Prisma
- Implementação de componentes React
- Sistema de autenticação
- Lógica de batalha
- Otimização e boas práticas

## 📄 Licença

Este é um projeto educacional desenvolvido para fins de aprendizado.

## 👤 Autor

Desenvolvido por Juan com assistência de IA (Claude Sonnet 4.5)

---

**Nota**: Este é um projeto em desenvolvimento ativo. Novas funcionalidades e melhorias são adicionadas regularmente.
