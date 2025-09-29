#!/usr/bin/env bash
# Path: scripts/backup_pg.sh
# Encrypted PostgreSQL backups with GPG (symmetric)
set -euo pipefail
: "${PGDATABASE:?}"; : "${PGUSER:?}"; : "${PGPASSWORD:?}"; : "${PGHOST:?}"; : "${GPG_PASSPHRASE:?}"
TS=$(date +%Y%m%d-%H%M%S)
OUT_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$OUT_DIR"
FILE="${OUT_DIR}/pgdump_${PGDATABASE}_${TS}.sql"
echo "Dumping ${PGDATABASE} -> ${FILE}"
PGPASSWORD="${PGPASSWORD}" pg_dump -h "${PGHOST}" -U "${PGUSER}" -F p "${PGDATABASE}" > "${FILE}"
echo "Encrypting with gpg..."
echo "${GPG_PASSPHRASE}" | gpg --batch --yes --passphrase-fd 0 -c -o "${FILE}.gpg" "${FILE}"
shred -u "${FILE}"
# Retention (keep last 14)
ls -1tr ${OUT_DIR}/pgdump_*.sql.gpg | head -n -14 | xargs -r rm -f
echo "Done: ${FILE}.gpg"
