#!/usr/bin/env bash
# ============================================================================
# Aplica o patch Dev → Prod e faz o baseline das migrations do Prisma.
#
# Uso:
#   DATABASE_URL="postgresql://user:pass@host:5432/db" ./apply-prod-patch.sh
#
# Flags:
#   --yes   pula a confirmação interativa (uso em CI — cuidado!)
#
# O que faz:
#   1. Roda patch-prod-to-dev-schema.sql em transação única (erro → rollback).
#   2. Marca as 7 migrations da pasta prisma/migrations como aplicadas
#      (`prisma migrate resolve --applied`), criando o baseline para que
#      `npm run migrate:deploy` futuro funcione normalmente.
#
# Requisitos: psql, npx (com o repo já em checkout da branch/tag que contém
# prisma/migrations — ou seja, o código novo já deployado).
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PATCH_SQL="$SCRIPT_DIR/patch-prod-to-dev-schema.sql"
MIGRATIONS_DIR="$REPO_ROOT/prisma/migrations"

SKIP_CONFIRM=false
[[ "${1:-}" == "--yes" ]] && SKIP_CONFIRM=true

# --- Pré-checagens -----------------------------------------------------------
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERRO: defina DATABASE_URL apontando para o banco de PRODUÇÃO." >&2
  exit 1
fi

command -v psql >/dev/null || { echo "ERRO: psql não encontrado." >&2; exit 1; }
command -v npx  >/dev/null || { echo "ERRO: npx não encontrado." >&2; exit 1; }

[[ -f "$PATCH_SQL" ]] || { echo "ERRO: $PATCH_SQL não encontrado." >&2; exit 1; }

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "ERRO: $MIGRATIONS_DIR não existe. Faça checkout do código novo (com as migrations) antes de rodar." >&2
  exit 1
fi

# Alvo (sem exibir credenciais)
TARGET="$(psql "$DATABASE_URL" -Atc "SELECT current_database() || ' @ ' || coalesce(inet_server_addr()::text, 'localhost')" 2>/dev/null || true)"
if [[ -z "$TARGET" ]]; then
  echo "ERRO: não foi possível conectar ao banco com a DATABASE_URL fornecida." >&2
  exit 1
fi

echo "============================================================"
echo " Patch Dev → Prod (IVCF)"
echo " Banco alvo: $TARGET"
echo "============================================================"
echo
echo "RECOMENDADO antes de continuar: backup completo, ex.:"
echo "  pg_dump -Fc \"\$DATABASE_URL\" -f backup-pre-patch-$(date +%Y%m%d-%H%M%S).dump"
echo
echo "(Os dados removidos pelo schema novo também ficam arquivados no schema legacy_backup dentro do próprio banco.)"
echo

if [[ "$SKIP_CONFIRM" != true ]]; then
  read -r -p "Digite MIGRAR para aplicar o patch nesse banco: " CONFIRM
  if [[ "$CONFIRM" != "MIGRAR" ]]; then
    echo "Abortado."
    exit 1
  fi
fi

# --- 1. Patch SQL (transação única) -----------------------------------------
echo
echo ">> Aplicando $PATCH_SQL ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$PATCH_SQL"
echo ">> Patch aplicado com sucesso."

# --- 2. Baseline das migrations ---------------------------------------------
echo
echo ">> Fazendo baseline das migrations (migrate resolve --applied) ..."
cd "$REPO_ROOT"

for dir in "$MIGRATIONS_DIR"/*/; do
  migration="$(basename "$dir")"
  [[ "$migration" =~ ^[0-9]{14}_ ]] || continue
  echo "   - $migration"
  if ! output="$(npx prisma migrate resolve --applied "$migration" 2>&1)"; then
    if grep -qi "already recorded as applied" <<<"$output"; then
      echo "     (já registrada, ok)"
    else
      echo "$output" >&2
      echo "ERRO no baseline da migration $migration." >&2
      exit 1
    fi
  fi
done

# --- 3. Verificação final ----------------------------------------------------
echo
echo ">> Verificando com prisma migrate deploy (não deve haver pendências) ..."
npx prisma migrate deploy

echo
echo "============================================================"
echo " Concluído."
echo " - Participantes/managers agora logam com <cpf>@ivcf.local"
echo " - Backup dos dados removidos: schema legacy_backup"
echo "   (para descartar depois: DROP SCHEMA legacy_backup CASCADE;)"
echo "============================================================"
