#!/bin/bash
set -e

echo "🚀 VISUAL Platform Deployment Script"
echo "===================================="

# Configuration
IMAGE_NAME="visual-platform"
CONTAINER_NAME="visual-app"
NETWORK_NAME="visual-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_info "✅ All dependencies are installed"
}

# Build application
build_app() {
    log_info "Building VISUAL Platform..."
    
    # Build frontend first
    log_info "Building frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        yarn install
    fi
    yarn build
    cd ..
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t $IMAGE_NAME .
    
    log_info "✅ Build completed successfully"
}

# Deploy using Docker Compose
deploy_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Create environment file if it doesn't exist
    if [ ! -f .env.production ]; then
        log_warn "Creating .env.production file..."
        cat > .env.production << EOF
DATABASE_URL=postgresql://postgres:password@db:5432/visual_db
SESSION_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
NODE_ENV=production
EOF
        log_info "✅ Environment file created. Please review and update as needed."
    fi
    
    # Deploy with Docker Compose
    docker-compose --env-file .env.production up -d
    
    log_info "✅ Deployment completed"
}

# Deploy standalone container
deploy_standalone() {
    log_info "Deploying standalone container..."
    
    # Stop existing container if running
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        log_info "Stopping existing container..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
    
    # Create network if it doesn't exist
    docker network create $NETWORK_NAME 2>/dev/null || true
    
    # Run the container
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        -p 80:80 \
        -e NODE_ENV=production \
        -v visual_uploads:/app/uploads \
        --restart unless-stopped \
        $IMAGE_NAME
    
    log_info "✅ Container deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health &> /dev/null; then
            log_info "✅ Application is healthy and running"
            break
        fi
        
        log_warn "Health check attempt $attempt/$max_attempts failed, waiting..."
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        exit 1
    fi
}

# Show logs
show_logs() {
    log_info "Showing application logs..."
    if command -v docker-compose &> /dev/null && [ -f docker-compose.yml ]; then
        docker-compose logs -f visual-app
    else
        docker logs -f $CONTAINER_NAME
    fi
}

# Main deployment function
main() {
    local deployment_type=${1:-"compose"}
    
    case $deployment_type in
        "build")
            check_dependencies
            build_app
            ;;
        "compose")
            check_dependencies
            build_app
            deploy_compose
            health_check
            ;;
        "standalone")
            check_dependencies
            build_app
            deploy_standalone
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "status")
            log_info "Checking deployment status..."
            if command -v docker-compose &> /dev/null && [ -f docker-compose.yml ]; then
                docker-compose ps
            else
                docker ps -f name=$CONTAINER_NAME
            fi
            ;;
        *)
            echo "Usage: $0 {build|compose|standalone|logs|status}"
            echo ""
            echo "Commands:"
            echo "  build      - Build the application only"
            echo "  compose    - Deploy using Docker Compose (default)"
            echo "  standalone - Deploy as standalone container"
            echo "  logs       - Show application logs"
            echo "  status     - Show deployment status"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"