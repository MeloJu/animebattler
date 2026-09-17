# Segurança

O que existe, o que foi verificado e o que ainda não foi. Documento honesto:
o que não está aqui, não foi feito.

## Estado atual

| Categoria | Ferramenta | Estado |
|---|---|---|
| Dependência de terceiro (SCA) | Dependabot | ativo — npm, github-actions e imagem Docker, mais Dependabot Security Updates |
| Segredo no histórico | gitleaks | ativo — hook de pre-push + job no CI |
| Código (SAST) | CodeQL | ativo — push, pull_request e agenda semanal |
| Infraestrutura como código | Checkov | ativo — job no CI, roda sobre infra/ |
| Imagem de container | — | não feito |
| Aplicação em execução (DAST) | — | não feito |

**Correção sobre uma versão anterior deste documento:** ele dizia "não há
Terraform" — errado. Existe, em `infra/gcp`, `infra/oracle` e
`infra/oracle-bootstrap`. O erro só foi pego numa auditoria pedida depois de
um code review externo (ver "Auditoria de 2026-09" abaixo).

## Segredos

O repositório é **público** e o deploy usa credencial de verdade (SSH para a
VM, token do GHCR, e agora API key da OCI/GCP para o Terraform). Segredo que
entra no histórico de um repositório público conta como **vazado mesmo
depois de removido**: o commit antigo continua acessível e provavelmente já
foi clonado. Remover não resolve — só rotacionar a credencial resolve.

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

## Código (CodeQL)

`.github/workflows/codeql.yml`. Gratuito para repositório público, nativo do
GitHub — resultado aparece na aba Security, não só no log do workflow.
`build-mode: none`: JavaScript/TypeScript é analisado por parsing do fonte,
não existe artefato a compilar. Roda em push/pull_request e também numa
agenda semanal, porque CodeQL rastreia fluxo de dado entre arquivos — uma
varredura periódica pega regra nova contra código antigo que nunca mudou.

## Infraestrutura (Checkov)

`.github/workflows/ci.yml`, job `infra`. Lê os `.tf` de `infra/`
estaticamente — não precisa de `terraform init` nem de credencial de nuvem
nenhuma.

Achado real corrigido por esta auditoria: SSH (porta 22) aberto para
`0.0.0.0/0` tanto no security list da Oracle quanto no firewall do GCP.
Chave pública já impedia login por senha, mas a porta continuava recebendo
todo bot de brute-force da internet. Ver `var.ssh_allowed_cidr` em cada
módulo — a descrição da variável explica como descobrir a faixa certa via
RDAP, inclusive para IP residencial dinâmico (usar a faixa do provedor, não
o `/32` exato, para o acesso sobreviver à próxima troca de IP).

**Achado sem correção que valesse o custo** fica com
`# checkov:skip=ID: motivo` **dentro do bloco do recurso** (não antes —
Checkov só associa o skip a um recurso se o comentário estiver entre as
chaves de abertura e fechamento dele). Isso reporta como "skipped", não
como sucesso silencioso, e o motivo fica ao lado do código:

- `CKV_GCP_26` (VPC Flow Logs) — cobra por volume logado, fora do Always Free.
- `CKV_GCP_106` (porta 80 pública) — é o próprio propósito: serve o site e
  atende o desafio HTTP-01 do Let's Encrypt.
- `CKV_GCP_38` (CSEK) — trocaria um segredo (a chave de disco) por outro
  pra gerenciar, sem ganho real sobre a criptografia já padrão do Google.
- `CKV_GCP_40` (sem IP público) — exigiria NAT gateway/load balancer, custo
  fora do Always Free, para uma VM única que já é o desenho do projeto.
- `CKV_OCI_7`/`CKV_OCI_9` (eventos e CMK no bucket de state) — bucket só
  guarda metadado do próprio Terraform, sem consumidor de evento e sem
  segredo real dentro (conferido).

## Auditoria de 2026-09

Pedido: revisar credenciais no projeto inteiro depois de um code review
externo apontar problema em `docker-compose.prod.yml`. O que mudou:

- **`docker-compose.prod.yml`**: `POSTGRES_USER` tinha um valor-padrão
  público (`:-animebattler`) escrito no arquivo versionado — não era senha
  vazada (o banco não tem porta exposta pro host, e autenticação exige
  usuário *e* senha), mas era informação fixa e previsível que não precisava
  estar aberta. Trocado por `${VAR:?mensagem}`, que falha o
  `docker compose config` na hora de ler o arquivo se a variável não
  estiver definida, em vez de cair num valor fixo. Testado: sem a variável,
  falha com a mensagem; com ela, funciona normal.
- **`.env` local, `.env.example`, `.env.prod.example`, `Dockerfile`**:
  conferidos um por um — só placeholder ou credencial descartável de dev.
  Nenhum real.
- **`infra/**/terraform.tfvars`, `*.tfstate`, `backend.hcl`**: confirmado
  que nenhum desses (nem versão antiga, nem removida depois) jamais entrou
  num commit, em nenhum ponto do histórico — não é só "está no gitignore
  hoje". O `.tfstate` do bootstrap só guarda nome de bucket/namespace, sem
  segredo; o estado da infra principal fica em backend remoto (bucket OCI),
  nunca no disco local.
- **Achado real**: SSH aberto para o mundo (ver seção Checkov acima) — não
  achado pela auditoria de segredo, mas pela de configuração, o que foi o
  motivo de trazer o Checkov pra este projeto no mesmo pente-fino.

## O que ainda falta

Em ordem de valor para este projeto:

1. **Scan da imagem** — Trivy. O container roda exposto na internet, e CVE
   em pacote de sistema não aparece no Dependabot.
2. **DAST** — ZAP contra o ambiente em execução. Mais trabalhoso, e exige
   cuidado por apontar scanner para a própria produção.
