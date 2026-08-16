#!/usr/bin/env bash
# Dump the production Supabase database (schema + data) to ./db-dumps/
#
# Usage:
#   export PROD_DB_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres'
#   ./scripts/dump-prod.sh
#
# Get PROD_DB_URL from: Supabase dashboard -> Settings -> Database ->
# Connection string -> URI. Use the DIRECT connection (port 5432), not the
# pooler (6543) -- pg_dump needs a session connection.
#
# Output (all gitignored):
#   db-dumps/<stamp>/schema.sql      public schema DDL only
#   db-dumps/<stamp>/data.sql        public schema data only
#   db-dumps/<stamp>/auth-users.sql  auth.users rows (needed for FKs)
#   db-dumps/<stamp>/full.dump       custom-format archive for pg_restore

set -euo pipefail

if [[ -z "${PROD_DB_URL:-}" ]]; then
  echo "ERROR: PROD_DB_URL is not set." >&2
  echo "  export PROD_DB_URL='postgresql://postgres:...@db.xxx.supabase.co:5432/postgres'" >&2
  exit 1
fi

# Supabase runs PG 15 or 17 depending on when the project was created.
# pg_dump refuses to dump a server newer than itself.
server_version=$(psql "$PROD_DB_URL" -tAc 'show server_version_num' 2>/dev/null || echo "")
if [[ -z "$server_version" ]]; then
  echo "ERROR: could not connect. Check PROD_DB_URL and that your IP is allowed." >&2
  exit 1
fi

client_major=$(pg_dump --version | grep -oE '[0-9]+' | head -1)
server_major=$((server_version / 10000))

if (( client_major < server_major )); then
  echo "ERROR: pg_dump is v${client_major} but the server is v${server_major}." >&2
  echo "  Fix: brew install postgresql@${server_major}" >&2
  echo "       export PATH=\"/opt/homebrew/opt/postgresql@${server_major}/bin:\$PATH\"" >&2
  exit 1
fi

stamp=$(date +%Y-%m-%d_%H%M%S)
out="db-dumps/${stamp}"
mkdir -p "$out"

echo "Server: PostgreSQL ${server_major}  |  Output: ${out}/"

echo "  [1/4] schema.sql"
pg_dump "$PROD_DB_URL" \
  --schema=public --schema-only --no-owner --no-privileges \
  -f "${out}/schema.sql"

echo "  [2/4] data.sql"
pg_dump "$PROD_DB_URL" \
  --schema=public --data-only --no-owner --no-privileges \
  --disable-triggers \
  -f "${out}/data.sql"

# public.profiles.id references auth.users(id). Restoring public data without
# these rows fails every profiles insert on the FK constraint.
echo "  [3/4] auth-users.sql"
pg_dump "$PROD_DB_URL" \
  --table=auth.users --data-only --no-owner --no-privileges \
  -f "${out}/auth-users.sql"

echo "  [4/4] full.dump"
pg_dump "$PROD_DB_URL" \
  --schema=public --format=custom --no-owner --no-privileges \
  -f "${out}/full.dump"

echo
echo "Done."
du -h "${out}"/* | sed 's/^/  /'
