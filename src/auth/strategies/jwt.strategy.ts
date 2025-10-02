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
        ExtractJwt.fromHeader('authorization'),
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
        done(null, secret);
      },
    });
  }

  private getCompanyNameFromRequest(req: Request): string {
    const originalUrl = req.originalUrl || req.url;
    const entityName = originalUrl.split("/")[1] || "krisiyukta";

    if (entityName.includes(".") || entityName.includes("/")) {
      return "undefined";
    }

    if (entityName === "krisiyukta") {
      const isProd = process.env.NODE_ENV === "production";
      return isProd ? "prod" : "dev";
    }
    return entityName;
  }

  async validate(payload: { user_id: string; user_name: string }) {
    // For the JWT strategy with dynamic DB, we'll do basic payload validation
    // The actual user existence check will be done at the controller/guard level
    // since we need the request context to determine the correct database
    if (!payload.user_id || !payload.user_name) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return { user_id: payload.user_id, user_name: payload.user_name };
  }
}
