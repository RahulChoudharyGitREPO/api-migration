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

    // get token
    const auth = req.headers['authorization'];
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim()  : undefined;

    if (!token || token === '') {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // get company name (adjust to your source: header, subdomain, param, etc.)
    const companyName =  getCompanyName(req); 
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'No company name provided' });
    }

    try {
      const secret = (process.env.JWT_SECRET || '') 
      const decoded = this.jwtService.verify(token, { secret }); // returns an object
      req.user = decoded;
      req.companyName = companyName;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Failed to authenticate token' });
    }
  }
}
