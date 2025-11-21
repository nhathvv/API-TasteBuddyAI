# Google OAuth Implementation - US-001

## Overview
Implemented Google OAuth registration feature allowing users to sign in quickly using their Google account.

## Features Implemented
✅ Google OAuth authentication with Passport.js  
✅ Automatic user creation on first sign-in  
✅ Profile data extraction (email, fullName, avatar)  
✅ JWT token generation for authenticated sessions  
✅ Smart redirect logic based on onboarding status  
✅ MongoDB integration with Mongoose schemas  

## Architecture

### 1. User Schema (`src/users/schemas/user.schema.ts`)
```typescript
- email: string (unique)
- fullName: string
- avatar: string (optional)
- provider: enum (GOOGLE | LOCAL)
- providerId: string
- isOnboarded: boolean (default: false)
- timestamps: createdAt, updatedAt
```

### 2. Authentication Flow
```
1. User clicks "Sign in with Google" → GET /auth/google
2. Redirected to Google OAuth consent screen
3. Google redirects back → GET /auth/google/callback
4. GoogleStrategy validates the OAuth profile
5. AuthService checks if user exists:
   - If new: Create user account with isOnboarded=false
   - If existing: Fetch existing user
6. Generate JWT token
7. Redirect based on user.isOnboarded:
   - false → /onboarding?token={jwt}
   - true → /home?token={jwt}
```

### 3. Modules Structure
```
src/
├── auth/
│   ├── auth.module.ts          # Auth module configuration
│   ├── auth.controller.ts      # OAuth endpoints
│   ├── auth.service.ts         # Business logic
│   ├── strategies/
│   │   ├── google.strategy.ts  # Google OAuth strategy
│   │   └── jwt.strategy.ts     # JWT validation strategy
│   └── guards/
│       ├── google-oauth.guard.ts
│       └── jwt-auth.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts        # User CRUD operations
│   └── schemas/
│       └── user.schema.ts      # MongoDB schema
└── configs/
    └── envs/
        └── env-variables.ts    # Environment validation
```

## Environment Variables

Required variables in `.env`:

```bash
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/hospital-mvp

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRATION=7d

# Frontend
FRONTEND_URL=http://localhost:4200
```

## API Endpoints

### `GET /auth/google`
Initiates Google OAuth flow. Redirects user to Google sign-in page.

### `GET /auth/google/callback`
OAuth callback endpoint. Handles user creation/login and redirects to frontend.

**Response**: Redirects to:
- `{FRONTEND_URL}/onboarding?token={jwt}` - New users
- `{FRONTEND_URL}/home?token={jwt}` - Existing users

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 3. Setup MongoDB
```bash
# Local MongoDB
mongod --dbpath /path/to/data

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 4. Run Application
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Code Quality

### Design Principles Applied
- **Single Responsibility Principle (SRP)**: Each service/module has one clear purpose
  - `UsersService`: User CRUD operations only
  - `AuthService`: Authentication logic only
  - `GoogleStrategy`: Google OAuth validation only
  
- **DRY (Don't Repeat Yourself)**: 
  - Reusable `UsersService` for user operations
  - Centralized JWT token generation
  - Shared guards for authentication

### Best Practices
- ✅ Type safety with TypeScript
- ✅ Input validation with class-validator
- ✅ Environment variable validation
- ✅ Proper error handling
- ✅ Modular architecture
- ✅ Guard-based route protection
- ✅ Clean separation of concerns

## Security Considerations
- JWT tokens for stateless authentication
- Environment variables for sensitive data
- OAuth 2.0 standard implementation
- Secure password-less authentication
- Profile data sanitization

## Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Future Enhancements
- [ ] Add email/password registration (local strategy)
- [ ] Implement refresh tokens
- [ ] Add rate limiting
- [ ] Support additional OAuth providers (Facebook, GitHub)
- [ ] Add user profile update endpoints
- [ ] Implement email verification
