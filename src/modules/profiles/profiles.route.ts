import { Router } from "express";
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
} from "./profiles.controller";
import { methodNotAllowedHandler } from "@/middlewares";

const router = Router();

router
  .route("/")
  .post(createProfile)
  .get(listProfiles)
  .all(methodNotAllowedHandler(["POST", "GET"]));

router
  .route("/:id")
  .get(getProfile)
  .delete(deleteProfile)
  .all(methodNotAllowedHandler(["GET", "DELETE"]));

export default router;
