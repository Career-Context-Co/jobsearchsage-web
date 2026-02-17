# Auth Endpoints Testing Guide

## Postman Collection

Import `auth-endpoints.postman_collection.json` into Postman to test the authentication endpoints.

## Setup

1. Make sure your dev server is running:
   ```bash
   pnpm dev
   ```

2. Ensure your `.env` file has the required Supabase configuration:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

## Collection Variables

The collection uses these variables:

- `baseUrl` - Default: `http://localhost:3000`
- `accessToken` - Automatically saved after sign-in
- `refreshToken` - Automatically saved after sign-in
- `profileId` - Automatically saved after sign-in

## Testing Flow

### 1. Sign Up (POST /api/auth/sign-up)

**Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Please check your email to confirm your account"
}
```

**Note:** Check your Supabase Auth settings - you may need to disable email confirmation for testing, or check your email for the confirmation link.

### 2. Sign In (POST /api/auth/sign-in)

**Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com"
    },
    "session": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    },
    "profileId": "prof_abc123xyz"
  }
}
```

**Note:** The collection automatically saves the tokens to variables for use in subsequent requests.

### 3. Get Session (GET /api/auth/session)

**Headers:**
- `Authorization: Bearer {{accessToken}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "profileId": "prof_abc123xyz"
  }
}
```

### 4. Sign Out (POST /api/auth/sign-out)

**Headers:**
- `Authorization: Bearer {{accessToken}}`

**Expected Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

## Error Scenarios

### Validation Errors

**Missing or invalid password:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 6 characters",
        "code": "TOO_SHORT"
      }
    ]
  }
}
```

### Duplicate Email

**Attempting to sign up with existing email:**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

### Invalid Credentials

**Wrong email or password during sign-in:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid login credentials"
  }
}
```

### Unconfirmed Email

**Signing in before confirming email:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Please confirm your email before signing in"
  }
}
```

## Supabase Configuration Tips

### Disable Email Confirmation for Testing

In Supabase Dashboard > Authentication > Providers > Email:
- Disable "Confirm email" option
- This allows immediate sign-in after sign-up for testing

### View Created Users

Check Supabase Dashboard > Authentication > Users to see:
- User accounts created via sign-up
- Email confirmation status
- Last sign-in timestamps

### View Created Profiles

Check Supabase Dashboard > Table Editor > `career_id.profiles` to see:
- Auto-created profile shells
- Profile IDs (with `prof_` prefix)
- User ID associations

## Testing with cURL

If you prefer command-line testing:

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Sign In:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Session:**
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Sign Out:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-out \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### "Network error" or connection refused
- Ensure dev server is running (`pnpm dev`)
- Check that port 3000 is not blocked

### "Email not confirmed" error
- Either confirm the email via the link sent by Supabase
- Or disable email confirmation in Supabase settings

### "Profile not found" error on sign-in
- Check Supabase logs for profile creation errors
- Verify RLS policies on `career_id.profiles` table
- The sign-in endpoint should create profiles defensively

### Session endpoint returns 401
- Ensure you're using the correct access token
- Check if the token has expired (default is 1 hour)
- Sign in again to get a fresh token
