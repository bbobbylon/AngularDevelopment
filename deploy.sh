#!/bin/bash

# Angular Tutorials - Deployment Script
# Supports: local development, Docker local, GitHub Pages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-local}"
APP_NAME="angulartutorials"
APP_PORT="${APP_PORT:-4242}"
DOCKER_PORT="${DOCKER_PORT:-4200}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-}"

# Functions
print_help() {
    cat << EOF
${GREEN}Angular Tutorials - Deployment Script${NC}

Usage: ./deploy.sh [COMMAND] [OPTIONS]

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
  ./deploy.sh start

  # Build Docker image
  DOCKER_USERNAME=myusername ./deploy.sh docker-build

  # Run Docker container
  ./deploy.sh docker-run

  # Build for GitHub Pages
  ./deploy.sh github-pages

EOF
}

print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

check_dependencies() {
    print_step "Checking dependencies..."

    for cmd in node npm; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed"
        fi
    done

    print_step "Dependencies OK"
}

install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_step "Installing npm dependencies..."
        npm install
    fi
}

build_production() {
    print_step "Building for production..."
    npm run build
    print_step "Build complete: dist/${APP_NAME}/browser"
}

build_github_pages() {
    print_step "Building for GitHub Pages..."
    npm run build -- --configuration production --base-href=/angulartutorials/
    print_step "GitHub Pages build complete: dist/${APP_NAME}/browser"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Commit your changes"
    echo "2. Push to GitHub (GitHub Actions will deploy automatically)"
    echo "3. Enable GitHub Pages in repository settings (Source: GitHub Actions)"
}

start_dev_server() {
    print_step "Starting development server..."
    echo -e "${GREEN}App will be available at: http://localhost:${APP_PORT}${NC}"
    npm start
}

docker_build() {
    if [ -z "$DOCKER_USERNAME" ]; then
        print_warning "DOCKER_USERNAME not set, building without registry tag"
        docker build -t ${APP_NAME}:latest .
    else
        docker build -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${APP_NAME}:latest .
        docker tag ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${APP_NAME}:latest ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${APP_NAME}:v$(date +%Y%m%d-%H%M%S)
    fi
    print_step "Docker image built successfully"
}

docker_run() {
    print_step "Running Docker container..."
    echo -e "${GREEN}App will be available at: http://localhost:${DOCKER_PORT}${NC}"

    if [ -z "$DOCKER_USERNAME" ]; then
        IMAGE="${APP_NAME}:latest"
    else
        IMAGE="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${APP_NAME}:latest"
    fi

    docker run -p ${DOCKER_PORT}:80 --name ${APP_NAME}-container ${IMAGE}
}

docker_push() {
    if [ -z "$DOCKER_USERNAME" ]; then
        print_error "DOCKER_USERNAME is required for docker push"
    fi

    print_step "Pushing Docker image to registry..."
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${APP_NAME}:latest
    print_step "Image pushed successfully"
}

clean_build() {
    print_step "Cleaning build artifacts..."
    rm -rf dist node_modules .angular
    print_step "Clean complete"
}

# Main script
main() {
    local command="${1:-start}"

    case $command in
        start)
            check_dependencies
            install_dependencies
            start_dev_server
            ;;
        build)
            check_dependencies
            install_dependencies
            build_production
            ;;
        docker-build)
            docker_build
            ;;
        docker-run)
            docker_run
            ;;
        docker-push)
            docker_push
            ;;
        github-pages)
            check_dependencies
            install_dependencies
            build_github_pages
            ;;
        clean)
            clean_build
            ;;
        help|--help|-h)
            print_help
            ;;
        *)
            print_error "Unknown command: $command"
            ;;
    esac
}

main "$@"
