import type { Request } from "express";

export const getCompanyName = (req: Request): string => {
  const originalUrl = req.originalUrl;
  const entityName = originalUrl.split("/")[1] || "krisiyukta";

  if (entityName.includes(".") || entityName.includes("/")) {
    return "undefined";
  }

  if (entityName === "krisiyukta") {
    const prod = process.env.NODE_ENV === "production";
    if (prod) {
      return "prod";
    }
    return "dev";
  }
  return entityName;
};