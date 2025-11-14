# OAuth Login System

A full-stack OAuth authentication system using Google and LINE login, built with NestJS (backend) and Next.js (frontend).

## Project Structure

```
noInvite/
├── backend/          # NestJS API server
│   ├── prisma/      # Database schema and migrations
│   ├── src/
│   │   ├── auth/    # Authentication module (OAuth logic)
│   │   ├── users/   # User management module
│   │   └── prisma/  # Prisma service module
│   └── .env         # Backend environment variables
└── frontend/         # Next.js web application
    ├── app/
    │   └── [locale]/ # Internationalized pages
    └── .env.local    # Frontend environment variables
```

## Features

- OAuth 2.0 authentication with PKCE (Proof Key for Code Exchange)
- Google OAuth login
- LINE OAuth login
- Session-based authentication using HTTP-only cookies
- User profile management
- Multiple OAuth provider linking to single user account

## Prerequisites

- Node.js 18+ and npm
- Google OAuth credentials
- LINE Login channel credentials

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

The `.env` file in `backend/` is already configured with your credentials:

```env
DATABASE_URL="file:./dev.db"

GOOGLE_CLIENT_ID=61142687327-iek6nuqvgok2imud5o2cmk0e152bemmr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

LINE_CHANNEL_ID=2008403450
LINE_CHANNEL_SECRET=d91a76161a66fea7f738873e7c37fe7e
LINE_REDIRECT_URI=http://localhost:4000/auth/line/callback

SESSION_SECRET=dev-secret-change-in-production
WEB_ORIGIN=http://localhost:3000
API_PORT=4000
```

**Important**: In production, generate a secure `SESSION_SECRET` and never commit credentials to version control.

#### Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create database tables
npx prisma migrate dev --name init
```

This will create a SQLite database at `backend/dev.db` with the following schema:

- `User`: Stores user information (id, displayName, primaryEmail, timestamps)
- `AuthIdentity`: Stores OAuth provider information linked to users

#### Start Backend Server

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The backend will run on http://localhost:4000

### 2. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

The `.env.local` file in `frontend/` is already configured:

```env
NEXT_PUBLIC_API=http://localhost:4000
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

#### Start Frontend Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The frontend will run on http://localhost:3000

## Usage

1. **Start both servers**:
   - Backend: `cd backend && npm run start:dev`
   - Frontend: `cd frontend && npm run dev`

2. **Access the application**:
   - Open http://localhost:3000 in your browser
   - You'll see login options for Google and LINE

3. **Login flow**:
   - Click "Sign in with Google" or "Sign in with LINE"
   - Complete OAuth authorization on the provider's page
   - You'll be redirected back to the app with user information displayed

4. **Features**:
   - View your display name, email, and connected providers
   - Logout to clear session
   - Session persists across page refreshes

## API Endpoints

### Authentication

- `GET /auth/google/start?redirect=/path` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback handler
- `GET /auth/line/start?redirect=/path` - Initiate LINE OAuth flow
- `GET /auth/line/callback` - LINE OAuth callback handler
- `GET /auth/me` - Get current authenticated user
- `POST /auth/logout` - Logout and destroy session

### Response Format

#### GET /auth/me (Success - 200)
```json
{
  "id": 1,
  "displayName": "John Doe",
  "primaryEmail": "john@example.com",
  "providers": ["google", "line"]
}
```

#### GET /auth/me (Unauthorized - 401)
```json
{
  "message": "Unauthorized"
}
```

## Database Schema

### User Model
```prisma
model User {
  id            BigInt   @id @default(autoincrement())
  displayName   String?
  primaryEmail  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  identities    AuthIdentity[]
}
```

### AuthIdentity Model
```prisma
model AuthIdentity {
  id              BigInt   @id @default(autoincrement())
  provider        String
  providerUserId  String
  providerEmail   String?
  createdAt       DateTime @default(now())
  userId          BigInt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerUserId])
}
```

## Security Features

- **PKCE**: Prevents authorization code interception attacks
- **HTTP-only cookies**: Prevents XSS attacks on session tokens
- **CORS**: Configured to only allow requests from frontend origin
- **State parameter**: Prevents CSRF attacks during OAuth flow
- **ID token verification**: Validates audience, issuer, and expiration

## Troubleshooting

### CORS Issues
- Ensure `WEB_ORIGIN` in backend `.env` matches your frontend URL
- Check that frontend is making requests with `credentials: 'include'`

### Session Not Persisting
- Verify cookie settings in browser (should see `connect.sid` cookie)
- Check that both frontend and backend are on same domain (localhost)
- Ensure `sameSite: 'lax'` in session configuration

### OAuth Errors
- Verify redirect URIs in Google/LINE console match `.env` configuration
- Check that OAuth credentials are valid and not expired
- Ensure scopes include `openid email profile`

## Development Notes

- The in-memory PKCE store is suitable for development but should be replaced with Redis or similar in production
- Session secret should be a cryptographically secure random string in production
- Consider using HTTPS in production and set `secure: true` for cookies
- SQLite is used for development; consider PostgreSQL or MySQL for production

## License

This project is for demonstration purposes.
