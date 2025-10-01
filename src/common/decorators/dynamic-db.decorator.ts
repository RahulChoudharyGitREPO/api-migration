import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { getCompanyName } from "../utils/company-name.extractor";

export const CompanyName = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return getCompanyName(request);
  }
);

export const DatabaseConnection = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { dbConnection?: any }>();
    return request.dbConnection;
  }
);