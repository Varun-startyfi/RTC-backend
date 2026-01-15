# Sessions Backend

A Node.js/Express backend service for managing live video sessions with PostgreSQL database support.

## Features

- **PostgreSQL Database**: Persistent storage for sessions and participants
- **Session Management**: Create, join, and end video sessions
- **Provider Abstraction**: Extensible architecture supporting multiple video providers
- **Real-time Communication**: Socket.io integration for real-time updates
- **Token Management**: Secure token generation for video providers
- **RESTful API**: Clean REST API for session operations

## Prerequisites

- **Node.js** 16+
- **PostgreSQL** 12+

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL Database

**Option A: Using PostgreSQL command line**
```bash
# Create database
createdb sessions_db

# Run setup script
psql -d sessions_db -f setup-db.sql
```

**Option B: Using Docker**
```bash
# Run PostgreSQL in Docker
docker run --name postgres-sessions -e POSTGRES_PASSWORD=password -e POSTGRES_DB=sessions_db -p 5432:5432 -d postgres:13

# Run setup script
docker exec -i postgres-sessions psql -U postgres -d sessions_db < setup-db.sql
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp env-example.txt .env
```

Edit `.env` with your values:
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sessions_db
DB_USER=postgres
DB_PASSWORD=password

# Agora Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
```

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Database Schema

### Tables

- **sessions**: Stores session information
- **participants**: Stores participant information for each session

### Key Relationships

- Each session can have multiple participants
- Participants are automatically deleted when session is deleted
- Foreign key constraints ensure data integrity

## API Endpoints

### Health Check
- `GET /health` - Check server and database status

### Sessions
- `POST /api/sessions/create` - Create a new session
- `POST /api/sessions/:id/join` - Join an existing session
- `GET /api/sessions/:id` - Get session information
- `POST /api/sessions/:id/end` - End a session (host only)

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8080 | No |
| `DB_HOST` | PostgreSQL host | localhost | No |
| `DB_PORT` | PostgreSQL port | 5432 | No |
| `DB_NAME` | Database name | sessions_db | No |
| `DB_USER` | Database user | postgres | No |
| `DB_PASSWORD` | Database password | password | Yes |
| `AGORA_APP_ID` | Agora App ID | - | Yes |
| `AGORA_APP_CERTIFICATE` | Agora App Certificate | - | Yes |

## Development

- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- Database schema automatically syncs on startup (development mode)

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a production PostgreSQL instance
3. Configure proper database credentials
4. Set up SSL/TLS for database connections
5. Use a process manager like PM2

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Migration Issues
- Database schema auto-syncs on startup
- Manual sync: The server automatically creates/updates tables

### Agora Token Issues
- Verify Agora credentials are correct
- Check Agora console for app status

## License

MIT