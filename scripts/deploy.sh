#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [[ -z "${IMAGE_TAG:-}" ]]; then
  echo "ERROR: IMAGE_TAG is required (for example: IMAGE_TAG=sha-<commit-sha> bash scripts/deploy.sh)." >&2
  exit 1
fi

TAG_FILE=".deployed-tag"
PREVIOUS_TAG=""
if [[ -f "$TAG_FILE" ]]; then
  IFS= read -r PREVIOUS_TAG < "$TAG_FILE" || true
fi

printf '%s\n' "$IMAGE_TAG" > "$TAG_FILE"

docker compose pull auth-service content-service api-gateway frontend
docker compose up -d --no-build --remove-orphans

ok=0
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5000/api/health >/dev/null 2>&1; then ok=1; break; fi
  sleep 2
done

if [[ "$ok" -eq 1 ]]; then
  echo "Deployment health check passed for IMAGE_TAG=$IMAGE_TAG."
  exit 0
fi

echo "ERROR: health check failed for IMAGE_TAG=$IMAGE_TAG." >&2
if [[ -n "$PREVIOUS_TAG" ]]; then
  echo "Rolling back to IMAGE_TAG=$PREVIOUS_TAG." >&2
  printf '%s\n' "$PREVIOUS_TAG" > "$TAG_FILE"
  if docker compose pull auth-service content-service api-gateway frontend &&
    docker compose up -d --no-build --remove-orphans; then
    echo "Rollback commands completed for IMAGE_TAG=$PREVIOUS_TAG." >&2
  else
    echo "ERROR: rollback commands failed for IMAGE_TAG=$PREVIOUS_TAG." >&2
  fi
fi

exit 1
