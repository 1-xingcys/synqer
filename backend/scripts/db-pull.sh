#!/usr/bin/env bash
#
# 把 production（Neon）的資料庫內容複製到本地 Docker Postgres。
#
#   npm run db:pull
#
# 需要 .env 內有 PROD_DATABASE_URL。

set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER=synqer
DB_NAME=synqer_dev
BACKUP_DIR=.backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [[ ! -f .env ]]; then
  echo "backend/.env not found" >&2
  exit 1
fi

# 環境變數優先，方便臨時指定其他來源；平常都是從 .env 讀。
PROD_URL="${PROD_DATABASE_URL:-$(grep -m1 '^PROD_DATABASE_URL=' .env | cut -d= -f2- || true)}"
if [[ -z "$PROD_URL" ]]; then
  echo "Set PROD_DATABASE_URL=<connection string> in backend/.env" >&2
  exit 1
fi


echo "This will wipe local ${DB_NAME} and replace it with production data."
read -r -p "Continue? (y to proceed) " reply
[[ "$reply" == "y" ]] || { echo "Aborted."; exit 1; }

mkdir -p "$BACKUP_DIR"

echo "==> Starting local database"
docker compose up -d --wait

# 覆蓋前先留一份本地現況，萬一 production 那份有問題還能還原。
if docker compose exec -T postgres psql -U "$DB_USER" -d postgres -tAc \
  "select 1 from pg_database where datname='${DB_NAME}'" | grep -q 1; then
  LOCAL_BACKUP="${BACKUP_DIR}/local-${TIMESTAMP}.dump"
  echo "==> Backing up current local database to ${LOCAL_BACKUP}"
  docker compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$LOCAL_BACKUP"
fi

PROD_BACKUP="${BACKUP_DIR}/prod-${TIMESTAMP}.dump"
echo "==> Dumping from production"
docker compose exec -T postgres pg_dump "$PROD_URL" -Fc --no-owner --no-privileges > "$PROD_BACKUP"

# WITH (FORCE) 會踢掉還連著的 session（dev server、Prisma Studio、GUI），
# 否則 Postgres 拒絕 drop 正在使用中的資料庫。PG13+ 才有。
echo "==> Recreating local database"
docker compose exec -T postgres psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)" \
  -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"

echo "==> Restoring"
docker compose exec -T postgres pg_restore -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges < "$PROD_BACKUP"

TABLES=$(docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "select count(*) from information_schema.tables where table_schema='public'")
USERS=$(docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  'select count(*) from "User"')

echo
echo "Done: ${TABLES} tables, ${USERS} users."
echo "Dumps kept in ${BACKUP_DIR}/ "
