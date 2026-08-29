#!/usr/bin/env bash
# One-time (but safely repeatable) infrastructure bootstrap.
#
#   ./aws/setup.sh
#
# Creates, in order:
#   1. a private S3 bucket to hold the built site
#   2. a CloudFront Origin Access Control (OAC) so only CloudFront can read that bucket
#   3. a CloudFront distribution in front of it, with SPA deep-link handling
#   4. a bucket policy scoped to exactly that one distribution
#
# Every step checks for the existing resource first, so running this twice is a no-op that
# just reprints the URL. Nothing here is destructive and nothing is deleted — teardown is
# ./aws/destroy.sh, deliberately separate.
#
# Resource discovery is done by *querying AWS*, never by reading a local state file. A
# state file goes stale the moment anyone touches the console, and CloudFront ids are not
# predictable enough to hard-code. The distribution is found by its Comment field, which
# this script owns.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source aws/config.sh

require_tools

DISTRIBUTION_COMMENT="${APP_NAME} static site (managed by aws/setup.sh)"
OAC_NAME="${APP_NAME}-oac"

# ---------------------------------------------------------------------------------------
say "1/4  S3 bucket: ${BUCKET}"
# ---------------------------------------------------------------------------------------

if aws s3api head-bucket --bucket "$BUCKET" --no-cli-pager 2>/dev/null; then
  ok "bucket already exists"
else
  # us-east-1 is the one region where create-bucket must NOT be given a
  # LocationConstraint — passing it there is an InvalidLocationConstraint error, while
  # omitting it anywhere else silently creates the bucket in us-east-1.
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --no-cli-pager >/dev/null
  else
    aws s3api create-bucket --bucket "$BUCKET" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}" \
      --no-cli-pager >/dev/null
  fi
  ok "bucket created"
fi

# Block Public Access stays fully ON. This is the deliberate difference from a classic
# "S3 static website hosting" setup: the bucket is never public, and CloudFront reaches it
# with signed requests via OAC. That means the playbook's Block-Public-Access gotcha simply
# does not apply here — there is nothing to turn off.
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --no-cli-pager
ok "public access blocked (CloudFront reaches it via OAC, not anonymously)"

aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
  --no-cli-pager
ok "default encryption on"

# ---------------------------------------------------------------------------------------
say "2/4  Origin Access Control"
# ---------------------------------------------------------------------------------------

OAC_ID="$(
  aws cloudfront list-origin-access-controls --no-cli-pager \
    | jq -r --arg n "$OAC_NAME" '.OriginAccessControlList.Items[]? | select(.Name==$n) | .Id' \
    | head -n1
)"

if [[ -n "$OAC_ID" ]]; then
  ok "reusing OAC ${OAC_ID}"
else
  OAC_ID="$(
    aws cloudfront create-origin-access-control --no-cli-pager \
      --origin-access-control-config "$(
        jq -nc --arg n "$OAC_NAME" '{
          Name: $n,
          Description: "Lets only this CloudFront distribution read the private site bucket",
          SigningProtocol: "sigv4",
          SigningBehavior: "always",
          OriginAccessControlOriginType: "s3"
        }'
      )" \
    | jq -r '.OriginAccessControl.Id'
  )"
  ok "created OAC ${OAC_ID}"
fi

# ---------------------------------------------------------------------------------------
say "3/4  CloudFront distribution"
# ---------------------------------------------------------------------------------------

find_distribution() {
  aws cloudfront list-distributions --no-cli-pager \
    | jq -r --arg c "$DISTRIBUTION_COMMENT" \
      '.DistributionList.Items[]? | select(.Comment==$c) | .Id' \
    | head -n1
}

DIST_ID="$(find_distribution)"

if [[ -n "$DIST_ID" ]]; then
  ok "reusing distribution ${DIST_ID}"
else
  # The REST origin (bucket.s3.region.amazonaws.com), NOT the website endpoint
  # (bucket.s3-website-region.amazonaws.com). Only the REST origin supports OAC; the
  # website endpoint requires a public bucket. The trade-off is that the REST origin has
  # no built-in "redirect missing keys to index.html" behaviour, which is what the
  # CustomErrorResponses below exist to replace.
  ORIGIN_DOMAIN="${BUCKET}.s3.${AWS_REGION}.amazonaws.com"

  DIST_CONFIG="$(
    jq -nc \
      --arg ref "${APP_NAME}-$(date +%s)" \
      --arg comment "$DISTRIBUTION_COMMENT" \
      --arg origin "$ORIGIN_DOMAIN" \
      --arg oac "$OAC_ID" \
      --arg cache "$CACHE_POLICY_ID" \
      --arg headers "$RESPONSE_HEADERS_POLICY_ID" \
      '{
        CallerReference: $ref,
        Comment: $comment,
        Enabled: true,
        DefaultRootObject: "index.html",
        HttpVersion: "http2and3",
        IsIPV6Enabled: true,
        PriceClass: "PriceClass_100",
        Origins: {
          Quantity: 1,
          Items: [{
            Id: "s3-site-origin",
            DomainName: $origin,
            OriginAccessControlId: $oac,
            S3OriginConfig: { OriginAccessIdentity: "" },
            OriginShield: { Enabled: false },
            ConnectionAttempts: 3,
            ConnectionTimeout: 10
          }]
        },
        DefaultCacheBehavior: {
          TargetOriginId: "s3-site-origin",
          ViewerProtocolPolicy: "redirect-to-https",
          Compress: true,
          AllowedMethods: {
            Quantity: 2,
            Items: ["GET", "HEAD"],
            CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] }
          },
          CachePolicyId: $cache,
          ResponseHeadersPolicyId: $headers
        },
        CustomErrorResponses: {
          Quantity: 2,
          Items: [
            {
              ErrorCode: 403,
              ResponsePagePath: "/index.html",
              ResponseCode: "200",
              ErrorCachingMinTTL: 10
            },
            {
              ErrorCode: 404,
              ResponsePagePath: "/index.html",
              ResponseCode: "200",
              ErrorCachingMinTTL: 10
            }
          ]
        }
      }'
  )"

  # Inline JSON, not file://. The playbook is emphatic about this and it matters more on
  # Windows than anywhere else: a file:// argument gets its path rewritten by MSYS before
  # the CLI ever sees it, and the resulting error blames the JSON rather than the path.
  DIST_ID="$(
    aws cloudfront create-distribution --no-cli-pager \
      --distribution-config "$DIST_CONFIG" \
      | jq -r '.Distribution.Id'
  )"
  ok "created distribution ${DIST_ID}"
  warn "a new distribution takes ~5-10 minutes to finish deploying to every edge location"
fi

DIST_DOMAIN="$(
  aws cloudfront get-distribution --id "$DIST_ID" --no-cli-pager \
    | jq -r '.Distribution.DomainName'
)"

# ---------------------------------------------------------------------------------------
say "4/4  Bucket policy"
# ---------------------------------------------------------------------------------------

# Written after the distribution exists, because the policy names the distribution ARN in
# its condition — this is what stops any *other* CloudFront distribution, in this account
# or anyone else's, from being pointed at the bucket.
BUCKET_POLICY="$(
  jq -nc \
    --arg bucket "$BUCKET" \
    --arg arn "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}" \
    '{
      Version: "2012-10-17",
      Statement: [{
        Sid: "AllowThisCloudFrontDistributionReadOnly",
        Effect: "Allow",
        Principal: { Service: "cloudfront.amazonaws.com" },
        Action: "s3:GetObject",
        Resource: ("arn:aws:s3:::" + $bucket + "/*"),
        Condition: { StringEquals: { "AWS:SourceArn": $arn } }
      }]
    }'
)"

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$BUCKET_POLICY" --no-cli-pager
ok "bucket readable only by distribution ${DIST_ID}"

# ---------------------------------------------------------------------------------------
say "Done"
# ---------------------------------------------------------------------------------------
cat <<EOF

    Bucket        s3://${BUCKET}
    Distribution  ${DIST_ID}
    URL           https://${DIST_DOMAIN}

    Next:  ./aws/deploy.sh          build and publish
           ./aws/add-domain.sh ...  put a custom domain in front of it

EOF
