// src/common/middleware/jwt-verify.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { getCompanyName } from '../utils/company-name.extractor';


declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
    companyName?: string;
  }
}

@Injectable()
export class JwtVerifyMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // allow preflight
    if (req.method === 'OPTIONS') return next();

    // get token - Express sends token directly without Bearer prefix
    const auth = req.headers['authorization'];
    let token: string | undefined;

    if (auth) {
      // Support both "Bearer <token>" and raw token (Express compatibility)
      token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
    }

    if (!token || token === '') {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // get company name (adjust to your source: header, subdomain, param, etc.)
    const companyName =  getCompanyName(req);
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'No company name provided' });
    }

    try {
      // IMPORTANT: Token is signed with JWT_SECRET + companyName, so we must verify with the same secret
      const secret = (process.env.JWT_SECRET || '') + companyName;
      console.log('JWT Middleware - URL:', req.originalUrl);
      console.log('JWT Middleware - Company Name:', companyName);
      console.log('JWT Middleware - Secret (partial):', secret.substring(0, 10) + '...');

      const decoded = this.jwtService.verify(token, { secret }); // returns an object
      req.user = decoded;
      req.companyName = companyName;
      return next();
    } catch (err) {
      console.error('JWT Middleware - Verification Error:', err.message);
      return res.status(401).json({ success: false, message: 'Failed to authenticate token' });
    }
  }
}
