# CI/CD Pipeline Plan

**Version:** 1.0  
**Date:** June 27, 2026  
**Status:** In Implementation

---

## Overview

This document outlines the CI/CD pipeline strategy for the Angular Tutorials application, covering automated testing, building, and deployment across multiple platforms.

---

## Table of Contents

- [Goals](#goals)
- [Pipeline Architecture](#pipeline-architecture)
- [Current Implementation](#current-implementation)
- [Docker Hub Integration](#docker-hub-integration)
- [Future Enhancements](#future-enhancements)
- [Security & Secrets Management](#security--secrets-management)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Goals

1. **Automated Deployments** - Zero-touch deployments on every push
2. **Multiple Targets** - GitHub Pages (free), Docker Hub (scalable), local (dev)
3. **Fast Feedback** - Build and test results in 2-3 minutes
4. **High Reliability** - Consistent, repeatable builds across environments
5. **Easy Rollback** - Quick recovery if something breaks
6. **Cost Efficient** - Leverage free/low-cost services (GitHub Actions, GitHub Pages)

---

## Pipeline Architecture

### Current Workflows

```
┌─────────────────┐
│  git push       │
└────────┬────────┘
         │
         ├─────────────────────────────────────┬──────────────────────────┐
         │                                     │                          │
    ┌────▼─────────────┐          ┌──────────▼─────────┐      ┌──────────▼────┐
    │ GitHub Pages     │          │  Docker Build      │      │  Local Dev    │
    │ (.yml workflow)  │          │  (.yml workflow)   │      │  (manual)     │
    └────┬─────────────┘          └──────────┬─────────┘      └──────────┬────┘
         │                                   │                          │
    ┌────▼──────────────────┐          ┌────▼──────────────┐      ┌─────▼──────┐
    │ Build Angular app     │          │ Build Docker img  │      │ npm start  │
    │ base-href:            │          │ Push to Hub       │      │ Deploy.sh  │
    │ /AngularDevelopment/  │          │                  │      └────────────┘
    └────┬──────────────────┘          └────┬──────────────┘
         │                                   │
    ┌────▼──────────────────┐          ┌────▼──────────────┐
    │ Upload artifact       │          │ Tag with commit   │
    │ (pages-artifact)      │          │ SHA & timestamp   │
    └────┬──────────────────┘          └────┬──────────────┘
         │                                   │
    ┌────▼──────────────────┐          ┌────▼──────────────┐
    │ Deploy to Pages       │          │ Available at:     │
    │ ✓ GitHub Pages live  │          │ hub.docker.com    │
    └──────────────────────┘          └───────────────────┘
         ↓
   https://bbobbylon
   .github.io
   /AngularDevelopment/
```

---

## Current Implementation

### 1. GitHub Pages Workflow ✅

**File:** `.github/workflows/deploy-github-pages.yml`

**Triggers:**
- Push to `master` or `main` branch
- Manual trigger via `workflow_dispatch`

**Steps:**
1. Checkout code
2. Setup Node.js 22
3. Install dependencies (`npm ci`)
4. Build Angular app with production config
5. Upload artifact via `actions/upload-pages-artifact@v3`
6. Deploy via `actions/deploy-pages@v4`

**Output:**
- Free hosting at: `https://bbobbylon.github.io/AngularDevelopment/`
- Auto-deploys on every push
- No additional configuration needed

**Status:** ✅ ACTIVE & WORKING

---

### 2. Docker CI/CD Workflow

**File:** `.github/workflows/deploy-docker.yml`

**Triggers:**
- Push to `master` or `main` branch
- Manual trigger via `workflow_dispatch`

**Steps:**
1. Checkout code
2. Setup Docker buildx (multi-platform builds)
3. Build Docker image
4. Push to Docker Hub

**Requirements:**
- Docker Hub username (env var: `DOCKER_USERNAME`)
- Docker Hub token (GitHub Secret: `DOCKER_PASSWORD`)
- Docker Hub token (GitHub Secret: `DOCKER_LOGIN_USERNAME`)

**Output:**
- Docker image available at: `docker.io/USERNAME/angulartutorials:latest`
- Also tagged with commit SHA and timestamp

**Status:** ⏳ READY (needs Docker Hub credentials)

---

### 3. Local Deployment Scripts ✅

**Files:** `deploy.sh` (Bash) and `deploy.ps1` (PowerShell)

**Available Commands:**
```bash
./deploy.sh start              # Dev server on port 4242
./deploy.sh build              # Production build
./deploy.sh docker-build       # Build Docker image
./deploy.sh docker-run         # Run Docker container
./deploy.sh docker-push        # Push to Docker Hub
./deploy.sh github-pages       # Build for GitHub Pages
./deploy.sh clean              # Clean build artifacts
./deploy.sh help               # Show help
```

**Status:** ✅ ACTIVE

---

## Docker Hub Integration

### Prerequisites

To enable Docker CI/CD, you need:

1. **Docker Hub Account**
   - Sign up at: https://hub.docker.com
   - Create free account (public repos are free)

2. **Personal Access Token**
   - Log in to Docker Hub
   - Go to: Account Settings → Security → New Access Token
   - Name it: `github-actions` or similar
   - Permissions: Read, Write (for pushing images)
   - Copy the token

3. **GitHub Secrets**
   - Go to your repo: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add these secrets:
     ```
     DOCKER_USERNAME=your_docker_hub_username
     DOCKER_PASSWORD=your_access_token
     ```

### Setup Steps (Coming Next)

Once Docker Hub is configured:

1. Commit and push to GitHub
2. GitHub Actions automatically triggers
3. Image is built and pushed to Docker Hub
4. Check progress in: Actions tab → Latest workflow run
5. Pull and run locally:
   ```bash
   docker pull your_username/angulartutorials:latest
   docker run -p 8080:80 your_username/angulartutorials:latest
   # Visit http://localhost:8080
   ```

---

## Future Enhancements

### Phase 2: Testing & Quality Gates

```
git push → Lint → Unit Tests → Build → Deploy
           (fail fast)
```

**Planned Additions:**
- `npm run test` in workflow (run vitest)
- ESLint checks via `npm run lint` (when added)
- Code coverage reporting
- Build only if tests pass

**Estimated Timeline:** Q3 2026

---

### Phase 3: Production Deployment

```
git push → Build → Deploy to Staging → Manual Approval → Deploy to Prod
```

**Planned Targets:**
- AWS EC2 / Vercel / Digital Ocean
- Staging environment for testing
- Manual approval gates before production
- Automatic rollback on deployment failure

**Estimated Timeline:** Q4 2026

---

### Phase 4: Advanced Monitoring

**Planned Additions:**
- Build time tracking
- Deployment success/failure metrics
- Performance monitoring (Lighthouse scores)
- Uptime monitoring
- Error tracking (Sentry integration)

**Estimated Timeline:** 2027

---

## Security & Secrets Management

### Current Practices

✅ **What We Do Right:**
- Secrets stored in GitHub Secrets (encrypted)
- No hardcoded credentials in code
- `.env` files are in `.gitignore`
- `deploy.sh` reads from environment variables

❌ **What We Should Add:**
- Branch protection rules (require PRs before merge)
- Signed commits (GPG)
- CODEOWNERS file (require review from specific people)
- Secrets scanning (GitHub Advanced Security)

### Secrets Used in CI/CD

| Secret | Purpose | Where Used |
|--------|---------|-----------|
| `DOCKER_USERNAME` | Docker Hub login | `deploy-docker.yml` |
| `DOCKER_PASSWORD` | Docker Hub token | `deploy-docker.yml` |
| `GITHUB_TOKEN` | Auto-provided by GitHub | Workflows (automatic) |

### Best Practices

1. **Rotate Secrets Regularly**
   - Docker Hub token: Every 90 days
   - GitHub tokens: Every 6 months

2. **Limit Scope**
   - Docker Hub token: Read + Write only for this image
   - GitHub token: Default permissions (scoped per action)

3. **Monitor Usage**
   - Check Docker Hub: Settings → Active Tokens
   - Review GitHub: Settings → Developer settings → Personal access tokens

---

## Monitoring & Troubleshooting

### View Workflow Runs

**GitHub Actions Dashboard:**
1. Go to repo → Actions tab
2. Click on workflow name (e.g., "Deploy to GitHub Pages")
3. Click on the latest run
4. Expand each job to see logs

**Common Issues & Fixes:**

#### Pages deployment shows success but site returns 404

**Symptom:** "Reported success!" in logs but site shows nothing

**Causes:**
1. Pages settings pointing to wrong source
2. base-href mismatch
3. Artifact not uploaded correctly

**Fix:**
1. Check Settings → Pages → Source = "GitHub Actions"
2. Verify base-href in workflow matches repo name
3. Check "Upload artifact" step uploads correct path

---

#### Docker build fails with "node: command not found"

**Symptom:** Docker build step fails with Node error

**Cause:** Builder image doesn't have Node installed

**Fix:** Ensure Dockerfile uses `node:22-alpine` (we already do ✓)

---

#### Docker push fails with "unauthorized"

**Symptom:** "Error: unauthorized: authentication required"

**Cause:** Docker credentials not set up correctly

**Fix:**
1. Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` in GitHub Secrets
2. Ensure Docker Hub token is still valid (didn't expire)
3. Check token has "Read, Write" permissions

---

### Manual Troubleshooting

**Test GitHub Pages build locally:**
```bash
npm run build -- --configuration production --base-href=/AngularDevelopment/
# Check dist/angulartutorials/browser/ directory
```

**Test Docker build locally:**
```bash
docker build -t angulartutorials:test .
docker run -p 8080:80 angulartutorials:test
# Visit http://localhost:8080
```

---

## Deployment Checklist

### Before Each Deployment

- [ ] All tests passing locally (`npm test`)
- [ ] App builds successfully (`npm run build`)
- [ ] No console errors in browser
- [ ] Git branch is clean (`git status` shows nothing)
- [ ] Commit message is clear and descriptive

### After Pushing to GitHub

- [ ] Check Actions tab for workflow status
- [ ] Wait for green checkmark (2-3 minutes)
- [ ] GitHub Pages: Visit live site and test features
- [ ] Docker: Pull image and test locally (optional)

### Post-Deployment

- [ ] Verify no 404 errors in browser console
- [ ] Test key features (practice, feedback, topic links)
- [ ] Check mobile responsiveness
- [ ] Monitor for errors in 1st hour

---

## Pipeline Health Metrics

**Target Metrics:**

| Metric | Target | Current |
|--------|--------|---------|
| Build time | < 3 min | ~2 min ✓ |
| Deployment frequency | Every push | Every push ✓ |
| Pages uptime | 99.9% | GitHub's SLA ✓ |
| Docker image size | < 100 MB | ~80 MB ✓ |

---

## Related Documents

- [DEPLOYMENT.md](DEPLOYMENT.md) — Full deployment guide
- [IMPROVEMENTS.md](../IMPROVEMENTS.md) — Feature documentation
- [.github/workflows/deploy-github-pages.yml](../.github/workflows/deploy-github-pages.yml) — Pages workflow
- [.github/workflows/deploy-docker.yml](../.github/workflows/deploy-docker.yml) — Docker workflow

---

**Status:** Active & Improving  
**Last Updated:** June 27, 2026  
**Owner:** Bobby Oliver
