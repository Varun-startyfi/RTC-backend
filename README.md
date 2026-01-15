# Sessions Backend

A Node.js/Express backend service for managing live video sessions with PostgreSQL database support.

## Features

- **Flexible Database Support**: Choose between Local PostgreSQL or Supabase via `DB_PROVIDER` flag
- **PostgreSQL Database**: Persistent storage for sessions and participants
- **Session Management**: Create, join, and end video sessions
- **Provider Abstraction**: Extensible architecture supporting multiple video providers
- **Real-time Communication**: Socket.io integration for real-time updates
- **Token Management**: Secure token generation for video providers
- **RESTful API**: Clean REST API for session operations

## Prerequisites

- **Node.js** 16+
- **PostgreSQL** 12+ (for local development) OR **Supabase** account (for production)

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

The application supports two database providers controlled by the `DB_PROVIDER` environment variable:

#### Option A: Local PostgreSQL (Development)

**Using PostgreSQL command line:**
```bash
# Create database
createdb sessions_db

# Run setup script
psql -d sessions_db -f setup-db.sql
```

**Using Docker:**
```bash
# Run PostgreSQL in Docker
docker run --name postgres-sessions -e POSTGRES_PASSWORD=password -e POSTGRES_DB=sessions_db -p 5432:5432 -d postgres:13

# Run setup script
docker exec -i postgres-sessions psql -U postgres -d sessions_db < setup-db.sql
```

#### Option B: Supabase (Production)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your connection string from: **Settings > Database > Connection string > URI**
3. Run the initialization script: `node init-db.js`

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp env-example.txt .env
```

**For Local PostgreSQL (Development):**
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database Configuration
DB_PROVIDER=local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sessions_db
DB_USER=postgres
DB_PASSWORD=password

# Agora Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
```

**For Supabase (Production):**
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database Configuration
DB_PROVIDER=supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

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
| `DB_PROVIDER` | Database provider: `local` or `supabase` | local | No |
| `DATABASE_URL` | Supabase connection string (when `DB_PROVIDER=supabase`) | - | Yes (if Supabase) |
| `DB_HOST` | PostgreSQL host (when `DB_PROVIDER=local`) | localhost | Yes (if local) |
| `DB_PORT` | PostgreSQL port (when `DB_PROVIDER=local`) | 5432 | No |
| `DB_NAME` | Database name (when `DB_PROVIDER=local`) | sessions_db | Yes (if local) |
| `DB_USER` | Database user (when `DB_PROVIDER=local`) | postgres | Yes (if local) |
| `DB_PASSWORD` | Database password (when `DB_PROVIDER=local`) | - | Yes (if local) |
| `AGORA_APP_ID` | Agora App ID | - | Yes |
| `AGORA_APP_CERTIFICATE` | Agora App Certificate | - | Yes |

## Development

- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- Database schema automatically syncs on startup (development mode)
- Set `DB_PROVIDER=local` for local development with PostgreSQL
- Set `DB_PROVIDER=supabase` for production with Supabase

## Database Architecture

The application uses a modular database architecture:

- **`models/index.js`**: Main entry point that selects the appropriate database module based on `DB_PROVIDER` flag
- **`models/supabase.js`**: Supabase-specific database configuration and connection
- **`models/local.js`**: Local PostgreSQL database configuration and connection
- **`models/Session.js`**: Session model definition
- **`models/Participant.js`**: Participant model definition

The `DB_PROVIDER` environment variable controls which database module is loaded:
- `local` → Uses `models/local.js` (PostgreSQL with individual connection parameters)
- `supabase` → Uses `models/supabase.js` (Supabase with connection string)

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