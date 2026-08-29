# AWS Deployment

**Version:** 1.0
**Last Updated:** 2026-08-29
**Author:** Bobby Oliver
**Status:** Draft — scripts written and reviewed, not yet run against a live account

## Overview

Four shell scripts that put this app on S3 + CloudFront with HTTPS, and take it down again.
They are idempotent, they discover their own resources by querying AWS rather than reading
a state file, and they are written to be copied into another project by editing one
variable.

## Table of Contents

- [Quick start](#quick-start)
- [What gets created](#what-gets-created)
- [Why not ECS](#why-not-ecs)
- [Design decisions](#design-decisions)
- [Gotcha catalog](#gotcha-catalog)
- [Reusing this in another project](#reusing-this-in-another-project)
- [Related documents](#related-documents)

---

## Quick start

Prerequisites: AWS CLI v2, `jq`, credentials that can create S3/CloudFront/ACM resources.

```bash
./aws/setup.sh          # once — creates the bucket, OAC, and distribution
./aws/deploy.sh         # every time — builds, uploads, invalidates
```

`setup.sh` prints the CloudFront URL when it finishes. The distribution takes 5–10 minutes
to reach every edge location on first creation; `deploy.sh` works immediately either way.

Later, when a domain exists:

```bash
./aws/add-domain.sh example.com
```

And to remove everything:

```bash
./aws/destroy.sh
```

| Script          | Idempotent | Destructive | Slow                                |
| --------------- | ---------- | ----------- | ----------------------------------- |
| `setup.sh`      | yes        | no          | ~1 min (distribution deploys after) |
| `deploy.sh`     | yes        | no          | ~1 min + build                      |
| `add-domain.sh` | yes        | no          | minutes, waits on DNS validation    |
| `destroy.sh`    | yes        | **yes**     | ~15 min (CloudFront disable)        |

---

## What gets created

```
                    ┌─────────────────────────┐
   visitor  ──────► │  CloudFront distribution │
                    │  · HTTPS, HTTP/3         │
                    │  · SecurityHeadersPolicy │
                    │  · 403/404 → /index.html │
                    └───────────┬─────────────┘
                                │ signed request (SigV4)
                                │ via Origin Access Control
                    ┌───────────▼─────────────┐
                    │  S3 bucket (PRIVATE)     │
                    │  Block Public Access ON  │
                    │  policy: this dist only  │
                    └─────────────────────────┘
```

Four resources: an S3 bucket, an Origin Access Control, a CloudFront distribution, and a
bucket policy. That is the whole footprint. Realistically a few cents to a couple of
dollars a month for a personal-traffic static site — S3 storage for ~1 MB of bundle is
negligible and CloudFront's free tier covers 1 TB out per month.

---

## Why not ECS

The AWS Deployment Playbook this borrows its conventions from targets a containerized
Spring Boot app: ECS Fargate behind an ALB, with a managed MySQL instance, running roughly
$50–60/month. Every one of those pieces exists to run server-side code.

This app has no server-side code. It is a static bundle — `ng build` produces HTML, JS, CSS
and nothing else, and the repo's `Dockerfile`/`nginx.conf` exist only to serve those files.
Running a container to hand out static files means paying for an always-on task, an ALB, and
a NAT path, to do a job a CDN does better and for cents.

So the topology is different on purpose. What carries over from the playbook is everything
that is actually about working with AWS: idempotent scripts, dynamic resource discovery,
inline JSON, the pager trap, the MSYS path trap, and the us-east-1 certificate rule.

This shape also scales far better toward the "every repo replicated to a website" goal — a
bucket and a distribution per project is cheap enough to be uninteresting, where a Fargate
task per project is not.

---

## Design decisions

### Private bucket + OAC, not S3 static website hosting

S3's built-in website hosting is the obvious route and it is the wrong one here. It requires
a **public** bucket, serves plain HTTP at the origin, and cannot be reached over OAC. The
private-bucket-plus-OAC arrangement keeps Block Public Access fully on and makes the bucket
readable by exactly one distribution, named by ARN in the bucket policy condition.

The trade-off is that the REST origin has no equivalent of website hosting's "redirect
missing keys to index.html", which is what the custom error responses replace.

### 403 → index.html, not just 404

This is the detail that catches people. With a **public** bucket, a missing key returns 404.
With a **private** bucket where the policy grants only `s3:GetObject` and not
`s3:ListBucket`, S3 returns **403** for a missing key instead — it will not confirm or deny
existence to a caller that cannot list. Handling only 404 means every SPA deep link
(`/lesson/signals`, `/mock-exam`) serves an access-denied page. Both codes are mapped.

`ErrorCachingMinTTL` is 10 seconds rather than the 300 default, so a genuinely broken
deploy is not pinned in cache while you fix it.

### Two-pass upload with split Cache-Control

Angular fingerprints its output (`main-A1B2C3D4.js`), so those files can be
`max-age=31536000, immutable` — the name changes whenever the content does. `index.html`
keeps its name forever, so it gets `no-cache`, meaning "revalidate before reusing" rather
than "never store".

S3 stores Cache-Control per object at upload time; there is no way to set it afterwards
without re-copying. Hence two passes rather than one sync.

### `_headers` and `_redirects` are not uploaded

Those are Netlify/Cloudflare Pages control files. On S3 they are inert text files a visitor
could fetch. Their two jobs are done natively here:

| File         | Purpose on Pages       | Equivalent here                             |
| ------------ | ---------------------- | ------------------------------------------- |
| `_redirects` | SPA rewrite to `/`     | CloudFront custom error responses (403/404) |
| `_headers`   | CSP, HSTS, X-Frame etc | CloudFront managed `SecurityHeadersPolicy`  |

One caveat worth knowing: the managed `SecurityHeadersPolicy` does **not** include a
Content-Security-Policy. If the CSP in `public/_headers` matters for the CloudFront
deployment too, that needs a custom response headers policy rather than the managed one.
Left as-is for now because the GitHub Pages deployment is still the primary one.

### `--base-href=/`

CloudFront serves from the domain root. The GitHub Pages workflow builds with
`--base-href=/AngularDevelopment/` because Pages serves from a repo subpath. Mixing them up
fails silently: the page loads, every asset 404s, and you get a blank screen with no error
anywhere server-side.

### Managed CloudFront policies

`CachingOptimized` and `SecurityHeadersPolicy` are AWS-managed and have the same IDs in
every account, so they are hard-coded in `config.sh`. Fewer objects to own, and the
behaviour is documented by AWS rather than by us.

### PriceClass_100

North America and Europe edge locations only. Cheapest tier; change it in `setup.sh` if the
audience is elsewhere. It is a distribution-level setting, so changing it later is an
`update-distribution` call, not a rebuild.

---

## Gotcha catalog

Carried forward from the playbook where still applicable, plus the ones specific to this
topology.

### 1. The AWS CLI pager will hang your script

CLI v2 pipes output through a pager by default. Interactively it looks like a frozen
terminal; in CI, where there is no terminal, it blocks with no error at all. `config.sh`
exports `AWS_PAGER=""` and every call also passes `--no-cli-pager`. Belt and braces because
the failure mode is a silent hang, not a message.

### 2. MSYS rewrites paths inside arguments

Git Bash and MSYS2 convert anything that looks like a Unix path into a Windows path before
handing it to the program. `--paths "/*"` arrives as something like
`C:/Program Files/Git/*` and the CloudFront invalidation covers nothing — with no error.
`deploy.sh` sets `MSYS_NO_PATHCONV=1` and `MSYS2_ARG_CONV_EXCL='*'` for that one command.

### 3. Never use `file://` for JSON arguments

Same root cause as #2, but worse: the rewritten path makes the CLI report a JSON parse
error, which sends you off debugging perfectly valid JSON. Every JSON payload in these
scripts is built with `jq -nc` and passed inline as a string.

### 4. ACM certificates for CloudFront must be in us-east-1

Not a default, not configurable. CloudFront's control plane lives in us-east-1 and a valid
certificate in any other region is invisible to it. `add-domain.sh` pins `ACM_REGION` rather
than using `AWS_REGION`, so this stays right even if everything else moves.

### 5. Resolve ARNs and IDs dynamically

Nothing here hard-codes a resource identifier. CloudFront distribution IDs are assigned by
AWS, and Secrets Manager ARNs (in the playbook's stack) carry an unpredictable six-character
suffix that makes a copied ARN break on the next recreate. The distribution is found by its
`Comment`, which these scripts own — change the comment and they lose track of it.

### 6. CloudFront updates are read-modify-write under an ETag

There is no partial update. `update-distribution` replaces the entire config and is
optimistically locked by ETag, so the only safe pattern is `get-distribution-config` →
modify with `jq` → `update-distribution --if-match`. Building a fresh config and pushing it
is how people silently drop their cache behaviours. The ETag also changes on every write, so
it must be re-read between a disable and a delete.

### 7. `create-bucket` and us-east-1 disagree about LocationConstraint

us-east-1 is the one region where `--create-bucket-configuration LocationConstraint=...` is
an error. Everywhere else, omitting it silently creates the bucket in us-east-1 instead.
`setup.sh` branches on this.

### 8. Deleting a distribution takes about 15 minutes

It must be disabled first, and the disable has to propagate to every edge location before
the delete is accepted. There is no way to shorten it. `destroy.sh` waits rather than
failing halfway.

### 9. `ng build` sometimes does not exit

Known local quirk: the build completes in a few seconds and prints
"Application bundle generation complete", then the process hangs instead of exiting. If
`deploy.sh` appears stuck after a successful build, that is what happened — Ctrl-C and rerun
with `--no-build`, which uploads the `dist/` output that was already written.

---

## Reusing this in another project

Copy the `aws/` directory and change `APP_NAME` in `config.sh`. That drives the bucket name,
the OAC name, the distribution comment, and the default `DIST_DIR`.

If the other project is not an Angular app, also set `DIST_DIR` to wherever its build output
lands, and change the `npx ng build` line in `deploy.sh`. Everything else — the OAC wiring,
the SPA error responses, the cache split, the traps above — is framework-agnostic and
applies to any single-page app.

Overrides can also be passed as environment variables without editing anything:

```bash
APP_NAME=someproject DIST_DIR=build ./aws/setup.sh
```

---

## Related documents

- [../DEPLOYMENT.md](../DEPLOYMENT.md) — all deployment targets, including GitHub Pages and Docker
- [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — how the app is built
- [../docs/BACKLOG.md](../docs/BACKLOG.md) — what is planned next
