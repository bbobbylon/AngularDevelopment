#!/usr/bin/env bash
# Build the app and publish it. Run this every time you want the live site updated.
#
#   ./aws/deploy.sh              build, upload, invalidate
#   ./aws/deploy.sh --no-build   upload whatever is already in dist/ (faster re-push)
#
# Assumes ./aws/setup.sh has been run at least once.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source aws/config.sh

require_tools

DISTRIBUTION_COMMENT="${APP_NAME} static site (managed by aws/setup.sh)"
SKIP_BUILD=false
[[ "${1:-}" == "--no-build" ]] && SKIP_BUILD=true

DIST_ID="$(
  aws cloudfront list-distributions --no-cli-pager \
    | jq -r --arg c "$DISTRIBUTION_COMMENT" \
      '.DistributionList.Items[]? | select(.Comment==$c) | .Id' \
    | head -n1
)"
[[ -n "$DIST_ID" ]] || die "No distribution found. Run ./aws/setup.sh first."

# ---------------------------------------------------------------------------------------
if [[ "$SKIP_BUILD" == false ]]; then
  say "Building"
  # --base-href=/ because CloudFront serves the app from the domain root. This differs
  # from .github/workflows/deploy-github-pages.yml, which needs /AngularDevelopment/
  # since Pages serves out of a repo subpath. Getting this wrong is silent: the page
  # loads, every asset 404s, and you get a blank screen with no server-side error.
  npx ng build --configuration production --base-href=/
  ok "built"
else
  warn "skipping build (--no-build)"
fi

[[ -d "$DIST_DIR" ]] || die "$DIST_DIR does not exist. Build first."
[[ -f "$DIST_DIR/index.html" ]] || die "$DIST_DIR/index.html missing — wrong DIST_DIR?"

# ---------------------------------------------------------------------------------------
say "Uploading to s3://${BUCKET}"

# Two passes, because the right Cache-Control differs by file and S3 stores it per object
# at upload time — there is no way to set it later without re-copying.
#
# Pass 1 — everything with a content hash in its filename (main-A1B2C3D4.js, styles-….css,
# media). Those names change whenever the content changes, so they can be cached forever.
#
# Note the excludes for _headers and _redirects: those are Netlify/Cloudflare control files
# that exist for the Pages deployment. On S3 they are inert — just two text files a visitor
# could fetch — so they are left out. Their jobs are done here by the CloudFront response
# headers policy (security headers) and the custom error responses (SPA rewrites).
aws s3 sync "$DIST_DIR" "s3://${BUCKET}" \
  --delete \
  --exclude "index.html" \
  --exclude "*.webmanifest" \
  --exclude "_headers" \
  --exclude "_redirects" \
  --cache-control "public,max-age=31536000,immutable" \
  --no-cli-pager
ok "hashed assets uploaded (immutable, 1 year)"

# Pass 2 — the entry point and the manifest. These keep the same name across every deploy,
# so caching them is how you ship an update nobody sees. no-cache does not mean "don't
# store"; it means the browser must revalidate before reusing, which is exactly right for
# a small file that points at everything else.
aws s3 cp "$DIST_DIR/index.html" "s3://${BUCKET}/index.html" \
  --cache-control "no-cache" \
  --content-type "text/html; charset=utf-8" \
  --no-cli-pager >/dev/null
ok "index.html uploaded (no-cache)"

for manifest in "$DIST_DIR"/*.webmanifest; do
  [[ -e "$manifest" ]] || break
  aws s3 cp "$manifest" "s3://${BUCKET}/$(basename "$manifest")" \
    --cache-control "no-cache" \
    --content-type "application/manifest+json" \
    --no-cli-pager >/dev/null
  ok "$(basename "$manifest") uploaded (no-cache)"
done

# ---------------------------------------------------------------------------------------
say "Invalidating CloudFront cache"

# MSYS/Git Bash rewrites anything that looks like a Unix path into a Windows path before
# the program is executed, so "/*" arrives at the AWS CLI as something like "C:/Program
# Files/Git/*" and the invalidation silently covers nothing. These two variables — one for
# Git Bash, one for MSYS2 — turn that rewriting off for this command only.
#
# "/*" is billed as a single path, and the first 1000 paths each month are free, so there
# is no reason to be clever about narrowing it.
INVALIDATION_ID="$(
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' \
    aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" \
    --paths '/*' \
    --no-cli-pager \
    | jq -r '.Invalidation.Id'
)"
ok "invalidation ${INVALIDATION_ID} submitted (usually clears within a minute)"

DIST_DOMAIN="$(
  aws cloudfront get-distribution --id "$DIST_ID" --no-cli-pager \
    | jq -r '.Distribution.DomainName'
)"

ALIASES="$(
  aws cloudfront get-distribution --id "$DIST_ID" --no-cli-pager \
    | jq -r '.Distribution.DistributionConfig.Aliases.Items[]?'
)"

say "Live"
echo "    https://${DIST_DOMAIN}"
for alias in $ALIASES; do echo "    https://${alias}"; done
echo
