# Segurança

O que existe, o que foi verificado e o que ainda não foi. Documento honesto:
o que não está aqui, não foi feito.

## Estado atual

| Categoria | Ferramenta | Estado |
|---|---|---|
| Dependência de terceiro (SCA) | Dependabot | ativo — npm, github-actions e imagem Docker |
| Segredo no histórico | gitleaks | ativo — hook de pre-push + job no CI |
| Código (SAST) | — | não feito |
| Imagem de container | — | não feito |
| Aplicação em execução (DAST) | — | não feito |
| Infraestrutura como código | — | não se aplica: não há Terraform, a infra é docker-compose |

## Segredos

O repositório é **público** e o deploy usa credencial de verdade (SSH para a
VM, token do GHCR). Segredo que entra no histórico de um repositório público
conta como **vazado mesmo depois de removido**: o commit antigo continua
acessível e provavelmente já foi clonado. Remover não resolve — só rotacionar
a credencial resolve.

**Varredura inicial:** o histórico inteiro foi varrido com gitleaks 8.30.1 e
veio **limpo nos 114 commits** de então. A regra de nunca commitar credencial
deixou de ser presumida e passou a ser verificada.

### Duas camadas, de propósito

1. **Hook de pre-push** (`.githooks/pre-push`) — é quem **previne**. Neste
   projeto tudo vai direto para o master, sem PR, então o CI só roda depois
   do push, quando o segredo já estaria público. O hook barra antes de subir.
2. **Job no CI** (`.github/workflows/ci.yml`, job `segredos`) — é a **rede de
   segurança**, para o caso de o hook não estar ativo na máquina.

O hook **falha aberta** se o gitleaks não estiver instalado: avisa e deixa
passar, em vez de travar todo push. Decisão consciente — o CI continua
barrando do outro lado, então o custo de ignorar o aviso é um build vermelho,
não um segredo publicado.

### Ativar na sua máquina

Uma vez por clone:

    git config core.hooksPath .githooks

E instalar o gitleaks (senão o hook só avisa). Binário em
https://github.com/gitleaks/gitleaks/releases — confirme com:

    gitleaks version

### Varrer manualmente

Histórico inteiro:

    gitleaks git --redact --verbose

Arquivos atuais, inclusive os não versionados:

    gitleaks dir --redact --verbose

O `--redact` importa: sem ele, o próprio log do CI passaria a conter o
segredo que encontrou.

## O que ainda falta

Em ordem de valor para este projeto:

1. **SAST** — CodeQL é gratuito para repositório público e nativo do GitHub.
2. **Scan da imagem** — Trivy. O container roda exposto na internet, e CVE em
   pacote de sistema não aparece no Dependabot.
3. **DAST** — ZAP contra o ambiente em execução. Mais trabalhoso, e exige
   cuidado por apontar scanner para a própria produção.

Checkov aparece em conversa sobre este tema, mas aqui teria pouco retorno:
ele brilha em Terraform/CloudFormation, e este projeto não tem IaC — a
infraestrutura é docker-compose mais GitHub Actions.
