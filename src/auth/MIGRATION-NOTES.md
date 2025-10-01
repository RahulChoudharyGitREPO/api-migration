# Authentication Migration Notes

## Overview
This authentication module has been migrated from Express/Mongoose to NestJS with the following preserved features:

### Original Features Preserved:
1. **Multi-tenant architecture** - Company name in URL path (`:companyName/api/account/...`)
2. **Double SHA-256 password hashing** - Maintains original security approach
3. **JWT authentication** with company-specific secrets
4. **Password reset flow** with UUID-based tokens
5. **User registration** with email-based password creation
6. **Soft delete** support (isRemove flag)

## Manual Steps Required:

### 1. Environment Variables
Add the following to your `.env` file:

```env
# JWT Secret Key (used with company name concatenation)
JWT_SECRET=03e69e2d-02cd-40e3-a103-dda3154b05be

# MongoDB Connection
MONGODB_URI=mongodb+srv://coretech:sgi-coretech@cluster0.kmuuy.mongodb.net/

# Application Hostname
HOSTNAME=http://localhost:3000

# Node Environment
NODE_ENV=development

# SendGrid Email Configuration (for password reset emails)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_SENDER_EMAIL=noreply@yourdomain.com
SENDGRID_SENDER_NAME=Your App Name
```

### 2. Install Required Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/mongoose mongoose
npm install @nestjs/config
npm install class-validator class-transformer
npm install uuid
npm install --save-dev @types/passport-jwt @types/uuid
```

### 3. Email Service Implementation

The original code used SendGrid for sending emails. You need to:

1. Create an email service:
   ```typescript
   // src/common/email/email.service.ts
   ```

2. Implement the following methods:
   - `sendPasswordCreationEmail(user, url)` - For new user registration
   - `sendResetPasswordEmail(user, url)` - For password reset

3. Uncomment email service calls in `auth.service.ts`:
   - Line ~183: `await this.emailService.sendPasswordCreationEmail(user, url);`
   - Line ~139: `await this.emailService.sendResetPasswordEmail(user, url);`

### 4. Password Hashing Verification

⚠️ **CRITICAL**: The original implementation uses **double SHA-256 hashing**, which is:
- Not recommended for password storage (use bcrypt or argon2 instead)
- Preserved in migration for compatibility with existing user passwords

**For new users or when updating the system**, consider:
1. Migrating to bcrypt/argon2
2. Implementing a password migration strategy
3. Adding a flag to track which hashing method was used

Example bcrypt implementation:
```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 5. Dynamic Database Connection

The original implementation used dynamic DB switching based on company name. Current implementation assumes single DB connection.

If multi-database support is needed:
1. Implement dynamic database connection in a middleware
2. Attach `req.db` to request object
3. Use request-scoped providers with dynamic model selection

### 6. Middleware for Company Name

The JWT Strategy extracts company name from URL. Ensure your routing supports:
- Pattern: `/:companyName/api/account/*`
- Example: `/acme-corp/api/account/login`

### 7. Caregiver User Validation

Original code had middleware `checkCareGiverUserAvailableMiddleware` for role-based validation.
If needed, create:
```typescript
// src/auth/guards/caregiver.guard.ts
```

### 8. Testing Checklist

- [ ] Verify JWT token generation with company-specific secret
- [ ] Test login with existing user credentials
- [ ] Test password reset flow (email sending)
- [ ] Test new user registration (email sending)
- [ ] Verify JWT guard protects authenticated routes
- [ ] Test multi-tenant routing (different company names)
- [ ] Verify soft-delete users cannot login
- [ ] Test inactive users cannot login

### 9. Additional Considerations

1. **Rate Limiting**: Add rate limiting for login/password reset endpoints
2. **Refresh Tokens**: Consider implementing refresh token mechanism
3. **Session Management**: Add logout/token revocation if needed
4. **Audit Logging**: Log authentication events
5. **2FA**: Consider adding two-factor authentication

## Endpoint Mapping

| Original Express Route | New NestJS Route |
|------------------------|------------------|
| `POST /:companyName/api/account/login` | `POST /:companyName/api/account/login` |
| `POST /:companyName/api/account/forget-password` | `POST /:companyName/api/account/forget-password` |
| `POST /:companyName/api/account/set-password` | `POST /:companyName/api/account/set-password` |
| `POST /:companyName/api/account/verify-user` | `POST /:companyName/api/account/verify-user` |
| `POST /:companyName/api/user/add-user` | `POST /:companyName/api/account/register` |

## Security Recommendations

1. **Replace SHA-256** with bcrypt/argon2 for new passwords
2. **Add refresh tokens** for better security
3. **Implement rate limiting** on auth endpoints
4. **Add CSRF protection** for form-based auth
5. **Enable CORS** with proper origin restrictions
6. **Add helmet.js** for security headers
7. **Implement password complexity** requirements
8. **Add account lockout** after failed login attempts
