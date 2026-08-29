#!/usr/bin/env bash
# Tear everything down. Deliberately separate from setup.sh, deliberately interactive.
#
#   ./aws/destroy.sh
#
# Deletes the CloudFront distribution, the S3 bucket and everything in it, and the OAC.
# Does NOT delete the ACM certificate (free, and reusable if you rebuild) or any DNS
# records (they may not be yours to remove).

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source aws/config.sh

require_tools

DISTRIBUTION_COMMENT="${APP_NAME} static site (managed by aws/setup.sh)"
OAC_NAME="${APP_NAME}-oac"

DIST_ID="$(
  aws cloudfront list-distributions --no-cli-pager \
    | jq -r --arg c "$DISTRIBUTION_COMMENT" \
      '.DistributionList.Items[]? | select(.Comment==$c) | .Id' \
    | head -n1
)"

cat <<EOF

  About to permanently delete:

    Distribution  ${DIST_ID:-<none found>}
    Bucket        s3://${BUCKET}  (and every object in it)
    OAC           ${OAC_NAME}

EOF

read -r -p "  Type the bucket name to confirm: " CONFIRM
[[ "$CONFIRM" == "$BUCKET" ]] || die "Did not match. Nothing was deleted."

# ---------------------------------------------------------------------------------------
if [[ -n "$DIST_ID" ]]; then
  say "Disabling distribution ${DIST_ID}"

  # A distribution cannot be deleted while enabled, and the disable itself has to propagate
  # to every edge location first. This is the slow part — budget 15 minutes — and there is
  # no way to shorten it.
  CURRENT="$(aws cloudfront get-distribution-config --id "$DIST_ID" --no-cli-pager)"
  ETAG="$(echo "$CURRENT" | jq -r '.ETag')"
  ENABLED="$(echo "$CURRENT" | jq -r '.DistributionConfig.Enabled')"

  if [[ "$ENABLED" == "true" ]]; then
    aws cloudfront update-distribution \
      --id "$DIST_ID" \
      --if-match "$ETAG" \
      --distribution-config "$(echo "$CURRENT" | jq -c '.DistributionConfig | .Enabled = false')" \
      --no-cli-pager >/dev/null
    ok "disable submitted"
  else
    ok "already disabled"
  fi

  say "Waiting for the disable to propagate (this is the ~15 minute step)"
  aws cloudfront wait distribution-deployed --id "$DIST_ID" --no-cli-pager
  ok "propagated"

  # The ETag changes with every update, so it has to be re-read before the delete.
  ETAG="$(aws cloudfront get-distribution-config --id "$DIST_ID" --no-cli-pager | jq -r '.ETag')"
  aws cloudfront delete-distribution --id "$DIST_ID" --if-match "$ETAG" --no-cli-pager
  ok "distribution deleted"
fi

# ---------------------------------------------------------------------------------------
say "Emptying and deleting s3://${BUCKET}"
if aws s3api head-bucket --bucket "$BUCKET" --no-cli-pager 2>/dev/null; then
  aws s3 rm "s3://${BUCKET}" --recursive --no-cli-pager >/dev/null
  aws s3api delete-bucket --bucket "$BUCKET" --no-cli-pager
  ok "bucket deleted"
else
  ok "bucket already gone"
fi

# ---------------------------------------------------------------------------------------
say "Deleting OAC"
OAC_ID="$(
  aws cloudfront list-origin-access-controls --no-cli-pager \
    | jq -r --arg n "$OAC_NAME" '.OriginAccessControlList.Items[]? | select(.Name==$n) | .Id' \
    | head -n1
)"
if [[ -n "$OAC_ID" ]]; then
  OAC_ETAG="$(
    aws cloudfront get-origin-access-control --id "$OAC_ID" --no-cli-pager | jq -r '.ETag'
  )"
  aws cloudfront delete-origin-access-control --id "$OAC_ID" --if-match "$OAC_ETAG" --no-cli-pager
  ok "OAC deleted"
else
  ok "OAC already gone"
fi

say "Done — the ACM certificate and any DNS records were left alone"
