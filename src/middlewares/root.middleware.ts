import { Request, Response } from "express";
import { logger } from "@/utils";

export const rootHandler = (_req: Request, res: Response) => {
  logger.info("Root", "Root endpoint requested");
  res.json({
    name: "backend",
    type: "monolith",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/v1/health",
      v1profiles: "/api/v1/profiles",
      v2profiles: "/api/profiles",
    },
  });
};
