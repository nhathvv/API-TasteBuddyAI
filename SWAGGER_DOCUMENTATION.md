# Swagger API Documentation

## Overview
Swagger/OpenAPI documentation has been successfully integrated into the Hospital MVP API using `@nestjs/swagger`.

## Access Swagger UI

Once the application is running, access the interactive API documentation at:

```
http://localhost:3000/api/docs
```

## Features

### 1. **Interactive API Explorer**
- Test all API endpoints directly from the browser
- View request/response schemas
- Try out OAuth authentication flow
- See example values for all data types

### 2. **Authentication Support**
- JWT Bearer token authentication configured
- Click "Authorize" button in Swagger UI
- Enter JWT token to test protected endpoints

### 3. **Documented Endpoints**

#### Auth Endpoints (`/auth`)

**GET /auth/google**
- **Summary**: Initiate Google OAuth login
- **Description**: Redirects user to Google OAuth consent screen. Entry point for "Sign in with Google"
- **Response**: 302 Redirect to Google OAuth consent page

**GET /auth/google/callback**
- **Summary**: Google OAuth callback
- **Description**: Handles OAuth callback from Google, creates/retrieves user, generates JWT
- **Responses**:
  - 302: Redirects to frontend
    - `/onboarding?token={jwt}` - New users
    - `/home?token={jwt}` - Existing users
  - 401: OAuth authentication failed

### 4. **DTOs and Schemas**

#### UserResponseDto
```typescript
{
  id: string;              // User ID
  email: string;           // Email address
  fullName: string;        // Full name
  avatar?: string;         // Avatar URL (optional)
  provider: 'google' | 'local';  // Auth provider
  isOnboarded: boolean;    // Onboarding status
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Update timestamp
}
```

#### AuthResponseDto
```typescript
{
  user: UserResponseDto;   // User information
  token: string;           // JWT access token
}
```

## Configuration

### Swagger Setup (main.ts)
```typescript
const swaggerConfig = new DocumentBuilder()
  .setTitle('Hospital MVP API')
  .setDescription('API documentation for Hospital Theory Integrated with AI')
  .setVersion('1.0')
  .addTag('auth', 'Authentication endpoints')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Enter JWT token',
    in: 'header',
  }, 'JWT-auth')
  .build();
```

## Decorators Used

### Controller Level
- `@ApiTags('auth')` - Groups endpoints under "auth" tag

### Endpoint Level
- `@ApiOperation()` - Describes endpoint purpose and behavior
- `@ApiResponse()` - Documents possible responses
- `@ApiBearerAuth()` - Marks protected endpoints requiring JWT

### Schema Level
- `@ApiProperty()` - Documents class properties with examples and descriptions

## Testing with Swagger UI

### 1. Test Google OAuth Flow
1. Open `http://localhost:3000/api/docs`
2. Navigate to **auth** section
3. Click on `GET /auth/google`
4. Click "Try it out"
5. Click "Execute"
6. Follow redirect to complete OAuth

### 2. Test Protected Endpoints (Future)
1. Obtain JWT token from OAuth callback
2. Click "Authorize" button (🔒) at top of Swagger UI
3. Enter token in format: `Bearer {your-jwt-token}`
4. Click "Authorize"
5. Now you can test protected endpoints

## API Response Examples

### Successful OAuth Redirect
```http
HTTP/1.1 302 Found
Location: http://localhost:8081/onboarding?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Object Example
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "fullName": "John Doe",
  "avatar": "https://lh3.googleusercontent.com/a/default-user",
  "provider": "google",
  "isOnboarded": false,
  "createdAt": "2024-11-21T12:00:00.000Z",
  "updatedAt": "2024-11-21T12:00:00.000Z"
}
```

## Files Created/Modified

### New Files
- `src/auth/dto/auth-response.dto.ts` - Response DTOs with Swagger decorators
- `src/common/decorators/api-bearer-auth.decorator.ts` - Custom JWT auth decorator
- `SWAGGER_DOCUMENTATION.md` - This documentation

### Modified Files
- `src/main.ts` - Added Swagger configuration
- `src/auth/auth.controller.ts` - Added API decorators
- `src/users/schemas/user.schema.ts` - Added ApiProperty decorators

## Best Practices Applied

✅ **Comprehensive Documentation**
- Every endpoint has clear summary and description
- All responses documented with status codes
- Example values provided for all schemas

✅ **Schema Validation**
- DTOs define clear contracts
- Type safety with TypeScript
- Swagger generates accurate schemas

✅ **Security Documentation**
- JWT authentication clearly marked
- Protected endpoints easily identifiable
- Authorization flow documented

✅ **Developer Experience**
- Interactive testing in browser
- Try-it-out functionality
- Clear examples and descriptions

## Future Enhancements
- [ ] Add more endpoints (user profile, update settings)
- [ ] Document error response schemas
- [ ] Add request body validation examples
- [ ] Include authentication examples in Swagger
- [ ] Add API versioning documentation
