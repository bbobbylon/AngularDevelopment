# Angular Tutorials - Deployment Script (PowerShell)
# Supports: local development, Docker local, GitHub Pages

param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'build', 'docker-build', 'docker-run', 'docker-push', 'github-pages', 'clean', 'help')]
    [string]$Command = 'start',

    [string]$DeploymentMode = $env:DEPLOYMENT_MODE ?? 'local',
    [int]$AppPort = $env:APP_PORT ?? 4242,
    [int]$DockerPort = $env:DOCKER_PORT ?? 4200,
    [string]$DockerRegistry = $env:DOCKER_REGISTRY ?? 'docker.io',
    [string]$DockerUsername = $env:DOCKER_USERNAME ?? ''
)

$AppName = 'angulartutorials'
$ErrorActionPreference = 'Stop'

function Write-Step {
    Write-Host "==> $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "Error: $args" -ForegroundColor Red
    exit 1
}

function Write-Warning {
    Write-Host "Warning: $args" -ForegroundColor Yellow
}

function Show-Help {
    @'
Angular Tutorials - Deployment Script (PowerShell)

Usage: .\deploy.ps1 [COMMAND] [OPTIONS]

Commands:
  start               Start the application (default)
  build               Build the application for production
  docker-build        Build Docker image
  docker-run          Run Docker container
  docker-push         Push Docker image to registry
  github-pages        Build for GitHub Pages deployment
  clean               Clean build artifacts
  help                Show this help message

Environment Variables:
  DEPLOYMENT_MODE     Deployment mode: local (default), docker, github-pages
  APP_PORT            Port for local dev server (default: 4242)
  DOCKER_PORT         Port for Docker container (default: 4200)
  DOCKER_REGISTRY     Docker registry (default: docker.io)
  DOCKER_USERNAME     Docker Hub username

Examples:
  # Local development
  .\deploy.ps1 start

  # Build Docker image
  $env:DOCKER_USERNAME='myusername'; .\deploy.ps1 docker-build

  # Run Docker container
  .\deploy.ps1 docker-run

  # Build for GitHub Pages
  .\deploy.ps1 github-pages
'@
}

function Check-Dependencies {
    Write-Step "Checking dependencies..."

    $dependencies = @('node', 'npm')
    foreach ($dep in $dependencies) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            Write-Error "$dep is not installed"
        }
    }

    Write-Step "Dependencies OK"
}

function Install-Dependencies {
    if (-not (Test-Path 'node_modules')) {
        Write-Step "Installing npm dependencies..."
        npm install
    }
}

function Build-Production {
    Write-Step "Building for production..."
    npm run build
    Write-Step "Build complete: dist\$AppName\browser"
}

function Build-GitHubPages {
    Write-Step "Building for GitHub Pages..."
    npm run build -- --configuration production --base-href=/angulartutorials/
    Write-Step "GitHub Pages build complete: dist\$AppName\browser"
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Commit your changes"
    Write-Host "2. Push to GitHub (GitHub Actions will deploy automatically)"
    Write-Host "3. Enable GitHub Pages in repository settings (Source: GitHub Actions)"
}

function Start-DevServer {
    Write-Step "Starting development server..."
    Write-Host "App will be available at: http://localhost:$AppPort" -ForegroundColor Green
    npm start
}

function Build-Docker {
    if ([string]::IsNullOrEmpty($DockerUsername)) {
        Write-Warning "DOCKER_USERNAME not set, building without registry tag"
        docker build -t "${AppName}:latest" .
    }
    else {
        docker build -t "$DockerRegistry/$DockerUsername/${AppName}:latest" .
        $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        docker tag "$DockerRegistry/$DockerUsername/${AppName}:latest" "$DockerRegistry/$DockerUsername/${AppName}:v$timestamp"
    }
    Write-Step "Docker image built successfully"
}

function Start-Docker {
    Write-Step "Running Docker container..."
    Write-Host "App will be available at: http://localhost:$DockerPort" -ForegroundColor Green

    if ([string]::IsNullOrEmpty($DockerUsername)) {
        $image = "${AppName}:latest"
    }
    else {
        $image = "$DockerRegistry/$DockerUsername/${AppName}:latest"
    }

    docker run -p "${DockerPort}:80" --name "${AppName}-container" $image
}

function Push-Docker {
    if ([string]::IsNullOrEmpty($DockerUsername)) {
        Write-Error "DOCKER_USERNAME is required for docker push"
    }

    Write-Step "Pushing Docker image to registry..."
    docker push "$DockerRegistry/$DockerUsername/${AppName}:latest"
    Write-Step "Image pushed successfully"
}

function Clean-Build {
    Write-Step "Cleaning build artifacts..."
    Remove-Item -Recurse -Force -Path dist, node_modules, .angular -ErrorAction SilentlyContinue
    Write-Step "Clean complete"
}

# Main logic
switch ($Command) {
    'start' {
        Check-Dependencies
        Install-Dependencies
        Start-DevServer
    }
    'build' {
        Check-Dependencies
        Install-Dependencies
        Build-Production
    }
    'docker-build' {
        Build-Docker
    }
    'docker-run' {
        Start-Docker
    }
    'docker-push' {
        Push-Docker
    }
    'github-pages' {
        Check-Dependencies
        Install-Dependencies
        Build-GitHubPages
    }
    'clean' {
        Clean-Build
    }
    'help' {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
    }
}
