#!/bin/bash

# CRUMBLE Development Script
# This script helps you start the development environment quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists node; then
        print_warning "Node.js is not installed. You'll need it for local frontend development."
    fi
    
    print_success "Prerequisites check completed."
}

# Function to setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env.local" ]; then
        print_status "Creating .env.local from .env.example..."
        cp .env.example .env.local
        print_success "Created .env.local. Please review and update the values if needed."
    else
        print_status ".env.local already exists."
    fi
}

# Function to start services
start_services() {
    local mode=$1
    
    case $mode in
        "full")
            print_status "Starting all services with Docker Compose..."
            docker-compose up -d
            ;;
        "backend")
            print_status "Starting backend services (PostgreSQL + Swift backend)..."
            docker-compose up -d postgres backend
            ;;
        "frontend")
            print_status "Starting frontend development server..."
            if command_exists npm; then
                npm install
                npm run dev
            else
                print_error "Node.js/npm not found. Please install Node.js or use 'full' mode."
                exit 1
            fi
            ;;
        *)
            print_error "Invalid mode. Use: full, backend, or frontend"
            exit 1
            ;;
    esac
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped."
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    print_status "\nService URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8080"
    echo "  PostgreSQL: localhost:5432"
}

# Function to reset database
reset_db() {
    print_warning "This will delete all data in the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        docker-compose down
        docker volume rm crumble_postgres_data 2>/dev/null || true
        docker-compose up -d postgres
        sleep 5
        docker-compose up -d backend
        print_success "Database reset completed."
    else
        print_status "Database reset cancelled."
    fi
}

# Function to run backend migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose exec backend swift run App migrate
    print_success "Migrations completed."
}

# Function to show help
show_help() {
    echo "CRUMBLE Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start [MODE]    Start services (modes: full, backend, frontend)"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs [SERVICE]  Show logs (optional: specify service name)"
    echo "  status          Show service status and URLs"
    echo "  reset-db        Reset the database (WARNING: deletes all data)"
    echo "  migrate         Run database migrations"
    echo "  setup           Setup environment files"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start full      # Start all services with Docker"
    echo "  $0 start backend   # Start only backend services"
    echo "  $0 start frontend  # Start frontend with npm (requires Node.js)"
    echo "  $0 logs backend    # Show backend logs"
    echo "  $0 status          # Show service status"
}

# Main script logic
case $1 in
    "start")
        check_prerequisites
        setup_env
        start_services "${2:-full}"
        echo ""
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        check_prerequisites
        start_services "full"
        echo ""
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "reset-db")
        reset_db
        ;;
    "migrate")
        run_migrations
        ;;
    "setup")
        setup_env
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        print_status "Starting CRUMBLE in full mode..."
        check_prerequisites
        setup_env
        start_services "full"
        echo ""
        show_status
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac