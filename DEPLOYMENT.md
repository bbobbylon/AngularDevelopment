# Deployment Guide

This document covers all deployment options for Angular Tutorials.

## Table of Contents

- [Local Development](#local-development)
- [GitHub Pages (Free, Automatic)](#github-pages-free-automatic)
- [Render (Free, Automatic)](#render-free-automatic)
- [AWS — S3 + CloudFront](#aws--s3--cloudfront)
- [Docker (Local)](#docker-local)
- [Docker (Remote Registry)](#docker-remote-registry)
- [CI/CD Pipelines](#cicd-pipelines)

## Local Development

### Quick Start

```bash
# Using the deployment script (recommended)
./deploy.sh start          # macOS/Linux
.\deploy.ps1 start         # Windows

# Or with npm directly
npm install
npm start
```

The app will be available at `http://localhost:4242`

### Build for Production

```bash
./deploy.sh build          # macOS/Linux
.\deploy.ps1 build         # Windows

# Or with npm
npm run build
```

Output: `dist/angulartutorials/browser/`

---

## GitHub Pages (Free, Automatic)

GitHub Pages provides **free hosting** with automatic deployments on every push. No server required.

### Setup (One-time)

1. **Push to GitHub** if not already there

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/angulartutorials.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages in Settings**
   - Go to repository Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

3. **The workflow is automatic!**
   - Every push to `main` or `master` branch triggers the deployment
   - Check Actions tab to see build status
   - Site available at: `https://YOUR_USERNAME.github.io/angulartutorials/`

### Manual Build (Optional)

```bash
./deploy.sh github-pages   # macOS/Linux
.\deploy.ps1 github-pages  # Windows
```

### Important Notes

- The app is deployed at `https://YOUR_USERNAME.github.io/angulartutorials/` (note the `/angulartutorials/` path)
- Changes are live within 1-2 minutes
- No cost, powered by GitHub
- Perfect for demos, tutorials, and portfolios

---

## Render (Free, Automatic)

**Live at: <https://angulardevelopment.onrender.com>**

Deployed as a Render **Web Service** running the repo's existing [`Dockerfile`](Dockerfile) —
not Render's static-site product, and not driven by a `render.yaml` Blueprint. It was created
directly from the Render dashboard (New → Web Service → pick the GitHub repo), and Render
auto-detected everything from the Dockerfile already in the repo:

- **Source:** `bbobbylon/AngularDevelopment`, branch `master`, repo root, `./Dockerfile` — all
  defaults, nothing customized.
- **Build:** the Dockerfile's own two stages — `node:22-alpine` runs `npm ci && npm run build`,
  then the compiled `dist/angulartutorials/browser` is copied into an `nginx:stable-alpine`
  image (`nginx.conf` already in the repo) that serves it on port 80.
- **Env vars / secrets: none.** Zero environment variables, secret files, or environment
  groups are configured — there is nothing to leak and nothing to rotate, because this is a
  pure static frontend served by nginx inside the container, with no backend or API key of its
  own.
- **Auto-Deploy:** set to "On Commit" — every push to `master` triggers a new build and deploy
  automatically, the same trigger the GitHub Pages workflow uses, just without that workflow's
  `verify` gate in front of it. **Run `npm run verify` locally before pushing** — Render will
  happily build and ship a broken commit that GitHub Pages' CI would have caught first.

### Setup, if recreating this from scratch

1. Sign in at [dashboard.render.com](https://dashboard.render.com) and connect the GitHub
   account/org that owns this repo, if you haven't already.
2. **New** → **Web Service** → select the repo. Render finds the root `Dockerfile`
   automatically and offers the Docker runtime — accept the defaults (region, branch
   `master`, `./Dockerfile`, no root directory override).
3. Skip the environment variables step entirely — this app needs none.
4. Deploy. Render builds the image and gives you a `https://<service-name>.onrender.com` URL
   (Render appends a suffix if the name is taken) on the **Deploys** tab once it finishes.

### Important Notes

- **This is a free-tier Docker _Web Service_, so it sleeps.** Render spins the container down
  after a period of inactivity; the next request pays a cold-start penalty (the dashboard
  quotes "50 seconds or more") while it boots back up. GitHub Pages has no equivalent delay —
  if that cold start matters, a Render **Static Site** (build command
  `npm run build`, publish directory `dist/angulartutorials/browser`, plus a rewrite-all
  route to `index.html` for the SPA — see the routing-basics lesson's "404s in production"
  pitfall for why that route is required) would be a second, always-warm Render service with
  no sleep behavior, at the cost of setting it up separately.
- A custom domain can be attached from the service's **Settings** tab at any time.
- The `public/_headers`/`public/_redirects` files in this repo are Netlify/Cloudflare-format
  and are **not** read by this Docker-based Render service (nginx serves whatever `nginx.conf`
  tells it to) — they'd only matter for the static-site alternative above, where Render's own
  dashboard-configured rewrite/headers rules would still be needed regardless, since Render
  does not honor the Netlify file convention either way.

### Running Render and GitHub Pages together

They don't "go hand in hand" in the sense of depending on each other — there's no wiring
between them, and neither knows the other exists. What they share is simpler: **both watch the
same `master` branch of the same repo**, so a single `git push` fires both deployments in
parallel, independently, to two different URLs:

|                 | GitHub Pages                                              | Render                                             |
| --------------- | --------------------------------------------------------- | -------------------------------------------------- |
| URL             | `https://bbobbylon.github.io/AngularDevelopment/`         | `https://angulardevelopment.onrender.com`          |
| Path            | subpath (`/AngularDevelopment/`)                          | domain root                                        |
| Build           | `.github/workflows/deploy-github-pages.yml`               | Render's own Docker build, from `Dockerfile`       |
| Gated by CI?    | yes — `verify` (format, typecheck, tests) must pass first | no — builds and ships whatever was pushed          |
| Cold start      | none                                                      | ~50s after inactivity (free tier)                  |
| Config lives in | the workflow file, in this repo                           | the Render dashboard (Docker Web Service settings) |

Nothing stops you from running both indefinitely as two independent mirrors of the same app —
that's exactly the current state. The only thing to keep in mind is the CI-gating difference:
GitHub Pages can't publish a commit that fails `npm run verify`, but Render can, so it's worth
running `npm run verify` locally (or just watching the GitHub Actions check) before pushing, so
Render never becomes the first place a broken build shows up live.

---

## AWS — S3 + CloudFront

The route to a **custom domain** and a real CDN. Scripts live in [`aws/`](aws/README.md);
that README is the full reference, including the gotcha catalog. This section is the
summary.

### Setup (one-time)

Prerequisites: AWS CLI v2, `jq`, and credentials that can create S3, CloudFront and ACM
resources.

```bash
./aws/setup.sh
```

Creates a **private** S3 bucket, a CloudFront Origin Access Control, and a distribution in
front of it, then prints the CloudFront URL. Idempotent — running it again just reprints
the URL.

### Deploy

```bash
./aws/deploy.sh              # build, upload, invalidate
./aws/deploy.sh --no-build   # re-upload the existing dist/
```

### Custom domain

```bash
./aws/add-domain.sh example.com
```

Requests an ACM certificate (in us-east-1, which CloudFront requires), validates it via
DNS — writing the records automatically if the zone is in Route 53 — then attaches the
aliases to the distribution. Safe to run against a live site.

### Teardown

```bash
./aws/destroy.sh      # interactive; asks you to type the bucket name
```

### How it differs from GitHub Pages

|                | GitHub Pages           | AWS                                       |
| -------------- | ---------------------- | ----------------------------------------- |
| Base href      | `/AngularDevelopment/` | `/`                                       |
| SPA deep links | `public/_redirects`    | CloudFront custom error responses 403/404 |
| Headers        | `public/_headers`      | CloudFront `SecurityHeadersPolicy`        |
| Custom domain  | possible, one per repo | yes, first-class                          |
| Cost           | free                   | cents to a couple of dollars a month      |
| Auto-deploy    | yes, on push           | manual (`deploy.sh`)                      |

The base-href difference is the one that bites: build with the wrong value and the page
loads, every asset 404s, and there is no server-side error to find. `deploy.sh` passes
`--base-href=/` explicitly for this reason.

`_headers` and `_redirects` are **not** uploaded to S3 — they are Netlify/Cloudflare
control files and inert there. CloudFront covers both jobs natively.

---

## Docker (Local)

Run the application in a Docker container on your machine.

### Prerequisites

- Install Docker: https://www.docker.com/products/docker-desktop

### Build Docker Image

```bash
./deploy.sh docker-build   # macOS/Linux
.\deploy.ps1 docker-build  # Windows

# Or with Docker directly
docker build -t angulartutorials:latest .
```

### Run Container

```bash
./deploy.sh docker-run     # macOS/Linux
.\deploy.ps1 docker-run    # Windows

# Or with Docker directly
docker run -p 4200:80 angulartutorials:latest
```

App available at: `http://localhost:4200`

### Stop Container

```bash
docker stop angulartutorials-container
docker rm angulartutorials-container
```

### Docker Compose

```bash
docker-compose up --build   # Build and run
docker-compose up           # Just run
docker-compose down         # Stop and remove
```

---

## Docker (Remote Registry)

Push your Docker image to Docker Hub or GitHub Container Registry for sharing/deployment.

### Prerequisites

- Docker Hub account (https://hub.docker.com) OR GitHub Container Registry
- Authentication configured

### Docker Hub Setup

1. **Set environment variable**

   ```bash
   # macOS/Linux (bash/zsh)
   export DOCKER_USERNAME="your_docker_hub_username"

   # Windows PowerShell
   $env:DOCKER_USERNAME="your_docker_hub_username"
   ```

2. **Build Docker image**

   ```bash
   ./deploy.sh docker-build
   .\deploy.ps1 docker-build
   ```

3. **Push to Docker Hub**

   ```bash
   ./deploy.sh docker-push
   .\deploy.ps1 docker-push
   ```

4. **Verify**
   - Check Docker Hub: https://hub.docker.com/r/YOUR_USERNAME/angulartutorials
   - Image tags are automatically created with timestamps

### Pull and Run Remotely

```bash
docker run -p 80:80 docker.io/YOUR_USERNAME/angulartutorials:latest
```

### GitHub Container Registry

If you prefer GHCR over Docker Hub:

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag angulartutorials:latest ghcr.io/YOUR_USERNAME/angulartutorials:latest

# Push
docker push ghcr.io/YOUR_USERNAME/angulartutorials:latest

# Pull and run
docker run -p 80:80 ghcr.io/YOUR_USERNAME/angulartutorials:latest
```

---

## CI/CD Pipelines

GitHub Actions automatically builds and deploys on every push.

### GitHub Actions Workflows

Two workflows are included:

1. **`deploy-github-pages.yml`** - Deploys to GitHub Pages
   - Triggers: Push to main/master branch
   - No secrets needed
   - Free hosting

2. **`deploy-docker.yml`** - Builds and pushes Docker image
   - Triggers: Push to main/master or version tags
   - Manual workflow trigger available
   - Requires Docker credentials

### Setting up Docker CI/CD

1. **Add Docker Hub Secrets** (if using Docker Hub)
   - Go to repository Settings → Secrets and variables → Actions
   - Add `DOCKER_USERNAME` = your Docker Hub username
   - Add `DOCKER_PASSWORD` = your Docker Hub token
     - Generate token at: https://hub.docker.com/settings/security

2. **Trigger**
   - Push to `main`/`master` branch, OR
   - Go to Actions tab → "Build and Push Docker Image" → "Run workflow"

3. **Monitor**
   - Check Actions tab for build status
   - Images pushed automatically to Docker Hub

### Example: Custom Workflow

Create `.github/workflows/custom-deploy.yml`:

```yaml
name: Custom Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci && npm run build
      - name: Deploy to Server
        run: |
          # Your custom deployment logic
          echo "Deploying to server..."
```

---

## Comparison Table

| Option              | Cost      | Setup Time | Auto Deploy | Scalability | Custom domain |
| ------------------- | --------- | ---------- | ----------- | ----------- | ------------- |
| **Local Dev**       | Free      | 2 min      | No          | N/A         | No            |
| **GitHub Pages**    | Free      | 5 min      | Yes         | Limited     | One per repo  |
| **S3 + CloudFront** | ~$0-2/mo  | 10 min     | No          | Excellent   | Yes           |
| **Docker Local**    | Free      | 10 min     | No          | Manual      | No            |
| **Docker Hub**      | Free tier | 15 min     | Yes (CI/CD) | Good        | N/A           |
| **Custom Server**   | $$$       | 20+ min    | Yes         | Excellent   | Yes           |

---

## Troubleshooting

### GitHub Pages not deploying

- ✅ Ensure workflow file is in `.github/workflows/`
- ✅ Check repository Settings → Pages → Source is "GitHub Actions"
- ✅ View Actions tab for build logs
- ✅ Try manual workflow trigger

### Docker image too large

- Run: `docker image prune -a` to clean up old images
- Check Dockerfile stages (we use multi-stage for optimization)

### Port conflicts

- Change port: `docker run -p 8080:80 ...` (uses port 8080 instead)
- Local dev: `APP_PORT=5000 npm start`

### Docker push fails

- Verify credentials: `docker login`
- Check username in image tag: `docker.io/USERNAME/...`
- Ensure repository is public (or update auth)

---

## Environment Variables

Common configuration via environment:

```bash
# Local dev
APP_PORT=5000                      # Dev server port (default: 4242)

# Docker
DOCKER_PORT=8080                   # Container port (default: 4200)
DOCKER_REGISTRY=docker.io          # Registry (default: docker.io)
DOCKER_USERNAME=myusername         # Registry username

# GitHub Actions (set as repository secrets)
DOCKER_USERNAME=myusername
DOCKER_PASSWORD=<token>
```

---

## Next Steps

- **For demos/portfolios**: Use GitHub Pages (free, auto-deploy)
- **For a custom domain**: Use `aws/` — S3 + CloudFront, cents per month
- **For production**: Use Docker + custom server or cloud platform
- **For CI/CD**: Enable GitHub Actions workflows
- **For private projects**: Use GitHub Container Registry instead of Docker Hub

Need help? Check the GitHub Actions logs for detailed error messages.

---

## Related Documents

- [aws/README.md](aws/README.md) — The S3 + CloudFront setup, design decisions, and gotcha catalog
- [docs/CI-CD-PIPELINE.md](docs/CI-CD-PIPELINE.md) — The workflows in detail
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — What is being deployed and why it is static
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — Checks to run before shipping
- [README.md](README.md) — Quick start
