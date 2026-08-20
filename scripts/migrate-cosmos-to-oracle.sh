#!/usr/bin/env bash
# Migrates NexusCart's MongoDB data from Azure Cosmos DB (Mongo API) to
# Oracle Autonomous JSON Database (Oracle Database API for MongoDB).
#
# Prerequisites (see docs/OCI_MIGRATION.md):
#   - mongodump / mongorestore (MongoDB Database Tools) installed and on PATH
#   - ORDS.ENABLE_SCHEMA already run for the target Oracle schema
#   - SOURCE_MONGODB_URI  = current backend/.env MONGODB_URI (Cosmos DB)
#   - TARGET_MONGODB_URI  = Oracle Mongo API URI, e.g.:
#       mongodb://nexuscart:<APP_PASSWORD>@<ADB_HOST>:27017/nexuscart?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true
#
# Usage:
#   SOURCE_MONGODB_URI="..." TARGET_MONGODB_URI="..." ./migrate-cosmos-to-oracle.sh

set -euo pipefail

: "${SOURCE_MONGODB_URI:?Set SOURCE_MONGODB_URI to the Cosmos DB connection string}"
: "${TARGET_MONGODB_URI:?Set TARGET_MONGODB_URI to the Oracle Mongo API connection string}"

TARGET_SCHEMA="${TARGET_SCHEMA:-nexuscart}"
DUMP_DIR="${DUMP_DIR:-./cosmos-dump-$(date +%Y%m%d-%H%M%S)}"
MAX_RETRIES=6

echo "==> Dumping from Cosmos DB into $DUMP_DIR"
mkdir -p "$DUMP_DIR"

# Cosmos DB Mongo API throttles on RU exhaustion (error 16500 / "TooManyRequests").
# mongodump doesn't retry that itself, so wrap the whole dump in a retry loop with backoff.
attempt=1
until mongodump --uri="$SOURCE_MONGODB_URI" --out="$DUMP_DIR" --numParallelCollections=1; do
  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    echo "mongodump failed after $MAX_RETRIES attempts (likely RU throttling). Consider" >&2
    echo "temporarily scaling up Cosmos RU/s before retrying." >&2
    exit 1
  fi
  wait_s=$((attempt * 15))
  echo "mongodump attempt $attempt failed, retrying in ${wait_s}s..." >&2
  sleep "$wait_s"
  attempt=$((attempt + 1))
done

echo "==> Dump complete. Databases found:"
SOURCE_DBS=()
for d in "$DUMP_DIR"/*/; do
  db_name="$(basename "$d")"
  [ "$db_name" = "admin" ] || [ "$db_name" = "local" ] || [ "$db_name" = "config" ] && continue
  SOURCE_DBS+=("$db_name")
  echo "  - $db_name"
done

if [ "${#SOURCE_DBS[@]}" -eq 0 ]; then
  echo "No non-system databases found in dump. Nothing to restore." >&2
  exit 1
fi

echo "==> Restoring into Oracle schema '$TARGET_SCHEMA' (one restore per source db — ORDS does not support combining multiple --nsInclude in a single restore)"
for db_name in "${SOURCE_DBS[@]}"; do
  echo "--- Restoring $db_name -> $TARGET_SCHEMA ---"
  mongorestore \
    --uri="$TARGET_MONGODB_URI" \
    --nsInclude="${db_name}.*" \
    --nsFrom="${db_name}.*" \
    --nsTo="${TARGET_SCHEMA}.*" \
    --dir="$DUMP_DIR" \
    --numInsertionWorkersPerCollection=1
done

echo "==> Migration complete. Run validate-migration.js next to compare document counts."
