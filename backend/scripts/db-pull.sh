#!/usr/bin/env bash
#
# Copy the production (Neon) database into the local Docker Postgres.
#
#   npm run db:pull
#
# Requires PROD_DATABASE_URL in .env.

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

# The environment variable wins so another source can be pointed at ad hoc;
# normally this is read from .env.
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

# Snapshot the current local database before overwriting it, so it can be
# restored if the production dump turns out to be bad.
if docker compose exec -T postgres psql -U "$DB_USER" -d postgres -tAc \
  "select 1 from pg_database where datname='${DB_NAME}'" | grep -q 1; then
  LOCAL_BACKUP="${BACKUP_DIR}/local-${TIMESTAMP}.dump"
  echo "==> Backing up current local database to ${LOCAL_BACKUP}"
  docker compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$LOCAL_BACKUP"
fi

PROD_BACKUP="${BACKUP_DIR}/prod-${TIMESTAMP}.dump"
echo "==> Dumping from production"
docker compose exec -T postgres pg_dump "$PROD_URL" -Fc --no-owner --no-privileges > "$PROD_BACKUP"

# WITH (FORCE) terminates sessions that are still connected (dev server,
# Prisma Studio, GUI clients); otherwise Postgres refuses to drop a database
# that is in use. Requires PG13+.
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
