import type { Request } from "express";

export const getCompanyName = (req: Request): string => {
  const originalUrl = req.originalUrl;
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
    const prod = process.env.NODE_ENV === "production";
    if (prod) {
      return "prod";
    }
    return "dev";
  }
  return entityName;
};
