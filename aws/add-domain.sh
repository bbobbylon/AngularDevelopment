#!/usr/bin/env bash
# Put a custom domain in front of the distribution, with HTTPS.
#
#   ./aws/add-domain.sh example.com
#   ./aws/add-domain.sh example.com --no-www     apex only, skip www.example.com
#
# Safe to run against a live site: the certificate is issued and validated *before* the
# distribution is touched, and the existing CloudFront URL keeps working throughout. The
# only moment anything changes for visitors is the final DNS switch, which you make.
#
# Deliberately separate from setup.sh. Buying a domain and waiting on DNS is a different
# kind of task from standing up infrastructure, and bundling them would mean setup.sh
# could not be run until a domain existed.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source aws/config.sh

require_tools

DOMAIN="${1:-}"
[[ -n "$DOMAIN" ]] || die "Usage: ./aws/add-domain.sh <domain> [--no-www]"

if [[ "${2:-}" == "--no-www" ]]; then
  DOMAINS=("$DOMAIN")
else
  DOMAINS=("$DOMAIN" "www.${DOMAIN}")
fi

DISTRIBUTION_COMMENT="${APP_NAME} static site (managed by aws/setup.sh)"
DIST_ID="$(
  aws cloudfront list-distributions --no-cli-pager \
    | jq -r --arg c "$DISTRIBUTION_COMMENT" \
      '.DistributionList.Items[]? | select(.Comment==$c) | .Id' \
    | head -n1
)"
[[ -n "$DIST_ID" ]] || die "No distribution found. Run ./aws/setup.sh first."

# A certificate attached to CloudFront must live in us-east-1. This is not a default that
# can be changed — CloudFront is a global service whose control plane is in us-east-1, and
# a perfectly valid certificate in any other region is simply invisible to it. Pinned here
# rather than relying on AWS_REGION so this stays correct even if the rest ever moves.
ACM_REGION="us-east-1"

# ---------------------------------------------------------------------------------------
say "1/4  Certificate for ${DOMAINS[*]}"
# ---------------------------------------------------------------------------------------

CERT_ARN="$(
  aws acm list-certificates --region "$ACM_REGION" --no-cli-pager \
    | jq -r --arg d "$DOMAIN" \
      '.CertificateSummaryList[]? | select(.DomainName==$d) | .CertificateArn' \
    | head -n1
)"

if [[ -n "$CERT_ARN" ]]; then
  ok "reusing certificate ${CERT_ARN}"
else
  SAN_ARGS=()
  if [[ ${#DOMAINS[@]} -gt 1 ]]; then
    SAN_ARGS=(--subject-alternative-names "${DOMAINS[@]:1}")
  fi
  CERT_ARN="$(
    aws acm request-certificate \
      --domain-name "$DOMAIN" \
      "${SAN_ARGS[@]}" \
      --validation-method DNS \
      --region "$ACM_REGION" \
      --no-cli-pager \
      | jq -r '.CertificateArn'
  )"
  ok "requested ${CERT_ARN}"
  # ACM populates the validation records asynchronously; querying immediately returns
  # nulls. A short pause here avoids printing an empty table and confusing the operator.
  sleep 10
fi

# ---------------------------------------------------------------------------------------
say "2/4  DNS validation"
# ---------------------------------------------------------------------------------------

VALIDATION="$(
  aws acm describe-certificate --certificate-arn "$CERT_ARN" \
    --region "$ACM_REGION" --no-cli-pager \
    | jq -c '[.Certificate.DomainValidationOptions[]?
        | select(.ResourceRecord != null)
        | {name: .ResourceRecord.Name, value: .ResourceRecord.Value}]
        | unique_by(.name)'
)"

CERT_STATUS="$(
  aws acm describe-certificate --certificate-arn "$CERT_ARN" \
    --region "$ACM_REGION" --no-cli-pager | jq -r '.Certificate.Status'
)"

if [[ "$CERT_STATUS" == "ISSUED" ]]; then
  ok "already validated and issued"
else
  # If the domain is hosted in Route 53 the validation records can be written directly;
  # otherwise they have to be added at whatever registrar holds the zone.
  ZONE_ID="$(
    aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" --no-cli-pager 2>/dev/null \
      | jq -r --arg d "${DOMAIN}." '.HostedZones[]? | select(.Name==$d) | .Id' \
      | head -n1 | sed 's|/hostedzone/||'
  )" || ZONE_ID=""

  if [[ -n "$ZONE_ID" ]]; then
    ok "found Route 53 zone ${ZONE_ID} — writing validation records"
    CHANGE_BATCH="$(
      jq -nc --argjson recs "$VALIDATION" '{
        Comment: "ACM DNS validation",
        Changes: [$recs[] | {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: .name,
            Type: "CNAME",
            TTL: 300,
            ResourceRecords: [{ Value: .value }]
          }
        }]
      }'
    )"
    aws route53 change-resource-record-sets \
      --hosted-zone-id "$ZONE_ID" \
      --change-batch "$CHANGE_BATCH" \
      --no-cli-pager >/dev/null
    ok "validation records written"
  else
    warn "no Route 53 zone for ${DOMAIN} — add these CNAME records at your registrar:"
    echo
    echo "$VALIDATION" | jq -r '.[] | "      \(.name)\n        CNAME  \(.value)\n"'
  fi

  say "Waiting for ACM to validate (can take a few minutes, occasionally up to 30)"
  aws acm wait certificate-validated \
    --certificate-arn "$CERT_ARN" --region "$ACM_REGION" --no-cli-pager
  ok "certificate issued"
fi

# ---------------------------------------------------------------------------------------
say "3/4  Attaching to distribution ${DIST_ID}"
# ---------------------------------------------------------------------------------------

# CloudFront has no partial update: update-distribution replaces the whole config, and it
# is optimistically locked by ETag. So the safe shape is always read → modify → write with
# --if-match, never build a config from scratch. Doing the latter is how people silently
# drop their cache behaviours.
CURRENT="$(aws cloudfront get-distribution-config --id "$DIST_ID" --no-cli-pager)"
ETAG="$(echo "$CURRENT" | jq -r '.ETag')"

ALIASES_JSON="$(printf '%s\n' "${DOMAINS[@]}" | jq -R . | jq -sc .)"

NEW_CONFIG="$(
  echo "$CURRENT" | jq -c \
    --arg cert "$CERT_ARN" \
    --argjson aliases "$ALIASES_JSON" \
    '.DistributionConfig
     | .Aliases = { Quantity: ($aliases | length), Items: $aliases }
     | .ViewerCertificate = {
         ACMCertificateArn: $cert,
         SSLSupportMethod: "sni-only",
         MinimumProtocolVersion: "TLSv1.2_2021",
         Certificate: $cert,
         CertificateSource: "acm"
       }'
)"

aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config "$NEW_CONFIG" \
  --no-cli-pager >/dev/null
ok "aliases set: ${DOMAINS[*]}"

DIST_DOMAIN="$(
  aws cloudfront get-distribution --id "$DIST_ID" --no-cli-pager \
    | jq -r '.Distribution.DomainName'
)"

# ---------------------------------------------------------------------------------------
say "4/4  Point DNS at CloudFront"
# ---------------------------------------------------------------------------------------

cat <<EOF

    Target: ${DIST_DOMAIN}

    Route 53   A / AAAA  ALIAS records to that target (free, and works at the apex)
    Elsewhere  apex  ->  ALIAS/ANAME/flattened-CNAME to ${DIST_DOMAIN}
               www   ->  CNAME to ${DIST_DOMAIN}

    A plain CNAME is not legal at a zone apex. If your registrar has no ALIAS-style
    record, either move the zone to Route 53 or serve from www and redirect the apex.

    The distribution takes ~5-10 minutes to redeploy with the new aliases. Until then
    the domain will serve a certificate mismatch — that is expected, not a failure.

EOF
