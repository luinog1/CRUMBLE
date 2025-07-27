# CRUMBLE - Stremio-like Media Streaming Platform

CRUMBLE is a modern media streaming platform built with React (frontend) and Swift Vapor (backend), designed to provide a Stremio-like experience for discovering and streaming content through various addons.

## Features

- 🎬 **Addon System**: Support for external addons to provide content catalogs and streams
- 📚 **Personal Library**: Save and organize your favorite movies and TV shows
- 📊 **Watch Progress**: Track your viewing progress across all content
- 🔍 **Advanced Search**: Search across multiple addon catalogs
- 🎨 **Modern UI**: Clean, responsive interface built with React and TypeScript
- 🚀 **High Performance**: Swift Vapor backend for fast API responses
- 🐳 **Docker Support**: Easy deployment with Docker Compose

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API communication
- **Modern CSS** with responsive design

### Backend
- **Swift 5.9** with Vapor framework
- **PostgreSQL** database with Fluent ORM
- **RESTful API** design
- **Docker** containerization

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+** (for local frontend development)
- **Swift 5.9+** (for local backend development)

### Using Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CRUMBLE
   ```

2. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432

### Local Development

#### Backend Setup

1. **Install Swift dependencies**:
   ```bash
   cd backend
   swift package resolve
   ```

2. **Set up PostgreSQL**:
   ```bash
   # Using Docker
   docker run --name crumble-postgres \
     -e POSTGRES_DB=crumble \
     -e POSTGRES_USER=crumble \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 -d postgres:15
   ```

3. **Set environment variables**:
   ```bash
   export DATABASE_URL="postgresql://crumble:password@localhost:5432/crumble"
   export LOG_LEVEL="debug"
   ```

4. **Run migrations and start server**:
   ```bash
   swift run App migrate
   swift run App serve --hostname 0.0.0.0 --port 8080
   ```

#### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Documentation

### Addon Endpoints

- `GET /api/v1/addons` - List all installed addons
- `POST /api/v1/addons/fetch-manifest` - Add addon by manifest URL
- `DELETE /api/v1/addons/{id}` - Remove addon
- `GET /api/v1/addons/{id}/catalog/{type}/{id}` - Get catalog from addon
- `GET /api/v1/addons/{id}/stream/{type}/{id}` - Get streams from addon

### User Endpoints

- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}/preferences` - Update user preferences

### Library Endpoints

- `GET /api/v1/library/{userId}` - Get user's library
- `POST /api/v1/library/{userId}` - Add item to library
- `PUT /api/v1/library/{userId}/{itemId}` - Update library item
- `DELETE /api/v1/library/{userId}/{itemId}` - Remove from library
- `GET /api/v1/library/{userId}/favorites` - Get favorites
- `GET /api/v1/library/{userId}/watching` - Get currently watching
- `GET /api/v1/library/{userId}/completed` - Get completed items

### Progress Endpoints

- `GET /api/v1/progress/{userId}` - Get user's watch progress
- `POST /api/v1/progress/{userId}` - Update watch progress
- `GET /api/v1/progress/{userId}/{contentId}` - Get progress for specific content
- `GET /api/v1/progress/{userId}/recent` - Get recent progress
- `DELETE /api/v1/progress/{userId}/{progressId}` - Delete progress

## Project Structure

```
CRUMBLE/
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Common components (Button, Input, etc.)
│   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   └── media/         # Media-specific components
│   ├── pages/             # Page components
│   │   ├── Home/          # Home page
│   │   ├── Search/        # Search page
│   │   ├── Library/       # Library page
│   │   ├── Details/       # Content details page
│   │   └── Settings/      # Settings page
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client and services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles and CSS modules
├── backend/
│   ├── Sources/
│   │   └── App/
│   │       ├── Controllers/   # API controllers
│   │       ├── Models/        # Database models
│   │       ├── Migrations/    # Database migrations
│   │       ├── Services/      # Business logic services
│   │       └── configure.swift # App configuration
│   └── Package.swift      # Swift dependencies
├── docker-compose.yml     # Docker services configuration
├── Dockerfile.backend     # Backend Docker image
├── Dockerfile.frontend.dev # Frontend development Docker image
└── README.md             # This file
```

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
```

### Backend
```env
DATABASE_URL=postgresql://crumble:password@localhost:5432/crumble
LOG_LEVEL=debug
```

## Development Workflow

1. **Start the backend**: `docker-compose up postgres backend` or run locally
2. **Start the frontend**: `npm run dev` or `docker-compose up frontend`
3. **Make changes**: Edit code in `src/` directories
4. **Test changes**: Both frontend and backend support hot reloading
5. **Run tests**: `npm test` (frontend) and `swift test` (backend)

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test` and `swift test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Stremio](https://www.stremio.com/)
- Built with [Vapor](https://vapor.codes/) Swift framework
- Frontend powered by [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)