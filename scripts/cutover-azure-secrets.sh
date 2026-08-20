#!/usr/bin/env bash
# Cuts over all 8 NexusCart Azure Container Apps from Azure Cosmos DB to the
# new Oracle Autonomous JSON Database, by updating the shared `mongodb-uri`
# secret on each app. This is the final, production-facing step — run it only
# after migrate-cosmos-to-oracle.sh and validate-migration.js both succeed.
#
# DO NOT run this until data has been migrated and validated. payment-service
# and order-service will start reading/writing the new database as soon as
# each app restarts.
#
# Usage:
#   TARGET_MONGODB_URI="mongodb://nexuscart:<pw>@<host>:27017/nexuscart?authMechanism=PLAIN&authSource=\$external&ssl=true&retryWrites=false&loadBalanced=true" \
#     ./cutover-azure-secrets.sh

set -euo pipefail

: "${TARGET_MONGODB_URI:?Set TARGET_MONGODB_URI to the Oracle Mongo API connection string}"

RESOURCE_GROUP="NexusCart-RG"
SERVICES=(
  auth-service
  product-service
  order-service
  payment-service
  business-service
  review-rating-service
  notification-service
  admin-service
)

echo "About to point these Container Apps at the new Oracle database:"
printf '  - %s\n' "${SERVICES[@]}"
read -r -p "Type 'yes' to proceed: " confirm
[ "$confirm" = "yes" ] || { echo "Aborted."; exit 1; }

for svc in "${SERVICES[@]}"; do
  echo "==> Updating secret on $svc"
  az containerapp secret set \
    --name "$svc" \
    --resource-group "$RESOURCE_GROUP" \
    --secrets "mongodb-uri=$TARGET_MONGODB_URI"

  # Secret update alone doesn't restart a running revision; force a new
  # revision so the app actually picks up the new connection string.
  az containerapp update \
    --name "$svc" \
    --resource-group "$RESOURCE_GROUP" \
    --revision-suffix "oracle-cutover-$(date +%s)"
done

echo "==> Cutover triggered on all 8 services."
echo "    Watch logs: az containerapp logs show --name <service> --resource-group $RESOURCE_GROUP --follow"
echo "    Old Cosmos DB account can be deleted only after confirming all services are healthy."
