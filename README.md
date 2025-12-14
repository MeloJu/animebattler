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

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16** - Framework React com renderização do lado do servidor
- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS 4** - Framework CSS utilitário
- **Lucide React** - Ícones modernos e personalizáveis

### Backend
- **Next.js API Routes** - Endpoints serverless
- **tRPC** - TypeScript RPC para comunicação type-safe
- **Prisma ORM** - ORM moderno para TypeScript/Node.js
- **SQLite** - Banco de dados relacional
- **Zod** - Validação de schemas TypeScript-first

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **PostCSS** - Processamento de CSS
- **React Query (TanStack Query)** - Gerenciamento de estado servidor

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

### Pré-requisitos
- Node.js 20+ instalado
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd anime-battler
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Popular o banco com dados iniciais:
```bash
npm run prisma:seed
```

5. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação em `http://localhost:3000`

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
└── generated/               # Código gerado (Prisma Client)
```

## 🎮 Personagens Disponíveis

### Naruto/Boruto Universe
- Naruto Uzumaki
- Sasuke Uchiha
- Kakashi Hatake
- Minato Namikaze

### Dragon Ball Universe
- Goku
- Vegeta
- Broly

### Bleach Universe
- Ichigo Kurosaki
- Rukia Kuchiki

### Jujutsu Kaisen Universe
- Yuji Itadori
- Megumi Fushiguro
- Nobara Kugisaki
- Maki Zenin
- Ryomen Sukuna

### Sword Art Online
- Kirito
- Asuna

### DC Comics
- Batman
- Superman
- Wonder Woman

### Marvel Comics
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

- [ ] Sistema PvP multiplayer
- [ ] Sistema de equipamentos
- [ ] Mais personagens e animes
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
