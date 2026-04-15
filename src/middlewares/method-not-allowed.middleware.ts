import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils";

const methodNotAllowed =
  (allowedMethods: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!allowedMethods.includes(req.method)) {
      logger.warn(
        "MethodNotAllowed",
        `${req.method} ${req.originalUrl} | allowed: ${allowedMethods.join(", ")}`,
      );
      res.set("Allow", allowedMethods.join(", "));
      return res.status(405).json({
        status: "error",
        message: `Method ${req.method} not allowed for ${req.originalUrl}`,
        allowed: allowedMethods,
      });
    }
    next();
  };

export default methodNotAllowed;
