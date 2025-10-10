import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Model } from "mongoose";
import { User, UserDocument, UserSchema } from "../schemas/user.schema";
import { DynamicDbService } from "../../database/dynamic-db.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dynamicDbService: DynamicDbService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from authorization header (supports both raw token and Bearer token)
        (request) => {
          const auth = request.headers?.authorization;
          if (auth) {
            return auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
          }
          return null;
        },
        ExtractJwt.fromHeader('x-access-token'),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        request: Request,
        rawJwtToken: string,
        done: (err: Error | null, secret?: string) => void,
      ) => {
        // Extract company name from URL (multi-tenant approach)
        const companyName = this.getCompanyNameFromRequest(request);
        const secret = process.env.JWT_SECRET + companyName;
        console.log('JWT Strategy - URL:', request.originalUrl || request.url);
        console.log('JWT Strategy - Company Name:', companyName);
        console.log('JWT Strategy - Secret (partial):', secret.substring(0, 10) + '...');
        console.log('JWT Strategy - Raw Token (first 50 chars):', rawJwtToken.substring(0, 50) + '...');
        done(null, secret);
      },
    });
  }

  private getCompanyNameFromRequest(req: Request): string {
    const originalUrl = req.originalUrl || req.url;
    const parts = originalUrl.split("/");

    // Handle URLs with /api-root prefix: /api-root/krisiyukta-dev/api/...
    // parts[0] = "", parts[1] = "api-root", parts[2] = "krisiyukta-dev"
    let entityName = parts[1] || "krisiyukta";

    // If first part is "api-root", use the second part
    if (entityName === "api-root") {
      entityName = parts[2] || "krisiyukta";
    }

    if (entityName.includes(".") || entityName.includes("/")) {
      return "undefined";
    }

    if (entityName === "krisiyukta") {
      const isProd = process.env.NODE_ENV === "production";
      return isProd ? "prod" : "dev";
    }
    return entityName;
  }

  async validate(payload: any) {
    // For the JWT strategy with dynamic DB, we'll do basic payload validation
    // The actual user existence check will be done at the controller/guard level
    // since we need the request context to determine the correct database
    if (!payload.user_id || !payload.user_name) {
      throw new UnauthorizedException("Invalid token payload");
    }

    console.log('JWT Strategy - Validate - Payload user_id:', payload.user_id);
    console.log('JWT Strategy - Validate - Payload user_name:', payload.user_name);

    // Return the full payload so it's available in req.user
    return payload;
  }
}
