# Installation Guide

## Step 1: Install Required Dependencies

Run the following command to install all required packages:

```bash
npm install @nestjs/jwt @nestjs/passport @nestjs/mongoose @nestjs/config passport passport-jwt mongoose class-validator class-transformer uuid
```

## Step 2: Install Dev Dependencies

```bash
npm install --save-dev @types/passport-jwt @types/uuid
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update with your actual values:
   - `JWT_SECRET` - Keep or change the secret key
   - `MONGODB_URI` - Update with your MongoDB connection string
   - `HOSTNAME` - Your application URL
   - `SENDGRID_*` - Add your SendGrid credentials (optional for now)

## Step 4: Verify Installation

Check that all files were created:

```bash
tree src/auth
```

You should see:
```
src/auth
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── dto/
│   ├── forgot-password.dto.ts
│   ├── login.dto.ts
│   ├── register-user.dto.ts
│   └── set-password.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
├── schemas/
│   └── user.schema.ts
└── strategies/
    └── jwt.strategy.ts
```

## Step 5: Start the Application

```bash
npm run start:dev
```

## Step 6: Test the Authentication Endpoints

### Test Login (example)
```bash
curl -X POST http://localhost:3000/test-company/api/account/login \
  -H "Content-Type: application/json" \
  -d '{"Email":"user@example.com","Password":"password123"}'
```

### Test Token Verification
```bash
curl -X POST http://localhost:3000/test-company/api/account/verify-user \
  -H "Authorization: YOUR_JWT_TOKEN"
```

## Common Issues

### Issue: Module not found errors
**Solution**: Make sure all dependencies are installed. Run `npm install` again.

### Issue: MongoDB connection failed
**Solution**: Check your `MONGODB_URI` in `.env` file and ensure your IP is whitelisted in MongoDB Atlas.

### Issue: JWT verification fails
**Solution**: Ensure `JWT_SECRET` matches between token creation and verification.

## Next Steps

1. ✅ Read `src/auth/MIGRATION-NOTES.md` for detailed implementation notes
2. ✅ Read `migration-summary.md` for complete file mapping
3. ⚠️ Implement email service for password reset/creation
4. ⚠️ Consider migrating from SHA-256 to bcrypt for passwords
5. ⚠️ Add remaining user management endpoints (CRUD operations)

## Package Versions (Compatible with NestJS 10+)

- `@nestjs/jwt`: ^10.0.0
- `@nestjs/passport`: ^10.0.0
- `@nestjs/mongoose`: ^10.0.0
- `@nestjs/config`: ^3.0.0
- `passport`: ^0.6.0
- `passport-jwt`: ^4.0.1
- `mongoose`: ^7.0.0 or ^8.0.0
- `class-validator`: ^0.14.0
- `class-transformer`: ^0.5.1
- `uuid`: ^9.0.0
