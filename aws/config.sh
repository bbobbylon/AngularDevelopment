#!/usr/bin/env bash
# Shared configuration for every script in this directory.
#
# Sourced, never run directly. Change APP_NAME for a different project and the rest
# follows — this file is the only thing that should need editing when reusing the
# aws/ directory somewhere else.

set -euo pipefail

# --- app identity -------------------------------------------------------------------
APP_NAME="${APP_NAME:-angulartutorials}"

# S3 bucket names are globally unique across all AWS accounts, so the account id is
# appended rather than hoping "angulartutorials" is free.
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --no-cli-pager)"
BUCKET="${BUCKET:-${APP_NAME}-site-${ACCOUNT_ID}}"

# --- region -------------------------------------------------------------------------
# us-east-1 everywhere, deliberately. ACM certificates attached to CloudFront must be
# issued in us-east-1 no matter where anything else lives, so using one region avoids
# a split-brain setup later when a domain is added.
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"

# --- build output ---------------------------------------------------------------------
# Angular's application builder emits the browser bundle into browser/ under the dist
# directory. This is the directory that gets uploaded; nothing above it should be.
DIST_DIR="${DIST_DIR:-dist/${APP_NAME}/browser}"

# --- CloudFront managed policy ids ----------------------------------------------------
# AWS-managed, identical in every account, so they are safe to hard-code and save
# maintaining our own policy objects.
#   CachingOptimized     — respects our Cache-Control headers, compresses, long TTLs
#   SecurityHeadersPolicy — HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors
CACHE_POLICY_ID="658327ea-f89d-4fab-a63d-7e88639e58f6"
RESPONSE_HEADERS_POLICY_ID="67f7725c-6f97-4210-82d7-5512b31e9d03"

# --- the pager trap -------------------------------------------------------------------
# AWS CLI v2 pipes every response through a pager by default. A command returning a large
# object then looks like a frozen terminal, and inside a script or CI job — where there is
# no terminal to page to — it blocks with no error at all. Belt and braces: the env var
# here, plus --no-cli-pager on individual calls.
export AWS_PAGER=""

# --- helpers --------------------------------------------------------------------------
say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[0;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

require_tools() {
  command -v aws >/dev/null || die "AWS CLI v2 not found. winget install Amazon.AWSCLI"
  command -v jq  >/dev/null || die "jq not found. winget install jqlang.jq"
  aws sts get-caller-identity --no-cli-pager >/dev/null 2>&1 \
    || die "AWS credentials not working. Run: aws configure"
}
