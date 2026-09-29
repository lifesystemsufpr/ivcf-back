# IVCF Backend

## Instruções para desenvolvimento local

### Pré-requisitos
- Node.js
- npm, pnpm, yarn etc
- Instância de PostgreSQL rodando e alcançável via `DATABASE_URL` (recomenda-se porta 5432), com banco tecno_aging_db criado

### Ambiente

1) Copie o modelo `.env.example` para um arquivo `.env` e ajuste os valores, como `DATABASE_URL` e `JWT_SECRET`.
2) Instale as dependências (recomenda-se pnpm)
```bash
pnpm install
```
3) Faça o setup do banco de dados com Prisma:
```bash
pnpm prisma:init
```

Que roda:
- prisma generate
- prisma migrate dev
- prisma db seed

4) Rode a API:
```bash
pnpm dev
```
URL padrão:
- http://127.0.0.1:3333

Documentação com Swagger (verificar variáveis `SWAGGER_ENABLED` e `SWAGGER_PATH`):
- http://127.0.0.1:3333/backend/api-docs

## Erros comuns e troubleshooting

> Error: "@nestjs/swagger/plugin" plugin is not installed

Isso pode acontecer se o node_modules estiver inconsistente ou corrompido.

Correção
```bash
pnpm install --force
```

Se ainda der ruim:
```bash
# remova node_modules
# depois limpe o pnpm store
pnpm store prune
pnpm install
```
---
> Tipagem do Prisma apitando erro.

Se o TypeScript não conseguir achar os tipos vindos do Prisma, gere o _client_ novamente:

```bash
pnpm prisma:generate
```

E depois reinicie o servidor TypeScript na sua IDE

No VS Code:
- CTRL + SHIFT + P
- TypeScript: Restart TS Server

No WebStorm tem um ícone do TS no canto inferior direito.

---

> Erros de seed ou migration

- Confira se a variável de ambiente `DATABASE_URL` está corretamente definida e se o banco está alcançável.
- Tente novamente:
```bash
pnpm prisma:init
```

---

> Swagger não carregando

- Verifique se a variável de ambiente `SWAGGER_ENABLED` está definida para true
- Verifique a rota da documentação via `SWAGGER_PATH` padrão: `api-docs` (URL final: `/backend/api-docs`)

## Deploy com Docker

O workflow `.github/workflows/deploy.yaml` publica a imagem no GHCR e implanta na VPS. `main` usa o environment `prod`; `dev` usa `dev`.

Configure os seguintes secrets em cada GitHub Environment:

- `ENV_PROD_FILE`: conteúdo completo do `.env.prod`, baseado em `.env.prod.example`;
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_SSH_PORT` e `VPS_APP_PATH`;
- `GHCR_USER` e `GHCR_PAT`, com permissão para baixar a imagem privada.

Na VPS, o serviço publica somente `127.0.0.1:3001`. O gateway do `lifesystems-infra` o expõe em `/ivcf-api`; o Swagger fica em `/ivcf-api/api-docs`.

## Arquitetura

- [Swagger](https://docs.nestjs.com/openapi/introduction)
- [Lint](https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md#usage)
- [Environment Configuration](https://docs.nestjs.com/techniques/configuration)
- [Logger](https://docs.nestjs.com/techniques/logger)
- [Autenticação/Autorização](https://docs.nestjs.com/recipes/passport)
